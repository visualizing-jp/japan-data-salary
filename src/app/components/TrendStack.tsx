/**
 * x 軸を共有した折れ線の積み重ね。
 * 平均給与・男女・人員を切り替えずに縦に並べる。
 */

import { useRef, type PointerEvent } from "react";
import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";

export interface Point {
  year: number;
  value: number | null;
}

export interface Series {
  key: string;
  label: string;
  points: Point[];
  emphasized: boolean;
}

export interface Panel {
  key: string;
  title: string;
  unit: string;
  series: Series[];
  format: (value: number) => string;
  formatTick?: (value: number) => string;
}

const M = { left: 62, right: 34, top: 0, bottom: 26 };
const HEADER_H = 24;
const PLOT_H = 132;
const GAP = 18;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (value <= step * mag) return step * mag;
  }
  return 10 * mag;
}

function xTicks(domain: [number, number]): number[] {
  const ticks: number[] = [];
  const start = Math.ceil(domain[0] / 2) * 2;
  for (let y = start; y <= domain[1]; y += 2) ticks.push(y);
  if (!ticks.includes(domain[0])) ticks.unshift(domain[0]);
  if (!ticks.includes(domain[1])) ticks.push(domain[1]);
  return ticks;
}

export function TrendStack({
  panels,
  domain,
  width,
  hoverYear,
  onHoverYear,
}: {
  panels: Panel[];
  domain: [number, number];
  width: number;
  hoverYear: number | null;
  onHoverYear: (year: number | null) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const height = panels.length * (HEADER_H + PLOT_H) + (panels.length - 1) * GAP + M.bottom;
  const x = scaleLinear().domain(domain).range([M.left, width - M.right]);

  function onMove(e: PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect === undefined) return;
    const year = Math.round(x.invert(e.clientX - rect.left));
    onHoverYear(Math.min(domain[1], Math.max(domain[0], year)));
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="block touch-none select-none"
      onPointerMove={onMove}
      onPointerLeave={() => onHoverYear(null)}
    >
      {panels.map((panel, pi) => {
        const top = pi * (HEADER_H + PLOT_H + GAP);
        const plotTop = top + HEADER_H;
        const max = niceMax(
          Math.max(
            ...panel.series.flatMap((s) => s.points.map((p) => (p.value === null ? 0 : p.value))),
            0,
          ),
        );
        const y = scaleLinear().domain([0, max]).range([plotTop + PLOT_H, plotTop]);
        const path = line<Point>()
          .defined((p) => p.value !== null)
          .x((p) => x(p.year))
          .y((p) => y(p.value!));

        const readout = panel.series
          .filter((s) => s.emphasized)
          .map((s) => {
            const p =
              hoverYear === null
                ? [...s.points].reverse().find((q) => q.value !== null)
                : s.points.find((q) => q.year === hoverYear);
            return { key: s.key, label: s.label, point: p ?? null };
          });

        return (
          <g key={panel.key}>
            <text x={M.left} y={top + 13} className="fill-ink text-[13px] font-semibold">
              {panel.title}
              <tspan className="fill-faint font-normal"> {panel.unit}</tspan>
            </text>
            <text
              x={width - M.right}
              y={top + 13}
              textAnchor="end"
              className="tnum fill-ink text-[13px] font-semibold"
            >
              {readout.map((r, i) => (
                <tspan key={r.key} dx={i === 0 ? 0 : 14}>
                  {readout.length > 1 && (
                    <tspan className="fill-muted text-[11px] font-normal">{r.label} </tspan>
                  )}
                  {r.point?.value == null ? "—" : panel.format(r.point.value)}
                </tspan>
              ))}
            </text>

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
                  {v === 0 ? "0" : (panel.formatTick ?? panel.format)(v)}
                </text>
              </g>
            ))}

            {panel.series.map((s) => (
              <g key={s.key} className={s.emphasized ? "" : "opacity-45"}>
                <path
                  d={path(s.points) ?? undefined}
                  fill="none"
                  className={s.emphasized ? "stroke-accent" : "stroke-muted"}
                  strokeWidth={s.emphasized ? 1.75 : 1}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {panel.series.length > 1 &&
                  (() => {
                    const last = [...s.points].reverse().find((p) => p.value !== null);
                    if (last === undefined) return null;
                    return (
                      <text
                        x={x(last.year) + 5}
                        y={y(last.value!) + 3.5}
                        className={`text-[10px] font-medium ${
                          s.emphasized ? "fill-accent" : "fill-muted"
                        }`}
                      >
                        {s.label}
                      </text>
                    );
                  })()}
              </g>
            ))}

            {hoverYear !== null && (
              <g className="pointer-events-none">
                <line
                  x1={x(hoverYear)}
                  x2={x(hoverYear)}
                  y1={plotTop}
                  y2={plotTop + PLOT_H}
                  className="stroke-ink/35"
                  strokeWidth={1}
                />
                {panel.series.map((s) => {
                  const p = s.points.find((q) => q.year === hoverYear);
                  if (p?.value == null) return null;
                  return (
                    <circle
                      key={s.key}
                      cx={x(p.year)}
                      cy={y(p.value)}
                      r={3}
                      className={s.emphasized ? "fill-accent" : "fill-muted"}
                      stroke="var(--color-surface)"
                      strokeWidth={1.5}
                    />
                  );
                })}
              </g>
            )}
          </g>
        );
      })}

      <g transform={`translate(0, ${height - M.bottom})`}>
        <line
          x1={M.left}
          x2={width - M.right}
          className="stroke-rule-strong"
          strokeWidth={1}
        />
        {xTicks(domain).map((t) => (
          <text
            key={t}
            x={x(t)}
            y={16}
            textAnchor="middle"
            className="tnum fill-muted text-[10px]"
          >
            {t}
          </text>
        ))}
        {hoverYear !== null && (
          <g className="pointer-events-none">
            <rect
              x={x(hoverYear) - 20}
              y={3}
              width={40}
              height={17}
              rx={3}
              className="fill-ink"
            />
            <text
              x={x(hoverYear)}
              y={16}
              textAnchor="middle"
              className="tnum fill-paper text-[10px] font-medium"
            >
              {hoverYear}
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}
