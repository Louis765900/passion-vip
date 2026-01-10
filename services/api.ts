import { Match } from '../types.ts';
import { MOCK_MATCHES } from '../constants.ts';

const ODDS_API_KEY = process.env.ODDS_API_KEY || 'demo_key';

const fetchOddsFromAPI = async (sport: string = 'soccer_epl'): Promise<Record<string, any>> => {
  try {
    const response = await fetch(`https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h`);
    if (!response.ok) throw new Error('Odds API failed');
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch odds:', error);
    return {};
  }
};

const LEAGUE_MAP: Record<string, string> = {
  'PL': 'Premier League',
  'PD': 'La Liga',
  'SA': 'Serie A',
  'BL1': 'Bundesliga',
  'FL1': 'Ligue 1',
  'CL': 'Champions League',
  'WC': 'World Cup'
};

export const fetchLiveMatches = async (): Promise<Match[]> => {
  try {
    // Use Odds API for real matches and odds
    const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`);
    
    if (!response.ok) {
      throw new Error(`Odds API Error: ${response.status}`);
    }

    const data = await response.json();
    
    const matches: Match[] = data
      .filter((event: any) => {
        const eventDate = new Date(event.commence_time).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        return eventDate === today;
      })
      .map((event: any) => {
      const homeOdds = event.bookmakers?.[0]?.markets?.[0]?.outcomes?.find((o: any) => o.name === event.home_team)?.price || 2.0;
      const awayOdds = event.bookmakers?.[0]?.markets?.[0]?.outcomes?.find((o: any) => o.name === event.away_team)?.price || 2.0;
      const drawOdds = event.bookmakers?.[0]?.markets?.[0]?.outcomes?.find((o: any) => o.name === 'Draw')?.price || 3.0;

      return {
        id: event.id.toString(),
        league: event.sport_title || 'Soccer',
        date: event.commence_time,
        homeTeam: {
          name: event.home_team,
          logoUrl: '', // Odds API doesn't provide logos
          recentForm: 'N/A'
        },
        awayTeam: {
          name: event.away_team,
          logoUrl: '',
          recentForm: 'N/A'
        },
        odds: {
          home: Number(homeOdds),
          draw: Number(drawOdds),
          away: Number(awayOdds)
        },
        status: 'SCHEDULED', // Odds API doesn't provide live status easily
        score: {
          home: 0,
          away: 0
        }
      };
    });

    // Try to fetch live matches from football-data with CORS proxy
    try {
      const liveResponse = await fetch(`https://cors-anywhere.herokuapp.com/https://api.football-data.org/v4/matches?status=LIVE`, {
        headers: {
          'X-Auth-Token': FOOTBALL_DATA_KEY
        }
      });

      if (liveResponse.ok) {
        const liveData = await liveResponse.json();
        const liveMatches: Match[] = liveData.matches.map((m: any) => ({
          id: m.id.toString(),
          league: LEAGUE_MAP[m.competition.code] || m.competition.name,
          date: m.utcDate,
          homeTeam: {
            name: m.homeTeam.name,
            logoUrl: m.homeTeam.crest,
            recentForm: 'N/A'
          },
          awayTeam: {
            name: m.awayTeam.name,
            logoUrl: m.awayTeam.crest,
            recentForm: 'N/A'
          },
          odds: {
            home: 2.0,
            draw: 3.0,
            away: 2.0
          },
          status: 'LIVE',
          minute: m.score.duration === 'REGULAR' ? 45 : undefined,
          score: {
            home: m.score.fullTime.home ?? 0,
            away: m.score.fullTime.away ?? 0
          }
        }));

        // Merge live matches with scheduled ones
        matches = [...liveMatches, ...matches];
      } else {
        // If live fetch fails, add mock live matches for demonstration
        const mockLiveMatches: Match[] = [
          {
            id: 'live1',
            league: 'Premier League',
            date: new Date().toISOString(),
            homeTeam: {
              name: 'Arsenal',
              logoUrl: '',
              recentForm: 'N/A'
            },
            awayTeam: {
              name: 'Chelsea',
              logoUrl: '',
              recentForm: 'N/A'
            },
            odds: {
              home: 2.1,
              draw: 3.2,
              away: 3.5
            },
            status: 'LIVE',
            minute: 67,
            score: {
              home: 1,
              away: 0
            }
          },
          {
            id: 'live2',
            league: 'La Liga',
            date: new Date().toISOString(),
            homeTeam: {
              name: 'Real Madrid',
              logoUrl: '',
              recentForm: 'N/A'
            },
            awayTeam: {
              name: 'Barcelona',
              logoUrl: '',
              recentForm: 'N/A'
            },
            odds: {
              home: 1.8,
              draw: 3.8,
              away: 4.2
            },
            status: 'LIVE',
            minute: 45,
            score: {
              home: 0,
              away: 1
            }
          }
        ];
        matches = [...mockLiveMatches, ...matches];
      }
    } catch (liveError) {
      console.warn("Failed to fetch live matches:", liveError);
      // Add mock live matches as fallback
      const mockLiveMatches: Match[] = [
        {
          id: 'live1',
          league: 'Premier League',
          date: new Date().toISOString(),
          homeTeam: {
            name: 'Arsenal',
            logoUrl: '',
            recentForm: 'N/A'
          },
          awayTeam: {
            name: 'Chelsea',
            logoUrl: '',
            recentForm: 'N/A'
          },
          odds: {
            home: 2.1,
            draw: 3.2,
            away: 3.5
          },
          status: 'LIVE',
          minute: 67,
          score: {
            home: 1,
            away: 0
          }
        }
      ];
      matches = [...mockLiveMatches, ...matches];
    }

    return matches;

  } catch (error) {
    console.warn("Failed to fetch real data from Odds API, using MOCK data.", error);
    return MOCK_MATCHES;
  }
};