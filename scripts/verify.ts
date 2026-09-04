/**
 * 令和6年分（2024年）の公表値と cube を突き合わせる。
 *
 *   npm run verify
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CubeView, type CubeJson, type DictEntry } from "../src/app/data/cube.ts";

const DATA = resolve(import.meta.dirname, "../public/data");

/** 千円。報道・概要の万円表示を 10 倍した値。 */
const EXPECTED_2024: Record<string, number> = {
  合計: 4780,
  "電気･ガス･熱供給・水道業": 8320,
  "金融業，保険業": 7020,
  情報通信業: 6600,
  "宿泊業，飲食サービス業": 2790,
};

interface IndustryFile extends CubeJson {
  industries: DictEntry[];
}

let failed = 0;

// 公表値は「万円」単位等で丸められている可能性があるため、少し誤差を許容する。
function check(label: string, got: number | null, expected: number, tol = 10): void {
  if (got === null) {
    console.log(`NG  ${label}: 欠測`);
    failed += 1;
    return;
  }
  const ok = Math.abs(got - expected) <= tol;
  console.log(`${ok ? "OK" : "NG"}  ${label}: ${got} (期待 ${expected})`);
  if (!ok) failed += 1;
}

const raw = JSON.parse(await readFile(resolve(DATA, "industry.json"), "utf8")) as IndustryFile;
const cube = new CubeView(raw);
const byLabel = new Map(raw.industries.map((d) => [d.label, d.code]));

for (const [label, expected] of Object.entries(EXPECTED_2024)) {
  const code = byLabel.get(label);
  if (code === undefined) {
    console.log(`NG  ${label}: 業種コードがない`);
    failed += 1;
    continue;
  }
  const got = cube.at("salary_avg", { industry: code, sex: "total", year: "2024" });
  check(`${label} 2024 平均給与(千円)`, got, expected);
}

if (failed > 0) {
  console.error(`\n${failed} 件不一致`);
  process.exit(1);
}
console.log("\n公表値と一致");
