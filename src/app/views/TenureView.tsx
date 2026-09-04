/**
 * 勤続ビュー。第15表。性別は無い。
 *
 * 勤続で伸びる業種と伸びない業種を、階級に沿った線で見せる。
 */

import { use, useMemo } from "react";
import { loadTenure } from "../data/chunks.ts";
import { IndustryPicker, type PickerRow } from "../components/IndustryPicker.tsx";
import { TenureChart, type TenurePoint } from "../components/TenureChart.tsx";
import { YearSelect } from "../components/YearSelect.tsx";
import { useUrlState } from "../hooks/useUrlState.ts";
import { useWidth } from "../hooks/useWidth.ts";
import { shortIndustry } from "../../lib/data/labels.ts";

const TOTAL: string = "15";
const TOTAL_TENURE = "9";

const manYen = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });

export function TenureView() {
  const { industries, tenures, cube, years } = use(loadTenure());
  const yearOptions = [...years].reverse();
  const [year, setYear] = useUrlState("year", yearOptions[0]!, (v) => years.includes(v));
  const [industry, setIndustry] = useUrlState("industry", TOTAL, (v) =>
    industries.some((d) => d.code === v),
  );
  const [ref, width] = useWidth<HTMLDivElement>();

  const current = industries.find((d) => d.code === industry)!;
  const bands = tenures.filter((t) => t.code !== TOTAL_TENURE);

  const pickerRows = useMemo((): PickerRow[] => {
    return industries.map((d) => {
      const salary = cube.at("salary_avg", { industry: d.code, tenure: TOTAL_TENURE, year });
      return {
        code: d.code,
        label: d.label,
        value: salary ?? 0,
        format: salary === null ? "—" : `${manYen.format(salary / 10)}万`,
      };
    });
  }, [industries, cube, year]);

  const points = useMemo((): TenurePoint[] => {
    return bands.map((t) => ({
      code: t.code,
      label: t.label,
      salary: cube.at("salary_avg", { industry, tenure: t.code, year }),
    }));
  }, [bands, cube, industry, year]);

  const overall = cube.at("salary_avg", { industry, tenure: TOTAL_TENURE, year });

  return (
    <div className="mx-auto flex w-full max-w-[1240px] gap-8 px-6 py-6 max-lg:flex-col-reverse">
      <aside className="w-[288px] shrink-0 max-lg:w-full lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
        <h2 className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-faint">
          業種
        </h2>
        <IndustryPicker rows={pickerRows} selected={industry} onSelect={setIndustry} />
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline justify-between gap-3 pb-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[19px] font-semibold tracking-tight">
              {shortIndustry(current.label)}の勤続
            </h1>
            <p className="tnum text-[13px] text-muted">
              {overall !== null && `平均 ${manYen.format(overall / 10)}万円`}
            </p>
          </div>
          <YearSelect years={yearOptions} value={year} onChange={setYear} />
        </header>

        <div ref={ref} className="min-h-[280px]">
          {width > 0 && <TenureChart points={points} width={width} />}
        </div>

        <p className="mt-4 border-t border-rule pt-3 text-[11px] leading-relaxed text-muted">
          横軸は勤続年数の階級。縦軸は平均給与（万円）。
          金融や電気・ガスは勤続とともに伸び、宿泊・飲食は伸びが小さい。
          この表に性別はない。1年未満勤続者は含まれない。
        </p>
      </main>
    </div>
  );
}
