import type { Tile } from '../types/mahjong';

interface Props {
  tile: Tile;
  selected?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  small?: boolean;
  highlighted?: boolean;
  rotate?: 90 | 180 | 270;
}

function tileUnicode(tile: Tile): string {
  if (tile.suit === 'honor') {
    return ['東', '南', '西', '北', '白', '発', '中'][tile.value - 1];
  }
  if (tile.suit === 'man') {
    return ['🀇','🀈','🀉','🀊','🀋','🀌','🀍','🀎','🀏'][tile.value - 1];
  }
  if (tile.suit === 'pin') {
    return ['🀙','🀚','🀛','🀜','🀝','🀞','🀟','🀠','🀡'][tile.value - 1];
  }
  return ['🀐','🀑','🀒','🀓','🀔','🀕','🀖','🀗','🀘'][tile.value - 1];
}

export default function TileComponent({ tile, selected, onClick, faceDown, small, highlighted, rotate }: Props) {
  const colorClass = tile.suit === 'honor'
    ? (tile.value >= 5 ? 'text-red-600' : 'text-gray-700')
    : tile.suit === 'man' ? 'text-red-700'
    : tile.suit === 'pin' ? 'text-blue-700'
    : 'text-green-700';

  const rotateClass = rotate === 90 ? 'rotate-90' : rotate === 180 ? 'rotate-180' : rotate === 270 ? '-rotate-90' : '';

  if (faceDown) {
    const w = small ? 'w-5 h-7' : 'w-10 h-14';
    return (
      <div className={`${w} bg-blue-800 border border-blue-600 rounded flex items-center justify-center shadow ${rotateClass}`}>
        <span className="text-blue-500 text-xs">▪</span>
      </div>
    );
  }

  const sizeClass = small ? 'w-6 h-9 text-xs' : 'w-10 h-14 text-sm';

  return (
    <div
      onClick={onClick}
      className={`
        ${sizeClass} bg-white border-2 rounded flex flex-col items-center justify-center
        shadow cursor-pointer select-none transition-all duration-100
        ${selected ? '-translate-y-2 border-yellow-400 bg-yellow-50' : 'border-gray-300'}
        ${highlighted ? 'border-green-400 bg-green-50' : ''}
        ${onClick ? 'hover:-translate-y-1 hover:shadow-md' : 'cursor-default'}
        ${tile.isRed ? 'ring-1 ring-red-400' : ''}
        ${rotateClass}
      `}
    >
      <span className={`${colorClass} font-bold leading-none`}>{tileUnicode(tile)}</span>
    </div>
  );
}
