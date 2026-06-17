import type { GameState, Player, Tile, Wind } from '../types/mahjong';
import { createTileSet, shuffle, sortTiles } from './tiles';
import { canWin, getTenpaiTiles } from './agari';
import { calcYaku } from './yaku';
import { calcSeigouScore, getDoraFromIndicator } from './score';
import { cpuChooseDiscard } from './ai';

const WINDS: Wind[] = ['east', 'south', 'west', 'north'];

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

  // Dead wall: last 14 tiles
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

// Draw a tile for current player
export function drawTile(state: GameState): GameState {
  if (state.wall.length === 0) {
    return { ...state, phase: 'exhaustive_draw' };
  }
  const [drawn, ...remaining] = state.wall;
  const players = state.players.map((p, i) => {
    if (i !== state.currentPlayer) return p;
    return { ...p, hand: sortTiles([...p.hand, drawn]) };
  });
  return { ...state, wall: remaining, players, lastDraw: drawn };
}

// Player discards a tile
export function discardTile(state: GameState, playerId: number, tile: Tile): GameState {
  const players = state.players.map((p, i) => {
    if (i !== playerId) return p;
    const tileIdx = p.hand.findIndex(t => t.suit === tile.suit && t.value === tile.value);
    const newHand = [...p.hand.slice(0, tileIdx), ...p.hand.slice(tileIdx + 1)];
    return { ...p, hand: sortTiles(newHand), discards: [...p.discards, tile] };
  });
  // next player
  const nextPlayer = (playerId + 1) % state.players.length;
  return {
    ...state,
    players,
    lastDiscard: tile,
    lastDiscardPlayer: playerId,
    currentPlayer: nextPlayer,
    phase: 'playing',
  };
}

// Declare tsumo win
export function declareTsumo(state: GameState): GameState {
  const player = state.players[state.currentPlayer];
  const winTile = state.lastDraw!;
  const handWithout = player.hand.filter((_, i) => i !== player.hand.length - 1);

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
    isDealer: state.currentPlayer === 0,
    isFirstDraw: state.wall.length === 108 - 4, // rough first draw check
  });

  if (yaku.length === 0) return state; // no yaku

  const doraCount = countDora(player.hand, state.dora);
  const isDealer = state.currentPlayer === 0;

  const scoreResult = calcSeigouScore(yaku, doraCount, isDealer, true, state.honba, state.riichiBets);

  // Apply payments
  const payments = scoreResult.payments.tsumo!;
  const players = state.players.map((p, i) => {
    if (i === state.currentPlayer) {
      let gain = state.riichiBets * 1000;
      for (let j = 0; j < state.players.length; j++) {
        if (j === i) continue;
        if (j === 0 && !isDealer) gain += payments.parent; // player 0 is dealer... wait, need to check
        else gain += payments.child;
      }
      // Simplified: winner gains total
      const totalGain = isDealer
        ? payments.child * 3 + state.riichiBets * 1000 + state.honba * 250 * 3
        : payments.parent + payments.child * 2 + state.riichiBets * 1000 + state.honba * 250 * 3;
      return { ...p, score: p.score + totalGain };
    }
    // Payer
    const pay = (i === 0 && !isDealer) ? payments.parent : payments.child;
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
  const loser = state.lastDiscardPlayer!;

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
    isDealer: winnerId === 0,
    isFirstDraw: false,
  });

  if (yaku.length === 0) return state;

  const doraCount = countDora([...player.hand, winTile], state.dora);
  const isDealer = winnerId === 0;

  const scoreResult = calcSeigouScore(yaku, doraCount, isDealer, false, state.honba, state.riichiBets);

  const ronAmount = scoreResult.payments.ron!;
  const players = state.players.map((p, i) => {
    if (i === winnerId) return { ...p, score: p.score + ronAmount + state.riichiBets * 1000 };
    if (i === loser) return { ...p, score: p.score - ronAmount };
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

// Declare riichi
export function declareRiichi(state: GameState, playerId: number, discardTile: Tile): GameState {
  let newState = discardTileAction(state, playerId, discardTile);
  const players = newState.players.map((p, i) => {
    if (i !== playerId) return p;
    return { ...p, isRiichi: true, score: p.score - 1000 };
  });
  return { ...newState, players, riichiBets: state.riichiBets + 1 };
}

function discardTileAction(state: GameState, playerId: number, tile: Tile): GameState {
  const players = state.players.map((p, i) => {
    if (i !== playerId) return p;
    const tileIdx = p.hand.findIndex(t => t.suit === tile.suit && t.value === tile.value);
    const newHand = [...p.hand.slice(0, tileIdx), ...p.hand.slice(tileIdx + 1)];
    return { ...p, hand: sortTiles(newHand), discards: [...p.discards, tile] };
  });
  const nextPlayer = (playerId + 1) % state.players.length;
  return { ...state, players, lastDiscard: tile, lastDiscardPlayer: playerId, currentPlayer: nextPlayer };
}

// Check if player can win by tsumo (has a complete hand)
export function canPlayerTsumo(state: GameState): boolean {
  const player = state.players[state.currentPlayer];
  return canWin(player.hand, player.melds);
}

// Check which players can win by ron
export function canRon(state: GameState): number[] {
  if (!state.lastDiscard || state.lastDiscardPlayer === null) return [];
  const winners: number[] = [];
  for (let i = 0; i < state.players.length; i++) {
    if (i === state.lastDiscardPlayer) continue;
    const p = state.players[i];
    if (canWin([...p.hand, state.lastDiscard], p.melds)) {
      // Check if has yaku
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
        isDealer: i === 0,
        isFirstDraw: false,
      });
      if (yaku.length > 0) winners.push(i);
    }
  }
  return winners;
}

export function countDora(hand: Tile[], dora: Tile[]): number {
  let count = 0;
  for (const d of dora) {
    count += hand.filter(t => t.suit === d.suit && t.value === d.value).length;
  }
  return count;
}

// CPU turn: draw and discard or tsumo
export function cpuTurn(state: GameState): GameState {
  let s = drawTile(state);
  const player = s.players[s.currentPlayer];

  // Check tsumo
  if (canWin(player.hand, player.melds)) {
    // Simple CPU: tsumo if possible
    const yaku = calcYaku({
      isTsumo: true,
      isRiichi: player.isRiichi,
      isIppatsu: false,
      isMenzen: player.melds.length === 0,
      seatWind: player.wind,
      roundWind: s.round,
      winTile: s.lastDraw!,
      melds: player.melds,
      handTiles: player.hand.slice(0, -1),
      isDealer: s.currentPlayer === 0,
      isFirstDraw: false,
    });
    if (yaku.length > 0) return declareTsumo(s);
  }

  // Discard
  const tileToDiscard = cpuChooseDiscard(player.hand, player.melds);
  return discardTile(s, s.currentPlayer, tileToDiscard);
}

// Check if player is in tenpai (for exhaustive draw)
export function isPlayerTenpai(state: GameState, playerId: number): boolean {
  const player = state.players[playerId];
  return getTenpaiTiles(player.hand, player.melds).length > 0;
}

// Next round setup
export function nextRound(state: GameState, winnerWasDealer: boolean): GameState {
  const newHonba = winnerWasDealer ? state.honba + 1 : 0;
  // Rotate winds if dealer lost
  let players = state.players;
  if (!winnerWasDealer) {
    players = state.players.map(p => ({
      ...p,
      wind: WINDS[(WINDS.indexOf(p.wind) + 3) % 4],
    }));
  }
  const newRoundNumber = state.roundNumber + (winnerWasDealer ? 0 : 1);
  const newRound: Wind = newRoundNumber > 4 ? 'south' : 'east';

  return dealNewRound({
    ...state,
    players,
    honba: newHonba,
    round: newRound,
    roundNumber: newRoundNumber > 4 ? newRoundNumber - 4 : newRoundNumber,
  });
}
