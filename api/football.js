// api/football.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const API_KEY = process.env.FOOTBALL_DATA_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  const { dateFrom, dateTo } = req.query;
  
  try {
    const response = await fetch(
      `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      {
        headers: {
          'X-Auth-Token': API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Football API returned ${response.status}`);
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Football API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch matches',
      matches: []
    });
  }
}
