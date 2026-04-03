import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Table } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Player, Game } from '../types';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function computePlayerStats(players: Player[], games: Game[]) {
  return players.map((p) => {
    const myGames = games.filter((g) => g.playerIds.includes(p.id));
    const finishedGames = myGames.filter((g) => g.status === 'finished');
    const wins = finishedGames.filter((g) => g.winnerIds?.includes(p.id)).length;
    const winRate = finishedGames.length > 0 ? (wins / finishedGames.length) * 100 : 0;

    let totalScore = 0;
    let roundCount = 0;
    let bestScore: number | null = null;

    for (const game of myGames) {
      for (const round of game.rounds) {
        const sc = round.scores.find((s) => s.playerId === p.id);
        if (sc !== undefined) {
          totalScore += sc.score;
          roundCount++;
          if (bestScore === null || sc.score > bestScore) bestScore = sc.score;
        }
      }
    }

    return {
      player: p,
      gamesPlayed: myGames.length,
      gamesFinished: finishedGames.length,
      wins,
      winRate,
      totalScore,
      avgScore: roundCount > 0 ? totalScore / roundCount : 0,
      bestScore: bestScore ?? 0,
    };
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}

function CustomBarTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2">
      <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

function CustomLineTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Kolo {label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function Statistics() {
  const players = useGameStore((s) => s.players);
  const games = useGameStore((s) => s.games);

  const finishedGames = games.filter((g) => g.status === 'finished');
  const [selectedGameId, setSelectedGameId] = useState<string>(finishedGames[0]?.id ?? '');

  const stats = computePlayerStats(players, games);

  // Data for wins bar chart
  const winsData = stats
    .filter((s) => s.gamesPlayed > 0)
    .map((s) => ({
      name: s.player.name,
      výhry: s.wins,
      hry: s.gamesPlayed,
      color: s.player.color,
    }));

  // Data for pie chart (win distribution)
  const pieData = stats
    .filter((s) => s.wins > 0)
    .map((s) => ({
      name: s.player.name,
      value: s.wins,
      color: s.player.color,
    }));

  // Line chart: cumulative score progression for selected game
  const selectedGame = games.find((g) => g.id === selectedGameId);
  const lineData: Array<Record<string, number | string>> = [];

  if (selectedGame) {
    const cumulatives: Record<string, number> = {};
    for (const pid of selectedGame.playerIds) cumulatives[pid] = 0;

    for (const round of selectedGame.rounds) {
      for (const s of round.scores) {
        cumulatives[s.playerId] = (cumulatives[s.playerId] ?? 0) + s.score;
      }
      const entry: Record<string, number | string> = { kolo: round.roundNumber };
      for (const pid of selectedGame.playerIds) {
        const p = players.find((pl) => pl.id === pid);
        if (p) entry[p.name] = cumulatives[pid];
      }
      lineData.push(entry);
    }
  }

  const selectedGamePlayers = selectedGame
    ? (selectedGame.playerIds.map((pid) => players.find((p) => p.id === pid)).filter(Boolean) as Player[])
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Statistiky</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Přehled výkonnosti hráčů a her</p>
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Wins bar chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Počet výher
          </h2>
          {winsData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Zatím žádná data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={winsData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="výhry" radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#6b7280' }}>
                  {winsData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Win distribution pie */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-purple-500" />
            Rozdělení výher
          </h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Zatím žádná data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={40}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} výher`, 'Výhry']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Score progression line chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Průběh skóre
          </h2>
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            {games.length === 0 && <option value="">Žádné hry</option>}
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.gameType})
              </option>
            ))}
          </select>
        </div>
        {!selectedGame || lineData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            {!selectedGame ? 'Vyberte hru' : 'Zatím žádná kola'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={lineData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="kolo" tick={{ fontSize: 12, fill: '#6b7280' }} label={{ value: 'Kolo', position: 'insideBottom', offset: -2, fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip content={<CustomLineTooltip />} />
              <Legend />
              {selectedGamePlayers.map((p) => (
                <Line
                  key={p.id}
                  type="monotone"
                  dataKey={p.name}
                  stroke={p.color}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: p.color }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Table className="w-5 h-5 text-amber-500" />
            Tabulka výkonnosti
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium">Hráč</th>
                <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Hry</th>
                <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Výhry</th>
                <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Úspěšnost</th>
                <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Celk. skóre</th>
                <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Prům. skóre</th>
                <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Nejl. kolo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {stats
                .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins)
                .map((s, i) => (
                  <tr
                    key={s.player.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                      i === 0 && s.wins > 0 ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: s.player.color }}
                        >
                          {getInitials(s.player.name)}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">{s.player.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-700 dark:text-gray-300">{s.gamesPlayed}</td>
                    <td className="px-4 py-4 text-center font-bold text-gray-900 dark:text-white">{s.wins}</td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: `${s.player.color}20`,
                          color: s.player.color,
                        }}
                      >
                        {s.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-700 dark:text-gray-300">{s.totalScore}</td>
                    <td className="px-4 py-4 text-center text-gray-700 dark:text-gray-300">{s.avgScore.toFixed(1)}</td>
                    <td className="px-4 py-4 text-center font-semibold" style={{ color: s.player.color }}>
                      {s.bestScore}
                    </td>
                  </tr>
                ))}
              {stats.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400 text-sm">
                    Žádní hráči
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
