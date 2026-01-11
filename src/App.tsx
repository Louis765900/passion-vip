// @ts-nocheck
import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import { Trophy, Zap, Wallet, Activity, Brain } from 'lucide-react';

// --- 1. CONFIGURATION (Tes clés API) ---
const API_KEYS = {
  FOOTBALL_DATA: import.meta.env.VITE_FOOTBALL_DATA_KEY || "", 
  GROQ: import.meta.env.VITE_GROQ_KEY || ""
};

function App() {
  // --- 2. ÉTATS (La mémoire de l'app) ---
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  
  // États pour l'IA
  const [ticketResult, setTicketResult] = useState(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [analyses, setAnalyses] = useState({});
  const [analyzingId, setAnalyzingId] = useState(null);

  // --- 3. CHARGEMENT DES MATCHS (Le Moteur) ---
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("🔄 Chargement des matchs...");
        // On regarde les 10 prochains jours pour être sûr d'avoir du foot
        const today = new Date();
        const future = new Date();
        future.setDate(today.getDate() + 10);
        
        const dateFrom = today.toISOString().split('T')[0];
        const dateTo = future.toISOString().split('T')[0];

        const proxyUrl = "https://corsproxy.io/?";
        const targetUrl = `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        
        const res = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
          headers: { "X-Auth-Token": API_KEYS.FOOTBALL_DATA },
        });
        
        const data = await res.json();
        // On garde les matchs non annulés
        const validMatches = data.matches?.filter(m => m.status !== "CANCELLED") || [];
        setMatches(validMatches);
        setLoading(false);
      } catch (err) {
        console.error("Erreur API:", err);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // --- 4. FONCTION : ANALYSER UN MATCH (IA) ---
  const handleAnalyze = async (match) => {
    if (analyses[match.id]) return; // Déjà analysé
    setAnalyzingId(match.id);
    
    try {
      const prompt = `Expert foot. Analyse courte : ${match.homeTeam.name} vs ${match.awayTeam.name}.
      Donne un prono sécurisé (Double chance ou Over/Under). 
      Format: "💡 PRONO : ... | 📝 RAISON : ..."`;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Authorization": `Bearer ${API_KEYS.GROQ}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], temperature: 0.7 })
      });
      const data = await res.json();
      setAnalyses(prev => ({ ...prev, [match.id]: data.choices[0]?.message?.content }));
    } catch (e) { console.error(e); } finally { setAnalyzingId(null); }
  };

  // --- 5. FONCTION : GÉNÉRER TICKET VIP (IA) ---
  const generateTicket = async () => {
    setLoadingTicket(true);
    setTicketResult(null);
    try {
      // On prend les matchs à venir uniquement
      const upcoming = matches.filter(m => m.status === "SCHEDULED" || m.status === "TIMED").slice(0, 10);
      const list = upcoming.map(m => `${m.homeTeam.name} vs ${m.awayTeam.name}`).join(", ");
      
      const prompt = `Génère un TICKET COMBINÉ "SAFE" (Cote ~2.5) avec ces matchs : ${list}. 
      Choisis 3 matchs sûrs. Format JSON strict : {"display_text": "Texte joli avec emojis..."}`;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Authorization": `Bearer ${API_KEYS.GROQ}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } })
      });
      const data = await res.json();
      const content = JSON.parse(data.choices[0]?.message?.content);
      setTicketResult(content.display_text);
    } catch (e) { setTicketResult("❌ Erreur IA. Réessaie."); } finally { setLoadingTicket(false); }
  };

  // Helpers de formatage
  const formatTime = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // --- RENDU VISUEL ---
  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* HEADER */}
      <header className="glass-panel" style={{
        position: 'sticky', top: 0, zIndex: 50, padding: '15px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', borderTop:0, borderLeft:0, borderRight:0
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-1px', color: '#fff' }}>
          PASSION<span style={{ color: '#00D9FF' }}>VIP</span>
        </div>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', 
          background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)' 
        }}>
          <Wallet size={16} color="#00FF7F" />
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#00FF7F' }}>1,250 €</span>
        </div>
      </header>

      <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* --- ONGLET ACCUEIL (Liste des matchs) --- */}
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Stats Rapides */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="glass-panel" style={{ padding: '15px', borderRadius: '16px', textAlign: 'center' }}>
                <Trophy size={24} color="#FFD700" style={{ marginBottom: '5px' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{matches.length}</div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Matchs détectés</div>
              </div>
              <div className="glass-panel" style={{ padding: '15px', borderRadius: '16px', textAlign: 'center' }}>
                <Activity size={24} color="#00D9FF" style={{ marginBottom: '5px' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>82%</div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Confiance IA</div>
              </div>
            </div>

            <h3 style={{ marginTop: '10px', marginBottom: '0', color: 'white' }}>🔥 Matchs à venir</h3>
            
            {loading ? (
              <div style={{textAlign: "center", color: "#94A3B8", marginTop: "20px"}}>Chargement des cotes...</div>
            ) : (
              matches.slice(0, 20).map((match) => (
                <div key={match.id} className="glass-panel" style={{ padding: '15px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* Ligne du match */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <img src={match.homeTeam.crest} style={{ width: '25px', height: '25px', objectFit: 'contain' }} />
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{match.homeTeam.name}</span>
                    </div>
                    <div style={{ padding: '0 10px', fontWeight: 'bold', color: '#00D9FF' }}>VS</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'right' }}>{match.awayTeam.name}</span>
                      <img src={match.awayTeam.crest} style={{ width: '25px', height: '25px', objectFit: 'contain' }} />
                    </div>
                  </div>

                  {/* Info Heure & Analyse */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '5px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      {formatTime(match.utcDate)} • {match.competition.name}
                    </div>
                    <button 
                      onClick={() => handleAnalyze(match)}
                      disabled={analyzingId === match.id}
                      style={{ 
                        background: analyses[match.id] ? 'rgba(0, 255, 127, 0.1)' : 'rgba(0, 217, 255, 0.1)', 
                        color: analyses[match.id] ? '#00FF7F' : '#00D9FF', 
                        border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' 
                      }}
                    >
                      {analyzingId === match.id ? "..." : (analyses[match.id] ? "Voir Prono" : "Analyser IA")}
                    </button>
                  </div>

                  {/* Résultat Analyse */}
                  {analyses[match.id] && (
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', color: '#e2e8f0', marginTop: '5px' }}>
                      {analyses[match.id]}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* --- ONGLET VIP (Générateur) --- */}
        {activeTab === 'vip' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)',
              borderRadius: '20px', padding: '30px', color: 'white',
              boxShadow: '0 10px 30px rgba(0, 217, 255, 0.3)'
            }}>
              <Brain size={48} color="white" style={{ marginBottom: '15px' }} />
              <h2 style={{ margin: '0 0 10px 0' }}>Générateur de Combinés</h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', marginBottom: '20px' }}>
                Laissez l'IA scanner les 50 prochains matchs pour créer le ticket parfait.
              </p>
              <button 
                onClick={generateTicket}
                disabled={loadingTicket}
                style={{
                  background: 'white', color: '#0066FF', border: 'none',
                  padding: '12px 24px', borderRadius: '12px', fontWeight: '900',
                  fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
              >
                {loadingTicket ? "Analyse en cours..." : "GÉNÉRER MON TICKET 🚀"}
              </button>
            </div>

            {ticketResult && (
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', textAlign: 'left', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {ticketResult}
              </div>
            )}
          </div>
        )}

        {/* --- AUTRES ONGLETS --- */}
        {activeTab === 'live' && <div style={{ textAlign: 'center', marginTop: '50px', color: '#94A3B8' }}>📡 Live Score (Bientôt)</div>}
        {activeTab === 'profile' && <div style={{ textAlign: 'center', marginTop: '50px', color: '#94A3B8' }}>👤 Profil (Bientôt)</div>}

      </main>

      {/* NAVIGATION */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    
    </div>
  );
}

export default App;