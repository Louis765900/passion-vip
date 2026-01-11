// @ts-nocheck
import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import FilterBar from './components/FilterBar';
import DateFilter from './components/DateFilter';
import { Trophy, Zap, Wallet, Activity, Brain, Ticket, History, TrendingUp } from 'lucide-react';

// --- CONFIGURATION ---
const API_KEYS = {
  FOOTBALL_DATA: import.meta.env.VITE_FOOTBALL_DATA_KEY || "", 
  GROQ: import.meta.env.VITE_GROQ_KEY || ""
};

function App() {
  // --- ÉTATS ---
  const [activeTab, setActiveTab] = useState('home');
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  
  // États JEU (Bankroll & Historique)
  const [bankroll, setBankroll] = useState(1250); // 💰 Argent de départ
  const [myBets, setMyBets] = useState([]); // 📜 Historique des paris

  // États IA
  const [ticketResult, setTicketResult] = useState(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [analyses, setAnalyses] = useState({});
  const [analyzingId, setAnalyzingId] = useState(null);
  const [expandedMatches, setExpandedMatches] = useState({});

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

  // --- ACTIONS DU JEU ---
  const handlePlaceBet = () => {
    if (!ticketResult) return;
    const mise = 50; // Mise fixe pour simplifier

    if (bankroll < mise) {
      alert("⚠️ Fonds insuffisants !");
      return;
    }

    // Création du pari
    const newBet = {
      id: Date.now(),
      date: new Date(),
      matches: ticketResult.matches,
      totalOdds: ticketResult.total_odds,
      stake: mise,
      potentialGain: (mise * parseFloat(ticketResult.total_odds)).toFixed(2),
      status: 'En cours'
    };

    // Mise à jour des états
    setBankroll(prev => prev - mise);
    setMyBets(prev => [newBet, ...prev]); // Ajoute en haut de la liste
    alert(`✅ Pari validé ! Gain potentiel : ${newBet.potentialGain}€`);
    setActiveTab('profile'); // Redirection vers le profil
  };

  // --- LOGIQUE FILTRES & IA ---
  const filteredMatches = matches.filter(m => {
    const matchLeague = selectedLeague === 'ALL' || m.competition.code === selectedLeague;
    const matchDateStr = m.utcDate.split('T')[0];
    const matchDate = selectedDate === 'ALL' || matchDateStr === selectedDate;
    return matchLeague && matchDate;
  });

  const handleAnalyze = async (match) => {
    if (analyses[match.id]) {
      setExpandedMatches(prev => ({...prev, [match.id]: !prev[match.id]}));
      return;
    }
    setAnalyzingId(match.id);
    try {
      const prompt = `Expert paris sportifs. Analyse : ${match.homeTeam.name} vs ${match.awayTeam.name}.
      Réponds court : "🎯 PRONO : ... | 📊 COTE : ... | 📝 AVIS : ..."`;
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Authorization": `Bearer ${API_KEYS.GROQ}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      setAnalyses(prev => ({ ...prev, [match.id]: data.choices[0]?.message?.content }));
      setExpandedMatches(prev => ({...prev, [match.id]: true}));
    } catch (e) { console.error(e); } finally { setAnalyzingId(null); }
  };

  const generateTicket = async () => {
    setLoadingTicket(true);
    setTicketResult(null);
    try {
      const sourceMatches = filteredMatches.length > 0 ? filteredMatches : matches;
      const upcoming = sourceMatches.filter(m => m.status === "SCHEDULED" || m.status === "TIMED").slice(0, 20);
      const list = upcoming.map(m => `${m.homeTeam.name} vs ${m.awayTeam.name}`).join(", ");
      
      const prompt = `Génère un TICKET "SAFE" (Cote ~3.00) avec 3 matchs parmi : ${list}.
      JSON strict. Pour "selection", mets "Victoire [Nom Equipe]".
      Format : { "matches": [{"match": "A vs B", "selection": "Victoire A", "odds": "1.50"}], "total_odds": "3.00", "advice": "..." }`;

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
      
      {/* HEADER AVEC BANKROLL DYNAMIQUE */}
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
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#00FF7F' }}>
            {bankroll.toLocaleString()} €
          </span>
        </div>
      </header>

      <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* --- ONGLET ACCUEIL --- */}
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <h3 style={{ marginTop: '0', marginBottom: '10px', color: 'white' }}>🏆 Compétitions</h3>
            <FilterBar selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} />
            <DateFilter selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
            
            <h3 style={{ marginTop: '10px', marginBottom: '10px', color: 'white' }}>🔥 Matchs</h3>
            {loading ? ( <div style={{textAlign: "center", color: "#94A3B8"}}>Chargement...</div> ) : 
             filteredMatches.length === 0 ? ( <div style={{textAlign: "center", color: "#94A3B8"}}>Aucun match.</div> ) : (
              filteredMatches.slice(0, 50).map((match) => (
                <div key={match.id} className="glass-panel" style={{ padding: '15px', borderRadius: '16px', marginBottom:'10px' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{formatTime(match.utcDate)} • {match.competition.name}</div>
                    <button onClick={() => handleAnalyze(match)} disabled={analyzingId === match.id} style={{ background: 'rgba(0, 217, 255, 0.1)', color: '#00D9FF', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                      {analyzingId === match.id ? "..." : "Analyser IA"}
                    </button>
                  </div>
                  {analyses[match.id] && expandedMatches[match.id] && (
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '10px', marginTop: '10px', borderLeft: '3px solid #00FF7F', fontSize: '0.85rem', color: '#E2E8F0' }}>
                      {analyses[match.id]}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* --- ONGLET VIP (GÉNÉRATEUR) --- */}
        {activeTab === 'vip' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
            <div style={{ background: 'linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)', borderRadius: '20px', padding: '30px', color: 'white' }}>
              <Brain size={48} color="white" style={{ marginBottom: '15px' }} />
              <h2 style={{ margin: '0 0 10px 0' }}>Générateur IA</h2>
              <button onClick={generateTicket} disabled={loadingTicket} style={{ background: 'white', color: '#0066FF', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '900', fontSize: '1rem', cursor: 'pointer' }}>
                {loadingTicket ? "Calcul..." : "GÉNÉRER TICKET 🚀"}
              </button>
            </div>

            {ticketResult && ticketResult.matches && (
              <div style={{ background: 'white', color: '#1e293b', borderRadius: '6px', padding: '20px', position: 'relative', fontFamily: 'monospace', textAlign:'left' }}>
                <div style={{ borderBottom: '2px dashed #cbd5e1', paddingBottom: '15px', marginBottom: '15px', display:'flex', alignItems:'center', gap:'10px' }}>
                  <Ticket size={24} /> <span style={{fontWeight:'bold'}}>TICKET PROPOSÉ</span>
                </div>
                {ticketResult.matches.map((m, idx) => (
                  <div key={idx} style={{ marginBottom:'10px' }}>
                    <div style={{ fontWeight:'bold', fontSize:'0.9rem' }}>{m.match}</div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ color:'#0066FF' }}>👉 {m.selection}</span>
                      <span style={{ fontWeight:'bold' }}>{m.odds}</span>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '15px', marginTop: '15px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:'bold' }}>TOTAL</span>
                  <span style={{ fontWeight:'900', fontSize:'1.5rem', color:'#00D9FF' }}>{ticketResult.total_odds}</span>
                </div>
                {/* BOUTON ACTIF */}
                <button onClick={handlePlaceBet} style={{ width:'100%', background:'#00D9FF', color:'#fff', border:'none', padding:'12px', marginTop:'20px', borderRadius:'4px', fontWeight:'bold', cursor:'pointer' }}>
                  PLACER CE PARI (50 €) 💸
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- ONGLET PROFIL (NOUVEAU) --- */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display:'flex', alignItems:'center', gap:'15px' }}>
              <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:'#334155', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Trophy size={30} color="#FFD700" />
              </div>
              <div>
                <h2 style={{ margin:0, fontSize:'1.2rem' }}>Mon Profil</h2>
                <div style={{ color:'#94A3B8', fontSize:'0.9rem' }}>Parieur Amateur</div>
              </div>
            </div>

            <h3 style={{ margin:'10px 0 0 0', display:'flex', alignItems:'center', gap:'10px' }}>
              <History size={20} /> Historique des paris
            </h3>

            {myBets.length === 0 ? (
              <div style={{ textAlign:'center', color:'#94A3B8', padding:'40px', border:'1px dashed #334155', borderRadius:'16px' }}>
                Aucun pari en cours.<br/>Va dans l'onglet VIP !
              </div>
            ) : (
              myBets.map((bet) => (
                <div key={bet.id} className="glass-panel" style={{ padding: '15px', borderRadius: '16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                    <span style={{ fontSize:'0.8rem', color:'#94A3B8' }}>{new Date(bet.date).toLocaleString()}</span>
                    <span style={{ background:'rgba(255, 165, 0, 0.2)', color:'orange', padding:'2px 8px', borderRadius:'4px', fontSize:'0.75rem', fontWeight:'bold' }}>{bet.status}</span>
                  </div>
                  {bet.matches.map((m, i) => (
                    <div key={i} style={{ fontSize:'0.9rem', marginBottom:'4px' }}>
                      {m.selection} <span style={{ opacity:0.6 }}>({m.odds})</span>
                    </div>
                  ))}
                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', marginTop:'10px', paddingTop:'10px', display:'flex', justifyContent:'space-between' }}>
                    <span>Mise : {bet.stake}€</span>
                    <span style={{ color:'#00FF7F', fontWeight:'bold' }}>Gain : {bet.potentialGain}€</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'live' && <div style={{ textAlign: 'center', marginTop: '50px', color: '#94A3B8' }}>📡 Live Score (Bientôt)</div>}

      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;