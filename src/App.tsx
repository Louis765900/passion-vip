// @ts-nocheck
import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import FilterBar from './components/FilterBar';
import DateFilter from './components/DateFilter'; // ✅ Import des dates
import { Trophy, Zap, Wallet, Activity, Brain, CheckCircle, Ticket } from 'lucide-react';

// --- CONFIGURATION ---
const API_KEYS = {
  FOOTBALL_DATA: import.meta.env.VITE_FOOTBALL_DATA_KEY || "", 
  GROQ: import.meta.env.VITE_GROQ_KEY || ""
};

function App() {
  // --- ÉTATS ---
  const [activeTab, setActiveTab] = useState('home');
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('ALL'); // ✅ Filtre Date
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  
  // États IA & UI
  const [ticketResult, setTicketResult] = useState(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [analyses, setAnalyses] = useState({});
  const [analyzingId, setAnalyzingId] = useState(null);
  const [expandedMatches, setExpandedMatches] = useState({}); // Pour ouvrir/fermer les pronos

  // --- CHARGEMENT ---
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

  // --- FILTRAGE INTELLIGENT ---
  const filteredMatches = matches.filter(m => {
    const matchLeague = selectedLeague === 'ALL' || m.competition.code === selectedLeague;
    const matchDateStr = m.utcDate.split('T')[0];
    const matchDate = selectedDate === 'ALL' || matchDateStr === selectedDate;
    return matchLeague && matchDate;
  });

  // --- IA : ANALYSE MATCH ---
  const handleAnalyze = async (match) => {
    // Si déjà analysé, on toggle juste l'affichage (Ouvrir/Fermer)
    if (analyses[match.id]) {
      setExpandedMatches(prev => ({...prev, [match.id]: !prev[match.id]}));
      return;
    }

    setAnalyzingId(match.id);
    try {
      const prompt = `Expert paris sportifs. Analyse le match ${match.homeTeam.name} vs ${match.awayTeam.name}.
      Réponds UNIQUEMENT avec ce format court :
      "🎯 PRONO : [Ton prono]
      📊 COTE ESTIMÉE : [Cote]
      📝 AVIS : [Une phrase d'analyse simple]"`;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Authorization": `Bearer ${API_KEYS.GROQ}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      const text = data.choices[0]?.message?.content;
      
      setAnalyses(prev => ({ ...prev, [match.id]: text }));
      setExpandedMatches(prev => ({...prev, [match.id]: true})); // On ouvre le résultat
    } catch (e) { console.error(e); } finally { setAnalyzingId(null); }
  };

  // --- IA : GÉNÉRATEUR TICKET VIP ---
  const generateTicket = async () => {
    setLoadingTicket(true);
    setTicketResult(null);
    try {
      const sourceMatches = filteredMatches.length > 0 ? filteredMatches : matches;
      const upcoming = sourceMatches.filter(m => m.status === "SCHEDULED" || m.status === "TIMED").slice(0, 20);
      const list = upcoming.map(m => `${m.homeTeam.name} vs ${m.awayTeam.name}`).join(", ");
      
      // On demande un format HTML brut pour le style
      const prompt = `Génère un TICKET COMBINÉ "SAFE" (Cote totale ~3.00) avec 3 matchs parmi : ${list}.
      Réponds UNIQUEMENT avec un objet JSON contenant : 
      {
        "matches": [
           {"match": "Equipe A vs Equipe B", "selection": "Victoire A", "odds": "1.50"},
           {"match": "...", "selection": "...", "odds": "..."}
        ],
        "total_odds": "3.10",
        "advice": "Ticket basé sur la forme du moment."
      }`;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Authorization": `Bearer ${API_KEYS.GROQ}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } })
      });
      const data = await res.json();
      const content = JSON.parse(data.choices[0]?.message?.content);
      setTicketResult(content);
    } catch (e) { setTicketResult(null); } finally { setLoadingTicket(false); }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Wallet size={16} color="#00FF7F" />
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#00FF7F' }}>1,250 €</span>
        </div>
      </header>

      <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            
            {/* Filtres */}
            <h3 style={{ marginTop: '0', marginBottom: '10px', color: 'white' }}>🏆 Compétitions</h3>
            <FilterBar selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} />
            
            {/* ✅ LES DATES SONT ICI */}
            <DateFilter selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

            <h3 style={{ marginTop: '10px', marginBottom: '10px', color: 'white' }}>
              🔥 Matchs {selectedDate === 'ALL' ? '' : 'sélectionnés'}
            </h3>
            
            {loading ? (
              <div style={{textAlign: "center", color: "#94A3B8", marginTop: "20px"}}>Chargement...</div>
            ) : filteredMatches.length === 0 ? (
               <div style={{textAlign: "center", color: "#94A3B8", marginTop: "20px", padding:"20px", border:"1px dashed #333", borderRadius:"10px"}}>
                 Aucun match trouvé. 😴
               </div>
            ) : (
              filteredMatches.slice(0, 50).map((match) => (
                <div key={match.id} className="glass-panel" style={{ padding: '15px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom:'10px' }}>
                  
                  {/* Match Info */}
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

                  {/* Bouton Action */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '5px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{formatTime(match.utcDate)} • {match.competition.name}</div>
                    <button 
                      onClick={() => handleAnalyze(match)}
                      disabled={analyzingId === match.id}
                      style={{ 
                        background: analyses[match.id] ? (expandedMatches[match.id] ? '#00D9FF' : 'rgba(0, 217, 255, 0.1)') : 'rgba(0, 217, 255, 0.1)', 
                        color: analyses[match.id] ? (expandedMatches[match.id] ? '#000' : '#00D9FF') : '#00D9FF', 
                        border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {analyzingId === match.id ? "Analys..." : (analyses[match.id] ? (expandedMatches[match.id] ? "Masquer 🔼" : "Voir Prono 🔽") : "Analyser IA")}
                    </button>
                  </div>

                  {/* ✅ Affichage du Prono (Formaté propre) */}
                  {analyses[match.id] && expandedMatches[match.id] && (
                    <div style={{ 
                      background: 'rgba(15, 23, 42, 0.6)', 
                      padding: '15px', borderRadius: '12px', marginTop: '5px',
                      borderLeft: '3px solid #00FF7F',
                      whiteSpace: 'pre-wrap', color: '#E2E8F0', fontSize: '0.9rem', lineHeight: '1.5'
                    }}>
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
              <button 
                onClick={generateTicket}
                disabled={loadingTicket}
                style={{
                  background: 'white', color: '#0066FF', border: 'none',
                  padding: '12px 24px', borderRadius: '12px', fontWeight: '900',
                  fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
              >
                {loadingTicket ? "L'IA réfléchit..." : "GÉNÉRER TICKET 🚀"}
              </button>
            </div>

            {/* ✅ NOUVEAU DESIGN TICKET VIP (Style Reçu) */}
            {ticketResult && ticketResult.matches && (
              <div style={{ 
                background: 'white', color: '#1e293b', 
                borderRadius: '6px', padding: '20px', 
                position: 'relative', 
                boxShadow: '0 0 20px rgba(0,255,127,0.2)',
                fontFamily: 'monospace' 
              }}>
                {/* Bordure du haut style ticket déchiré */}
                <div style={{ borderBottom: '2px dashed #cbd5e1', paddingBottom: '15px', marginBottom: '15px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', fontSize:'1.2rem', fontWeight:'900', color:'#0f172a' }}>
                    <Ticket size={24} /> TICKET GAGNANT
                  </div>
                  <div style={{ fontSize:'0.8rem', color:'#64748b', marginTop:'5px' }}>{new Date().toLocaleString()}</div>
                </div>

                {/* Liste des matchs */}
                <div style={{ display:'flex', flexDirection:'column', gap:'15px', textAlign:'left' }}>
                  {ticketResult.matches.map((m, idx) => (
                    <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:'bold', fontSize:'0.9rem' }}>{m.match}</div>
                        <div style={{ fontSize:'0.85rem', color:'#0066FF' }}>👉 {m.selection}</div>
                      </div>
                      <div style={{ fontWeight:'bold', fontSize:'1rem', background:'#e2e8f0', padding:'4px 8px', borderRadius:'4px' }}>
                        {m.odds}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '15px', marginTop: '20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:'bold', fontSize:'1.1rem' }}>COTE TOTALE</span>
                  <span style={{ fontWeight:'900', fontSize:'1.5rem', color:'#00D9FF', background:'#0f172a', padding:'5px 10px', borderRadius:'5px' }}>
                    {ticketResult.total_odds}
                  </span>
                </div>
                
                <div style={{ marginTop:'15px', fontSize:'0.8rem', color:'#64748b', fontStyle:'italic' }}>
                  "{ticketResult.advice}"
                </div>
                
                {/* Bouton Parier */}
                <button style={{ width:'100%', background:'#00D9FF', color:'#fff', border:'none', padding:'12px', marginTop:'20px', borderRadius:'4px', fontWeight:'bold', cursor:'pointer' }}>
                  PLACER CE PARI 💸
                </button>
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