import type { Tile, Suit } from '../types/mahjong';

export function createTileSet(): Tile[] {
  const tiles: Tile[] = [];
  let id = 0;

  const suits: Suit[] = ['man', 'pin', 'sou'];
  for (const suit of suits) {
    for (let value = 1; value <= 9; value++) {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push({ id: id++, suit, value, isRed: copy === 0 && value === 5 });
      }
    }
  }

  // Honors: 1=East 2=South 3=West 4=North 5=Haku 6=Hatsu 7=Chun
  for (let value = 1; value <= 7; value++) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({ id: id++, suit: 'honor', value });
    }
  }

  return tiles;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function tileLabel(tile: Tile): string {
  if (tile.suit === 'honor') {
    return ['東', '南', '西', '北', '白', '発', '中'][tile.value - 1];
  }
  const suitChar = tile.suit === 'man' ? '万' : tile.suit === 'pin' ? '筒' : '索';
  return `${tile.value}${suitChar}`;
}

export function tileUnicode(tile: Tile): string {
  if (tile.suit === 'honor') {
    return ['東', '南', '西', '北', '白', '発', '中'][tile.value - 1];
  }
  if (tile.suit === 'man') {
    const codes = ['🀇','🀈','🀉','🀊','🀋','🀌','🀍','🀎','🀏'];
    return codes[tile.value - 1];
  }
  if (tile.suit === 'pin') {
    const codes = ['🀙','🀚','🀛','🀜','🀝','🀞','🀟','🀠','🀡'];
    return codes[tile.value - 1];
  }
  // sou
  const codes = ['🀐','🀑','🀒','🀓','🀔','🀕','🀖','🀗','🀘'];
  return codes[tile.value - 1];
}

export function sameTile(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.value === b.value;
}

export function compareTile(a: Tile, b: Tile): number {
  const suitOrder: Record<Suit, number> = { man: 0, pin: 1, sou: 2, honor: 3 };
  if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
  return a.value - b.value;
}

export function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort(compareTile);
}

export function isTerminal(tile: Tile): boolean {
  if (tile.suit === 'honor') return true;
  return tile.value === 1 || tile.value === 9;
}

export function isHonor(tile: Tile): boolean {
  return tile.suit === 'honor';
}

export function isYaochuuhai(tile: Tile): boolean {
  return isHonor(tile) || tile.value === 1 || tile.value === 9;
}
