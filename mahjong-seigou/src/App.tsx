import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState, Tile } from './types/mahjong';
import {
  createInitialState, drawTile, discardTile, declareRiichi,
  declareTsumo, declareRon, canPlayerTsumo, canHumanRon,
  cpuTurn, nextRound, isPlayerTenpai, isGameOver,
} from './lib/game';
import { getTenpaiTiles } from './lib/agari';
import { getTenpaiDiscardsAndWaits } from './lib/ai';
import TileComponent from './components/TileComponent';
import ScoreModal from './components/ScoreModal';

const HUMAN = 0;
const CPU_DELAY = 700;

// Player positions: 0=East(Human/Bottom), 1=South(Right), 2=West(Top), 3=North(Left)
const WIND_LABEL: Record<string, string> = { east: '東', south: '南', west: '西', north: '北' };

function getDiscardLabel(tile: Tile): string {
  if (tile.suit === 'honor') return ['東', '南', '西', '北', '白', '発', '中'][tile.value - 1];
  return `${tile.value}${tile.suit === 'man' ? '万' : tile.suit === 'pin' ? '筒' : '索'}`;
}

// Small face-down tile for CPU hands
function FaceDownTile({ vertical }: { vertical?: boolean }) {
  return (
    <div className={`bg-blue-800 border border-blue-600 rounded shadow flex-shrink-0 ${
      vertical ? 'w-5 h-7' : 'w-5 h-7'
    }`} />
  );
}

// Discard grid for a player (3 columns, small tiles)
function DiscardGrid({ tiles, lastTileId, rotate }: {
  tiles: Tile[];
  lastTileId?: number;
  rotate?: 90 | 180 | 270;
}) {
  const rows: Tile[][] = [];
  for (let i = 0; i < tiles.length; i += 6) rows.push(tiles.slice(i, i + 6));

  return (
    <div className={`flex flex-col gap-0.5 ${rotate === 180 ? 'rotate-180' : ''}`}>
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-0.5">
          {row.map((t, ci) => (
            <TileComponent
              key={`${ri}-${ci}`}
              tile={t}
              small
              highlighted={t.id === lastTileId}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [game, setGame] = useState<GameState>(() => drawTile(createInitialState()));
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [riichiMode, setRiichiMode] = useState(false);
  const [canTsumo, setCanTsumo] = useState(false);
  const [tenpaiHighlight, setTenpaiHighlight] = useState<Tile[]>([]);
  const [riichiDiscards, setRiichiDiscards] = useState<Set<string>>(new Set());
  const [ronAvailable, setRonAvailable] = useState(false);
  const [cpuPaused, setCpuPaused] = useState(false);
  const [message, setMessage] = useState('');
  const lastCheckedId = useRef<number | null>(null);

  // Evaluate player state when it's human's turn
  useEffect(() => {
    if (game.phase !== 'playing' || game.currentPlayer !== HUMAN) return;
    if (game.players[HUMAN].hand.length < 14) return;

    const tsumo = canPlayerTsumo(game);
    setCanTsumo(tsumo);

    const p = game.players[HUMAN];
    const hand13 = p.hand.length === 14 ? p.hand.slice(0, -1) : p.hand;
    setTenpaiHighlight(getTenpaiTiles(hand13, p.melds));

    if (!p.isRiichi && p.melds.length === 0) {
      setRiichiDiscards(new Set(getTenpaiDiscardsAndWaits(p.hand, p.melds).keys()));
    } else {
      setRiichiDiscards(new Set());
    }

    setMessage(tsumo ? 'ツモ！または牌を捨てる' : p.isRiichi ? '自摸切りしてください' : '捨てる牌を選んでください（2回クリック）');
  }, [game]);

  // Check ron opportunity for human
  useEffect(() => {
    if (game.phase !== 'playing') return;
    if (!game.lastDiscard || game.lastDiscardPlayer === HUMAN) return;
    if (game.lastDiscard.id === lastCheckedId.current) return;
    lastCheckedId.current = game.lastDiscard.id;

    if (canHumanRon(game)) {
      setRonAvailable(true);
      setCpuPaused(true);
      setMessage(`ロン！ (${game.players[game.lastDiscardPlayer!].name}: ${getDiscardLabel(game.lastDiscard)})`);
    }
  }, [game]);

  // CPU auto-play
  useEffect(() => {
    if (cpuPaused || game.phase !== 'playing' || game.currentPlayer === HUMAN) return;

    const timer = setTimeout(() => {
      setGame(prev => {
        if (prev.phase !== 'playing' || prev.currentPlayer === HUMAN) return prev;
        const next = cpuTurn(prev);
        if (next.phase === 'exhaustive_draw') setMessage('流局');
        return next;
      });
    }, CPU_DELAY);

    return () => clearTimeout(timer);
  }, [game, cpuPaused]);

  // Human draw
  useEffect(() => {
    if (game.phase !== 'playing' || game.currentPlayer !== HUMAN) return;
    if (game.players[HUMAN].hand.length === 14) return;
    if (cpuPaused) return;

    setGame(prev => {
      if (prev.players[HUMAN].hand.length !== 13 || prev.phase !== 'playing') return prev;
      return drawTile(prev);
    });
  }, [game, cpuPaused]);

  const handleTileClick = useCallback((tile: Tile) => {
    if (game.phase !== 'playing' || game.currentPlayer !== HUMAN) return;
    if (ronAvailable) return;
    const p = game.players[HUMAN];

    if (riichiMode) {
      if (!riichiDiscards.has(`${tile.suit}-${tile.value}`)) return;
      setGame(declareRiichi(game, HUMAN, tile));
      setRiichiMode(false);
      setSelectedTile(null);
      setMessage('リーチ！');
      return;
    }

    if (p.isRiichi) {
      const drawn = p.hand[p.hand.length - 1];
      if (tile.id !== drawn.id) return;
      setGame(discardTile(game, HUMAN, tile));
      setSelectedTile(null);
      setCanTsumo(false);
      return;
    }

    if (selectedTile?.id === tile.id) {
      setGame(discardTile(game, HUMAN, tile));
      setSelectedTile(null);
      setCanTsumo(false);
      setMessage('');
    } else {
      setSelectedTile(tile);
    }
  }, [game, selectedTile, riichiMode, riichiDiscards, ronAvailable]);

  const handleTsumo = () => {
    const next = declareTsumo(game);
    if (next.phase === 'tsumo') setGame(next);
  };

  const handleRon = () => {
    const next = declareRon(game, HUMAN);
    if (next.phase === 'ron') { setGame(next); setRonAvailable(false); setCpuPaused(false); }
    else { setRonAvailable(false); setCpuPaused(false); setMessage('役なし'); }
  };

  const handlePassRon = () => {
    setRonAvailable(false);
    setCpuPaused(false);
    setMessage('');
  };

  const handleNext = () => {
    if (isGameOver(game)) {
      setGame(drawTile(createInitialState()));
      setMessage('');
      return;
    }
    const winnerWasDealer = game.winner !== null && game.players[game.winner]?.wind === 'east';
    const isDraw = game.phase === 'exhaustive_draw';
    const dealerTenpai = isDraw && isPlayerTenpai(game, game.players.findIndex(p => p.wind === 'east'));
    setGame(drawTile(nextRound(game, winnerWasDealer || (isDraw && dealerTenpai))));
    setSelectedTile(null);
    setRiichiMode(false);
    setRonAvailable(false);
    setCpuPaused(false);
    setMessage('');
  };

  const player = game.players[HUMAN];
  const drawnTile = player.hand.length === 14 ? player.hand[player.hand.length - 1] : null;
  const hand13 = drawnTile ? player.hand.slice(0, -1) : player.hand;
  const canRiichi = !player.isRiichi && player.melds.length === 0 && riichiDiscards.size > 0 && !canTsumo;

  // Player order: 2=West(top), 3=North(left), 1=South(right)
  const cpuWest = game.players[2];
  const cpuNorth = game.players[3];
  const cpuSouth = game.players[1];

  const isResult = game.phase === 'tsumo' || game.phase === 'ron';
  const isExhaustive = game.phase === 'exhaustive_draw';

  const lastDiscardId = game.lastDiscard?.id;

  return (
    <div className="min-h-screen bg-green-900 text-white flex flex-col" style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div className="bg-green-950 px-3 py-1.5 flex justify-between items-center text-xs">
        <span className="font-bold text-yellow-300 text-sm">麻雀 整合計算</span>
        <span>{game.round === 'east' ? '東' : '南'}{game.roundNumber}局{game.honba > 0 ? ` ${game.honba}本場` : ''}</span>
        <span className="text-yellow-200">供託 {game.riichiBets * 1000}点</span>
      </div>

      {/* Score row */}
      <div className="grid grid-cols-4 gap-0.5 px-1 py-0.5 bg-green-800 text-center text-xs">
        {game.players.map(p => (
          <div key={p.id} className={`rounded px-1 py-0.5 ${p.id === game.currentPlayer && game.phase === 'playing' ? 'bg-yellow-700' : 'bg-green-700'}`}>
            <div className="truncate font-semibold">{p.name}</div>
            <div className="font-mono text-yellow-100">{p.score.toLocaleString()}</div>
            <div className="text-green-300">{WIND_LABEL[p.wind]}{p.isRiichi ? '♦' : ''}</div>
          </div>
        ))}
      </div>

      {/* === MAHJONG TABLE === */}
      <div className="flex-1 flex flex-col bg-green-800 px-1 pt-1">

        {/* TOP: CPU West */}
        <div className="flex flex-col items-center mb-0.5">
          <div className="text-xs text-gray-300 mb-0.5">{cpuWest.name} {WIND_LABEL[cpuWest.wind]}{cpuWest.isRiichi ? ' ♦リーチ' : ''}</div>
          <div className="flex gap-0.5 rotate-180">
            {cpuWest.hand.map((_, i) => <FaceDownTile key={i} />)}
          </div>
        </div>

        {/* MIDDLE ROW: Left(North) | Center | Right(South) */}
        <div className="flex flex-1 gap-0.5 min-h-0">

          {/* LEFT: CPU North */}
          <div className="flex flex-col items-center justify-center w-9 shrink-0">
            <div className="text-xs text-gray-300 mb-1" style={{ writingMode: 'vertical-rl' }}>
              {cpuNorth.name}{cpuNorth.isRiichi ? '♦' : ''}
            </div>
            <div className="flex flex-col gap-0.5">
              {cpuNorth.hand.map((_, i) => <FaceDownTile key={i} />)}
            </div>
          </div>

          {/* CENTER: discard cross */}
          <div className="flex-1 flex flex-col bg-green-700 rounded p-1 gap-1 min-w-0">

            {/* West discards (top, rotated 180°) */}
            <div className="flex justify-center">
              <DiscardGrid
                tiles={cpuWest.discards}
                lastTileId={game.lastDiscardPlayer === 2 ? lastDiscardId : undefined}
                rotate={180}
              />
            </div>

            {/* Middle: North discards | Info | South discards */}
            <div className="flex flex-1 gap-1 items-center">
              {/* North discards (left side, rotated 90°) */}
              <div className="flex flex-col items-end" style={{ minWidth: 26 }}>
                <div style={{ transform: 'rotate(90deg)', transformOrigin: 'center center' }}>
                  <DiscardGrid
                    tiles={cpuNorth.discards}
                    lastTileId={game.lastDiscardPlayer === 3 ? lastDiscardId : undefined}
                  />
                </div>
              </div>

              {/* Center info */}
              <div className="flex-1 flex flex-col items-center justify-center gap-1 text-xs text-center">
                <div className="text-yellow-300 text-xs font-semibold">ドラ</div>
                {game.dora.map((d, i) => <TileComponent key={i} tile={d} small />)}
                <div className="text-gray-400 mt-1">残{game.wall.length}枚</div>
              </div>

              {/* South discards (right side, rotated -90°) */}
              <div className="flex flex-col items-start" style={{ minWidth: 26 }}>
                <div style={{ transform: 'rotate(-90deg)', transformOrigin: 'center center' }}>
                  <DiscardGrid
                    tiles={cpuSouth.discards}
                    lastTileId={game.lastDiscardPlayer === 1 ? lastDiscardId : undefined}
                  />
                </div>
              </div>
            </div>

            {/* Human discards (bottom of center) */}
            <div className="flex justify-center">
              <DiscardGrid
                tiles={player.discards}
                lastTileId={game.lastDiscardPlayer === HUMAN ? lastDiscardId : undefined}
              />
            </div>
          </div>

          {/* RIGHT: CPU South */}
          <div className="flex flex-col items-center justify-center w-9 shrink-0">
            <div className="flex flex-col gap-0.5">
              {cpuSouth.hand.map((_, i) => <FaceDownTile key={i} />)}
            </div>
            <div className="text-xs text-gray-300 mt-1" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              {cpuSouth.name}{cpuSouth.isRiichi ? '♦' : ''}
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="text-center text-xs py-1 min-h-5">
          <span className={ronAvailable ? 'text-red-300 font-bold animate-pulse' : 'text-yellow-200'}>
            {message}
          </span>
        </div>

        {/* BOTTOM: Human hand */}
        <div className="pb-2">
          <div className="text-xs text-gray-400 mb-1 flex justify-between px-1">
            <span>あなた {WIND_LABEL[player.wind]}{player.isRiichi ? ' 【リーチ中】' : ''}</span>
            {tenpaiHighlight.length > 0 && !canTsumo && (
              <span className="text-yellow-300 animate-pulse">テンパイ {tenpaiHighlight.length}種</span>
            )}
          </div>

          {/* Hand tiles */}
          <div className="flex gap-1 justify-center items-end flex-wrap">
            {hand13.map((tile, i) => {
              const key = `${tile.suit}-${tile.value}`;
              return (
                <TileComponent
                  key={`h-${tile.id}-${i}`}
                  tile={tile}
                  selected={selectedTile?.id === tile.id}
                  highlighted={
                    riichiMode
                      ? riichiDiscards.has(key)
                      : tenpaiHighlight.some(t => t.suit === tile.suit && t.value === tile.value)
                  }
                  onClick={ronAvailable ? undefined : () => handleTileClick(tile)}
                />
              );
            })}
            {drawnTile && (
              <>
                <div className="w-2 self-stretch border-l border-yellow-500/40" />
                <TileComponent
                  key={`drawn-${drawnTile.id}`}
                  tile={drawnTile}
                  selected={selectedTile?.id === drawnTile.id}
                  highlighted={riichiMode && riichiDiscards.has(`${drawnTile.suit}-${drawnTile.value}`)}
                  onClick={ronAvailable ? undefined : () => handleTileClick(drawnTile)}
                />
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-center mt-2 flex-wrap">
            {canTsumo && (
              <button onClick={handleTsumo}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-2 rounded-xl shadow text-sm">
                ツモ
              </button>
            )}
            {canRiichi && !riichiMode && (
              <button onClick={() => { setRiichiMode(true); setSelectedTile(null); setMessage('リーチ: 緑の牌を選んで捨てる'); }}
                className="bg-white border-2 border-red-500 text-red-600 font-bold px-5 py-2 rounded-xl shadow text-sm">
                リーチ
              </button>
            )}
            {riichiMode && (
              <button onClick={() => { setRiichiMode(false); setMessage(''); }}
                className="bg-red-600 text-white font-bold px-5 py-2 rounded-xl shadow text-sm">
                取消
              </button>
            )}
            {ronAvailable && (
              <>
                <button onClick={handleRon}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2 rounded-xl shadow text-base">
                  ロン
                </button>
                <button onClick={handlePassRon}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-bold px-4 py-2 rounded-xl shadow text-sm">
                  スルー
                </button>
              </>
            )}
            {selectedTile && !ronAvailable && !riichiMode && (
              <span className="text-xs text-yellow-200 self-center">もう一度クリックで捨てる</span>
            )}
          </div>
        </div>
      </div>

      {/* Score modal */}
      {isResult && game.scoreResult && game.winner !== null && (
        <ScoreModal
          result={game.scoreResult}
          winnerName={game.players[game.winner].name}
          isTsumo={game.winByTsumo}
          isDealer={game.players[game.winner].wind === 'east'}
          winTile={game.winTile}
          winnerHand={game.players[game.winner].hand}
          onNext={handleNext}
        />
      )}

      {/* Exhaustive draw modal */}
      {isExhaustive && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 rounded-2xl p-5 max-w-xs w-full mx-4">
            <h2 className="text-xl font-bold text-center mb-3">流局</h2>
            <div className="space-y-1.5 mb-4">
              {game.players.map((p, i) => {
                const t = isPlayerTenpai(game, i);
                return (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{p.name}</span>
                    <span className={t ? 'text-green-600 font-semibold' : 'text-red-500'}>{t ? 'テンパイ' : 'ノーテン'}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={handleNext} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl">次の局へ</button>
          </div>
        </div>
      )}

      {/* Game over */}
      {isGameOver(game) && !isResult && !isExhaustive && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 rounded-2xl p-5 max-w-xs w-full mx-4">
            <h2 className="text-xl font-bold text-center mb-3">ゲーム終了</h2>
            <div className="space-y-1.5 mb-4">
              {[...game.players].sort((a, b) => b.score - a.score).map((p, rank) => (
                <div key={p.id} className={`flex justify-between p-1.5 rounded ${rank === 0 ? 'bg-yellow-50 font-bold' : ''}`}>
                  <span>{rank + 1}位 {p.name}</span>
                  <span>{p.score.toLocaleString()}点</span>
                </div>
              ))}
            </div>
            <button onClick={handleNext} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl">もう一度</button>
          </div>
        </div>
      )}
    </div>
  );
}
