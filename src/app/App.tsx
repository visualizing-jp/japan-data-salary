import { Suspense } from "react";
import { IndustryView } from "./views/IndustryView.tsx";
import { AgeView } from "./views/AgeView.tsx";
import { DistView } from "./views/DistView.tsx";
import { TenureView } from "./views/TenureView.tsx";
import { useUrlState } from "./hooks/useUrlState.ts";
import { SeriesBar, SeriesFooter } from "./components/Brand.tsx";

const VIEWS = [
  { id: "industry", label: "業種", hint: "平均給与の推移", ready: true },
  { id: "age", label: "年齢", hint: "年齢階級 × 業種", ready: true },
  { id: "dist", label: "分布", hint: "給与階級の構成", ready: true },
  { id: "tenure", label: "勤続", hint: "勤続年数 × 業種", ready: true },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

export function App() {
  const [view, setView] = useUrlState<ViewId>("view", "industry", (v) =>
    VIEWS.some((x) => x.id === v && x.ready),
  );

  return (
    <div className="min-h-dvh">
      <header className="border-b border-rule bg-paper/85 backdrop-blur-sm">
        <SeriesBar />
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-end justify-between gap-4 px-6 pt-5">
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight">
              業種で給与はどれだけ違うか
            </h1>
            <p className="text-[11px] text-muted">国税庁「民間給与実態統計調査」</p>
          </div>
          <nav className="flex gap-1 -mb-px" aria-label="ビュー">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={!v.ready}
                onClick={() => setView(v.id)}
                aria-current={view === v.id ? "page" : undefined}
                className={`cursor-pointer border-b-2 px-3 pt-1 pb-2 text-[13px] transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:text-faint active:scale-[0.97] ${
                  view === v.id
                    ? "border-accent font-semibold text-ink"
                    : "border-transparent text-muted hover:text-ink disabled:hover:text-faint"
                }`}
              >
                {v.label}
                <span className="ml-1.5 text-[10px] font-normal text-faint">
                  {v.ready ? v.hint : "準備中"}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <Suspense key={view} fallback={<Loading />}>
        {view === "industry" && <IndustryView />}
        {view === "age" && <AgeView />}
        {view === "dist" && <DistView />}
        {view === "tenure" && <TenureView />}
      </Suspense>

      <footer className="mx-auto w-full max-w-[1240px] px-6 pt-2 pb-10 text-[11px] leading-relaxed text-faint">
        出典: 国税庁「民間給与実態統計調査」（e-Stat 経由で取得）。
        1年を通じて勤務した民間の給与所得者。正社員とそれ以外を分けていない。
        公務員・自営業は含まない。金額は平均給与（給与総額÷人員）。
        <SeriesFooter />
      </footer>
    </div>
  );
}

function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-16 text-[12px] text-faint">
      読み込み中
    </div>
  );
}
