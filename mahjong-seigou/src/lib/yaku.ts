import type { Tile, Meld, Wind, YakuResult, YakuName } from '../types/mahjong';
import type { WinPattern, Block } from './agari';
import { findWinPatterns, isChiitoi, isKokushi } from './agari';
import { sameTile, isYaochuuhai, isHonor } from './tiles';

// 整合計算 翻数
const SEIGOU_HAN: Record<YakuName, number> = {
  // 通常役
  tsumo: 0.5,
  riichi: 1,
  ippatsu: 1,
  tanyao: 1,
  pinfu: 0.5,      // 整合: 0.5翻
  iipeiko: 1,
  yakuhai_east: 1,
  yakuhai_south: 1,
  yakuhai_west: 1,
  yakuhai_north: 1,
  yakuhai_haku: 1,
  yakuhai_hatsu: 1,
  yakuhai_chun: 1,
  sanshoku: 2,
  ittsu: 2,
  chanta: 2,
  toitoi: 2.5,     // 整合: 2.5翻
  sananko: 2.5,    // 整合: 2.5翻
  sankantsu: 3,    // 整合: 3翻
  chiitoi: 1.5,    // 整合: 1.5翻
  honitsu: 3,
  junchan: 3,
  ryanpeiko: 3,
  chinitsu: 6,
  // 役満
  kokushi: Infinity,
  suuanko: Infinity,
  daisangen: Infinity,
  shosuushi: Infinity,
  daisuushi: Infinity,
  tsuiisou: Infinity,
  chinroto: Infinity,
  ryuuiisou: Infinity,
  suukantsu: Infinity,
  chuurenpoto: Infinity,
  tenho: Infinity,
  chiho: Infinity,
  // 符翻
  fuuhan_ron: 0.5,
  fuuhan_ryananko: 0.5,
  fuuhan_ikkantsu: 0.5,
  fuuhan_ryankantsu: 1,
};

interface WinContext {
  isTsumo: boolean;
  isRiichi: boolean;
  isIppatsu: boolean;
  isMenzen: boolean;
  seatWind: Wind;
  roundWind: Wind;
  winTile: Tile;
  melds: Meld[];
  handTiles: Tile[]; // 13 tiles (without win tile)
  isDealer: boolean;
  isFirstDraw: boolean; // for tenho/chiho
}

function windValue(wind: Wind): number {
  return { east: 1, south: 2, west: 3, north: 4 }[wind];
}

function countKantsu(melds: Meld[]): number {
  return melds.filter(m => m.type === 'kan' || m.type === 'ankan').length;
}

function countAnko(pattern: WinPattern, isTsumo: boolean, winTile: Tile): number {
  let count = 0;
  for (const block of pattern.blocks) {
    if (block.type === 'koutsu' && block.isAnko) {
      // If win tile completes this block by tsumo, it's still anko
      if (!isTsumo && sameTile(block.tiles[0], winTile)) {
        // ron: the win tile came from outside, so this koutsu is not anko
        continue;
      }
      count++;
    }
  }
  // Count ankan melds
  count += pattern.melds.filter(m => m.type === 'ankan').length;
  return count;
}

export function calcYaku(ctx: WinContext): YakuResult[] {
  const { handTiles, melds, winTile, isTsumo, isRiichi, isIppatsu, isMenzen, seatWind, roundWind } = ctx;
  const allTiles = [...handTiles, winTile];

  const results: YakuResult[] = [];
  const add = (name: YakuName, isFuuhan = false) => {
    results.push({ name, han: SEIGOU_HAN[name], isFuuhan });
  };

  // 役満チェック
  if (ctx.isFirstDraw && isTsumo && melds.length === 0) {
    if (ctx.isDealer) { add('tenho'); return results; }
    else { add('chiho'); return results; }
  }
  if (isKokushi(handTiles) && melds.length === 0) { add('kokushi'); return results; }

  const patterns = findWinPatterns(allTiles, melds);
  const isChiit = isChiitoi(allTiles) && melds.length === 0;

  // 七対子
  if (isChiit) {
    add('chiitoi');
    if (isRiichi) add('riichi');
    if (isIppatsu) add('ippatsu');
    if (isTsumo) add('tsumo');
    else if (isMenzen) add('fuuhan_ron', true);
    calcDoraYaku(allTiles, results);
    return results;
  }

  if (patterns.length === 0) return results;

  const pattern = patterns[0];

  // 役満: 四暗刻
  const ankoCount = countAnko(pattern, isTsumo, winTile);
  const kantsuCount = countKantsu(melds) + pattern.melds.filter(m => m.type === 'ankan').length;
  if (ankoCount + kantsuCount >= 4 && isMenzen) { add('suuanko'); return results; }

  // 役満: 四槓子
  if (kantsuCount >= 4) { add('suukantsu'); return results; }

  // 役満: 大三元
  const dragonCount = ['haku', 'hatsu', 'chun'].filter(d => {
    const v = { haku: 5, hatsu: 6, chun: 7 }[d]!;
    const matching = [...pattern.blocks, ...pattern.melds.map(m => ({
      type: 'koutsu' as const, tiles: m.tiles, isAnko: false
    }))].filter(b => b.type === 'koutsu' && b.tiles[0].suit === 'honor' && b.tiles[0].value === v);
    return matching.length > 0;
  }).length;
  if (dragonCount >= 3) { add('daisangen'); return results; }

  // 役満: 字一色
  if (allTiles.every(t => t.suit === 'honor')) { add('tsuiisou'); return results; }

  // 役満: 清老頭
  if (allTiles.every(t => !isHonor(t) && (t.value === 1 || t.value === 9))) { add('chinroto'); return results; }

  // 役満: 緑一色
  const greenTiles = new Set(['sou-2','sou-3','sou-4','sou-6','sou-8','honor-6']);
  if (allTiles.every(t => greenTiles.has(`${t.suit}-${t.value}`))) { add('ryuuiisou'); return results; }

  // 役満: 大四喜
  const windCount = [1,2,3,4].filter(v => {
    return [...pattern.blocks, ...pattern.melds.map(m => ({
      type: 'koutsu' as const, tiles: m.tiles, isAnko: false
    }))].some(b => b.type === 'koutsu' && b.tiles[0].suit === 'honor' && b.tiles[0].value === v);
  }).length;
  if (windCount >= 4) { add('daisuushi'); return results; }
  if (windCount >= 3 && pattern.jantai.tiles[0].suit === 'honor' && pattern.jantai.tiles[0].value <= 4) {
    add('shosuushi');
    return results;
  }

  // 九蓮宝燈
  if (isMenzen && melds.length === 0) {
    const suit = allTiles[0].suit;
    if (suit !== 'honor' && allTiles.every(t => t.suit === suit)) {
      const counts = Array(10).fill(0);
      for (const t of allTiles) counts[t.value]++;
      if (counts[1] >= 3 && counts[9] >= 3 && [2,3,4,5,6,7,8].every(v => counts[v] >= 1)) {
        add('chuurenpoto'); return results;
      }
    }
  }

  // 通常役
  if (isRiichi) add('riichi');
  if (isIppatsu) add('ippatsu');
  if (isTsumo && isMenzen) add('tsumo');
  if (!isTsumo && isMenzen) add('fuuhan_ron', true);

  // 符翻: 二暗刻
  if (ankoCount >= 2) add('fuuhan_ryananko', true);

  // 符翻: 槓子
  const totalKan = countKantsu(melds);
  if (totalKan >= 2) add('fuuhan_ryankantsu', true);
  else if (totalKan >= 1) add('fuuhan_ikkantsu', true);

  // 三槓子
  if (totalKan >= 3) add('sankantsu');

  // 三暗刻
  if (ankoCount >= 3 && ankoCount < 4) add('sananko');

  // 平和
  const isPinfu = isMenzen && melds.length === 0 &&
    pattern.blocks.every(b => b.type === 'shuntsu') &&
    !isHonor(pattern.jantai.tiles[0]) &&
    (() => {
      // 待ちが両面
      const jantaiTile = pattern.jantai.tiles[0];
      if (sameTile(winTile, jantaiTile)) return false;
      // Check if win tile is in a two-sided wait shuntsu
      for (const block of pattern.blocks) {
        if (block.tiles.some(t => sameTile(t, winTile))) {
          const vals = block.tiles.map(t => t.value).sort((a,b)=>a-b);
          const pos = block.tiles.findIndex(t => sameTile(t, winTile));
          if (pos === 0 && vals[0] !== 1) return true;
          if (pos === 2 && vals[2] !== 9) return true;
        }
      }
      return false;
    })();
  if (isPinfu) add('pinfu');

  // 断么九
  if (allTiles.every(t => !isYaochuuhai(t)) && melds.every(m => m.tiles.every(t => !isYaochuuhai(t)))) {
    add('tanyao');
  }

  // 一盃口・二盃口
  if (isMenzen && melds.length === 0) {
    const shuntsuKeys = pattern.blocks
      .filter(b => b.type === 'shuntsu')
      .map(b => `${b.tiles[0].suit}-${b.tiles[0].value}`);
    const pairs = shuntsuKeys.filter((k, i) => shuntsuKeys.indexOf(k) !== i);
    if (pairs.length >= 2) add('ryanpeiko');
    else if (pairs.length >= 1) add('iipeiko');
  }

  // 役牌
  const windMap: Record<string, YakuName> = {
    '1': 'yakuhai_east', '2': 'yakuhai_south', '3': 'yakuhai_west', '4': 'yakuhai_north',
    '5': 'yakuhai_haku', '6': 'yakuhai_hatsu', '7': 'yakuhai_chun',
  };
  const allBlocks = [...pattern.blocks, ...pattern.melds.map(m => ({
    type: (m.type === 'chi' ? 'shuntsu' : 'koutsu') as Block['type'],
    tiles: m.tiles,
    isAnko: m.type === 'ankan',
  }))];
  for (const block of allBlocks) {
    if (block.type === 'koutsu' && block.tiles[0].suit === 'honor') {
      const v = block.tiles[0].value;
      // Dragon
      if (v >= 5) { add(windMap[String(v)]); continue; }
      // Seat wind
      if (v === windValue(seatWind)) add(windMap[String(v)]);
      // Round wind
      if (v === windValue(roundWind)) add(windMap[String(v)]);
    }
  }

  // 対々和
  if (allBlocks.every(b => b.type === 'koutsu')) add('toitoi');

  // 混全帯么九・純全帯么九
  const allBlocksIncJantai = [...allBlocks, { type: 'jantai' as const, tiles: pattern.jantai.tiles, isAnko: false }];
  const hasHonorInAny = allBlocksIncJantai.some(b => b.tiles.some(t => isHonor(t)));
  const allHaveYaochuu = allBlocksIncJantai.every(b => b.tiles.some(t => isYaochuuhai(t)));
  if (allHaveYaochuu) {
    if (hasHonorInAny) add('chanta');
    else add('junchan');
  }

  // 一気通貫
  for (const suit of ['man', 'pin', 'sou'] as const) {
    const shuntsus = allBlocks.filter(b => b.type === 'shuntsu' && b.tiles[0].suit === suit);
    const vals = shuntsus.map(b => b.tiles[0].value);
    if (vals.includes(1) && vals.includes(4) && vals.includes(7)) { add('ittsu'); break; }
  }

  // 三色同順
  const shuntsusBySuit = (['man','pin','sou'] as const).map(suit =>
    allBlocks.filter(b => b.type === 'shuntsu' && b.tiles[0].suit === suit).map(b => b.tiles[0].value)
  );
  for (let v = 1; v <= 7; v++) {
    if (shuntsusBySuit.every(vals => vals.includes(v))) { add('sanshoku'); break; }
  }

  // 混一色・清一色
  const nonHonorSuits = new Set(allTiles.filter(t => !isHonor(t)).map(t => t.suit));
  if (nonHonorSuits.size === 1) {
    if (allTiles.every(t => !isHonor(t))) add('chinitsu');
    else add('honitsu');
  }

  // ドラ
  calcDoraYaku(allTiles, results);

  return results;
}

function calcDoraYaku(_tiles: Tile[], _results: YakuResult[]): void {
  // Dora is handled separately in score calculation
}
