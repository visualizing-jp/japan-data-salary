/**
 * 給与階級の構成比。長さは選んだ業種の人員合計に対する割合。
 */

import { shortBracket } from "../../lib/data/labels.ts";

const pct = new Intl.NumberFormat("ja-JP", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const int = new Intl.NumberFormat("ja-JP");

export interface BracketRow {
  code: string;
  label: string;
  workers: number;
  share: number;
}

export function BracketBars({ rows }: { rows: BracketRow[] }) {
  const maxShare = Math.max(...rows.map((r) => r.share), 0);

  return (
    <ol className="flex flex-col">
      {rows.map((row) => (
        <li key={row.code} className="flex items-center gap-3 rounded px-2 py-[4px]">
          <span className="tnum w-[5.5rem] shrink-0 text-[12px] text-muted">
            {shortBracket(row.label)}
          </span>
          <span className="h-[12px] min-w-0 flex-1 bg-ink/[0.05]">
            <span
              className="block h-full bg-accent/70"
              style={{ width: `${maxShare === 0 ? 0 : (row.share / maxShare) * 100}%` }}
            />
          </span>
          <span className="tnum w-[3.25rem] shrink-0 text-right text-[12px]">
            {pct.format(row.share * 100)}%
          </span>
          <span className="tnum w-[4.5rem] shrink-0 text-right text-[11px] text-faint">
            {int.format(row.workers)}
          </span>
        </li>
      ))}
    </ol>
  );
}
