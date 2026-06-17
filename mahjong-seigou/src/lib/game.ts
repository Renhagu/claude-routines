import type { GameState, Player, Tile, Wind } from '../types/mahjong';
import { createTileSet, shuffle, sortTiles } from './tiles';
import { canWin, getTenpaiTiles } from './agari';
import { calcYaku } from './yaku';
import { calcSeigouScore, getDoraFromIndicator, calcNotenBappu } from './score';
import { cpuChooseDiscard, cpuGetRiichiDiscard } from './ai';

const WINDS: Wind[] = ['east', 'south', 'west', 'north'];
const PLAYER_COUNT = 4;

export function createInitialState(): GameState {
  return dealNewRound({
    players: [
      { id: 0, name: 'あなた', hand: [], melds: [], discards: [], score: 25000, wind: 'east', isRiichi: false },
      { id: 1, name: 'CPU南', hand: [], melds: [], discards: [], score: 25000, wind: 'south', isRiichi: false },
      { id: 2, name: 'CPU西', hand: [], melds: [], discards: [], score: 25000, wind: 'west', isRiichi: false },
      { id: 3, name: 'CPU北', hand: [], melds: [], discards: [], score: 25000, wind: 'north', isRiichi: false },
    ],
    wall: [],
    dora: [],
    uraDora: [],
    currentPlayer: 0,
    phase: 'dealing',
    round: 'east',
    roundNumber: 1,
    honba: 0,
    riichiBets: 0,
    lastDraw: null,
    lastDiscard: null,
    lastDiscardPlayer: null,
    winner: null,
    winTile: null,
    winByTsumo: false,
    scoreResult: null,
  });
}

export function dealNewRound(state: GameState): GameState {
  const tiles = shuffle(createTileSet());

  // Dead wall: last 14 tiles. First is dora indicator.
  const deadWall = tiles.splice(tiles.length - 14);
  const dora = [getDoraFromIndicator(deadWall[0])];
  const uraDora = [getDoraFromIndicator(deadWall[7])];

  const players: Player[] = state.players.map((p) => ({
    ...p,
    hand: sortTiles(tiles.splice(0, 13)),
    melds: [],
    discards: [],
    isRiichi: false,
  }));

  return {
    ...state,
    wall: tiles,
    dora,
    uraDora,
    players,
    currentPlayer: 0,
    phase: 'playing',
    lastDraw: null,
    lastDiscard: null,
    lastDiscardPlayer: null,
    winner: null,
    winTile: null,
    winByTsumo: false,
    scoreResult: null,
  };
}

// Draw a tile for current player. Drawn tile is appended to end (not sorted) for visual distinction.
export function drawTile(state: GameState): GameState {
  if (state.wall.length === 0) {
    return { ...state, phase: 'exhaustive_draw' };
  }
  const [drawn, ...remaining] = state.wall;
  const players = state.players.map((p, i) => {
    if (i !== state.currentPlayer) return p;
    return { ...p, hand: [...sortTiles(p.hand), drawn] };
  });
  return { ...state, wall: remaining, players, lastDraw: drawn };
}

// Player discards a tile by tile identity
export function discardTile(state: GameState, playerId: number, tile: Tile): GameState {
  const players = state.players.map((p, i) => {
    if (i !== playerId) return p;
    // Remove by id first (exact match), fallback to suit+value
    let tileIdx = p.hand.findIndex(t => t.id === tile.id);
    if (tileIdx === -1) tileIdx = p.hand.findIndex(t => t.suit === tile.suit && t.value === tile.value);
    const newHand = [...p.hand.slice(0, tileIdx), ...p.hand.slice(tileIdx + 1)];
    return { ...p, hand: sortTiles(newHand), discards: [...p.discards, tile] };
  });
  const nextPlayer = (playerId + 1) % PLAYER_COUNT;
  return {
    ...state,
    players,
    lastDiscard: tile,
    lastDiscardPlayer: playerId,
    currentPlayer: nextPlayer,
    phase: 'playing',
  };
}

// Declare riichi: discard tile, pay 1000, mark riichi
export function declareRiichi(state: GameState, playerId: number, tile: Tile): GameState {
  const newState = discardTile(state, playerId, tile);
  const players = newState.players.map((p, i) => {
    if (i !== playerId) return p;
    return { ...p, isRiichi: true, score: p.score - 1000 };
  });
  return { ...newState, players, riichiBets: newState.riichiBets + 1 };
}

// Get win tile from hand (the drawn tile = lastDraw)
function extractWinTile(hand: Tile[], lastDraw: Tile): { winTile: Tile; handWithout: Tile[] } {
  const winTile = hand.find(t => t.id === lastDraw.id) ?? hand[hand.length - 1];
  const idx = hand.findIndex(t => t.id === winTile.id);
  const handWithout = [...hand.slice(0, idx), ...hand.slice(idx + 1)];
  return { winTile, handWithout };
}

// Declare tsumo win
export function declareTsumo(state: GameState): GameState {
  const player = state.players[state.currentPlayer];
  if (!state.lastDraw) return state;

  const { winTile, handWithout } = extractWinTile(player.hand, state.lastDraw);
  const isDealer = player.wind === 'east';

  const yaku = calcYaku({
    isTsumo: true,
    isRiichi: player.isRiichi,
    isIppatsu: false,
    isMenzen: player.melds.length === 0,
    seatWind: player.wind,
    roundWind: state.round,
    winTile,
    melds: player.melds,
    handTiles: handWithout,
    isDealer,
    isFirstDraw: state.wall.length === 70, // 136 - 14(dead) - 13×4 - 1(first draw)
  });

  if (yaku.filter(y => !y.isFuuhan).length === 0 && !yaku.some(y => y.han === Infinity)) return state;
  if (yaku.length === 0) return state;

  const doraCount = countDora(player.hand, state.dora);
  const scoreResult = calcSeigouScore(yaku, doraCount, isDealer, true, state.honba, state.riichiBets);
  const payments = scoreResult.payments.tsumo!;

  const riichiBetGain = state.riichiBets * 1000;

  const players = state.players.map((p, i) => {
    if (i === state.currentPlayer) {
      const total = isDealer
        ? payments.child * 3 + riichiBetGain
        : payments.parent + payments.child * 2 + riichiBetGain;
      return { ...p, score: p.score + total };
    }
    const isParent = p.wind === 'east';
    const pay = (!isDealer && isParent) ? payments.parent : payments.child;
    return { ...p, score: p.score - pay };
  });

  return {
    ...state,
    players,
    winner: state.currentPlayer,
    winTile,
    winByTsumo: true,
    scoreResult,
    phase: 'tsumo',
    riichiBets: 0,
  };
}

// Declare ron win
export function declareRon(state: GameState, winnerId: number): GameState {
  const player = state.players[winnerId];
  const winTile = state.lastDiscard!;
  const loserId = state.lastDiscardPlayer!;
  const isDealer = player.wind === 'east';

  const yaku = calcYaku({
    isTsumo: false,
    isRiichi: player.isRiichi,
    isIppatsu: false,
    isMenzen: player.melds.length === 0,
    seatWind: player.wind,
    roundWind: state.round,
    winTile,
    melds: player.melds,
    handTiles: player.hand,
    isDealer,
    isFirstDraw: false,
  });

  if (yaku.filter(y => !y.isFuuhan).length === 0 && !yaku.some(y => y.han === Infinity)) return state;
  if (yaku.length === 0) return state;

  const doraCount = countDora([...player.hand, winTile], state.dora);
  const scoreResult = calcSeigouScore(yaku, doraCount, isDealer, false, state.honba, state.riichiBets);
  const ronAmount = scoreResult.payments.ron!;
  const riichiBetGain = state.riichiBets * 1000;

  const players = state.players.map((p, i) => {
    if (i === winnerId) return { ...p, score: p.score + ronAmount + riichiBetGain };
    if (i === loserId) return { ...p, score: p.score - ronAmount };
    return p;
  });

  return {
    ...state,
    players,
    winner: winnerId,
    winTile,
    winByTsumo: false,
    scoreResult,
    phase: 'ron',
    riichiBets: 0,
  };
}

// Check if current player can tsumo
export function canPlayerTsumo(state: GameState): boolean {
  const player = state.players[state.currentPlayer];
  if (!canWin(player.hand, player.melds)) return false;
  // Check yaku exists
  if (!state.lastDraw) return false;
  const { winTile, handWithout } = extractWinTile(player.hand, state.lastDraw);
  const yaku = calcYaku({
    isTsumo: true,
    isRiichi: player.isRiichi,
    isIppatsu: false,
    isMenzen: player.melds.length === 0,
    seatWind: player.wind,
    roundWind: state.round,
    winTile,
    melds: player.melds,
    handTiles: handWithout,
    isDealer: player.wind === 'east',
    isFirstDraw: false,
  });
  return yaku.length > 0 && (yaku.some(y => !y.isFuuhan) || yaku.some(y => y.han === Infinity));
}

// Check if human can ron on last discard
export function canHumanRon(state: GameState): boolean {
  const HUMAN = 0;
  if (!state.lastDiscard || state.lastDiscardPlayer === HUMAN) return false;
  const p = state.players[HUMAN];
  if (!canWin([...p.hand, state.lastDiscard], p.melds)) return false;
  const yaku = calcYaku({
    isTsumo: false,
    isRiichi: p.isRiichi,
    isIppatsu: false,
    isMenzen: p.melds.length === 0,
    seatWind: p.wind,
    roundWind: state.round,
    winTile: state.lastDiscard,
    melds: p.melds,
    handTiles: p.hand,
    isDealer: p.wind === 'east',
    isFirstDraw: false,
  });
  return yaku.length > 0 && (yaku.some(y => !y.isFuuhan) || yaku.some(y => y.han === Infinity));
}

export function countDora(hand: Tile[], dora: Tile[]): number {
  let count = 0;
  for (const d of dora) {
    count += hand.filter(t => t.suit === d.suit && t.value === d.value).length;
  }
  return count;
}

// CPU ron check: returns winnerId if any CPU can ron on current discard, else -1
function checkCpuRon(state: GameState): number {
  if (!state.lastDiscard || state.lastDiscardPlayer === null) return -1;
  // Check CPU players (1,2,3) in turn order starting from player after discarder
  const discarder = state.lastDiscardPlayer;
  for (let offset = 1; offset < PLAYER_COUNT; offset++) {
    const cpuId = (discarder + offset) % PLAYER_COUNT;
    if (cpuId === 0) continue; // skip human
    const cpu = state.players[cpuId];
    if (!canWin([...cpu.hand, state.lastDiscard], cpu.melds)) continue;
    const yaku = calcYaku({
      isTsumo: false,
      isRiichi: cpu.isRiichi,
      isIppatsu: false,
      isMenzen: cpu.melds.length === 0,
      seatWind: cpu.wind,
      roundWind: state.round,
      winTile: state.lastDiscard,
      melds: cpu.melds,
      handTiles: cpu.hand,
      isDealer: cpu.wind === 'east',
      isFirstDraw: false,
    });
    if (yaku.length > 0 && (yaku.some(y => !y.isFuuhan) || yaku.some(y => y.han === Infinity))) {
      return cpuId;
    }
  }
  return -1;
}

// CPU turn: check ron, then draw+discard or tsumo, optionally declare riichi
export function cpuTurn(state: GameState): GameState {
  // Check CPU ron on current discard (after human passes)
  const ronWinner = checkCpuRon(state);
  if (ronWinner !== -1) {
    return declareRon(state, ronWinner);
  }

  // Draw tile
  let s = drawTile(state);
  if (s.phase === 'exhaustive_draw') return s;

  const cpuId = s.currentPlayer;
  const player = s.players[cpuId];

  // Check tsumo
  if (canWin(player.hand, player.melds) && s.lastDraw) {
    const { winTile, handWithout } = extractWinTile(player.hand, s.lastDraw);
    const yaku = calcYaku({
      isTsumo: true,
      isRiichi: player.isRiichi,
      isIppatsu: false,
      isMenzen: player.melds.length === 0,
      seatWind: player.wind,
      roundWind: s.round,
      winTile,
      melds: player.melds,
      handTiles: handWithout,
      isDealer: player.wind === 'east',
      isFirstDraw: false,
    });
    if (yaku.length > 0 && (yaku.some(y => !y.isFuuhan) || yaku.some(y => y.han === Infinity))) {
      return declareTsumo(s);
    }
  }

  // Try riichi if tenpai and menzen
  if (!player.isRiichi && player.melds.length === 0) {
    const riichiTile = cpuGetRiichiDiscard(player.hand, player.melds);
    if (riichiTile && Math.random() < 0.7) { // 70% chance to riichi
      return declareRiichi(s, cpuId, riichiTile);
    }
  }

  // Normal discard
  const tileToDiscard = cpuChooseDiscard(player.hand, player.melds);
  return discardTile(s, cpuId, tileToDiscard);
}

// Check if player is in tenpai
export function isPlayerTenpai(state: GameState, playerId: number): boolean {
  const player = state.players[playerId];
  return getTenpaiTiles(player.hand, player.melds).length > 0;
}

// Handle exhaustive draw: apply tenpai/noten payments and advance
export function handleExhaustiveDraw(state: GameState): GameState {
  const tenpaiFlags = state.players.map((_, i) => isPlayerTenpai(state, i));
  const payments = calcNotenBappu(tenpaiFlags);

  const players = state.players.map((p, i) => ({
    ...p,
    score: p.score + payments[i],
  }));

  // Honba increases on exhaustive draw
  void tenpaiFlags; // used above in players map
  return {
    ...state,
    players,
    phase: 'exhaustive_draw',
    honba: state.honba + 1,
    // Store result info
    scoreResult: {
      han: 0,
      yaku: [],
      dora: 0,
      basePoints: 0,
      payments: {},
      rankName: tenpaiFlags.map((t, i) => `${state.players[i].name}: ${t ? 'テンパイ' : 'ノーテン'}`).join(' / '),
    },
  };
}

// Next round setup
export function nextRound(state: GameState, winnerWasDealer: boolean): GameState {
  const newHonba = winnerWasDealer ? state.honba + 1 : 0;

  let players = state.players;
  let newRoundNumber = state.roundNumber;
  let newRound = state.round;

  if (!winnerWasDealer) {
    // Rotate seat winds
    players = state.players.map(p => ({
      ...p,
      wind: WINDS[(WINDS.indexOf(p.wind) + 3) % 4] as Wind,
    }));
    newRoundNumber = state.roundNumber + 1;
    if (newRoundNumber > 4) {
      newRoundNumber = 1;
      newRound = state.round === 'east' ? 'south' : 'west';
    }
  }

  return dealNewRound({
    ...state,
    players,
    honba: newHonba,
    round: newRound,
    roundNumber: newRoundNumber,
  });
}

// Check if game should end
export function isGameOver(state: GameState): boolean {
  // Bankruptcy
  if (state.players.some(p => p.score <= 0)) return true;
  // After 南4局 (or 西4局 depending on rules)
  if (state.round === 'south' && state.roundNumber > 4) return true;
  return false;
}

// Get tenpai tiles for a specific player's hand (useful for display)
export function getPlayerTenpaiTiles(state: GameState, playerId: number): Tile[] {
  const player = state.players[playerId];
  // For 13-tile hand, get waiting tiles
  const hand13 = player.hand.length === 14
    ? sortTiles(player.hand).slice(0, 13) // rough: just check first 13
    : player.hand;
  return getTenpaiTiles(hand13, player.melds);
}
