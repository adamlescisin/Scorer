import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Hash,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useGameStore } from '../store/gameStore';
import { Game, Player, RoundScore } from '../types';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function computeTotals(game: Game): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const pid of game.playerIds) totals[pid] = 0;
  for (const round of game.rounds) {
    for (const s of round.scores) {
      totals[s.playerId] = (totals[s.playerId] ?? 0) + s.score;
    }
  }
  return totals;
}

function getRankings(game: Game, players: Player[]): { player: Player; total: number; rank: number }[] {
  const totals = computeTotals(game);
  const gamePlayers = game.playerIds
    .map((pid) => players.find((p) => p.id === pid))
    .filter(Boolean) as Player[];

  const sorted = [...gamePlayers].sort((a, b) =>
    game.lowerIsBetter ? totals[a.id] - totals[b.id] : totals[b.id] - totals[a.id]
  );

  let rank = 1;
  return sorted.map((p, i) => {
    if (i > 0 && totals[sorted[i - 1].id] !== totals[p.id]) rank = i + 1;
    return { player: p, total: totals[p.id], rank };
  });
}

function buildChartData(game: Game, players: Player[]) {
  const gamePlayers = game.playerIds
    .map((pid) => players.find((p) => p.id === pid))
    .filter(Boolean) as Player[];

  const running: Record<string, number> = {};
  for (const pid of game.playerIds) running[pid] = 0;

  return game.rounds.map((round) => {
    for (const s of round.scores) {
      running[s.playerId] = (running[s.playerId] ?? 0) + s.score;
    }
    const point: Record<string, number | string> = { name: `${round.roundNumber}` };
    for (const p of gamePlayers) {
      point[p.name] = running[p.id];
    }
    return point;
  });
}

interface ScoreProgressChartProps {
  game: Game;
  players: Player[];
}

function ScoreProgressChart({ game, players }: ScoreProgressChartProps) {
  const gamePlayers = game.playerIds
    .map((pid) => players.find((p) => p.id === pid))
    .filter(Boolean) as Player[];

  const data = buildChartData(game, players);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
        <LineChartIcon className="w-5 h-5 text-indigo-500" />
        Vývoj skóre
        {game.status === 'active' && (
          <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 ml-1">
            živé
          </span>
        )}
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            label={{ value: 'Kolo', position: 'insideBottomRight', offset: -5, fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} width={40} />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              backgroundColor: 'var(--tooltip-bg, #fff)',
            }}
            formatter={(value: number, name: string) => [`${value} bodů`, name]}
            labelFormatter={(label) => `Kolo ${label}`}
          />
          <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '13px' }} />
          {gamePlayers.map((p) => (
            <Line
              key={p.id}
              type="monotone"
              dataKey={p.name}
              stroke={p.color}
              strokeWidth={2.5}
              dot={{ r: 4, fill: p.color, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: p.color, stroke: '#fff', strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ScoreModalProps {
  game: Game;
  players: Player[];
  editRoundId?: string;
  onSave: (scores: RoundScore[]) => void;
  onClose: () => void;
}

function ScoreModal({ game, players, editRoundId, onSave, onClose }: ScoreModalProps) {
  const editRound = editRoundId ? game.rounds.find((r) => r.id === editRoundId) : undefined;

  const [scores, setScores] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const pid of game.playerIds) {
      const existing = editRound?.scores.find((s) => s.playerId === pid);
      init[pid] = existing !== undefined ? String(existing.score) : '';
    }
    return init;
  });

  const [error, setError] = useState('');

  const gamePlayers = game.playerIds
    .map((pid) => players.find((p) => p.id === pid))
    .filter(Boolean) as Player[];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (const pid of game.playerIds) {
      if (scores[pid] === '' || isNaN(Number(scores[pid]))) {
        setError('Zadejte platné skóre pro všechny hráče.');
        return;
      }
    }
    const result: RoundScore[] = game.playerIds.map((pid) => ({
      playerId: pid,
      score: Number(scores[pid]),
    }));
    onSave(result);
  }

  const roundLabel = editRound
    ? `Upravit kolo ${editRound.roundNumber}`
    : `Kolo ${game.rounds.length + 1}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{roundLabel}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {gamePlayers.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: p.color }}
              >
                {getInitials(p.name)}
              </div>
              <span className="flex-1 font-medium text-gray-900 dark:text-white">{p.name}</span>
              <input
                type="number"
                value={scores[p.id]}
                onChange={(e) => {
                  setScores((prev) => ({ ...prev, [p.id]: e.target.value }));
                  setError('');
                }}
                placeholder="0"
                className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          ))}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 shadow-md transition-all"
            >
              {editRound ? 'Uložit' : 'Přidat kolo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FinishConfirmProps {
  onConfirm: () => void;
  onClose: () => void;
}

function FinishConfirm({ onConfirm, onClose }: FinishConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ukončit hru</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Opravdu chcete ukončit tuto hru? Výsledky budou zaznamenány a hra se uzavře.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
            Zrušit
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium shadow-md hover:shadow-lg transition-all">
            Ukončit hru
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const game = useGameStore((s) => s.games.find((g) => g.id === id));
  const players = useGameStore((s) => s.players);
  const addRound = useGameStore((s) => s.addRound);
  const updateRound = useGameStore((s) => s.updateRound);
  const deleteRound = useGameStore((s) => s.deleteRound);
  const finishGame = useGameStore((s) => s.finishGame);

  const [showScoreModal, setShowScoreModal] = useState(false);
  const [editRoundId, setEditRoundId] = useState<string | undefined>(undefined);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Hra nenalezena.</p>
        <button onClick={() => navigate('/games')} className="flex items-center gap-2 text-indigo-500 hover:text-indigo-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Zpět na hry
        </button>
      </div>
    );
  }

  const gamePlayers = game.playerIds
    .map((pid) => players.find((p) => p.id === pid))
    .filter(Boolean) as Player[];

  const totals = computeTotals(game);
  const rankings = getRankings(game, players);

  function handleSaveRound(scores: RoundScore[]) {
    if (editRoundId) {
      updateRound(game!.id, editRoundId, scores);
    } else {
      addRound(game!.id, scores);
    }
    setShowScoreModal(false);
    setEditRoundId(undefined);
  }

  function openEditRound(roundId: string) {
    setEditRoundId(roundId);
    setShowScoreModal(true);
  }

  function handleFinish() {
    finishGame(game!.id);
    setShowFinishConfirm(false);
  }

  const winnerPlayer = game.winnerIds?.[0]
    ? players.find((p) => p.id === game.winnerIds![0])
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/games')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět na hry
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{game.name}</h1>
              <span
                className={`text-sm px-3 py-1 rounded-full font-medium ${
                  game.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {game.status === 'active' ? 'Aktivní' : 'Dokončena'}
              </span>
            </div>
            <p className="text-indigo-500 font-medium mt-1">{game.gameType}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Vytvořeno {formatDate(game.createdAt)}
              {game.finishedAt && ` • Ukončeno ${formatDate(game.finishedAt)}`}
            </p>
          </div>
          {game.status === 'active' && (
            <div className="flex gap-3">
              <button
                onClick={() => { setEditRoundId(undefined); setShowScoreModal(true); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Přidat kolo
              </button>
              <button
                onClick={() => setShowFinishConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                Ukončit hru
              </button>
            </div>
          )}
        </div>

        {/* Winner banner */}
        {winnerPlayer && (
          <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">Vítěz: </span>
              <span className="font-bold text-lg" style={{ color: winnerPlayer.color }}>
                {winnerPlayer.name}
              </span>
              {game.winnerIds && game.winnerIds.length > 1 && (
                <span className="text-gray-600 dark:text-gray-400 text-sm ml-1">
                  (+ {game.winnerIds.length - 1} další)
                </span>
              )}
              <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                ({totals[winnerPlayer.id]} bodů)
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Score Table */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5 text-indigo-500" />
            Skóre po kolech
          </h2>
          {game.rounds.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-3">Zatím žádná kola</p>
              {game.status === 'active' && (
                <button
                  onClick={() => setShowScoreModal(true)}
                  className="text-indigo-500 hover:text-indigo-700 font-medium text-sm transition-colors"
                >
                  Přidat první kolo
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                      <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium w-16">Kolo</th>
                      {gamePlayers.map((p) => (
                        <th key={p.id} className="text-center px-3 py-3 min-w-[80px]">
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: p.color }}
                            >
                              {getInitials(p.name)}
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 font-medium text-xs whitespace-nowrap">
                              {p.name}
                            </span>
                          </div>
                        </th>
                      ))}
                      {game.status === 'active' && (
                        <th className="px-3 py-3 w-20" />
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {game.rounds.map((round) => (
                      <tr key={round.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">{round.roundNumber}</td>
                        {gamePlayers.map((p) => {
                          const sc = round.scores.find((s) => s.playerId === p.id);
                          return (
                            <td key={p.id} className="px-3 py-3 text-center font-semibold text-gray-900 dark:text-white">
                              {sc !== undefined ? sc.score : '—'}
                            </td>
                          );
                        })}
                        {game.status === 'active' && (
                          <td className="px-3 py-3">
                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditRound(round.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteRound(game.id, round.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 font-bold">
                      <td className="px-4 py-3 text-indigo-700 dark:text-indigo-300">Celkem</td>
                      {gamePlayers.map((p) => (
                        <td key={p.id} className="px-3 py-3 text-center text-lg" style={{ color: p.color }}>
                          {totals[p.id]}
                        </td>
                      ))}
                      {game.status === 'active' && <td />}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Rankings sidebar */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Aktuální pořadí
          </h2>
          <div className="space-y-3">
            {rankings.map(({ player, total, rank }) => {
              const rankIcons = ['🥇', '🥈', '🥉'];
              const isWinner = game.winnerIds?.includes(player.id);
              return (
                <div
                  key={player.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 flex items-center gap-3 transition-all ${
                    isWinner
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <span className="text-xl w-7 text-center flex-shrink-0">
                    {rank <= 3 ? rankIcons[rank - 1] : `#${rank}`}
                  </span>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: player.color }}
                  >
                    {getInitials(player.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{player.name}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      {game.lowerIsBetter ? (
                        <TrendingDown className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                      )}
                      {game.lowerIsBetter ? 'nižší = lepší' : 'vyšší = lepší'}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-xl" style={{ color: player.color }}>
                      {total}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">bodů</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Game info card */}
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-2 text-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Informace o hře</h3>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Typ hry</span>
              <span className="font-medium text-gray-900 dark:text-white">{game.gameType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Kola</span>
              <span className="font-medium text-gray-900 dark:text-white">{game.rounds.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Hráči</span>
              <span className="font-medium text-gray-900 dark:text-white">{gamePlayers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Hodnocení</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {game.lowerIsBetter ? 'Nižší = lepší' : 'Vyšší = lepší'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Score progression chart */}
      {game.rounds.length >= 2 && (
        <ScoreProgressChart game={game} players={players} />
      )}

      {/* Modals */}
      {showScoreModal && (
        <ScoreModal
          game={game}
          players={players}
          editRoundId={editRoundId}
          onSave={handleSaveRound}
          onClose={() => { setShowScoreModal(false); setEditRoundId(undefined); }}
        />
      )}
      {showFinishConfirm && (
        <FinishConfirm onConfirm={handleFinish} onClose={() => setShowFinishConfirm(false)} />
      )}
    </div>
  );
}
