/**
 * 業種の一覧。項目ごとにスパークラインを添えて、選ぶ前に形が見えるようにする。
 * 縦の比較はしない（各行を自身の最大値で正規化する）ので、読めるのは推移の形だけ。
 */

import { line } from "d3-shape";
import { scaleLinear } from "d3-scale";
import { shortIndustry } from "../../lib/data/labels.ts";
import type { DictEntry } from "../data/cube.ts";

const W = 68;
const H = 20;

export interface IndustryRow {
  industry: DictEntry;
  values: (number | null)[];
}

export function IndustryList({
  rows,
  years,
  selected,
  onSelect,
}: {
  rows: IndustryRow[];
  years: number[];
  selected: string;
  onSelect: (code: string) => void;
}) {
  const x = scaleLinear()
    .domain([years[0]!, years.at(-1)!])
    .range([1, W - 1]);

  return (
    <ul className="flex flex-col">
      {rows.map(({ industry, values }, i) => {
        const max = Math.max(...values.map((v) => v ?? 0), 0);
        const y = scaleLinear()
          .domain([0, max || 1])
          .range([H - 2, 2]);
        const path = line<number | null>()
          .defined((v) => v !== null)
          .x((_, j) => x(years[j]!))
          .y((v) => y(v!));
        const isSelected = industry.code === selected;
        const isTotal = i === 0;

        return (
          <li key={industry.code} className={isTotal ? "mb-1 border-b border-rule pb-1" : ""}>
            <button
              type="button"
              onClick={() => onSelect(industry.code)}
              aria-pressed={isSelected}
              className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left transition-colors duration-150 ease-out active:scale-[0.99] ${
                isSelected ? "bg-ink/[0.06]" : "hover:bg-ink/[0.03]"
              }`}
            >
              <span
                className={`flex-1 truncate text-[12px] leading-tight ${
                  isSelected ? "font-semibold text-ink" : "text-muted"
                }`}
                title={industry.label}
              >
                {shortIndustry(industry.label)}
              </span>
              <svg width={W} height={H} className="shrink-0" aria-hidden>
                <path
                  d={path(values) ?? undefined}
                  fill="none"
                  className={isSelected ? "stroke-accent" : "stroke-faint"}
                  strokeWidth={isSelected ? 1.5 : 1}
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
