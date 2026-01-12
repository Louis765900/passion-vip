// api/groq.js
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GROQ_KEY = process.env.GROQ_KEY;
  
  if (!GROQ_KEY) {
    return res.status(500).json({ error: 'Groq API key not configured' });
  }
  
  const { prompt, model = 'llama-3.3-70b-versatile' } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      })
    });
    
    if (!response.ok) {
      throw new Error(`Groq API returned ${response.status}`);
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Groq API Error:', error);
    res.status(200).json({
      choices: [{
        message: {
          content: '{"analyse": "Analyse indisponible temporairement.", "probabilite": 75, "conseil": "Match équilibré"}'
        }
      }]
    });
  }
};
