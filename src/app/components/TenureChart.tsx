/**
 * 勤続階級に沿った平均給与。カテゴリ軸なので年次の TrendStack は使わない。
 */

import { scaleBand, scaleLinear } from "d3-scale";
import { line } from "d3-shape";

const M = { left: 52, right: 16, top: 12, bottom: 36 };

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (value <= step * mag) return step * mag;
  }
  return 10 * mag;
}

export interface TenurePoint {
  code: string;
  label: string;
  salary: number | null;
}

export function TenureChart({
  points,
  width,
  height = 280,
}: {
  points: TenurePoint[];
  width: number;
  height?: number;
}) {
  const x = scaleBand()
    .domain(points.map((p) => p.code))
    .range([M.left, width - M.right])
    .padding(0.2);
  const max = niceMax(Math.max(...points.map((p) => p.salary ?? 0), 0) / 10);
  const y = scaleLinear()
    .domain([0, max])
    .range([height - M.bottom, M.top]);
  const path = line<TenurePoint>()
    .defined((p) => p.salary !== null)
    .x((p) => (x(p.code) ?? 0) + x.bandwidth() / 2)
    .y((p) => y((p.salary ?? 0) / 10));

  return (
    <svg width={width} height={height} className="block">
      {[0, max / 2, max].map((v) => (
        <g key={v}>
          <line
            x1={M.left}
            x2={width - M.right}
            y1={y(v)}
            y2={y(v)}
            className="stroke-rule"
            strokeWidth={1}
          />
          <text
            x={M.left - 8}
            y={y(v) + 4}
            textAnchor="end"
            className="tnum fill-faint text-[10px]"
          >
            {v === 0 ? "0" : `${v}`}
          </text>
        </g>
      ))}
      <path
        d={path(points) ?? undefined}
        fill="none"
        className="stroke-accent"
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p) => {
        if (p.salary === null) return null;
        const cx = (x(p.code) ?? 0) + x.bandwidth() / 2;
        return (
          <circle
            key={p.code}
            cx={cx}
            cy={y(p.salary / 10)}
            r={3}
            className="fill-accent"
            stroke="var(--color-surface)"
            strokeWidth={1.5}
          />
        );
      })}
      {points.map((p) => (
        <text
          key={`${p.code}-tick`}
          x={(x(p.code) ?? 0) + x.bandwidth() / 2}
          y={height - 10}
          textAnchor="middle"
          className="fill-muted text-[10px]"
        >
          {p.label.replace("年", "")}
        </text>
      ))}
      <text x={M.left} y={10} className="fill-faint text-[10px]">
        万円
      </text>
    </svg>
  );
}
