import type { ScoreResult, YakuResult } from '../types/mahjong';

// 整合計算 点数計算
// 基点表
// 条件の基点 × 翻の基点 ÷ 1000 = 点数

// 翻の基点 (han -> base points for that han level)
function hanToKitenBase(han: number): number {
  if (han >= 13) return 16000; // 役満: 基点16倍 (条件の基点1000×16=16000)
  if (han >= 4) return han * 1000; // 第4規則: 条件の基点 × 翻数
  // 第1〜第3規則: 2[han]-2 × (1 + han - [han]) × 1000
  const floor = Math.floor(han);
  const frac = han - floor;
  return Math.pow(2, floor - 2) * (1 + frac) * 1000;
}

function roundUp250(n: number): number {
  return Math.ceil(n / 250) * 250;
}

// 250点単位への丸め（例外処理含む）
export function calcSeigouScore(
  yakuList: YakuResult[],
  doraCount: number,
  isDealer: boolean,
  isTsumo: boolean,
  honba: number,
  _riichiBets: number,
): ScoreResult {
  const isYakuman = yakuList.some(y => y.han === Infinity);

  let han = isYakuman ? Infinity : yakuList.reduce((s, y) => s + y.han, 0) + doraCount;

  const rankName = getRankName(han);

  // 条件の基点計算
  // 子ツモ: 子→子支払い=500(基点1), 子→親支払い=1000(基点2)
  // 親ツモ: 子→親支払い=1000(基点2) ×3
  // ロン: 子→子(3人)=2000(基点2×3=6000相当), 親→子(3人)=3000

  const kitenBase = isYakuman ? 16000 : hanToKitenBase(han);

  let childPayChild: number;   // 子ツモ時の子の支払い
  let childPayParent: number;  // 子ツモ時の親の支払い
  let parentPayChild: number;  // 親ツモ時の子の支払い
  let ronPayment: number;      // ロン時の支払い

  if (isYakuman) {
    // 役満: 条件の基点1000×16=16000
    childPayChild = 8000;
    childPayParent = 16000;
    parentPayChild = 16000;
    ronPayment = isDealer ? 48000 : 32000;
  } else {
    // 翻の基点 (per-person payment amounts)
    // 条件の基点500(子ツモ子支払い) × 翻の基点 / 1000
    childPayChild = roundUp250((500 * kitenBase) / 1000);
    childPayParent = roundUp250((1000 * kitenBase) / 1000);
    parentPayChild = roundUp250((1000 * kitenBase) / 1000);

    // 例外: 1.5翻の子のツモ子支払い
    if (han === 1.5) {
      childPayChild = 500; // 例外
    }

    if (isDealer) {
      // 親ツモ: 全員が parentPayChild を支払う
      ronPayment = parentPayChild * 3;
    } else {
      // 子ロン: 振り込んだ一人が全額支払い
      // ロン得点 = ツモ得点と同じ (子ツモの場合: childPayChild×2 + childPayParent)
      ronPayment = roundUp250(kitenBase * 2); // 条件の基点2000 × 翻の基点 / 1000
    }
  }

  // 本場加算
  const honbaBonus = honba * 250;

  const payments: ScoreResult['payments'] = {};
  if (isTsumo) {
    if (isDealer) {
      payments.tsumo = { parent: 0, child: parentPayChild + Math.ceil(honbaBonus / 3) };
    } else {
      payments.tsumo = {
        parent: childPayParent + honbaBonus,
        child: childPayChild + Math.ceil(honbaBonus / 3),
      };
    }
  } else {
    payments.ron = ronPayment + (isDealer ? honbaBonus * 3 : honbaBonus * 3);
  }

  return {
    han,
    yaku: yakuList,
    dora: doraCount,
    basePoints: kitenBase,
    payments,
    rankName,
  };
}

export function getRankName(han: number): string {
  if (han === Infinity || han >= 13) return '役満';
  if (han >= 12) return '三倍満';
  if (han >= 8) return '倍満';
  if (han >= 6) return '跳満';
  if (han >= 4) return '満貫';
  return `${han}翻`;
}

// ドラ表示牌から本ドラを計算
export function getDoraFromIndicator(indicator: import('../types/mahjong').Tile): import('../types/mahjong').Tile {
  const t = { ...indicator };
  if (t.suit === 'honor') {
    if (t.value <= 4) t.value = t.value === 4 ? 1 : t.value + 1; // winds cycle
    else t.value = t.value === 7 ? 5 : t.value + 1; // dragons cycle
  } else {
    t.value = t.value === 9 ? 1 : t.value + 1;
  }
  return t;
}
