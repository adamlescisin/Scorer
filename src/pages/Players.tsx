import { useState } from 'react';
import { UserPlus, Edit2, Trash2, Trophy, Gamepad2 } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Player } from '../types';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#84cc16', '#64748b', '#be185d',
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface PlayerFormData {
  name: string;
  color: string;
}

interface PlayerModalProps {
  initial?: Player;
  onSave: (data: PlayerFormData) => void;
  onClose: () => void;
}

function PlayerModal({ initial, onSave, onClose }: PlayerModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0]);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Jméno hráče je povinné.');
      return;
    }
    onSave({ name: trimmed, color });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {initial ? 'Upravit hráče' : 'Přidat hráče'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preview */}
          <div className="flex justify-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg transition-colors"
              style={{ backgroundColor: color }}
            >
              {getInitials(name || '?')}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Jméno hráče
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Zadejte jméno..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              autoFocus
            />
            {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Barva avataru
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full transition-transform hover:scale-110 ${
                    color === c ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-800 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
            >
              {initial ? 'Uložit' : 'Přidat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteConfirmProps {
  player: Player;
  onConfirm: () => void;
  onClose: () => void;
}

function DeleteConfirm({ player, onConfirm, onClose }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Smazat hráče</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Opravdu chcete smazat hráče <strong className="text-gray-900 dark:text-white">{player.name}</strong>?
          Tuto akci nelze vrátit.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
          >
            Zrušit
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors shadow-md"
          >
            Smazat
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Players() {
  const players = useGameStore((s) => s.players);
  const games = useGameStore((s) => s.games);
  const addPlayer = useGameStore((s) => s.addPlayer);
  const updatePlayer = useGameStore((s) => s.updatePlayer);
  const deletePlayer = useGameStore((s) => s.deletePlayer);

  const [showModal, setShowModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);

  function handleSave(data: PlayerFormData) {
    if (editPlayer) {
      updatePlayer(editPlayer.id, data.name, data.color);
    } else {
      addPlayer(data.name, data.color);
    }
    setShowModal(false);
    setEditPlayer(null);
  }

  function openEdit(p: Player) {
    setEditPlayer(p);
    setShowModal(true);
  }

  function handleDelete() {
    if (deleteTarget) {
      deletePlayer(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  function getPlayerStats(playerId: string) {
    const finishedGames = games.filter(
      (g) => g.status === 'finished' && g.playerIds.includes(playerId)
    );
    const totalGames = games.filter((g) => g.playerIds.includes(playerId)).length;
    const wins = finishedGames.filter((g) => g.winnerIds?.includes(playerId)).length;
    const winRate = finishedGames.length > 0 ? (wins / finishedGames.length) * 100 : 0;
    return { totalGames, wins, winRate };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hráči</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {players.length} {players.length === 1 ? 'hráč' : players.length < 5 ? 'hráči' : 'hráčů'}
          </p>
        </div>
        <button
          onClick={() => { setEditPlayer(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Přidat hráče
        </button>
      </div>

      {/* Grid */}
      {players.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Zatím žádní hráči</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium shadow-md hover:shadow-lg transition-all"
          >
            Přidat prvního hráče
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {players.map((player) => {
            const stats = getPlayerStats(player.id);
            return (
              <PlayerCard
                key={player.id}
                player={player}
                stats={stats}
                onEdit={() => openEdit(player)}
                onDelete={() => setDeleteTarget(player)}
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <PlayerModal
          initial={editPlayer ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditPlayer(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          player={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

interface PlayerCardProps {
  player: Player;
  stats: { totalGames: number; wins: number; winRate: number };
  onEdit: () => void;
  onDelete: () => void;
}

function PlayerCard({ player, stats, onEdit, onDelete }: PlayerCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Color band */}
      <div
        className="h-2"
        style={{ background: `linear-gradient(to right, ${player.color}, ${player.color}aa)` }}
      />
      <div className="p-5">
        {/* Avatar + actions */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg"
            style={{ backgroundColor: player.color }}
          >
            {getInitials(player.name)}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
              title="Upravit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Smazat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Name */}
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-3">{player.name}</h3>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <Gamepad2 className="w-3.5 h-3.5" />
              Odehráno her
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">{stats.totalGames}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <Trophy className="w-3.5 h-3.5" />
              Výher
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">{stats.wins}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Úspěšnost</span>
            <span
              className="font-bold text-base"
              style={{ color: player.color }}
            >
              {stats.winRate.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Win rate bar */}
        <div className="mt-3 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${stats.winRate}%`, backgroundColor: player.color }}
          />
        </div>
      </div>
    </div>
  );
}
