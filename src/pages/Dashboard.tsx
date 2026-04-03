import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Users,
  Gamepad2,
  TrendingUp,
  PlusCircle,
  UserPlus,
  Calendar,
  ChevronRight,
  Star,
  Activity,
} from 'lucide-react';
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getTotals(game: Game): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const pid of game.playerIds) totals[pid] = 0;
  for (const round of game.rounds) {
    for (const s of round.scores) {
      totals[s.playerId] = (totals[s.playerId] ?? 0) + s.score;
    }
  }
  return totals;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const players = useGameStore((s) => s.players);
  const games = useGameStore((s) => s.games);

  const totalGames = games.length;
  const activeGames = games.filter((g) => g.status === 'active').length;
  const totalPlayers = players.length;
  const totalRounds = games.reduce((sum, g) => sum + g.rounds.length, 0);

  const recentGames = [...games]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Compute win rates
  const playerStats = players.map((p) => {
    const finishedGames = games.filter(
      (g) => g.status === 'finished' && g.playerIds.includes(p.id)
    );
    const wins = finishedGames.filter((g) => g.winnerIds?.includes(p.id)).length;
    const winRate = finishedGames.length > 0 ? (wins / finishedGames.length) * 100 : 0;
    return { player: p, gamesPlayed: finishedGames.length, wins, winRate };
  });

  const topPlayers = [...playerStats]
    .filter((ps) => ps.gamesPlayed > 0)
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins)
    .slice(0, 3);

  const today = new Date().toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Přehled</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 capitalize">{today}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/players')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Přidat hráče
          </button>
          <button
            onClick={() => navigate('/games')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Nová hra
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Gamepad2 className="w-6 h-6" />}
          label="Celkem her"
          value={totalGames}
          gradient="from-indigo-500 to-indigo-600"
          bg="bg-indigo-50 dark:bg-indigo-950/30"
          textColor="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          label="Aktivní hry"
          value={activeGames}
          gradient="from-emerald-500 to-teal-600"
          bg="bg-emerald-50 dark:bg-emerald-950/30"
          textColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Hráči"
          value={totalPlayers}
          gradient="from-pink-500 to-rose-600"
          bg="bg-pink-50 dark:bg-pink-950/30"
          textColor="text-pink-600 dark:text-pink-400"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Kola celkem"
          value={totalRounds}
          gradient="from-amber-500 to-orange-600"
          bg="bg-amber-50 dark:bg-amber-950/30"
          textColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Games */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Poslední hry
            </h2>
            <button
              onClick={() => navigate('/games')}
              className="text-sm text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
            >
              Všechny hry
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentGames.length === 0 ? (
              <EmptyState
                message="Žádné hry zatím"
                action="Vytvořit první hru"
                onAction={() => navigate('/games')}
              />
            ) : (
              recentGames.map((game) => (
                <RecentGameCard
                  key={game.id}
                  game={game}
                  players={players}
                  onClick={() => navigate(`/games/${game.id}`)}
                />
              ))
            )}
          </div>
        </div>

        {/* Top Players */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Top hráči
            </h2>
            <button
              onClick={() => navigate('/players')}
              className="text-sm text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
            >
              Všichni
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {topPlayers.length === 0 ? (
              <EmptyState
                message="Zatím žádné dokončené hry"
                action="Přidat hráče"
                onAction={() => navigate('/players')}
              />
            ) : (
              topPlayers.map((ps, idx) => (
                <TopPlayerCard key={ps.player.id} rank={idx + 1} ps={ps} />
              ))
            )}
          </div>

          {/* Quick tip */}
          <div className="mt-4 p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Tip</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Zaznamenávejte výsledky každého kola ihned po odehrání pro přesné statistiky.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  gradient: string;
  bg: string;
  textColor: string;
}

function StatCard({ icon, label, value, bg, textColor }: StatCardProps) {
  return (
    <div className={`${bg} rounded-2xl p-5 border border-white/50 dark:border-gray-700/50`}>
      <div className={`${textColor} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

interface RecentGameCardProps {
  game: Game;
  players: Player[];
  onClick: () => void;
}

function RecentGameCard({ game, players, onClick }: RecentGameCardProps) {
  const totals = getTotals(game);
  const gamePlayers = game.playerIds
    .map((pid) => players.find((p) => p.id === pid))
    .filter(Boolean) as Player[];

  const winner = game.winnerIds?.[0]
    ? players.find((p) => p.id === game.winnerIds![0])
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white truncate">{game.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                game.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {game.status === 'active' ? 'Aktivní' : 'Dokončena'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-indigo-500 font-medium">{game.gameType}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{game.rounds.length} kol</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(game.createdAt)}</span>
          </div>
          {winner && (
            <div className="flex items-center gap-1.5 mt-2">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Vítěz: <span className="font-medium" style={{ color: winner.color }}>{winner.name}</span>
                {' '}({totals[winner.id]} b.)
              </span>
            </div>
          )}
        </div>
        <div className="flex -space-x-2 flex-shrink-0">
          {gamePlayers.slice(0, 4).map((p) => (
            <div
              key={p.id}
              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: p.color }}
              title={p.name}
            >
              {getInitials(p.name)}
            </div>
          ))}
          {gamePlayers.length > 4 && (
            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-bold">
              +{gamePlayers.length - 4}
            </div>
          )}
        </div>
      </div>
      <div className="mt-1 flex justify-end">
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
      </div>
    </button>
  );
}

interface TopPlayerCardProps {
  rank: number;
  ps: {
    player: Player;
    gamesPlayed: number;
    wins: number;
    winRate: number;
  };
}

function TopPlayerCard({ rank, ps }: TopPlayerCardProps) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
      <span className="text-xl w-7 text-center flex-shrink-0">{medals[rank - 1]}</span>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
        style={{ backgroundColor: ps.player.color }}
      >
        {getInitials(ps.player.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white truncate">{ps.player.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {ps.wins} výher z {ps.gamesPlayed} her
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
          {ps.winRate.toFixed(0)}%
        </p>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  message: string;
  action: string;
  onAction: () => void;
}

function EmptyState({ message, action, onAction }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-dashed border-gray-200 dark:border-gray-700 text-center">
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{message}</p>
      <button
        onClick={onAction}
        className="text-sm text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
      >
        {action}
      </button>
    </div>
  );
}
