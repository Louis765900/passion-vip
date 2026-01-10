export enum PredictionStatus {
  PENDING = 'PENDING',
  WON = 'WON',
  LOST = 'LOST'
}

export interface Team {
  name: string;
  logoUrl?: string;
  recentForm?: string; // e.g., "W-W-D-L-W"
}

export interface Match {
  id: string;
  league: string;
  date: string; // ISO string
  homeTeam: Team;
  awayTeam: Team;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELED';
  minute?: number;
  score?: {
    home: number;
    away: number;
  }
}

export interface BetRecommendation {
  type: 'BANKER' | 'VALUE' | 'LONG_SHOT';
  selection: string;
  odds: number;
  confidence: number;
  reasoning: string;
}

export interface AIAnalysis {
  matchId: string;
  snapshot: string; // 1 phrase summary
  scenario: string; // Context & stakes
  predictions: BetRecommendation[]; // The 3 specific bets
  riskManagement: string; // Bankroll advice
  vipAdvice?: string;
  trends: string;
}

export interface StoredPrediction {
  id: string;
  matchId: string;
  matchTitle: string;
  date: string;
  selection: string;
  odds: number;
  stake: number; // Virtual units, default 1
  status: PredictionStatus;
  analysisSnippet: string;
  type: 'BANKER' | 'VALUE' | 'LONG_SHOT';
}

export interface UserStats {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
  profit: number; // Virtual profit units
  currentStreak: number;
}