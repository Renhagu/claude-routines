import { useState, useEffect, useCallback } from 'react';
import type { GameState, Tile } from './types/mahjong';
import {
  createInitialState, drawTile, discardTile, declareTsumo, declareRon,
  canPlayerTsumo, canRon, cpuTurn, nextRound, isPlayerTenpai
} from './lib/game';
import { getTenpaiTiles } from './lib/agari';
import TileComponent from './components/TileComponent';
import ScoreModal from './components/ScoreModal';

const HUMAN = 0;

export default function App() {
  const [game, setGame] = useState<GameState>(() => {
    const s = createInitialState();
    return drawTile(s);
  });
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [tenpaiTiles, setTenpaiTiles] = useState<Tile[]>([]);
  const [canTsumo, setCanTsumo] = useState(false);
  const [ronAvailable, setRonAvailable] = useState(false);
  const [message, setMessage] = useState<string>('牌を選んで捨ててください');
  const [awaitingDiscard, setAwaitingDiscard] = useState(true);
  const [cpuPaused, setCpuPaused] = useState(false);

  useEffect(() => {
    const { phase, currentPlayer } = game;

    if (phase === 'playing' && currentPlayer === HUMAN) {
      const tsumo = canPlayerTsumo(game);
      setCanTsumo(tsumo);
      const player = game.players[HUMAN];
      setTenpaiTiles(getTenpaiTiles(player.hand, player.melds));
      setMessage(tsumo ? 'ツモできます！または牌を捨ててください' : '捨てる牌を選んでください（2回クリック）');
      setAwaitingDiscard(true);
      setRonAvailable(false);
    }

    // Check ron for human after any discard
    if (phase === 'playing' && game.lastDiscardPlayer !== null && game.lastDiscardPlayer !== HUMAN) {
      const rons = canRon(game);
      if (rons.includes(HUMAN)) {
        setRonAvailable(true);
        setCpuPaused(true);
        setMessage(`ロンできます！ (${game.players[game.lastDiscardPlayer!].name}の捨て牌)`);
      }
    }
  }, [game]);

  // CPU auto-play
  useEffect(() => {
    const { phase, currentPlayer } = game;
    if (phase !== 'playing') return;
    if (currentPlayer === HUMAN) return;
    if (cpuPaused) return;

    const timer = setTimeout(() => {
      setGame(prev => {
        if (prev.currentPlayer === HUMAN || prev.phase !== 'playing') return prev;
        const newState = cpuTurn(prev);
        return newState;
      });
    }, 700);

    return () => clearTimeout(timer);
  }, [game, cpuPaused]);

  const handleTileClick = useCallback((tile: Tile) => {
    if (game.phase !== 'playing' || game.currentPlayer !== HUMAN) return;
    if (!awaitingDiscard) return;
    if (game.players[HUMAN].isRiichi) return;

    if (selectedTile && selectedTile.suit === tile.suit && selectedTile.value === tile.value) {
      // Second click: discard
      const newGame = discardTile(game, HUMAN, tile);
      setGame(newGame);
      setSelectedTile(null);
      setCanTsumo(false);
      setTenpaiTiles([]);
      setAwaitingDiscard(false);
      setMessage('');
    } else {
      setSelectedTile(tile);
    }
  }, [game, selectedTile, awaitingDiscard]);

  const handleTsumo = () => {
    const newGame = declareTsumo(game);
    if (newGame.phase === 'tsumo') {
      setGame(newGame);
      setCanTsumo(false);
    } else {
      setMessage('役がありません');
    }
  };

  const handleRon = () => {
    const newGame = declareRon(game, HUMAN);
    if (newGame.phase === 'ron') {
      setGame(newGame);
      setRonAvailable(false);
      setCpuPaused(false);
    } else {
      setMessage('役がありません（フリテン？）');
      handlePassRon();
    }
  };

  const handlePassRon = () => {
    setRonAvailable(false);
    setCpuPaused(false);
    setMessage('');
  };

  const handleNext = () => {
    const winnerWasDealer = game.winner !== null && game.winner === 0;
    const newGame = nextRound(game, winnerWasDealer);
    setGame(drawTile(newGame));
    setSelectedTile(null);
    setCanTsumo(false);
    setRonAvailable(false);
    setCpuPaused(false);
    setMessage('新しい局が始まりました');
    setAwaitingDiscard(true);
  };

  const player = game.players[HUMAN];

  return (
    <div className="min-h-screen bg-green-900 text-white flex flex-col select-none">
      {/* Header */}
      <div className="bg-green-950 px-4 py-2 flex justify-between items-center text-sm">
        <span className="font-bold text-yellow-300">麻雀 整合計算</span>
        <span>{game.round === 'east' ? '東' : '南'}{game.roundNumber}局{game.honba > 0 ? ` ${game.honba}本場` : ''}</span>
        <span className="text-yellow-200">供託 {game.riichiBets * 1000}点</span>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-4 gap-1 px-2 py-1 bg-green-800 text-xs text-center">
        {game.players.map(p => (
          <div key={p.id} className={`rounded px-1 py-1 ${p.id === game.currentPlayer && game.phase === 'playing' ? 'bg-yellow-700' : 'bg-green-700'}`}>
            <div className="font-semibold truncate">{p.name}</div>
            <div className="text-yellow-100">{p.score.toLocaleString()}</div>
            <div className="text-green-300 text-xs">
              {p.wind === 'east' ? '東' : p.wind === 'south' ? '南' : p.wind === 'west' ? '西' : '北'}
              {p.isRiichi ? ' ♦' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Dora */}
      <div className="flex items-center gap-2 px-4 py-2 text-xs">
        <span className="text-yellow-300 shrink-0">ドラ表示:</span>
        {game.dora.map((d, i) => (
          <TileComponent key={i} tile={d} small />
        ))}
        <span className="text-gray-400 ml-auto">残り{game.wall.length}枚</span>
      </div>

      {/* CPU Hands (face down) */}
      <div className="flex flex-col gap-1 px-4">
        {[1, 2, 3].map(cpuId => (
          <div key={cpuId} className="flex items-center gap-2 py-1">
            <span className="text-xs w-14 text-gray-300 shrink-0">{game.players[cpuId].name}</span>
            <div className="flex gap-0.5 flex-wrap">
              {game.players[cpuId].hand.map((_, i) => (
                <TileComponent key={i} tile={{ id: -1, suit: 'man', value: 1 }} faceDown small />
              ))}
            </div>
            <div className="ml-auto flex gap-0.5 flex-wrap max-w-32">
              {game.players[cpuId].discards.slice(-8).map((t, i) => (
                <TileComponent key={i} tile={t} small />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Human discards */}
      <div className="px-4 py-1 mt-1">
        <div className="text-xs text-gray-400 mb-1">あなたの捨て牌</div>
        <div className="flex gap-0.5 flex-wrap min-h-9">
          {player.discards.map((t, i) => (
            <TileComponent key={i} tile={t} small />
          ))}
        </div>
      </div>

      {/* Message */}
      <div className="text-center text-sm py-1 text-yellow-200 min-h-6 px-4">{message}</div>

      {/* Human hand */}
      <div className="flex-1 flex flex-col justify-end px-4 pb-6">
        <div className="text-xs text-gray-400 mb-2 flex justify-between">
          <span>あなたの手牌{player.isRiichi ? ' 【リーチ中】' : ''}</span>
          {tenpaiTiles.length > 0 && !canTsumo && (
            <span className="text-yellow-300 animate-pulse">テンパイ！</span>
          )}
        </div>
        <div className="flex gap-1 flex-wrap justify-center">
          {player.hand.map((tile, i) => (
            <TileComponent
              key={`${tile.suit}-${tile.value}-${i}`}
              tile={tile}
              selected={selectedTile?.suit === tile.suit && selectedTile?.value === tile.value}
              highlighted={!canTsumo && tenpaiTiles.some(t => t.suit === tile.suit && t.value === tile.value)}
              onClick={
                awaitingDiscard && game.currentPlayer === HUMAN && !player.isRiichi
                  ? () => handleTileClick(tile)
                  : undefined
              }
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center mt-4">
          {canTsumo && (
            <button
              onClick={handleTsumo}
              className="bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-bold px-8 py-3 rounded-xl shadow-lg text-lg"
            >
              ツモ
            </button>
          )}
          {ronAvailable && (
            <>
              <button
                onClick={handleRon}
                className="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg text-lg"
              >
                ロン
              </button>
              <button
                onClick={handlePassRon}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold px-6 py-3 rounded-xl shadow"
              >
                スルー
              </button>
            </>
          )}
        </div>
      </div>

      {/* Score modal */}
      {(game.phase === 'tsumo' || game.phase === 'ron') && game.scoreResult && game.winner !== null && (
        <ScoreModal
          result={game.scoreResult}
          winnerName={game.players[game.winner].name}
          isTsumo={game.winByTsumo}
          isDealer={game.winner === 0}
          onNext={handleNext}
        />
      )}

      {/* Exhaustive draw */}
      {game.phase === 'exhaustive_draw' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 rounded-2xl p-6 max-w-xs w-full mx-4 text-center">
            <h2 className="text-2xl font-bold mb-4">流局</h2>
            <p className="mb-2">
              {isPlayerTenpai(game, HUMAN) ? 'あなた: テンパイ' : 'あなた: ノーテン'}
            </p>
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl mt-2"
            >
              次の局へ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
