/**
 * 年齢ビュー。第12表。性別は無い。
 *
 * 問いは「その年齢では業種差はどうか」。順位そのものが結論。
 */

import { use, useMemo } from "react";
import { loadAge } from "../data/chunks.ts";
import { BandList, type BandRow } from "../components/BandList.tsx";
import { SalaryRanking, type RankRow } from "../components/SalaryRanking.tsx";
import { YearSelect } from "../components/YearSelect.tsx";
import { useUrlState } from "../hooks/useUrlState.ts";

const TOTAL_AGE: string = "13";
const TOTAL_IND: string = "15";

const int = new Intl.NumberFormat("ja-JP");
const manYen = new Intl.NumberFormat("ja-JP", {
  maximumFractionDigits: 0,
});

export function AgeView() {
  const { industries, ages, cube, years } = use(loadAge());
  const yearOptions = [...years].reverse();
  const [year, setYear] = useUrlState("year", yearOptions[0]!, (v) => years.includes(v));
  const [age, setUrlAge] = useUrlState("age", TOTAL_AGE, (v) => ages.some((a) => a.code === v));

  const ageBands = ages.filter((a) => a.code !== TOTAL_AGE);
  const industryRows = industries.filter((d) => d.code !== TOTAL_IND);

  const ageRows = useMemo((): BandRow[] => {
    const total = ages.find((a) => a.code === TOTAL_AGE)!;
    const totalWorkers = cube.at("workers", { industry: TOTAL_IND, age: TOTAL_AGE, year }) ?? 0;
    return [
      { code: total.code, label: "全年齢", value: totalWorkers },
      ...ageBands.map((a) => ({
        code: a.code,
        label: a.label,
        value: cube.at("workers", { industry: TOTAL_IND, age: a.code, year }) ?? 0,
      })),
    ];
  }, [ages, ageBands, cube, year]);

  const ageIndex = age === TOTAL_AGE ? null : ageBands.findIndex((a) => a.code === age);
  const current = ages.find((a) => a.code === age)!;

  const rows = useMemo((): RankRow[] => {
    return industryRows
      .map((d) => {
        const byBand = ageBands.map(
          (a) => cube.at("salary_avg", { industry: d.code, age: a.code, year }) ?? 0,
        );
        const salary =
          ageIndex === null
            ? (cube.at("salary_avg", { industry: d.code, age: TOTAL_AGE, year }) ?? 0)
            : byBand[ageIndex]!;
        return { code: d.code, label: d.label, salary, byBand };
      })
      .filter((r) => r.salary > 0)
      .sort((a, b) => b.salary - a.salary);
  }, [industryRows, ageBands, cube, year, ageIndex]);

  const headline = cube.at("salary_avg", { industry: TOTAL_IND, age, year });

  return (
    <div className="mx-auto flex w-full max-w-[1240px] gap-8 px-6 py-6 max-lg:flex-col-reverse">
      <aside className="w-[300px] shrink-0 max-lg:w-full">
        <h2 className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-faint">
          年齢階級
        </h2>
        <BandList rows={ageRows} selected={age} onSelect={setUrlAge} allCode={TOTAL_AGE} />
        <p className="px-2 pt-3 text-[10.5px] leading-relaxed text-faint">
          バーは給与所得者数。若い階級の人員は少なく見えるが、それが実態。
        </p>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline justify-between gap-3 pb-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[19px] font-semibold tracking-tight">
              {age === TOTAL_AGE ? "全年齢" : current.label}の業種
            </h1>
            <p className="tnum text-[13px] text-muted">
              {headline !== null && `${manYen.format(headline / 10)}万円`}
              <span className="text-faint">
                {" "}
                · {int.format(cube.at("workers", { industry: TOTAL_IND, age, year }) ?? 0)}人
              </span>
            </p>
          </div>
          <YearSelect years={yearOptions} value={year} onChange={setYear} />
        </header>

        <SalaryRanking rows={rows} markAt={ageIndex} />

        <p className="mt-4 border-t border-rule pt-3 text-[11px] leading-relaxed text-muted">
          バーは表示中の最高額に対する平均給与。右端の折れ線は同じ業種の年齢別平均給与で、
          左が19歳以下、右が70歳以上。高さは行ごとに正規化しているため、行をまたいだ比較はできない。
          この表に性別はない。
        </p>
      </main>
    </div>
  );
}
