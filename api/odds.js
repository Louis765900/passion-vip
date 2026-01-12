// api/odds.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const API_KEY = process.env.ODDS_API_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ error: 'Odds API key not configured' });
  }
  
  const { sport = 'soccer', region = 'eu' } = req.query;
  
  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${API_KEY}&regions=${region}&markets=h2h`
    );
    
    if (!response.ok) {
      throw new Error(`Odds API returned ${response.status}`);
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Odds API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch odds', 
      data: [] 
    });
  }
}
