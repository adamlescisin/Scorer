import { create } from 'zustand';
import { Player, Game, Round } from '../types';
import { supabase } from '../lib/supabase';

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

// ── Supabase helpers ──────────────────────────────────────────────────────────

function dbToPlayer(row: Record<string, unknown>): Player {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
    createdAt: row.created_at as string,
  };
}

function dbToGame(row: Record<string, unknown>): Game {
  return {
    id: row.id as string,
    name: row.name as string,
    gameType: row.game_type as string,
    playerIds: row.player_ids as string[],
    rounds: (row.rounds as Round[]) ?? [],
    status: row.status as 'active' | 'finished',
    createdAt: row.created_at as string,
    finishedAt: (row.finished_at as string) ?? undefined,
    winnerIds: (row.winner_ids as string[]) ?? undefined,
    lowerIsBetter: (row.lower_is_better as boolean) ?? true,
  };
}

function playerToDb(p: Player) {
  return { id: p.id, name: p.name, color: p.color, created_at: p.createdAt };
}

function gameToDb(g: Game) {
  return {
    id: g.id,
    name: g.name,
    game_type: g.gameType,
    player_ids: g.playerIds,
    rounds: g.rounds,
    status: g.status,
    created_at: g.createdAt,
    finished_at: g.finishedAt ?? null,
    winner_ids: g.winnerIds ?? null,
    lower_is_better: g.lowerIsBetter ?? true,
  };
}

// ── localStorage helpers ──────────────────────────────────────────────────────

const LS_KEY = 'scorer-storage';

function lsLoad(): { players: Player[]; games: Game[] } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function lsSave(players: Player[], games: Game[]) {
  localStorage.setItem(LS_KEY, JSON.stringify({ players, games }));
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface GameState {
  players: Player[];
  games: Game[];
  darkMode: boolean;
  loaded: boolean;

  initStore: () => Promise<void>;

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

export const useGameStore = create<GameState>()((set) => ({
  players: [],
  games: [],
  darkMode: localStorage.getItem('scorer-darkMode') === 'true',
  loaded: false,

  initStore: async () => {
    if (!supabase) {
      // localStorage fallback
      const stored = lsLoad();
      if (stored) {
        set({ players: stored.players, games: stored.games, loaded: true });
      } else {
        set({ players: SAMPLE_PLAYERS, games: SAMPLE_GAMES, loaded: true });
        lsSave(SAMPLE_PLAYERS, SAMPLE_GAMES);
      }
      return;
    }

    // Supabase mode
    const [{ data: pRows, error: pErr }, { data: gRows, error: gErr }] = await Promise.all([
      supabase.from('players').select('*').order('created_at'),
      supabase.from('games').select('*').order('created_at'),
    ]);

    if (pErr) console.error('Supabase players error:', pErr);
    if (gErr) console.error('Supabase games error:', gErr);

    let players = (pRows ?? []).map(dbToPlayer);
    let games = (gRows ?? []).map(dbToGame);

    // Seed sample data on first run
    if (players.length === 0 && games.length === 0) {
      await supabase.from('players').insert(SAMPLE_PLAYERS.map(playerToDb));
      await supabase.from('games').insert(SAMPLE_GAMES.map(gameToDb));
      players = [...SAMPLE_PLAYERS];
      games = [...SAMPLE_GAMES];
    }

    set({ players, games, loaded: true });
  },

  addPlayer: (name, color) => {
    const p: Player = { id: genId(), name, color, createdAt: new Date().toISOString() };
    set((s) => {
      const players = [...s.players, p];
      if (!supabase) lsSave(players, s.games);
      else supabase.from('players').insert(playerToDb(p)).then(({ error }) => { if (error) console.error(error); });
      return { players };
    });
  },

  updatePlayer: (id, name, color) => {
    set((s) => {
      const players = s.players.map((p) => (p.id === id ? { ...p, name, color } : p));
      if (!supabase) lsSave(players, s.games);
      else supabase.from('players').update({ name, color }).eq('id', id).then(({ error }) => { if (error) console.error(error); });
      return { players };
    });
  },

  deletePlayer: (id) => {
    set((s) => {
      const players = s.players.filter((p) => p.id !== id);
      if (!supabase) lsSave(players, s.games);
      else supabase.from('players').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); });
      return { players };
    });
  },

  addGame: (name, gameType, playerIds, lowerIsBetter) => {
    const id = genId();
    const g: Game = {
      id, name, gameType, playerIds, rounds: [], status: 'active',
      createdAt: new Date().toISOString(), lowerIsBetter,
    };
    set((s) => {
      const games = [...s.games, g];
      if (!supabase) lsSave(s.players, games);
      else supabase.from('games').insert(gameToDb(g)).then(({ error }) => { if (error) console.error(error); });
      return { games };
    });
    return id;
  },

  updateGame: (id, updates) => {
    set((s) => {
      const games = s.games.map((g) => (g.id === id ? { ...g, ...updates } : g));
      const updated = games.find((g) => g.id === id)!;
      if (!supabase) lsSave(s.players, games);
      else supabase.from('games').update(gameToDb(updated)).eq('id', id).then(({ error }) => { if (error) console.error(error); });
      return { games };
    });
  },

  deleteGame: (id) => {
    set((s) => {
      const games = s.games.filter((g) => g.id !== id);
      if (!supabase) lsSave(s.players, games);
      else supabase.from('games').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); });
      return { games };
    });
  },

  finishGame: (id) => {
    set((s) => {
      const game = s.games.find((g) => g.id === id);
      if (!game) return s;

      const totals: Record<string, number> = {};
      for (const pid of game.playerIds) totals[pid] = 0;
      for (const round of game.rounds)
        for (const sc of round.scores)
          totals[sc.playerId] = (totals[sc.playerId] ?? 0) + sc.score;

      const sorted = [...game.playerIds].sort((a, b) =>
        game.lowerIsBetter ? totals[a] - totals[b] : totals[b] - totals[a]
      );
      const best = totals[sorted[0]];
      const winnerIds = sorted.filter((pid) => totals[pid] === best);

      const updated: Game = { ...game, status: 'finished', finishedAt: new Date().toISOString(), winnerIds };
      const games = s.games.map((g) => (g.id === id ? updated : g));
      if (!supabase) lsSave(s.players, games);
      else supabase.from('games').update(gameToDb(updated)).eq('id', id).then(({ error }) => { if (error) console.error(error); });
      return { games };
    });
  },

  addRound: (gameId, scores) => {
    set((s) => {
      const games = s.games.map((g) => {
        if (g.id !== gameId) return g;
        const newRound: Round = { id: genId(), roundNumber: g.rounds.length + 1, scores };
        return { ...g, rounds: [...g.rounds, newRound] };
      });
      const updated = games.find((g) => g.id === gameId)!;
      if (!supabase) lsSave(s.players, games);
      else supabase.from('games').update({ rounds: updated.rounds }).eq('id', gameId).then(({ error }) => { if (error) console.error(error); });
      return { games };
    });
  },

  updateRound: (gameId, roundId, scores) => {
    set((s) => {
      const games = s.games.map((g) => {
        if (g.id !== gameId) return g;
        return { ...g, rounds: g.rounds.map((r) => (r.id === roundId ? { ...r, scores } : r)) };
      });
      const updated = games.find((g) => g.id === gameId)!;
      if (!supabase) lsSave(s.players, games);
      else supabase.from('games').update({ rounds: updated.rounds }).eq('id', gameId).then(({ error }) => { if (error) console.error(error); });
      return { games };
    });
  },

  deleteRound: (gameId, roundId) => {
    set((s) => {
      const games = s.games.map((g) => {
        if (g.id !== gameId) return g;
        const filtered = g.rounds.filter((r) => r.id !== roundId);
        const renumbered = filtered.map((r, i) => ({ ...r, roundNumber: i + 1 }));
        return { ...g, rounds: renumbered };
      });
      const updated = games.find((g) => g.id === gameId)!;
      if (!supabase) lsSave(s.players, games);
      else supabase.from('games').update({ rounds: updated.rounds }).eq('id', gameId).then(({ error }) => { if (error) console.error(error); });
      return { games };
    });
  },

  toggleDarkMode: () =>
    set((s) => {
      const darkMode = !s.darkMode;
      localStorage.setItem('scorer-darkMode', String(darkMode));
      return { darkMode };
    }),
}));
