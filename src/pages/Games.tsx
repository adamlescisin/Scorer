import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Gamepad2,
  Trophy,
  Calendar,
  ChevronRight,
  Users,
  Trash2,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Game, Player } from '../types';

const GAME_TYPES = ['Žolíky', 'Prší', 'Mariáš', 'Kvarteto', 'Canasta', 'Jiné'];

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

interface NewGameModalProps {
  players: Player[];
  onSave: (name: string, gameType: string, playerIds: string[], lowerIsBetter: boolean) => void;
  onClose: () => void;
}

function NewGameModal({ players, onSave, onClose }: NewGameModalProps) {
  const [name, setName] = useState('');
  const [gameType, setGameType] = useState(GAME_TYPES[0]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [lowerIsBetter, setLowerIsBetter] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggle(pid: string) {
    setSelectedPlayers((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Název hry je povinný.';
    if (selectedPlayers.length < 2) e.players = 'Vyberte alespoň 2 hráče.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave(name.trim(), gameType, selectedPlayers, lowerIsBetter);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Nová hra</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Game name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Název hry
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: '' })); }}
              placeholder="např. Páteční Žolíky"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              autoFocus
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Game type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Typ hry
            </label>
            <select
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              {GAME_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Players */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hráči (vyberte alespoň 2)
            </label>
            {players.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nejprve přidejte hráče v sekci Hráči.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {players.map((p) => {
                  const selected = selectedPlayers.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { toggle(p.id); setErrors((prev) => ({ ...prev, players: '' })); }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left ${
                        selected
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: p.color }}
                      >
                        {getInitials(p.name)}
                      </div>
                      <span className={`text-sm font-medium truncate ${selected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {errors.players && <p className="mt-1 text-sm text-red-500">{errors.players}</p>}
          </div>

          {/* Lower is better */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nižší skóre = lepší
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Vhodné pro Žolíky, Prší (počítá se trest)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLowerIsBetter(!lowerIsBetter)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                lowerIsBetter ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  lowerIsBetter ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
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
              Vytvořit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteConfirmProps {
  game: Game;
  onConfirm: () => void;
  onClose: () => void;
}

function DeleteConfirm({ game, onConfirm, onClose }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Smazat hru</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Opravdu chcete smazat hru <strong className="text-gray-900 dark:text-white">{game.name}</strong>?
          Tuto akci nelze vrátit.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
            Zrušit
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors shadow-md">
            Smazat
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Games() {
  const navigate = useNavigate();
  const players = useGameStore((s) => s.players);
  const games = useGameStore((s) => s.games);
  const addGame = useGameStore((s) => s.addGame);
  const deleteGame = useGameStore((s) => s.deleteGame);

  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Game | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'finished'>('all');

  const filtered = games
    .filter((g) => filter === 'all' || g.status === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function handleCreate(name: string, gameType: string, playerIds: string[], lowerIsBetter: boolean) {
    const id = addGame(name, gameType, playerIds, lowerIsBetter);
    setShowModal(false);
    navigate(`/games/${id}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hry</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {games.length} {games.length === 1 ? 'hra' : games.length < 5 ? 'hry' : 'her'} celkem
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Nová hra
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'active', 'finished'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {f === 'all' ? 'Vše' : f === 'active' ? 'Aktivní' : 'Dokončené'}
          </button>
        ))}
      </div>

      {/* Game list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filter === 'all' ? 'Zatím žádné hry' : filter === 'active' ? 'Žádné aktivní hry' : 'Žádné dokončené hry'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium shadow-md hover:shadow-lg transition-all"
            >
              Vytvořit první hru
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              players={players}
              onClick={() => navigate(`/games/${game.id}`)}
              onDelete={() => setDeleteTarget(game)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <NewGameModal
          players={players}
          onSave={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          game={deleteTarget}
          onConfirm={() => { deleteGame(deleteTarget.id); setDeleteTarget(null); }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

interface GameCardProps {
  game: Game;
  players: Player[];
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function GameCard({ game, players, onClick, onDelete }: GameCardProps) {
  const gamePlayers = game.playerIds
    .map((pid) => players.find((p) => p.id === pid))
    .filter(Boolean) as Player[];

  const totals = getTotals(game);
  const winner = game.winnerIds?.[0]
    ? players.find((p) => p.id === game.winnerIds![0])
    : null;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Top strip */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">{game.name}</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  game.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {game.status === 'active' ? 'Aktivní' : 'Dokončena'}
              </span>
            </div>
            <span className="text-sm text-indigo-500 font-medium">{game.gameType}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(e); }}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all ml-2 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Players */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex -space-x-2">
            {gamePlayers.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: p.color }}
                title={p.name}
              >
                {getInitials(p.name)}
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {gamePlayers.length} hráčů
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {game.rounds.length} kol
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(game.createdAt)}
          </span>
        </div>

        {/* Winner */}
        {winner && (
          <div className="mt-3 flex items-center gap-1.5 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Vítěz:{' '}
              <span className="font-semibold" style={{ color: winner.color }}>
                {winner.name}
              </span>{' '}
              ({totals[winner.id]} b.)
            </span>
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
        </div>
      </div>
    </div>
  );
}
