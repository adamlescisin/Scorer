import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Player, Game, Round } from '../types';

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const SAMPLE_PLAYERS: Player[] = [
  { id: 'p1', name: 'Tomáš', color: '#6366f1', createdAt: '2024-01-10T10:00:00Z' },
  { id: 'p2', name: 'Jana', color: '#ec4899', createdAt: '2024-01-10T10:05:00Z' },
  { id: 'p3', name: 'Petr', color: '#10b981', createdAt: '2024-01-10T10:10:00Z' },
  { id: 'p4', name: 'Lucie', color: '#f59e0b', createdAt: '2024-01-10T10:15:00Z' },
];

const SAMPLE_GAMES: Game[] = [
  {
    id: 'g1',
    name: 'Večerní Žolíky',
    gameType: 'Žolíky',
    playerIds: ['p1', 'p2', 'p3', 'p4'],
    lowerIsBetter: true,
    status: 'finished',
    createdAt: '2024-01-15T18:00:00Z',
    finishedAt: '2024-01-15T20:30:00Z',
    winnerIds: ['p2'],
    rounds: [
      { id: 'r1', roundNumber: 1, scores: [{ playerId: 'p1', score: 15 }, { playerId: 'p2', score: 0 }, { playerId: 'p3', score: 30 }, { playerId: 'p4', score: 20 }] },
      { id: 'r2', roundNumber: 2, scores: [{ playerId: 'p1', score: 25 }, { playerId: 'p2', score: 10 }, { playerId: 'p3', score: 5 }, { playerId: 'p4', score: 40 }] },
      { id: 'r3', roundNumber: 3, scores: [{ playerId: 'p1', score: 0 }, { playerId: 'p2', score: 20 }, { playerId: 'p3', score: 35 }, { playerId: 'p4', score: 15 }] },
      { id: 'r4', roundNumber: 4, scores: [{ playerId: 'p1', score: 30 }, { playerId: 'p2', score: 5 }, { playerId: 'p3', score: 20 }, { playerId: 'p4', score: 10 }] },
      { id: 'r5', roundNumber: 5, scores: [{ playerId: 'p1', score: 10 }, { playerId: 'p2', score: 15 }, { playerId: 'p3', score: 0 }, { playerId: 'p4', score: 25 }] },
    ],
  },
  {
    id: 'g2',
    name: 'Sobotní Prší',
    gameType: 'Prší',
    playerIds: ['p1', 'p3', 'p4'],
    lowerIsBetter: true,
    status: 'finished',
    createdAt: '2024-01-20T15:00:00Z',
    finishedAt: '2024-01-20T17:00:00Z',
    winnerIds: ['p1'],
    rounds: [
      { id: 'r6', roundNumber: 1, scores: [{ playerId: 'p1', score: 5 }, { playerId: 'p3', score: 20 }, { playerId: 'p4', score: 35 }] },
      { id: 'r7', roundNumber: 2, scores: [{ playerId: 'p1', score: 0 }, { playerId: 'p3', score: 15 }, { playerId: 'p4', score: 25 }] },
      { id: 'r8', roundNumber: 3, scores: [{ playerId: 'p1', score: 10 }, { playerId: 'p3', score: 30 }, { playerId: 'p4', score: 5 }] },
      { id: 'r9', roundNumber: 4, scores: [{ playerId: 'p1', score: 20 }, { playerId: 'p3', score: 10 }, { playerId: 'p4', score: 15 }] },
    ],
  },
  {
    id: 'g3',
    name: 'Nedělní Mariáš',
    gameType: 'Mariáš',
    playerIds: ['p1', 'p2', 'p3'],
    lowerIsBetter: false,
    status: 'finished',
    createdAt: '2024-01-28T14:00:00Z',
    finishedAt: '2024-01-28T16:30:00Z',
    winnerIds: ['p3'],
    rounds: [
      { id: 'r10', roundNumber: 1, scores: [{ playerId: 'p1', score: 40 }, { playerId: 'p2', score: 30 }, { playerId: 'p3', score: 50 }] },
      { id: 'r11', roundNumber: 2, scores: [{ playerId: 'p1', score: 20 }, { playerId: 'p2', score: 45 }, { playerId: 'p3', score: 35 }] },
      { id: 'r12', roundNumber: 3, scores: [{ playerId: 'p1', score: 35 }, { playerId: 'p2', score: 25 }, { playerId: 'p3', score: 60 }] },
    ],
  },
  {
    id: 'g4',
    name: 'Aktivní Žolíky',
    gameType: 'Žolíky',
    playerIds: ['p1', 'p2', 'p3', 'p4'],
    lowerIsBetter: true,
    status: 'active',
    createdAt: '2024-02-05T19:00:00Z',
    rounds: [
      { id: 'r13', roundNumber: 1, scores: [{ playerId: 'p1', score: 20 }, { playerId: 'p2', score: 10 }, { playerId: 'p3', score: 35 }, { playerId: 'p4', score: 5 }] },
      { id: 'r14', roundNumber: 2, scores: [{ playerId: 'p1', score: 0 }, { playerId: 'p2', score: 25 }, { playerId: 'p3', score: 15 }, { playerId: 'p4', score: 30 }] },
    ],
  },
];

interface GameState {
  players: Player[];
  games: Game[];
  darkMode: boolean;

  addPlayer: (name: string, color: string) => void;
  updatePlayer: (id: string, name: string, color: string) => void;
  deletePlayer: (id: string) => void;

  addGame: (name: string, gameType: string, playerIds: string[], lowerIsBetter: boolean) => string;
  updateGame: (id: string, updates: Partial<Game>) => void;
  deleteGame: (id: string) => void;
  finishGame: (id: string) => void;

  addRound: (gameId: string, scores: { playerId: string; score: number }[]) => void;
  updateRound: (gameId: string, roundId: string, scores: { playerId: string; score: number }[]) => void;
  deleteRound: (gameId: string, roundId: string) => void;

  toggleDarkMode: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      players: SAMPLE_PLAYERS,
      games: SAMPLE_GAMES,
      darkMode: false,

      addPlayer: (name, color) =>
        set((state) => ({
          players: [
            ...state.players,
            { id: genId(), name, color, createdAt: new Date().toISOString() },
          ],
        })),

      updatePlayer: (id, name, color) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, name, color } : p
          ),
        })),

      deletePlayer: (id) =>
        set((state) => ({
          players: state.players.filter((p) => p.id !== id),
        })),

      addGame: (name, gameType, playerIds, lowerIsBetter) => {
        const id = genId();
        set((state) => ({
          games: [
            ...state.games,
            {
              id,
              name,
              gameType,
              playerIds,
              rounds: [],
              status: 'active',
              createdAt: new Date().toISOString(),
              lowerIsBetter,
            },
          ],
        }));
        return id;
      },

      updateGame: (id, updates) =>
        set((state) => ({
          games: state.games.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),

      deleteGame: (id) =>
        set((state) => ({
          games: state.games.filter((g) => g.id !== id),
        })),

      finishGame: (id) =>
        set((state) => {
          const game = state.games.find((g) => g.id === id);
          if (!game) return state;

          const totals: Record<string, number> = {};
          for (const pid of game.playerIds) totals[pid] = 0;
          for (const round of game.rounds) {
            for (const s of round.scores) totals[s.playerId] = (totals[s.playerId] ?? 0) + s.score;
          }

          const sortedIds = [...game.playerIds].sort((a, b) =>
            game.lowerIsBetter ? totals[a] - totals[b] : totals[b] - totals[a]
          );
          const bestScore = totals[sortedIds[0]];
          const winnerIds = sortedIds.filter((id) => totals[id] === bestScore);

          return {
            games: state.games.map((g) =>
              g.id === id
                ? { ...g, status: 'finished', finishedAt: new Date().toISOString(), winnerIds }
                : g
            ),
          };
        }),

      addRound: (gameId, scores) =>
        set((state) => ({
          games: state.games.map((g) => {
            if (g.id !== gameId) return g;
            const roundNumber = g.rounds.length + 1;
            const newRound: Round = { id: genId(), roundNumber, scores };
            return { ...g, rounds: [...g.rounds, newRound] };
          }),
        })),

      updateRound: (gameId, roundId, scores) =>
        set((state) => ({
          games: state.games.map((g) => {
            if (g.id !== gameId) return g;
            return {
              ...g,
              rounds: g.rounds.map((r) =>
                r.id === roundId ? { ...r, scores } : r
              ),
            };
          }),
        })),

      deleteRound: (gameId, roundId) =>
        set((state) => ({
          games: state.games.map((g) => {
            if (g.id !== gameId) return g;
            const filtered = g.rounds.filter((r) => r.id !== roundId);
            const renumbered = filtered.map((r, i) => ({ ...r, roundNumber: i + 1 }));
            return { ...g, rounds: renumbered };
          }),
        })),

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: 'scorer-storage',
    }
  )
);
