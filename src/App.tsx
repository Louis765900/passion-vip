// @ts-nocheck
import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import FilterBar from './components/FilterBar'; // ✅ On importe le filtre
import { Trophy, Zap, Wallet, Activity, Brain } from 'lucide-react';

// --- CONFIGURATION ---
const API_KEYS = {
  FOOTBALL_DATA: import.meta.env.VITE_FOOTBALL_DATA_KEY || "", 
  GROQ: import.meta.env.VITE_GROQ_KEY || ""
};

function App() {
  // --- ÉTATS ---
  const [activeTab, setActiveTab] = useState('home');
  const [selectedLeague, setSelectedLeague] = useState('ALL'); // ✅ État du filtre
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  
  // États IA
  const [ticketResult, setTicketResult] = useState(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [analyses, setAnalyses] = useState({});
  const [analyzingId, setAnalyzingId] = useState(null);

  // --- CHARGEMENT DONNÉES ---
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("🔄 Chargement...");
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
        const validMatches = data.matches?.filter(m => m.status !== "CANCELLED") || [];
        setMatches(validMatches);
        setLoading(false);
      } catch (err) { console.error(err); setLoading(false); }
    };
    loadData();
  }, []);

  // --- FILTRAGE DES MATCHS (La logique magique) ---
  const filteredMatches = selectedLeague === 'ALL' 
    ? matches 
    : matches.filter(m => m.competition.code === selectedLeague);

  // --- ANALYSE IA ---
  const handleAnalyze = async (match) => {
    if (analyses[match.id]) return; 
    setAnalyzingId(match.id);
    try {
      const prompt = `Expert foot. Analyse courte : ${match.homeTeam.name} vs ${match.awayTeam.name}.
      Donne un prono sécurisé. Format: "💡 PRONO : ... | 📝 RAISON : ..."`;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Authorization": `Bearer ${API_KEYS.GROQ}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      setAnalyses(prev => ({ ...prev, [match.id]: data.choices[0]?.message?.content }));
    } catch (e) { console.error(e); } finally { setAnalyzingId(null); }
  };

  // --- GÉNÉRATEUR TICKET ---
  const generateTicket = async () => {
    setLoadingTicket(true);
    setTicketResult(null);
    try {
      // On utilise filteredMatches pour générer un ticket basé sur le filtre actuel !
      const sourceMatches = filteredMatches.length > 0 ? filteredMatches : matches;
      const upcoming = sourceMatches.filter(m => m.status === "SCHEDULED" || m.status === "TIMED").slice(0, 15);
      
      const list = upcoming.map(m => `${m.homeTeam.name} vs ${m.awayTeam.name}`).join(", ");
      const prompt = `Génère un TICKET COMBINÉ "SAFE" (Cote ~2.5) avec ces matchs : ${list}. 
      Choisis 3 matchs. Format JSON strict : {"display_text": "..."}`;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Authorization": `Bearer ${API_KEYS.GROQ}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } })
      });
      const data = await res.json();
      const content = JSON.parse(data.choices[0]?.message?.content);
      setTicketResult(content.display_text);
    } catch (e) { setTicketResult("❌ Erreur IA."); } finally { setLoadingTicket(false); }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

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
        
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Stats Dynamiques (changent selon le filtre) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="glass-panel" style={{ padding: '15px', borderRadius: '16px', textAlign: 'center' }}>
                <Trophy size={24} color="#FFD700" style={{ marginBottom: '5px' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{filteredMatches.length}</div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Matchs {selectedLeague !== 'ALL' ? selectedLeague : ''}</div>
              </div>
              <div className="glass-panel" style={{ padding: '15px', borderRadius: '16px', textAlign: 'center' }}>
                <Activity size={24} color="#00D9FF" style={{ marginBottom: '5px' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>82%</div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Confiance IA</div>
              </div>
            </div>

            {/* --- LA BARRE DE FILTRE EST ICI --- */}
            <div>
              <h3 style={{ marginTop: '0', marginBottom: '10px', color: 'white' }}>🏆 Compétitions</h3>
              <FilterBar selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} />
            </div>

            <h3 style={{ marginTop: '0', marginBottom: '0', color: 'white' }}>🔥 Matchs à venir</h3>
            
            {loading ? (
              <div style={{textAlign: "center", color: "#94A3B8", marginTop: "20px"}}>Chargement...</div>
            ) : filteredMatches.length === 0 ? (
               <div style={{textAlign: "center", color: "#94A3B8", marginTop: "20px", padding:"20px", border:"1px dashed #333", borderRadius:"10px"}}>
                 Aucun match trouvé pour cette ligue dans les 10 prochains jours. 😴
               </div>
            ) : (
              filteredMatches.slice(0, 50).map((match) => (
                <div key={match.id} className="glass-panel" style={{ padding: '15px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

        {activeTab === 'vip' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)',
              borderRadius: '20px', padding: '30px', color: 'white',
              boxShadow: '0 10px 30px rgba(0, 217, 255, 0.3)'
            }}>
              <Brain size={48} color="white" style={{ marginBottom: '15px' }} />
              <h2 style={{ margin: '0 0 10px 0' }}>Générateur {selectedLeague !== 'ALL' ? selectedLeague : 'Global'}</h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', marginBottom: '20px' }}>
                L'IA va scanner les matchs {selectedLeague !== 'ALL' ? 'de cette ligue' : 'du monde entier'} pour créer ton ticket.
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

        {activeTab === 'live' && <div style={{ textAlign: 'center', marginTop: '50px', color: '#94A3B8' }}>📡 Live Score (Bientôt)</div>}
        {activeTab === 'profile' && <div style={{ textAlign: 'center', marginTop: '50px', color: '#94A3B8' }}>👤 Profil (Bientôt)</div>}

      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;