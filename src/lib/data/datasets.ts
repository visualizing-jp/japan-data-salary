/**
 * 取得対象の e-Stat 統計表。
 * 各表の素性・注意点は docs/data-sources.md を参照。
 */

export interface DatasetDef {
  /** ファイル名やログに使う短いキー。 */
  key: string;
  /** e-Stat の統計表ID（getStatsData の statsDataId）。 */
  statsDataId: string;
  label: string;
  /** 公称セル数。取得後の健全性チェックに使う。 */
  expectedCells?: number;
  /** getStatsData への追加パラメータ。未指定なら全件取得。 */
  query?: Record<string, string>;
}

export const DATASETS = {
  /**
   * 全国計表 第9表。業種×給与階級×性別×年。
   * 1年を通じて勤務した給与所得者。平均給与・賞与・平均年齢・分布の背骨。
   */
  industryClass: {
    key: "industry-class",
    statsDataId: "0004009620",
    label:
      "全国計表 第9表 業種別及び給与階級別の給与所得者数・給与額 業種別（1年を通じて勤務した給与所得者） （2014年～）",
    expectedCells: 66_825,
  },

  /**
   * 全国計表 第12表。業種×年齢×年。性別は無い。
   */
  industryAge: {
    key: "industry-age",
    statsDataId: "0004009623",
    label:
      "全国計表 第12表 業種別及び年齢階層別の給与所得者数・給与額 （1年を通じて勤務した給与所得者） （2014年～）",
    expectedCells: 6_435,
  },

  /**
   * 全国計表 第15表。業種×勤続年数×年。性別は無い。
   */
  industryTenure: {
    key: "industry-tenure",
    statsDataId: "0004009627",
    label:
      "全国計表 第15表 業種別及び勤続年数別の給与所得者数・給与額 （1年を通じて勤務した給与所得者） （2014年～）",
    expectedCells: 4_455,
  },

  /**
   * 【参考】国税局別表 第4表。業種×国税局×年。
   * 参考値・事業所所在地。UI では使わないが、軸の確認と将来用に取得する。
   */
  industryBureau: {
    key: "industry-bureau",
    statsDataId: "0004009642",
    label:
      "【参考】国税局別表 第4表 国税局別及び業種別の給与所得者数・給与額 （1年を通じて勤務した給与所得者） （2014年～）",
    expectedCells: 6_435,
  },
} as const satisfies Record<string, DatasetDef>;

export const ALL_DATASETS: DatasetDef[] = Object.values(DATASETS);

/** 配信用 cube の材料。国税局表は取得するが配信しない。 */
export const BUILD_DATASETS: DatasetDef[] = [
  DATASETS.industryClass,
  DATASETS.industryAge,
  DATASETS.industryTenure,
];
