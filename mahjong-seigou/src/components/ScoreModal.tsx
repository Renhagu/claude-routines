import type { ScoreResult, Tile } from '../types/mahjong';
import TileComponent from './TileComponent';
import { sortTiles } from '../lib/tiles';

const YAKU_LABELS: Record<string, string> = {
  tsumo: '門前清自摸和',
  riichi: 'リーチ',
  ippatsu: '一発',
  tanyao: '断么九',
  pinfu: '平和',
  iipeiko: '一盃口',
  yakuhai_east: '役牌（東）',
  yakuhai_south: '役牌（南）',
  yakuhai_west: '役牌（西）',
  yakuhai_north: '役牌（北）',
  yakuhai_haku: '白',
  yakuhai_hatsu: '発',
  yakuhai_chun: '中',
  sanshoku: '三色同順',
  ittsu: '一気通貫',
  chanta: '混全帯么九',
  toitoi: '対々和',
  sananko: '三暗刻',
  sankantsu: '三槓子',
  chiitoi: '七対子',
  honitsu: '混一色',
  junchan: '純全帯么九',
  ryanpeiko: '二盃口',
  chinitsu: '清一色',
  kokushi: '国士無双',
  suuanko: '四暗刻',
  daisangen: '大三元',
  shosuushi: '小四喜',
  daisuushi: '大四喜',
  tsuiisou: '字一色',
  chinroto: '清老頭',
  ryuuiisou: '緑一色',
  suukantsu: '四槓子',
  chuurenpoto: '九蓮宝燈',
  tenho: '天和',
  chiho: '地和',
  fuuhan_ron: '門前清栄和',
  fuuhan_ryananko: '二暗刻',
  fuuhan_ikkantsu: '一槓子',
  fuuhan_ryankantsu: '二槓子',
};

interface Props {
  result: ScoreResult;
  winnerName: string;
  isTsumo: boolean;
  isDealer: boolean;
  winTile: Tile | null;
  winnerHand: Tile[];
  onNext: () => void;
}

export default function ScoreModal({ result, winnerName, isTsumo, isDealer, winTile, winnerHand, onNext }: Props) {
  const normalYaku = result.yaku.filter(y => !y.isFuuhan);
  const fuuhanYaku = result.yaku.filter(y => y.isFuuhan);
  const hand = winTile ? sortTiles(winnerHand.filter(t => t.id !== winTile.id)) : sortTiles(winnerHand);

  return (
    <div className="fixed inset-0 bg-black/75 flex items-end sm:items-center justify-center z-50 p-2">
      <div className="bg-white rounded-2xl shadow-2xl p-4 w-full max-w-sm mx-auto">
        <h2 className="text-2xl font-bold text-center mb-0.5 text-gray-800">
          {isTsumo ? 'ツモ！' : 'ロン！'}
        </h2>
        <p className="text-center text-gray-400 text-sm mb-3">{winnerName} の和了</p>

        {/* Winning hand display */}
        {winnerHand.length > 0 && (
          <div className="flex gap-1 justify-center mb-3 flex-wrap">
            {hand.map((t, i) => (
              <TileComponent key={i} tile={t} small />
            ))}
            {winTile && (
              <>
                <div className="w-2" />
                <TileComponent tile={winTile} small highlighted />
              </>
            )}
          </div>
        )}

        {/* Rank */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 mb-3 text-center">
          <span className="text-2xl font-bold text-amber-700">{result.rankName}</span>
          {result.han !== Infinity && result.han > 0 && (
            <span className="text-base text-amber-500 ml-2">{result.han}翻</span>
          )}
        </div>

        {/* Yaku list */}
        <div className="mb-3 text-sm">
          {normalYaku.length > 0 && (
            <div className="space-y-0.5">
              {normalYaku.map((y, i) => (
                <div key={i} className="flex justify-between">
                  <span>{YAKU_LABELS[y.name] ?? y.name}</span>
                  <span className="font-mono text-gray-600">
                    {y.han === Infinity ? '役満' : `${y.han}翻`}
                  </span>
                </div>
              ))}
            </div>
          )}
          {fuuhanYaku.length > 0 && (
            <div className="mt-1 pt-1 border-t border-dashed border-gray-200">
              <div className="text-xs text-gray-400 mb-0.5">符翻</div>
              {fuuhanYaku.map((y, i) => (
                <div key={i} className="flex justify-between text-gray-400">
                  <span>{YAKU_LABELS[y.name] ?? y.name}</span>
                  <span className="font-mono">{y.han}翻</span>
                </div>
              ))}
            </div>
          )}
          {result.dora > 0 && (
            <div className="flex justify-between mt-0.5 text-red-500">
              <span>ドラ</span>
              <span className="font-mono">{result.dora}翻</span>
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
          {isTsumo && result.payments.tsumo ? (
            isDealer ? (
              <div className="flex justify-between">
                <span>子から各</span>
                <span className="font-bold text-lg">{result.payments.tsumo.child.toLocaleString()}点</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>親から</span>
                  <span className="font-bold">{result.payments.tsumo.parent.toLocaleString()}点</span>
                </div>
                <div className="flex justify-between">
                  <span>子から各</span>
                  <span className="font-bold">{result.payments.tsumo.child.toLocaleString()}点</span>
                </div>
              </>
            )
          ) : (
            <div className="flex justify-between">
              <span>振込点数</span>
              <span className="font-bold text-lg">{result.payments.ron?.toLocaleString()}点</span>
            </div>
          )}
        </div>

        <button
          onClick={onNext}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 rounded-xl transition-colors"
        >
          次へ
        </button>
      </div>
    </div>
  );
}
