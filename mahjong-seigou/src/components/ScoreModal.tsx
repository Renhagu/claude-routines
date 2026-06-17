import type { ScoreResult } from '../types/mahjong';

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
  onNext: () => void;
}

export default function ScoreModal({ result, winnerName, isTsumo, isDealer, onNext }: Props) {
  const normalYaku = result.yaku.filter(y => !y.isFuuhan);
  const fuuhanYaku = result.yaku.filter(y => y.isFuuhan);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-center mb-1 text-gray-800">
          {isTsumo ? 'ツモ！' : 'ロン！'}
        </h2>
        <p className="text-center text-gray-500 mb-4">{winnerName} の和了</p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-center">
          <span className="text-3xl font-bold text-amber-700">{result.rankName}</span>
          <span className="text-lg text-amber-600 ml-2">
            {result.han === Infinity ? '' : `${result.han}翻`}
          </span>
        </div>

        {/* Yaku list */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">役</h3>
          <div className="space-y-1">
            {normalYaku.map((y, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{YAKU_LABELS[y.name] ?? y.name}</span>
                <span className="font-mono text-gray-600">
                  {y.han === Infinity ? '役満' : `${y.han}翻`}
                </span>
              </div>
            ))}
          </div>
          {fuuhanYaku.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-500 mt-3 mb-2">符翻</h3>
              <div className="space-y-1">
                {fuuhanYaku.map((y, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-500">
                    <span>{YAKU_LABELS[y.name] ?? y.name}</span>
                    <span className="font-mono">{y.han}翻</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {result.dora > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-red-500">ドラ</span>
              <span className="font-mono text-red-500">{result.dora}翻</span>
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">点数</h3>
          {isTsumo && result.payments.tsumo ? (
            <div className="text-sm space-y-1">
              {isDealer ? (
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
              )}
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span>振込点数</span>
              <span className="font-bold text-lg">{result.payments.ron?.toLocaleString()}点</span>
            </div>
          )}
        </div>

        <button
          onClick={onNext}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
        >
          次へ
        </button>
      </div>
    </div>
  );
}
