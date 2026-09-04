/**
 * 分布ビュー。第9表の給与階級。
 *
 * 平均の差が、低給与層の厚みの差かどうかを正面に置く。
 */

import { use, useMemo } from "react";
import { loadDist, loadIndustry, type Sex } from "../data/chunks.ts";
import { BracketBars, type BracketRow } from "../components/BracketBars.tsx";
import { IndustryPicker, type PickerRow } from "../components/IndustryPicker.tsx";
import { Segmented } from "../components/Segmented.tsx";
import { YearSelect } from "../components/YearSelect.tsx";
import { useUrlState } from "../hooks/useUrlState.ts";
import { shortIndustry } from "../../lib/data/labels.ts";

const SEXES = [
  { value: "total", label: "総数" },
  { value: "male", label: "男" },
  { value: "female", label: "女" },
] as const satisfies readonly { value: Sex; label: string }[];

const TOTAL: string = "15";

const manYen = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("ja-JP", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function DistView() {
  const dist = use(loadDist());
  const overview = use(loadIndustry());
  const { industries, brackets, cube, years } = dist;
  const yearOptions = [...years].reverse();

  const [year, setYear] = useUrlState("year", yearOptions[0]!, (v) => years.includes(v));
  const [sex, setSex] = useUrlState<Sex>("sex", "total", (v) =>
    SEXES.some((s) => s.value === v),
  );
  const [industry, setIndustry] = useUrlState("industry", TOTAL, (v) =>
    industries.some((d) => d.code === v),
  );

  const current = industries.find((d) => d.code === industry)!;

  const pickerRows = useMemo((): PickerRow[] => {
    return industries.map((d) => {
      const salary = overview.cube.at("salary_avg", { industry: d.code, sex, year });
      return {
        code: d.code,
        label: d.label,
        value: salary ?? 0,
        format: salary === null ? "—" : `${manYen.format(salary / 10)}万`,
      };
    });
  }, [industries, overview.cube, sex, year]);

  const rows = useMemo((): BracketRow[] => {
    const counts = brackets.map(
      (b) => cube.at("workers", { industry, bracket: b.code, sex, year }) ?? 0,
    );
    const total = counts.reduce((n, v) => n + v, 0);
    return brackets.map((b, i) => ({
      code: b.code,
      label: b.label,
      workers: counts[i]!,
      share: total === 0 ? 0 : counts[i]! / total,
    }));
  }, [brackets, cube, industry, sex, year]);

  const lowShare = rows
    .filter((r) => r.label === "100万円以下" || r.label === "200万円以下" || r.label === "300万円以下")
    .reduce((n, r) => n + r.share, 0);

  return (
    <div className="mx-auto flex w-full max-w-[1240px] gap-8 px-6 py-6 max-lg:flex-col-reverse">
      <aside className="w-[288px] shrink-0 max-lg:w-full lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
        <h2 className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-faint">
          業種
        </h2>
        <IndustryPicker rows={pickerRows} selected={industry} onSelect={setIndustry} />
        <p className="px-2 pt-3 text-[10.5px] leading-relaxed text-faint">
          数字は平均給与。バーは表示中の最高額に対する長さ。
        </p>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline justify-between gap-3 pb-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[19px] font-semibold tracking-tight">
              {shortIndustry(current.label)}の給与分布
            </h1>
            <p className="tnum text-[13px] text-muted">
              300万円以下が{pct.format(lowShare * 100)}%
            </p>
          </div>
          <div className="flex items-center gap-2">
            <YearSelect years={yearOptions} value={year} onChange={setYear} />
            <Segmented options={SEXES} value={sex} onChange={setSex} label="性別" />
          </div>
        </header>

        <BracketBars rows={rows} />

        <p className="mt-4 border-t border-rule pt-3 text-[11px] leading-relaxed text-muted">
          階級は累積ではなく隣接する区間（「200万円以下」は100万超〜200万）。
          バーの長さは選んだ業種のなかでの構成比の最大値に対する割合。
          宿泊・飲食などで平均が低いのは、低給与層が厚いことと重なる。
          正社員とそれ以外はここでは分けられない。
        </p>
      </main>
    </div>
  );
}
