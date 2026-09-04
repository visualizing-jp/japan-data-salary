const int = new Intl.NumberFormat("ja-JP");

export interface BandRow {
  code: string;
  label: string;
  value: number;
}

export function BandList({
  rows,
  selected,
  onSelect,
  allCode = "all",
}: {
  rows: BandRow[];
  selected: string;
  onSelect: (code: string) => void;
  allCode?: string;
}) {
  const max = Math.max(...rows.filter((r) => r.code !== allCode).map((r) => r.value), 1);

  return (
    <ul className="flex flex-col">
      {rows.map((row) => {
        const isSelected = row.code === selected;
        const isAll = row.code === allCode;
        return (
          <li key={row.code} className={isAll ? "mb-1 border-b border-rule pb-1" : ""}>
            <button
              type="button"
              onClick={() => onSelect(row.code)}
              aria-pressed={isSelected}
              className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left transition-colors duration-150 ease-out active:scale-[0.99] ${
                isSelected ? "bg-ink/[0.06]" : "hover:bg-ink/[0.03]"
              }`}
            >
              <span
                className={`w-[4.75rem] shrink-0 text-[12px] ${
                  isSelected ? "font-semibold text-ink" : "text-muted"
                }`}
              >
                {row.label}
              </span>
              <span
                className={`tnum w-[3.75rem] shrink-0 text-right text-[11px] ${
                  isSelected ? "text-ink" : "text-faint"
                }`}
              >
                {int.format(row.value)}
              </span>
              {isAll ? (
                <span className="flex-1" />
              ) : (
                <span className="h-[9px] flex-1 bg-ink/[0.05]">
                  <span
                    className={`block h-full ${isSelected ? "bg-accent" : "bg-accent/45"}`}
                    style={{ width: `${(row.value / max) * 100}%` }}
                  />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
