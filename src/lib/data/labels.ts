/**
 * 表示用の短い業種名。公式名は cube の dict に残し、リスト行だけ短くする。
 * 公式名の中黒は全角「･」と「・」が混在するので、正規化してから引く。
 */

const SHORT: Record<string, string> = {
  建設業: "建設業",
  製造業: "製造業",
  "卸売業，小売業": "卸売・小売",
  "宿泊業，飲食サービス業": "宿泊・飲食",
  "金融業，保険業": "金融・保険",
  "不動産業，物品賃貸業": "不動産・賃貸",
  "運輸業，郵便業": "運輸・郵便",
  "電気･ガス･熱供給・水道業": "電気・ガス",
  "電気・ガス・熱供給・水道業": "電気・ガス",
  情報通信業: "情報通信",
  "学術研究，専門・技術サービス業，教育，学習支援業": "学術・教育",
  "医療，福祉": "医療・福祉",
  複合サービス事業: "複合サービス",
  サービス業: "サービス業",
  "農林水産・鉱業": "農林水産・鉱業",
  合計: "合計",
};

export function shortIndustry(name: string): string {
  return SHORT[name] ?? name;
}

/** 給与階級の隣接ブラケット表示。公式の「200万円以下」は 100超〜200。 */
export function shortBracket(name: string): string {
  if (name === "100万円以下") return "～100万";
  if (name === "2,500万円超" || name === "2500万円超") return "2500万超";
  const m = /^([\d,]+)万円以下$/.exec(name);
  if (m === null) return name;
  const hi = Number(m[1]!.replaceAll(",", ""));
  if (hi === 1500) return "1000–1500";
  if (hi === 2000) return "1500–2000";
  if (hi === 2500) return "2000–2500";
  return `${hi - 100}–${hi}`;
}

export const SEX_LABEL = {
  total: "計",
  male: "男",
  female: "女",
} as const;

export type Sex = keyof typeof SEX_LABEL;
