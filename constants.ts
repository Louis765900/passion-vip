import { Match } from './types.ts';

export const MOCK_MATCHES: Match[] = [
  {
    id: '1',
    league: 'Premier League',
    date: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    homeTeam: { name: 'Arsenal', recentForm: 'W-W-D-W-W' },
    awayTeam: { name: 'Liverpool', recentForm: 'W-D-W-W-L' },
    odds: { home: 2.15, draw: 3.40, away: 3.10 },
    status: 'SCHEDULED'
  },
  {
    id: '2',
    league: 'La Liga',
    date: new Date(Date.now() + 7200000).toISOString(),
    homeTeam: { name: 'Real Madrid', recentForm: 'W-W-W-W-W' },
    awayTeam: { name: 'Barcelona', recentForm: 'W-W-L-W-W' },
    odds: { home: 1.95, draw: 3.60, away: 3.50 },
    status: 'SCHEDULED'
  },
  {
    id: '3',
    league: 'Ligue 1',
    date: new Date(Date.now() - 1800000).toISOString(), // Started 30 mins ago
    homeTeam: { name: 'PSG', recentForm: 'W-D-W-W-W' },
    awayTeam: { name: 'Marseille', recentForm: 'D-L-W-W-D' },
    odds: { home: 1.45, draw: 4.50, away: 6.00 },
    status: 'LIVE',
    minute: 32
  },
  {
    id: '4',
    league: 'Serie A',
    date: new Date(Date.now() + 86400000).toISOString(),
    homeTeam: { name: 'Juventus', recentForm: 'D-D-W-L-W' },
    awayTeam: { name: 'AC Milan', recentForm: 'W-L-W-D-W' },
    odds: { home: 2.30, draw: 3.20, away: 3.05 },
    status: 'SCHEDULED'
  }
];

export const SYSTEM_INSTRUCTION = `
You are an expert sports betting analyst for 'La Passion VIP'.
Analyze the provided match data deeply.
Focus on:
1. Team form and momentum.
2. Historical head-to-head (simulate based on knowledge).
3. Value in odds.
Provide a structured JSON response.
Do not hedge. Be decisive but acknowledge risk.
Tone: Professional, analytical, "Cyberpunk/Futuristic" edge.
`;