/**
 * 業種ビュー。第9表の給与階級「計」。
 *
 * 指標を切り替えさせず、平均給与・男女・人員を縦に並べる。
 */

import { use, useMemo, useState } from "react";
import { loadIndustry, type Sex } from "../data/chunks.ts";
import { IndustryList } from "../components/IndustryList.tsx";
import { Segmented } from "../components/Segmented.tsx";
import { TrendStack, type Panel, type Point } from "../components/TrendStack.tsx";
import { useWidth } from "../hooks/useWidth.ts";
import { useUrlState } from "../hooks/useUrlState.ts";
import { shortIndustry } from "../../lib/data/labels.ts";

const SEXES = [
  { value: "total", label: "総数" },
  { value: "male", label: "男" },
  { value: "female", label: "女" },
] as const satisfies readonly { value: Sex; label: string }[];

const TOTAL: string = "15";

const manYen = new Intl.NumberFormat("ja-JP", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const one = new Intl.NumberFormat("ja-JP", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const int = new Intl.NumberFormat("ja-JP");

function man(v: number): number {
  return v / 10;
}

function compactPeople(v: number): string {
  if (v >= 10_000) return `${int.format(Math.round(v / 10_000))}万`;
  return int.format(Math.round(v));
}

function series(years: string[], values: (number | null)[]): Point[] {
  return years.map((year, i) => ({ year: Number(year), value: values[i] ?? null }));
}

export function IndustryView() {
  const { industries, cube, years } = use(loadIndustry());
  const [industry, setIndustry] = useUrlState("industry", TOTAL, (v) =>
    industries.some((d) => d.code === v),
  );
  const [sex, setSex] = useUrlState<Sex>("sex", "total", (v) =>
    SEXES.some((s) => s.value === v),
  );
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const [ref, width] = useWidth<HTMLDivElement>();

  const current = industries.find((d) => d.code === industry)!;
  const yearNums = years.map(Number);
  const latest = years.at(-1)!;
  const readYear = hoverYear === null ? latest : String(hoverYear);

  const rows = useMemo(
    () =>
      industries.map((d) => ({
        industry: d,
        values: cube.series("salary_avg", "year", { industry: d.code, sex }),
      })),
    [industries, cube, sex],
  );

  const panels = useMemo((): Panel[] => {
    const at = (measure: string, s: Sex) =>
      cube.series(measure, "year", { industry, sex: s });

    return [
      {
        key: "salary",
        title: "平均給与",
        unit: "万円",
        format: (v) => manYen.format(man(v)),
        formatTick: (v) => manYen.format(man(v)),
        series: [
          {
            key: "salary",
            label: "",
            points: series(years, at("salary_avg", sex)),
            emphasized: true,
          },
        ],
      },
      {
        key: "gap",
        title: "男女の平均給与",
        unit: "万円",
        format: (v) => manYen.format(man(v)),
        formatTick: (v) => manYen.format(man(v)),
        series: (["male", "female"] as const).map((s) => ({
          key: s,
          label: s === "male" ? "男" : "女",
          points: series(years, at("salary_avg", s)),
          emphasized: sex === "total" || sex === s,
        })),
      },
      {
        key: "workers",
        title: "給与所得者数",
        unit: "人",
        format: (v) => int.format(Math.round(v)),
        formatTick: compactPeople,
        series: [
          {
            key: "workers",
            label: "",
            points: series(years, at("workers", sex)),
            emphasized: true,
          },
        ],
      },
    ];
  }, [cube, industry, sex, years]);

  const salary = cube.at("salary_avg", { industry, sex, year: readYear });
  const bonus = cube.at("bonus_avg", { industry, sex, year: readYear });
  const meanAge = cube.at("mean_age", { industry, sex, year: readYear });
  const meanTenure = cube.at("mean_tenure", { industry, sex, year: readYear });
  const bonusShare =
    salary !== null && salary > 0 && bonus !== null ? bonus / salary : null;

  return (
    <div className="mx-auto flex w-full max-w-[1240px] gap-8 px-6 py-6 max-lg:flex-col-reverse">
      <aside className="w-[288px] shrink-0 max-lg:w-full">
        <h2 className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-faint">
          業種
        </h2>
        <IndustryList rows={rows} years={yearNums} selected={industry} onSelect={setIndustry} />
        <p className="px-2 pt-3 text-[10.5px] leading-relaxed text-faint">
          折れ線は平均給与の推移。高さは項目ごとに正規化してあるので、
          項目間の大小は比べられない。
        </p>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline justify-between gap-3 pb-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[19px] font-semibold tracking-tight">
              {shortIndustry(current.label)}
            </h1>
            <p className={`tnum text-[13px] ${hoverYear === null ? "text-faint" : "text-ink"}`}>
              {hoverYear ?? Number(latest)}年
            </p>
          </div>
          <Segmented options={SEXES} value={sex} onChange={setSex} label="性別" />
        </header>

        <p className="pb-4 text-[12px] leading-relaxed text-muted">
          {meanAge !== null && (
            <>
              平均年齢 {one.format(meanAge)}歳
              <span className="text-faint"> · </span>
            </>
          )}
          {meanTenure !== null && (
            <>
              平均勤続 {one.format(meanTenure)}年
              <span className="text-faint"> · </span>
            </>
          )}
          {bonusShare !== null && <>賞与は平均給与の{one.format(bonusShare * 100)}%</>}
        </p>

        <div ref={ref} className="min-h-[520px]">
          {width > 0 && (
            <TrendStack
              panels={panels}
              domain={[yearNums[0]!, yearNums.at(-1)!]}
              width={width}
              hoverYear={hoverYear}
              onHoverYear={setHoverYear}
            />
          )}
        </div>

        <p className="mt-6 border-t border-rule pt-4 text-[11px] leading-relaxed text-muted">
          1年を通じて勤務した民間の給与所得者。正社員とパート・アルバイトなどを分けていない。
          業種は所属企業の主業による14分類。平均給与は給与総額を人員で割った値で、
          賞与を含む。
        </p>
      </main>
    </div>
  );
}
