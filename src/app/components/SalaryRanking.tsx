/**
 * 業種別平均給与のランキング。バーは表示中の最大値に対する長さ。
 */

import { line } from "d3-shape";
import { scaleLinear } from "d3-scale";
import { shortIndustry } from "../../lib/data/labels.ts";

const SPARK_W = 76;
const SPARK_H = 18;

const manYen = new Intl.NumberFormat("ja-JP", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export interface RankRow {
  code: string;
  label: string;
  salary: number;
  /** 階級ごとの平均給与（千円）。スパークは行内正規化。 */
  byBand: number[];
}

export function SalaryRanking({
  rows,
  markAt,
}: {
  rows: RankRow[];
  markAt: number | null;
}) {
  const max = Math.max(...rows.map((r) => r.salary), 1);

  return (
    <ol className="flex flex-col">
      {rows.map((row, i) => (
        <li
          key={row.code}
          className="flex items-center gap-3 rounded px-2 py-[3px] transition-colors duration-150 hover:bg-ink/[0.03]"
        >
          <span className="tnum w-4 shrink-0 text-right text-[11px] text-faint">{i + 1}</span>
          <span
            className="w-[11rem] shrink-0 truncate text-[12.5px] max-md:w-[8rem]"
            title={row.label}
          >
            {shortIndustry(row.label)}
          </span>
          <span className="hidden h-[10px] min-w-0 flex-1 bg-ink/[0.05] sm:block">
            <span className="block h-full bg-accent/70" style={{ width: `${(row.salary / max) * 100}%` }} />
          </span>
          <span className="tnum w-[4.25rem] shrink-0 text-right text-[12px]">
            {manYen.format(row.salary / 10)}万
          </span>
          <Spark values={row.byBand} markAt={markAt} />
        </li>
      ))}
    </ol>
  );
}

function Spark({ values, markAt }: { values: number[]; markAt: number | null }) {
  const max = Math.max(...values, 0);
  const x = scaleLinear()
    .domain([0, Math.max(values.length - 1, 1)])
    .range([1, SPARK_W - 1]);
  const y = scaleLinear()
    .domain([0, max || 1])
    .range([SPARK_H - 2, 2]);
  const path = line<number>()
    .x((_, i) => x(i))
    .y((v) => y(v));

  return (
    <svg width={SPARK_W} height={SPARK_H} className="shrink-0" aria-hidden>
      <path
        d={path(values) ?? undefined}
        fill="none"
        className="stroke-muted"
        strokeWidth={1}
        strokeLinejoin="round"
      />
      {markAt !== null && values[markAt] !== undefined && (
        <circle cx={x(markAt)} cy={y(values[markAt]!)} r={2} className="fill-accent" />
      )}
    </svg>
  );
}
