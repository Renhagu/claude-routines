import type { ScoreResult, YakuResult } from '../types/mahjong';

// 整合計算 点数計算
// 基点公式: 点数 = 条件の基点 × 翻の基点 ÷ 1000

// 翻の基点 (han base)
// 翻の第1規則: 2翻 = 条件の基点(1000)
// 翻の第2規則: 1翻以上4翻以下 → 1翻小さい点数の2倍
// 翻の第3規則: 小数第1位が5の翻数 → 0.5翻小さい点数の1.5倍
// 翻の第4規則: 4翻以上13翻未満 → 条件の基点 × 翻数
// 翻の第5規則: 13翻以上 / 役満 → 条件の基点 × 16
//
// 公式: han 1-4: 翻の基点 = 2^([han]-2) × (1 + han - [han]) × 1000
function hanToHanBase(han: number): number {
  if (han >= 13) return 16000;
  if (han >= 4) return han * 1000;
  const floor = Math.floor(han);
  const frac = han - floor;
  return Math.pow(2, floor - 2) * (1 + frac) * 1000;
}

// 条件の基点 (situation base)
// 子ツモ・子支払 = 500
// 子ツモ・親支払 / 親ツモ・子支払 = 1000
// 四人麻雀子ロン = 2000 (= 500×2 + 1000×1 をひとりが払う)
// 四人麻雀親ロン = 3000 (= 1000×3 をひとりが払う)

function roundUp250(n: number): number {
  if (n % 250 === 0) return n;
  return Math.ceil(n / 250) * 250;
}

// 例外処理: 250の倍数にならない場合は250単位に切り上げ
// 例外テーブルに従い特定の値を調整
function fixException(n: number): number {
  // 250点単位に切り上げ
  return roundUp250(n);
}

export function calcSeigouScore(
  yakuList: YakuResult[],
  doraCount: number,
  isDealer: boolean,
  isTsumo: boolean,
  honba: number,
  _riichiBets: number,
): ScoreResult {
  const isYakuman = yakuList.some(y => y.han === Infinity);
  const han = isYakuman ? Infinity : yakuList.reduce((s, y) => s + y.han, 0) + doraCount;

  const rankName = getRankName(han);
  const hanBase = isYakuman ? 16000 : hanToHanBase(han);

  // 各支払い点数を計算
  // 子ツモ: childPayChild = 500 × hanBase / 1000, childPayParent = 1000 × hanBase / 1000
  // 親ツモ: parentPayChild = 1000 × hanBase / 1000
  let childPayChild = fixException((500 * hanBase) / 1000);
  let childPayParent = fixException((1000 * hanBase) / 1000);
  const parentPayChild = fixException((1000 * hanBase) / 1000);

  // 例外: 1.5翻のchildPayChild
  if (han === 1.5) {
    childPayChild = 500; // 特例
  }

  // 本場加算: ツモは各人から250点×本場、ロンは振込者から750点×本場
  const honbaPerPerson = honba * 250;
  const honbaRon = honba * 250 * 3; // (4-1)人分

  const payments: ScoreResult['payments'] = {};

  if (isTsumo) {
    if (isDealer) {
      payments.tsumo = {
        parent: 0,
        child: parentPayChild + honbaPerPerson,
      };
    } else {
      payments.tsumo = {
        parent: childPayParent + honbaPerPerson,
        child: childPayChild + honbaPerPerson,
      };
    }
  } else {
    const baseRon = isDealer
      ? fixException((3000 * hanBase) / 1000)
      : fixException((2000 * hanBase) / 1000);
    payments.ron = baseRon + honbaRon;
  }

  return {
    han,
    yaku: yakuList,
    dora: doraCount,
    basePoints: hanBase,
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
    if (t.value <= 4) t.value = t.value === 4 ? 1 : t.value + 1;
    else t.value = t.value === 7 ? 5 : t.value + 1;
  } else {
    t.value = t.value === 9 ? 1 : t.value + 1;
  }
  return t;
}

// 流局時のノーテン罰符計算
// 総罰符 3000点固定
export function calcNotenBappu(tenpaiFlags: boolean[]): number[] {
  const n = tenpaiFlags.length; // 4
  const tenpaiCount = tenpaiFlags.filter(Boolean).length;
  const notenCount = n - tenpaiCount;

  if (tenpaiCount === 0 || tenpaiCount === n) return tenpaiFlags.map(() => 0);

  const totalPool = 3000;
  const gainPerTenpai = totalPool / tenpaiCount;
  const payPerNoten = totalPool / notenCount;

  return tenpaiFlags.map(isTenpai =>
    isTenpai ? gainPerTenpai : -payPerNoten
  );
}
