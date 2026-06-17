import type { Tile } from '../types/mahjong';
import { tileUnicode } from '../lib/tiles';

interface Props {
  tile: Tile;
  selected?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  small?: boolean;
  highlighted?: boolean;
}

export default function TileComponent({ tile, selected, onClick, faceDown, small, highlighted }: Props) {
  const isHonor = tile.suit === 'honor';
  const colorClass = !isHonor
    ? tile.suit === 'man' ? 'text-red-700' : tile.suit === 'pin' ? 'text-blue-700' : 'text-green-700'
    : tile.value >= 5 ? 'text-red-600' : 'text-gray-700';

  if (faceDown) {
    return (
      <div className={`
        ${small ? 'w-8 h-11 text-sm' : 'w-12 h-16 text-xl'}
        bg-blue-800 border-2 border-blue-600 rounded
        flex items-center justify-center
        shadow-md
      `}>
        <span className="text-blue-400">🀫</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        ${small ? 'w-8 h-11 text-xs' : 'w-12 h-16 text-base'}
        bg-white border-2 rounded
        flex flex-col items-center justify-center
        shadow-md cursor-pointer select-none
        transition-all duration-150
        ${selected ? '-translate-y-2 border-yellow-400 bg-yellow-50' : 'border-gray-300'}
        ${highlighted ? 'border-green-400 bg-green-50' : ''}
        ${onClick ? 'hover:-translate-y-1 hover:shadow-lg' : 'cursor-default'}
        ${tile.isRed ? 'ring-1 ring-red-400' : ''}
      `}
    >
      <span className={`${colorClass} font-bold leading-tight`} style={{ fontSize: small ? '0.7rem' : '1.1rem' }}>
        {tileUnicode(tile)}
      </span>
      {tile.isRed && <span className="text-red-500 text-xs leading-none">●</span>}
    </div>
  );
}
