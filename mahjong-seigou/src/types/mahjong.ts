// Tile suits
export type Suit = 'man' | 'pin' | 'sou' | 'honor';
export type HonorType = 'east' | 'south' | 'west' | 'north' | 'haku' | 'hatsu' | 'chun';

export interface Tile {
  id: number;       // unique id (0-135)
  suit: Suit;
  value: number;    // 1-9 for number tiles, 1-7 for honors (E/S/W/N/Haku/Hatsu/Chun)
  isRed?: boolean;
}

export type MeldType = 'chi' | 'pon' | 'kan' | 'ankan';

export interface Meld {
  type: MeldType;
  tiles: Tile[];
  fromPlayer?: number;
}

export type Wind = 'east' | 'south' | 'west' | 'north';

export interface Player {
  id: number;
  name: string;
  hand: Tile[];
  melds: Meld[];
  discards: Tile[];
  score: number;
  wind: Wind;
  isRiichi: boolean;
  riichiBet?: number;
}

export type GamePhase =
  | 'dealing'
  | 'playing'
  | 'tsumo'
  | 'ron'
  | 'exhaustive_draw'
  | 'game_over';

export interface GameState {
  players: Player[];
  wall: Tile[];
  dora: Tile[];
  uraDora: Tile[];
  currentPlayer: number;
  phase: GamePhase;
  round: Wind;
  roundNumber: number;
  honba: number; // 本場
  riichiBets: number; // 供託
  lastDraw: Tile | null;
  lastDiscard: Tile | null;
  lastDiscardPlayer: number | null;
  winner: number | null;
  winTile: Tile | null;
  winByTsumo: boolean;
  scoreResult: ScoreResult | null;
}

// --- Yaku definitions ---
export type YakuName =
  | 'tsumo'          // 門前清自摸和 0.5翻
  | 'riichi'         // リーチ 1翻
  | 'ippatsu'        // 一発 1翻
  | 'tanyao'         // 断么九 1翻
  | 'pinfu'          // 平和 0.5翻 (整合)
  | 'iipeiko'        // 一盃口 1翻
  | 'yakuhai_east'   // 役牌（東）1翻
  | 'yakuhai_south'  // 役牌（南）1翻
  | 'yakuhai_west'   // 役牌（西）1翻
  | 'yakuhai_north'  // 役牌（北）1翻
  | 'yakuhai_haku'   // 白 1翻
  | 'yakuhai_hatsu'  // 発 1翻
  | 'yakuhai_chun'   // 中 1翻
  | 'sanshoku'       // 三色同順 2翻
  | 'ittsu'          // 一気通貫 2翻
  | 'chanta'         // 混全帯么九 2翻
  | 'toitoi'         // 対々和 2.5翻 (整合)
  | 'sananko'        // 三暗刻 2.5翻 (整合)
  | 'sankantsu'      // 三槓子 3翻 (整合)
  | 'chiitoi'        // 七対子 1.5翻 (整合)
  | 'honitsu'        // 混一色 3翻
  | 'junchan'        // 純全帯么九 3翻
  | 'ryanpeiko'      // 二盃口 3翻
  | 'chinitsu'       // 清一色 6翻
  | 'kokushi'        // 国士無双 役満
  | 'suuanko'        // 四暗刻 役満
  | 'daisangen'      // 大三元 役満
  | 'shosuushi'      // 小四喜 役満
  | 'daisuushi'      // 大四喜 役満
  | 'tsuiisou'       // 字一色 役満
  | 'chinroto'       // 清老頭 役満
  | 'ryuuiisou'      // 緑一色 役満
  | 'suukantsu'      // 四槓子 役満
  | 'chuurenpoto'    // 九蓮宝燈 役満
  | 'tenho'          // 天和 役満
  | 'chiho'          // 地和 役満
  // 符翻
  | 'fuuhan_ron'     // 門前清栄和 0.5翻
  | 'fuuhan_ryananko' // 二暗刻 0.5翻
  | 'fuuhan_ikkantsu' // 一槓子 0.5翻
  | 'fuuhan_ryankantsu'; // 二槓子 1翻

export interface YakuResult {
  name: YakuName;
  han: number;
  isFuuhan: boolean;
}

export interface ScoreResult {
  han: number;
  yaku: YakuResult[];
  dora: number;
  basePoints: number;
  payments: {
    tsumo?: { parent: number; child: number };
    ron?: number;
  };
  rankName: string;
}
