/**
 * 生データから配信用 cube を組み立てて public/data/ に書き出す。
 *
 *   npm run data
 */

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadTable, type Table } from "../src/lib/transform/table.ts";
import { Cube, round } from "../src/lib/transform/cube.ts";
import { formatBytes } from "../src/lib/cache.ts";
import { SEX_LABEL, type Sex } from "../src/lib/data/labels.ts";
import type { DictEntry } from "../src/app/data/cube.ts";

const OUT_DIR = resolve(import.meta.dirname, "../public/data");

const SEXES = ["total", "male", "female"] as const satisfies readonly Sex[];

function yearOf(name: string): string {
  const m = /^(\d{4})年/.exec(name);
  if (m === null) throw new Error(`年として読めない: ${name}`);
  return m[1]!;
}

function dictOf(
  items: { "@code": string; "@name": string; "@level": string }[],
): DictEntry[] {
  return items.map((c) => ({
    code: c["@code"],
    label: c["@name"],
    level: Number(c["@level"] || 1),
  }));
}

/** 合計/計を先頭、残りは表の並びのまま。 */
function withTotalFirst(items: DictEntry[], totalCode: string): DictEntry[] {
  const total = items.find((d) => d.code === totalCode);
  if (total === undefined) throw new Error(`合計コード ${totalCode} がない`);
  return [total, ...items.filter((d) => d.code !== totalCode)];
}

function yearsChronological(t: Table): { code: string; year: string }[] {
  return [...t.axis("年").items]
    .map((c) => ({ code: c["@code"], year: yearOf(c["@name"]) }))
    .sort((a, b) => a.year.localeCompare(b.year));
}

async function writeJson(name: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data);
  const path = resolve(OUT_DIR, `${name}.json`);
  await writeFile(path, json);
  console.log(`  ${name}.json  ${formatBytes(Buffer.byteLength(json))}`);
}

async function buildIndustry() {
  const t = await loadTable("industry-class");
  const industries = withTotalFirst(dictOf(t.axis("業種").items), "15");
  const years = yearsChronological(t);
  const cube = new Cube(
    [
      { name: "industry", codes: industries.map((d) => d.code) },
      { name: "sex", codes: [...SEXES] },
      { name: "year", codes: years.map((y) => y.year) },
    ],
    ["workers", "salary_avg", "bonus_avg", "allowance_avg", "mean_age", "mean_tenure"],
  );

  const tab = {
    workers: t.codeOf("表章項目", "給与所得者数"),
    salary_avg: t.codeOf("表章項目", "給与(平均)"),
    bonus_avg: t.codeOf("表章項目", "賞与(平均)"),
    allowance_avg: t.codeOf("表章項目", "給料・手当(平均)"),
    mean_age: t.codeOf("表章項目", "平均年齢"),
    mean_tenure: t.codeOf("表章項目", "平均勤続年数"),
  };
  const bracketTotal = t.codeOf("給与階級", "計");

  for (const ind of industries) {
    for (const sex of SEXES) {
      for (const y of years) {
        const sel = {
          業種: ind.code,
          給与階級: bracketTotal,
          性別: t.codeOf("性別", SEX_LABEL[sex]),
          年: y.code,
        };
        const coords = [ind.code, sex, y.year];
        cube.set("workers", coords, t.get({ ...sel, 表章項目: tab.workers }));
        cube.set("salary_avg", coords, t.get({ ...sel, 表章項目: tab.salary_avg }));
        cube.set("bonus_avg", coords, t.get({ ...sel, 表章項目: tab.bonus_avg }));
        cube.set("allowance_avg", coords, t.get({ ...sel, 表章項目: tab.allowance_avg }));
        cube.set("mean_age", coords, round(t.get({ ...sel, 表章項目: tab.mean_age }), 1));
        cube.set("mean_tenure", coords, round(t.get({ ...sel, 表章項目: tab.mean_tenure }), 1));
      }
    }
  }

  await writeJson("industry", { ...cube.toJSON(), industries });
}

async function buildDist() {
  const t = await loadTable("industry-class");
  const industries = withTotalFirst(dictOf(t.axis("業種").items), "15");
  const brackets = dictOf(t.axis("給与階級").items.filter((c) => c["@code"] !== "15"));
  const years = yearsChronological(t);
  const cube = new Cube(
    [
      { name: "industry", codes: industries.map((d) => d.code) },
      { name: "bracket", codes: brackets.map((d) => d.code) },
      { name: "sex", codes: [...SEXES] },
      { name: "year", codes: years.map((y) => y.year) },
    ],
    ["workers"],
  );

  const tabWorkers = t.codeOf("表章項目", "給与所得者数");

  for (const ind of industries) {
    for (const br of brackets) {
      for (const sex of SEXES) {
        for (const y of years) {
          cube.set(
            "workers",
            [ind.code, br.code, sex, y.year],
            t.get({
              表章項目: tabWorkers,
              業種: ind.code,
              給与階級: br.code,
              性別: t.codeOf("性別", SEX_LABEL[sex]),
              年: y.code,
            }),
          );
        }
      }
    }
  }

  await writeJson("dist", { ...cube.toJSON(), industries, brackets });
}

async function buildAge() {
  const t = await loadTable("industry-age");
  const industries = withTotalFirst(dictOf(t.axis("業種").items), "15");
  const ages = withTotalFirst(dictOf(t.axis("年齢").items), "13");
  const years = yearsChronological(t);
  const cube = new Cube(
    [
      { name: "industry", codes: industries.map((d) => d.code) },
      { name: "age", codes: ages.map((d) => d.code) },
      { name: "year", codes: years.map((y) => y.year) },
    ],
    ["workers", "salary_avg"],
  );

  const tabWorkers = t.codeOf("表章項目", "給与所得者数");
  const tabAvg = t.codeOf("表章項目", "平均給与");

  for (const ind of industries) {
    for (const age of ages) {
      for (const y of years) {
        const sel = { 業種: ind.code, 年齢: age.code, 年: y.code };
        cube.set("workers", [ind.code, age.code, y.year], t.get({ ...sel, 表章項目: tabWorkers }));
        cube.set("salary_avg", [ind.code, age.code, y.year], t.get({ ...sel, 表章項目: tabAvg }));
      }
    }
  }

  await writeJson("age", { ...cube.toJSON(), industries, ages });
}

async function buildTenure() {
  const t = await loadTable("industry-tenure");
  const industries = withTotalFirst(dictOf(t.axis("業種").items), "15");
  const tenures = withTotalFirst(dictOf(t.axis("勤続").items), "9");
  const years = yearsChronological(t);
  const cube = new Cube(
    [
      { name: "industry", codes: industries.map((d) => d.code) },
      { name: "tenure", codes: tenures.map((d) => d.code) },
      { name: "year", codes: years.map((y) => y.year) },
    ],
    ["workers", "salary_avg"],
  );

  const tabWorkers = t.codeOf("表章項目", "給与所得者数");
  const tabAvg = t.codeOf("表章項目", "平均給与");

  for (const ind of industries) {
    for (const ten of tenures) {
      for (const y of years) {
        const sel = { 業種: ind.code, 勤続: ten.code, 年: y.code };
        cube.set("workers", [ind.code, ten.code, y.year], t.get({ ...sel, 表章項目: tabWorkers }));
        cube.set("salary_avg", [ind.code, ten.code, y.year], t.get({ ...sel, 表章項目: tabAvg }));
      }
    }
  }

  await writeJson("tenure", { ...cube.toJSON(), industries, tenures });
}

async function buildBureau() {
  const t = await loadTable("industry-bureau");
  const industries = withTotalFirst(dictOf(t.axis("業種").items), "15");
  const bureaus = withTotalFirst(dictOf(t.axis("国税局").items), "13");
  const years = yearsChronological(t);
  const cube = new Cube(
    [
      { name: "industry", codes: industries.map((d) => d.code) },
      { name: "bureau", codes: bureaus.map((d) => d.code) },
      { name: "year", codes: years.map((y) => y.year) },
    ],
    ["workers", "salary_avg"],
  );

  const tabWorkers = t.codeOf("表章項目", "給与所得者数");
  const tabAvg = t.codeOf("表章項目", "平均給与");

  for (const ind of industries) {
    for (const bureau of bureaus) {
      for (const y of years) {
        const sel = { 業種: ind.code, 国税局: bureau.code, 年: y.code };
        cube.set(
          "workers",
          [ind.code, bureau.code, y.year],
          t.get({ ...sel, 表章項目: tabWorkers }),
        );
        cube.set(
          "salary_avg",
          [ind.code, bureau.code, y.year],
          t.get({ ...sel, 表章項目: tabAvg }),
        );
      }
    }
  }

  await writeJson("bureau", { ...cube.toJSON(), industries, bureaus });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log("industry (第9表 計)");
  await buildIndustry();
  console.log("dist (第9表 階級)");
  await buildDist();
  console.log("age (第12表)");
  await buildAge();
  console.log("tenure (第15表)");
  await buildTenure();
  console.log("bureau (参考：第4表 国税局別)");
  await buildBureau();
}

await main();
