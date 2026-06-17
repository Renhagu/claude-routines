import type { Tile, Meld } from '../types/mahjong';
import { getTenpaiTiles } from './agari';
import { sameTile, isYaochuuhai } from './tiles';

// CPU AI: discard strategy
export function cpuChooseDiscard(hand: Tile[], melds: Meld[]): Tile {
  // Try to discard each tile and see if remaining tiles are tenpai or get better
  let bestTile = hand[0];
  let bestScore = -Infinity;

  for (const candidate of hand) {
    const remaining = removeOneTile(hand, candidate);
    const waits = getTenpaiTiles(remaining, melds);
    if (waits.length > 0) {
      // Tenpai! Discard this tile - prioritize by number of waits
      const score = 1000 + waits.length;
      if (score > bestScore) { bestScore = score; bestTile = candidate; }
      continue;
    }
    // Score the remaining hand by connections
    const score = scoreHand(remaining, melds);
    if (score > bestScore) { bestScore = score; bestTile = candidate; }
  }

  return bestTile;
}

function removeOneTile(hand: Tile[], tile: Tile): Tile[] {
  const idx = hand.findIndex(t => sameTile(t, tile));
  return [...hand.slice(0, idx), ...hand.slice(idx + 1)];
}

function scoreHand(hand: Tile[], _melds: Meld[]): number {
  let score = 0;
  for (let i = 0; i < hand.length; i++) {
    const t = hand[i];
    if (isYaochuuhai(t)) continue; // yaochuu tiles are less useful
    for (let j = i + 1; j < hand.length; j++) {
      const u = hand[j];
      if (sameTile(t, u)) { score += 3; continue; } // pair
      if (t.suit === u.suit && !isYaochuuhai(t)) {
        const diff = Math.abs(t.value - u.value);
        if (diff === 1) score += 2; // sequential
        if (diff === 2) score += 1; // kanchan
      }
    }
  }
  return score;
}

// CPU decides whether to declare riichi
export function cpuGetRiichiDiscard(hand: Tile[], melds: Meld[]): Tile | null {
  if (melds.length > 0) return null;
  // Find a discard that leaves hand in tenpai
  for (const tile of hand) {
    const remaining = removeOneTile(hand, tile);
    const waits = getTenpaiTiles(remaining, melds);
    if (waits.length > 0) return tile;
  }
  return null;
}

// Get tenpai waits for a hand (14 tiles - returns waits if tenpai with one discard)
export function getTenpaiDiscardsAndWaits(hand: Tile[], melds: Meld[]): Map<string, Tile[]> {
  const result = new Map<string, Tile[]>();
  for (const tile of hand) {
    const remaining = removeOneTile(hand, tile);
    const waits = getTenpaiTiles(remaining, melds);
    if (waits.length > 0) {
      result.set(`${tile.suit}-${tile.value}`, waits);
    }
  }
  return result;
}
