/**
 * 配信データの取得。
 *
 * 変換まで済ませた Promise をモジュールレベルでキャッシュする。
 * React 19 の `use()` はレンダーをまたいで同一の Promise であることを要求するので、
 * 途中で `.then()` を挟むと毎回サスペンドし直してしまう。
 */

import { CubeView, type CubeJson, type DictEntry } from "./cube.ts";

export type Sex = "total" | "male" | "female";

export interface IndustryChunk {
  industries: DictEntry[];
  cube: CubeView;
  years: string[];
}

export interface DistChunk {
  industries: DictEntry[];
  brackets: DictEntry[];
  cube: CubeView;
  years: string[];
}

export interface AgeChunk {
  industries: DictEntry[];
  ages: DictEntry[];
  cube: CubeView;
  years: string[];
}

export interface TenureChunk {
  industries: DictEntry[];
  tenures: DictEntry[];
  cube: CubeView;
  years: string[];
}

const cache = new Map<string, Promise<unknown>>();

function chunk<Raw, T>(name: string, transform: (raw: Raw) => T): Promise<T> {
  const hit = cache.get(name);
  if (hit !== undefined) return hit as Promise<T>;
  const promise = fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`${name}.json の取得に失敗しました (${r.status})`);
      return r.json() as Promise<Raw>;
    })
    .then(transform);
  cache.set(name, promise);
  return promise;
}

function yearsOf(raw: CubeJson): string[] {
  return raw.dims.find((d) => d.name === "year")!.codes;
}

export function loadIndustry(): Promise<IndustryChunk> {
  return chunk<CubeJson & { industries: DictEntry[] }, IndustryChunk>("industry", (raw) => ({
    industries: raw.industries,
    cube: new CubeView(raw),
    years: yearsOf(raw),
  }));
}

export function loadDist(): Promise<DistChunk> {
  return chunk<CubeJson & { industries: DictEntry[]; brackets: DictEntry[] }, DistChunk>(
    "dist",
    (raw) => ({
      industries: raw.industries,
      brackets: raw.brackets,
      cube: new CubeView(raw),
      years: yearsOf(raw),
    }),
  );
}

export function loadAge(): Promise<AgeChunk> {
  return chunk<CubeJson & { industries: DictEntry[]; ages: DictEntry[] }, AgeChunk>(
    "age",
    (raw) => ({
      industries: raw.industries,
      ages: raw.ages,
      cube: new CubeView(raw),
      years: yearsOf(raw),
    }),
  );
}

export function loadTenure(): Promise<TenureChunk> {
  return chunk<CubeJson & { industries: DictEntry[]; tenures: DictEntry[] }, TenureChunk>(
    "tenure",
    (raw) => ({
      industries: raw.industries,
      tenures: raw.tenures,
      cube: new CubeView(raw),
      years: yearsOf(raw),
    }),
  );
}
