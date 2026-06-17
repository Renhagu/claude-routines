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
const CPU_DELAY = 800;

type AppPhase =
  | 'player_draw'    // player just drew, can discard/tsumo/riichi
  | 'player_discard' // waiting for discard selection
  | 'ron_check'      // showing ron button to human
  | 'cpu_turn'       // CPU is playing
  | 'result'         // showing score modal
  | 'exhaustive'     // exhaustive draw
  | 'game_over';     // game over

export default function App() {
  const [game, setGame] = useState<GameState>(() => {
    const s = createInitialState();
    return drawTile(s);
  });
  const [appPhase, setAppPhase] = useState<AppPhase>('player_draw');
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [riichiMode, setRiichiMode] = useState(false);
  const [canTsumo, setCanTsumo] = useState(false);
  const [tenpaiTiles, setTenpaiTiles] = useState<Tile[]>([]);
  const [riichiDiscards, setRiichiDiscards] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('牌を捨ててください');
  const [gameLog, setGameLog] = useState<string[]>([]);
  const lastCheckedDiscardId = useRef<number | null>(null);

  const addLog = useCallback((msg: string) => {
    setGameLog(prev => [...prev.slice(-8), msg]);
  }, []);

  // Evaluate player actions after game state changes
  useEffect(() => {
    const { phase, currentPlayer } = game;
    if (phase !== 'playing') return;

    if (currentPlayer === HUMAN) {
      // It's the player's turn after a draw
      const tsumo = canPlayerTsumo(game);
      setCanTsumo(tsumo);

      const player = game.players[HUMAN];
      // Get tenpai tiles from 13-tile hand (without lastDraw)
      const hand13 = player.hand.length === 14
        ? player.hand.slice(0, -1) // drawn tile is at end
        : player.hand;
      const waits = getTenpaiTiles(hand13, player.melds);
      setTenpaiTiles(waits);

      // Calculate riichi-eligible discards
      if (!player.isRiichi && player.melds.length === 0) {
        const discardsMap = getTenpaiDiscardsAndWaits(player.hand, player.melds);
        setRiichiDiscards(new Set(discardsMap.keys()));
      } else {
        setRiichiDiscards(new Set());
      }

      if (tsumo) {
        setMessage('ツモ！または牌を捨ててください');
      } else if (player.isRiichi) {
        setMessage('リーチ中 - 自摸切りしてください');
      } else {
        setMessage('捨てる牌を選んでください（同じ牌を2回クリック）');
      }
      setAppPhase('player_draw');
    }
  }, [game]);

  // Check ron opportunity for human after CPU discards
  useEffect(() => {
    const { phase, lastDiscard, lastDiscardPlayer } = game;
    if (phase !== 'playing') return;
    if (!lastDiscard || lastDiscardPlayer === HUMAN || lastDiscardPlayer === null) return;
    if (lastDiscard.id === lastCheckedDiscardId.current) return;

    lastCheckedDiscardId.current = lastDiscard.id;

    if (canHumanRon(game)) {
      setAppPhase('ron_check');
      setMessage(`ロンできます！ (${game.players[lastDiscardPlayer].name}の捨て牌: ${getDiscardLabel(lastDiscard)})`);
    }
  }, [game]);

  // CPU auto-play
  useEffect(() => {
    if (appPhase !== 'cpu_turn') return;
    if (game.currentPlayer === HUMAN) return;
    if (game.phase !== 'playing') return;

    const timer = setTimeout(() => {
      setGame(prev => {
        if (prev.currentPlayer === HUMAN || prev.phase !== 'playing') return prev;
        const next = cpuTurn(prev);
        if (next.phase === 'tsumo' || next.phase === 'ron') {
          setAppPhase('result');
          addLog(`${prev.players[next.winner!].name} が${next.winByTsumo ? 'ツモ' : 'ロン'}!`);
        } else if (next.phase === 'exhaustive_draw') {
          setAppPhase('exhaustive');
        } else if (next.currentPlayer === HUMAN && next.phase === 'playing') {
          // After CPU discard, human might ron (handled by ron check effect)
          // Or it's now CPU's turn but we need to draw for human
          // Actually after CPU discards, next.currentPlayer advances past human...
          // Let's check: if it's human's turn, they need to draw
        } else {
          setAppPhase('cpu_turn');
        }
        if (next.lastDiscardPlayer !== null && next.lastDiscardPlayer !== HUMAN) {
          const discardedPlayer = next.players[next.lastDiscardPlayer];
          if (next.lastDiscard) addLog(`${discardedPlayer.name}: ${getDiscardLabel(next.lastDiscard)} を捨てた`);
        }
        return next;
      });
    }, CPU_DELAY);

    return () => clearTimeout(timer);
  }, [appPhase, game, addLog]);

  // When game moves to cpu_turn phase and currentPlayer is human's turn to draw
  useEffect(() => {
    if (game.phase !== 'playing') return;
    if (game.currentPlayer !== HUMAN) return;
    if (appPhase === 'cpu_turn' || appPhase === 'ron_check') return;

    // Player needs to draw (state from initial deal or after CPU discard)
    if (game.players[HUMAN].hand.length === 13) {
      setGame(prev => {
        if (prev.players[HUMAN].hand.length !== 13) return prev;
        const next = drawTile(prev);
        addLog('あなたがツモりました');
        return next;
      });
    }
  }, [game, appPhase, addLog]);

  const handleTileClick = useCallback((tile: Tile) => {
    if (appPhase !== 'player_draw' && appPhase !== 'player_discard') return;
    if (game.currentPlayer !== HUMAN) return;
    const player = game.players[HUMAN];

    // Riichi mode: single click discards
    if (riichiMode) {
      const key = `${tile.suit}-${tile.value}`;
      if (!riichiDiscards.has(key)) return;
      const next = declareRiichi(game, HUMAN, tile);
      setGame(next);
      setRiichiMode(false);
      setSelectedTile(null);
      setAppPhase('cpu_turn');
      addLog(`あなた: リーチ (${getDiscardLabel(tile)} を捨てた)`);
      return;
    }

    // Riichi locked: only tsumogiri allowed
    if (player.isRiichi) {
      const drawnTile = player.hand[player.hand.length - 1];
      if (tile.id !== drawnTile.id) return; // only drawn tile can be discarded
      doDiscard(tile);
      return;
    }

    // Normal: 2-click to discard
    if (selectedTile && selectedTile.id === tile.id) {
      doDiscard(tile);
    } else {
      setSelectedTile(tile);
      setAppPhase('player_discard');
    }
  }, [appPhase, game, selectedTile, riichiMode, riichiDiscards, addLog]);

  const doDiscard = useCallback((tile: Tile) => {
    const next = discardTile(game, HUMAN, tile);
    setGame(next);
    setSelectedTile(null);
    setCanTsumo(false);
    setTenpaiTiles([]);
    setMessage('');
    setAppPhase('cpu_turn');
    addLog(`あなた: ${getDiscardLabel(tile)} を捨てた`);
  }, [game, addLog]);

  const handleTsumo = () => {
    const next = declareTsumo(game);
    if (next.phase === 'tsumo') {
      setGame(next);
      setAppPhase('result');
      addLog(`あなた: ツモ！ ${next.scoreResult?.rankName}`);
    }
  };

  const handleRon = () => {
    const next = declareRon(game, HUMAN);
    if (next.phase === 'ron') {
      setGame(next);
      setAppPhase('result');
      addLog(`あなた: ロン！ ${next.scoreResult?.rankName}`);
    } else {
      setMessage('役がありません（チョンボ）');
      setAppPhase('cpu_turn');
    }
  };

  const handlePassRon = () => {
    setAppPhase('cpu_turn');
    setMessage('');
  };

  const handleRiichiMode = () => {
    setRiichiMode(!riichiMode);
    setSelectedTile(null);
    setMessage(riichiMode ? '捨てる牌を選んでください' : 'リーチ: テンパイ維持できる牌を選んでください（緑色）');
  };

  const handleNext = () => {
    if (isGameOver(game)) {
      // Reset game
      const fresh = createInitialState();
      setGame(drawTile(fresh));
      setAppPhase('player_draw');
      setGameLog([]);
      setMessage('新しいゲームが始まりました');
      return;
    }

    const winnerWasDealer = game.winner !== null && game.players[game.winner]?.wind === 'east';
    const exhaustiveDealerTenpai = game.phase === 'exhaustive_draw'
      && isPlayerTenpai(game, game.players.findIndex(p => p.wind === 'east'));

    const shouldDealerStay = winnerWasDealer || (game.phase === 'exhaustive_draw' && exhaustiveDealerTenpai);

    const next = nextRound(game, shouldDealerStay);
    setGame(drawTile(next));
    setAppPhase('player_draw');
    setSelectedTile(null);
    setRiichiMode(false);
    setMessage('新しい局が始まりました');
    addLog(`--- ${next.round === 'east' ? '東' : '南'}${next.roundNumber}局 ---`);
  };

  const player = game.players[HUMAN];
  const drawnTile = player.hand.length === 14 ? player.hand[player.hand.length - 1] : null;
  const hand13 = player.hand.length === 14 ? player.hand.slice(0, -1) : player.hand;

  const canRiichi = !player.isRiichi && player.melds.length === 0 && riichiDiscards.size > 0
    && appPhase === 'player_draw' && !riichiMode;

  const isResult = game.phase === 'tsumo' || game.phase === 'ron';
  const isExhaustive = game.phase === 'exhaustive_draw';

  return (
    <div className="min-h-screen bg-green-900 text-white flex flex-col" style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div className="bg-green-950 px-3 py-2 flex justify-between items-center text-sm">
        <span className="font-bold text-yellow-300">麻雀 整合計算</span>
        <span className="text-xs">
          {game.round === 'east' ? '東' : '南'}{game.roundNumber}局
          {game.honba > 0 ? ` ${game.honba}本場` : ''}
        </span>
        <span className="text-xs text-yellow-200">供託 {game.riichiBets * 1000}点</span>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-4 gap-1 px-2 py-1 bg-green-800 text-center">
        {game.players.map(p => (
          <div key={p.id} className={`rounded px-1 py-1 text-xs ${
            p.id === game.currentPlayer && game.phase === 'playing' ? 'bg-yellow-700' : 'bg-green-700'
          }`}>
            <div className="font-semibold truncate">{p.name}</div>
            <div className="text-yellow-100 font-mono">{p.score.toLocaleString()}</div>
            <div className="text-green-300">
              {p.wind === 'east' ? '東' : p.wind === 'south' ? '南' : p.wind === 'west' ? '西' : '北'}
              {p.isRiichi ? <span className="text-red-300 ml-0.5">♦</span> : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Dora */}
      <div className="flex items-center gap-2 px-3 py-1 text-xs bg-green-850">
        <span className="text-yellow-300 shrink-0">ドラ:</span>
        {game.dora.map((d, i) => <TileComponent key={i} tile={d} small />)}
        <span className="text-gray-400 ml-auto">残{game.wall.length}枚</span>
      </div>

      {/* CPU Hands */}
      <div className="flex flex-col px-2 py-1 gap-1 bg-green-900/50">
        {[1, 2, 3].map(cpuId => (
          <div key={cpuId} className="flex items-center gap-1 min-h-10">
            <span className="text-xs w-12 text-gray-300 shrink-0">{game.players[cpuId].name}</span>
            <div className="flex gap-0.5">
              {game.players[cpuId].hand.map((t, i) => {
                const showFace = isResult && game.winner === cpuId;
                return (
                  <TileComponent
                    key={i}
                    tile={t}
                    faceDown={!showFace}
                    small
                  />
                );
              })}
            </div>
            <div className="ml-auto flex gap-0.5 flex-wrap max-w-28">
              {game.players[cpuId].discards.map((t, i) => (
                <TileComponent
                  key={i}
                  tile={t}
                  small
                  highlighted={
                    game.lastDiscard?.id === t.id &&
                    game.lastDiscardPlayer === cpuId &&
                    i === game.players[cpuId].discards.length - 1
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Game log */}
      <div className="px-3 py-1 bg-green-950/70 min-h-8 max-h-16 overflow-y-auto">
        {gameLog.slice(-3).map((log, i) => (
          <div key={i} className="text-xs text-gray-400">{log}</div>
        ))}
      </div>

      {/* Human discards */}
      <div className="px-3 py-1">
        <div className="text-xs text-gray-400 mb-1">あなたの捨て牌</div>
        <div className="flex gap-0.5 flex-wrap min-h-8">
          {player.discards.map((t, i) => (
            <TileComponent key={i} tile={t} small />
          ))}
        </div>
      </div>

      {/* Message */}
      <div className="text-center text-xs py-1 px-3 min-h-6">
        <span className={appPhase === 'ron_check' ? 'text-red-300 font-bold animate-pulse' : 'text-yellow-200'}>
          {message}
        </span>
      </div>

      {/* Human hand */}
      <div className="flex-1 flex flex-col justify-end px-3 pb-4">
        <div className="text-xs text-gray-400 mb-1 flex justify-between">
          <span>あなたの手牌{player.isRiichi ? ' 【リーチ中】' : ''}</span>
          {tenpaiTiles.length > 0 && appPhase === 'player_draw' && !canTsumo && (
            <span className="text-yellow-300 animate-pulse">テンパイ！待ち: {tenpaiTiles.length}種</span>
          )}
        </div>

        {/* Hand tiles: 13 sorted + drawn tile separated */}
        <div className="flex gap-1 flex-wrap justify-center items-end">
          {hand13.map((tile, i) => {
            const key = `${tile.suit}-${tile.value}`;
            const isRiichiTarget = riichiMode && riichiDiscards.has(key);
            const isTenpaiWait = !riichiMode && tenpaiTiles.some(t => t.suit === tile.suit && t.value === tile.value);
            const isSelected = selectedTile?.id === tile.id;
            return (
              <TileComponent
                key={`hand-${tile.id}-${i}`}
                tile={tile}
                selected={isSelected}
                highlighted={isRiichiTarget || isTenpaiWait}
                onClick={appPhase !== 'ron_check' ? () => handleTileClick(tile) : undefined}
              />
            );
          })}

          {/* Drawn tile - visually separated */}
          {drawnTile && (
            <>
              <div className="w-2 shrink-0" />
              <TileComponent
                key={`drawn-${drawnTile.id}`}
                tile={drawnTile}
                selected={selectedTile?.id === drawnTile.id}
                highlighted={riichiMode && riichiDiscards.has(`${drawnTile.suit}-${drawnTile.value}`)}
                onClick={appPhase !== 'ron_check' ? () => handleTileClick(drawnTile) : undefined}
              />
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 justify-center mt-3 flex-wrap">
          {canTsumo && appPhase === 'player_draw' && (
            <button
              onClick={handleTsumo}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2.5 rounded-xl shadow-lg"
            >
              ツモ
            </button>
          )}
          {canRiichi && (
            <button
              onClick={handleRiichiMode}
              className={`font-bold px-6 py-2.5 rounded-xl shadow-lg border-2 ${
                riichiMode
                  ? 'bg-red-600 border-red-400 text-white'
                  : 'bg-white border-red-500 text-red-600 hover:bg-red-50'
              }`}
            >
              {riichiMode ? 'リーチ取消' : 'リーチ'}
            </button>
          )}
          {appPhase === 'ron_check' && (
            <>
              <button
                onClick={handleRon}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-7 py-2.5 rounded-xl shadow-lg text-lg"
              >
                ロン
              </button>
              <button
                onClick={handlePassRon}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold px-5 py-2.5 rounded-xl"
              >
                スルー
              </button>
            </>
          )}
          {selectedTile && (appPhase === 'player_draw' || appPhase === 'player_discard') && !riichiMode && (
            <div className="text-xs text-yellow-200 flex items-center">
              もう一度クリックで捨てる
            </div>
          )}
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
          <div className="bg-white text-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold text-center mb-4">流局</h2>
            <div className="space-y-2 mb-4">
              {game.players.map((p, i) => {
                const tenpai = isPlayerTenpai(game, i);
                return (
                  <div key={i} className="flex justify-between items-center">
                    <span>{p.name}</span>
                    <span className={`font-semibold ${tenpai ? 'text-green-600' : 'text-red-500'}`}>
                      {tenpai ? 'テンパイ' : 'ノーテン'}
                    </span>
                  </div>
                );
              })}
            </div>
            {game.scoreResult?.rankName && (
              <p className="text-xs text-gray-500 text-center mb-4">{game.scoreResult.rankName}</p>
            )}
            <button
              onClick={handleNext}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl"
            >
              次の局へ
            </button>
          </div>
        </div>
      )}

      {/* Game over */}
      {isGameOver(game) && !isResult && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold text-center mb-4">ゲーム終了</h2>
            <div className="space-y-2 mb-6">
              {[...game.players]
                .sort((a, b) => b.score - a.score)
                .map((p, rank) => (
                  <div key={p.id} className={`flex justify-between items-center p-2 rounded-lg ${
                    rank === 0 ? 'bg-yellow-50 border border-yellow-300' : 'bg-gray-50'
                  }`}>
                    <span className="text-lg">{rank + 1}位 {p.name}</span>
                    <span className="font-bold text-lg">{p.score.toLocaleString()}点</span>
                  </div>
                ))}
            </div>
            <button
              onClick={handleNext}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl"
            >
              もう一度プレイ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getDiscardLabel(tile: Tile): string {
  if (tile.suit === 'honor') {
    return ['東', '南', '西', '北', '白', '発', '中'][tile.value - 1];
  }
  const suit = tile.suit === 'man' ? '万' : tile.suit === 'pin' ? '筒' : '索';
  return `${tile.value}${suit}`;
}
