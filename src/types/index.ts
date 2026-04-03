export interface Player {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface RoundScore {
  playerId: string;
  score: number;
}

export interface Round {
  id: string;
  roundNumber: number;
  scores: RoundScore[];
}

export interface Game {
  id: string;
  name: string;
  gameType: string;
  playerIds: string[];
  rounds: Round[];
  status: 'active' | 'finished';
  createdAt: string;
  finishedAt?: string;
  winnerIds?: string[];
  lowerIsBetter?: boolean;
}

export interface PlayerStats {
  player: Player;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  totalScore: number;
  avgScore: number;
  bestScore: number;
}
