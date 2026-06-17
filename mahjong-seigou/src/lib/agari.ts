import type { Tile, Meld } from '../types/mahjong';
import { sameTile } from './tiles';

export interface Block {
  type: 'shuntsu' | 'koutsu' | 'jantai'; // sequence, triplet, pair
  tiles: Tile[];
  isAnko: boolean; // closed triplet
}

export interface WinPattern {
  blocks: Block[];
  jantai: Block;
  melds: Meld[];
}

// Check if tiles form a valid winning hand (normal form)
export function findWinPatterns(handTiles: Tile[], melds: Meld[]): WinPattern[] {
  const sorted = [...handTiles].sort((a, b) => {
    const suitOrder = { man: 0, pin: 1, sou: 2, honor: 3 };
    if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
    return a.value - b.value;
  });

  const patterns: WinPattern[] = [];
  tryPair(sorted, [], melds, patterns);
  return patterns;
}

function tryPair(tiles: Tile[], _blocks: Block[], melds: Meld[], results: WinPattern[]): void {
  for (let i = 0; i < tiles.length - 1; i++) {
    if (sameTile(tiles[i], tiles[i + 1])) {
      const pair: Block = {
        type: 'jantai',
        tiles: [tiles[i], tiles[i + 1]],
        isAnko: false,
      };
      const remaining = [...tiles.slice(0, i), ...tiles.slice(i + 2)];
      const meldBlocks = melds.map(m => ({
        type: (m.type === 'chi' ? 'shuntsu' : 'koutsu') as Block['type'],
        tiles: m.tiles,
        isAnko: m.type === 'ankan',
      }));
      tryMentsu(remaining, [pair, ...meldBlocks], pair, melds, results);
    }
  }
}

function tryMentsu(tiles: Tile[], blocks: Block[], jantai: Block, melds: Meld[], results: WinPattern[]): void {
  if (tiles.length === 0) {
    results.push({ blocks: blocks.filter(b => b.type !== 'jantai'), jantai, melds });
    return;
  }

  const first = tiles[0];

  // Try koutsu (triplet)
  if (tiles.length >= 3 && sameTile(tiles[0], tiles[1]) && sameTile(tiles[1], tiles[2])) {
    const block: Block = {
      type: 'koutsu',
      tiles: [tiles[0], tiles[1], tiles[2]],
      isAnko: true,
    };
    tryMentsu(tiles.slice(3), [...blocks, block], jantai, melds, results);
  }

  // Try shuntsu (sequence)
  if (first.suit !== 'honor') {
    const second = tiles.find((t, i) => i > 0 && t.suit === first.suit && t.value === first.value + 1);
    if (second) {
      const third = tiles.find((t, i) => i > tiles.indexOf(second) && t.suit === first.suit && t.value === first.value + 2);
      if (third) {
        const remaining = [...tiles];
        remaining.splice(remaining.indexOf(third), 1);
        remaining.splice(remaining.indexOf(second), 1);
        remaining.splice(0, 1);
        const block: Block = {
          type: 'shuntsu',
          tiles: [first, second, third],
          isAnko: false,
        };
        tryMentsu(remaining, [...blocks, block], jantai, melds, results);
      }
    }
  }
}

// Chiitoi (seven pairs)
export function isChiitoi(handTiles: Tile[]): boolean {
  if (handTiles.length !== 13) return false;
  const groups: Map<string, number> = new Map();
  for (const t of handTiles) {
    const key = `${t.suit}-${t.value}`;
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  const vals = [...groups.values()];
  return vals.length === 7 && vals.every(v => v === 2);
}

// Kokushi
export function isKokushi(handTiles: Tile[]): boolean {
  if (handTiles.length !== 13) return false;
  const yaochuu = [
    { suit: 'man', value: 1 }, { suit: 'man', value: 9 },
    { suit: 'pin', value: 1 }, { suit: 'pin', value: 9 },
    { suit: 'sou', value: 1 }, { suit: 'sou', value: 9 },
    { suit: 'honor', value: 1 }, { suit: 'honor', value: 2 },
    { suit: 'honor', value: 3 }, { suit: 'honor', value: 4 },
    { suit: 'honor', value: 5 }, { suit: 'honor', value: 6 },
    { suit: 'honor', value: 7 },
  ];
  const has = (s: string, v: number) => handTiles.some(t => t.suit === s && t.value === v);
  const hasAll = yaochuu.every(y => has(y.suit, y.value));
  if (!hasAll) return false;
  // Must have a pair among yaochuu
  const pairs = yaochuu.filter(y => handTiles.filter(t => t.suit === y.suit && t.value === y.value).length >= 2);
  return pairs.length >= 1;
}

export function canWin(handTiles: Tile[], melds: Meld[]): boolean {
  if (handTiles.length + melds.length * 3 !== 14 && handTiles.length + melds.length * 3 !== 13) {
    // After draw: 14 tiles in hand (no melds) or adjusted for melds
  }
  if (isChiitoi(handTiles)) return true;
  if (isKokushi(handTiles)) return true;
  return findWinPatterns(handTiles, melds).length > 0;
}

// Tenpai check: can win if one tile is added
export function getTenpaiTiles(handTiles: Tile[], melds: Meld[]): Tile[] {
  const allTiles: Tile[] = [];
  const suits = ['man', 'pin', 'sou'] as const;
  for (const suit of suits) {
    for (let v = 1; v <= 9; v++) allTiles.push({ id: -1, suit, value: v });
  }
  for (let v = 1; v <= 7; v++) allTiles.push({ id: -1, suit: 'honor', value: v });

  return allTiles.filter(candidate => canWin([...handTiles, candidate], melds));
}
