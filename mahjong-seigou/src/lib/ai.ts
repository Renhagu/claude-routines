import type { Tile, Meld } from '../types/mahjong';
import { getTenpaiTiles } from './agari';
import { sameTile, isYaochuuhai, sortTiles } from './tiles';

// Simple CPU AI: discard strategy
export function cpuChooseDiscard(hand: Tile[], melds: Meld[]): Tile {
  const sorted = sortTiles(hand);

  // Try to find tenpai by removing each tile
  for (const tile of sorted) {
    const remaining = sorted.filter((_, i) => sorted[i] !== tile);
    // Skip duplicates (same tile type)
    const waits = getTenpaiTiles(remaining, melds);
    if (waits.length > 0) {
      return tile;
    }
  }

  // Count tile usefulness (how many connections it has)
  const scores = sorted.map(tile => {
    let score = 0;
    if (isYaochuuhai(tile)) score -= 2;
    for (const other of sorted) {
      if (other === tile) continue;
      if (sameTile(other, tile)) score += 3; // pair
      if (other.suit === tile.suit && Math.abs(other.value - tile.value) <= 2) score += 1;
    }
    return score;
  });

  // Discard tile with lowest score
  const minScore = Math.min(...scores);
  const idx = scores.indexOf(minScore);
  return sorted[idx];
}

// CPU decides whether to declare riichi
export function cpuShouldRiichi(hand: Tile[], melds: Meld[]): boolean {
  if (melds.length > 0) return false;
  // Simple: riichi if tenpai with few waits (conservative)
  const waits = getTenpaiTiles(hand, melds);
  return waits.length > 0;
}

// CPU decides whether to call chi/pon on a discarded tile
export function cpuShouldClaim(_hand: Tile[], _tile: Tile): boolean {
  // Simple AI: don't call for now
  return false;
}
