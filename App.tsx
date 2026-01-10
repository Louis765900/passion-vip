import React, { useState, useEffect } from 'react';

// --- CONFIGURATION SÉCURITÉ & CLÉS ---
const API_KEYS = {
  FOOTBALL_DATA: import.meta.env.VITE_FOOTBALL_DATA_KEY || "", 
  GROQ: import.meta.env.VITE_GROQ_KEY || "",
  ODDS_API: import.meta.env.VITE_ODDS_API_KEY || ""
};

function App() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // IA & Analyse
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analyses, setAnalyses] = useState({});
  const [revealedIds, setRevealedIds] = useState({}); 

  // Ticket & Mémoire
  const [ticketResult, setTicketResult] = useState(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [ticketSaved, setTicketSaved] = useState(false);
  const [stats, setStats] = useState({ wins: 0, losses: 0, pending: 0 });
  
  // UI & Mobile
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [activeBetsList, setActiveBetsList] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 1. GESTION DU RESPONSIVE
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. CHARGEMENT DONNÉES (VERSION 3 JOURS)
  useEffect(() => {
    const loadData = async () => {
      try {
        // --- CALCUL DES DATES (Aujourd'hui -> J+3) ---
        const todayDate = new Date();
        const futureDate = new Date();
        futureDate.setDate(todayDate.getDate() + 3); // On regarde 3 jours devant
        
        const dateFrom = todayDate.toISOString().split('T')[0];
        const dateTo = futureDate.toISOString().split('T')[0];

        // On demande spécifiquement cette période
        const proxyUrl = "https://corsproxy.io/?";
        const targetUrl = `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        
        const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
          headers: { "X-Auth-Token": API_KEYS.FOOTBALL_DATA },
        });
        
        const data = await response.json();
        // On garde tout ce qui n'est pas annulé
        const validMatches = data.matches?.filter(m => m.status !== "CANCELLED") || [];
        setMatches(validMatches);
        setLoading(false);

        // --- (Le reste du code ne change pas) ---
        // Gestion Stats & Paris
        const savedStats = JSON.parse(localStorage.getItem('vip_stats') || '{"wins":0, "losses":0}');
        const activeBets = JSON.parse(localStorage.getItem('vip_active_bets') || '[]');
        setActiveBetsList(activeBets); 
        
        let newWins = 0;
        let newLosses = 0;
        let remainingBets = [];

        if (activeBets.length > 0) {
            for (let bet of activeBets) {
                try {
                    let matchData = validMatches.find(m => m.id === bet.matchId);
                    
                    if (!matchData) {
                        const detailUrl = `https://api.football-data.org/v4/matches/${bet.matchId}`;
                        const matchRes = await fetch(proxyUrl + encodeURIComponent(detailUrl), {
                             headers: { "X-Auth-Token": API_KEYS.FOOTBALL_DATA },
                        });
                        matchData = await matchRes.json();
                    }

                    if (matchData && matchData.status === "FINISHED") {
                        const scoreHome = matchData.score.fullTime.home;
                        const scoreAway = matchData.score.fullTime.away;
                        let won = false;
                        if (bet.type === "HOME_WIN" && scoreHome > scoreAway) won = true;
                        else if (bet.type === "AWAY_WIN" && scoreAway > scoreHome) won = true;
                        else if (bet.type === "DRAW" && scoreHome === scoreAway) won = true;
                        
                        if (won) newWins++; else newLosses++;
                    } else {
                        remainingBets.push(bet);
                    }
                } catch (e) { remainingBets.push(bet); }
            }

            if (newWins > 0 || newLosses > 0) {
                const updatedStats = { wins: savedStats.wins + newWins, losses: savedStats.losses + newLosses };
                setStats({...updatedStats, pending: remainingBets.length});
                localStorage.setItem('vip_stats', JSON.stringify(updatedStats));
                localStorage.setItem('vip_active_bets', JSON.stringify(remainingBets));
                setActiveBetsList(remainingBets);
            } else {
                setStats({...savedStats, pending: activeBets.length});
            }
        } else {
            setStats({...savedStats, pending: 0});
        }
      } catch (err) { console.error(err); setLoading(false); }
    };

    loadData();

    const interval = setInterval(() => {
        console.log("🔄 Actualisation des scores...");
        loadData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);
        // Gestion Stats & Paris
        const savedStats = JSON.parse(localStorage.getItem('vip_stats') || '{"wins":0, "losses":0}');
        const activeBets = JSON.parse(localStorage.getItem('vip_active_bets') || '[]');
        setActiveBetsList(activeBets); 
        
        let newWins = 0;
        let newLosses = 0;
        let remainingBets = [];

        if (activeBets.length > 0) {
            for (let bet of activeBets) {
                try {
                    let matchData = validMatches.find(m => m.id === bet.matchId);
                    
                    // Si pas trouvé dans la liste globale, on fetch le détail (aussi via Proxy)
                    if (!matchData) {
                        const detailUrl = `https://api.football-data.org/v4/matches/${bet.matchId}`;
                        const matchRes = await fetch(proxyUrl + encodeURIComponent(detailUrl), {
                             headers: { "X-Auth-Token": API_KEYS.FOOTBALL_DATA },
                        });
                        matchData = await matchRes.json();
                    }

                    if (matchData && matchData.status === "FINISHED") {
                        const scoreHome = matchData.score.fullTime.home;
                        const scoreAway = matchData.score.fullTime.away;
                        let won = false;
                        if (bet.type === "HOME_WIN" && scoreHome > scoreAway) won = true;
                        else if (bet.type === "AWAY_WIN" && scoreAway > scoreHome) won = true;
                        else if (bet.type === "DRAW" && scoreHome === scoreAway) won = true;
                        
                        if (won) newWins++; else newLosses++;
                    } else {
                        remainingBets.push(bet);
                    }
                } catch (e) { remainingBets.push(bet); }
            }

            if (newWins > 0 || newLosses > 0) {
                const updatedStats = { wins: savedStats.wins + newWins, losses: savedStats.losses + newLosses };
                setStats({...updatedStats, pending: remainingBets.length});
                localStorage.setItem('vip_stats', JSON.stringify(updatedStats));
                localStorage.setItem('vip_active_bets', JSON.stringify(remainingBets));
                setActiveBetsList(remainingBets);
            } else {
                setStats({...savedStats, pending: activeBets.length});
            }
        } else {
            setStats({...savedStats, pending: 0});
        }
      } catch (err) { console.error(err); setLoading(false); }
    };

    loadData();

    const interval = setInterval(() => {
        console.log("🔄 Actualisation des scores...");
        loadData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);


  // 3. GÉNÉRATEUR
  const generateTicket = async () => {
    setLoadingTicket(true);
    setTicketResult("⚡ Analyse tactique en cours...");
    setTicketSaved(false); 
    try {
        const upcomingMatches = matches.filter(m => m.status === "SCHEDULED" || m.status === "TIMED");
        if (upcomingMatches.length === 0) throw new Error("Aucun match à venir.");

        const matchesList = upcomingMatches.slice(0, 15).map(m => `ID:${m.id} | ${m.homeTeam.name} vs ${m.awayTeam.name}`).join("\n");
        const prompt = `Matchs: ${matchesList}. Génère 3 tickets (SAFE, MEDIUM, FUN). JSON Strict. {"display_text": "...", "bets": [{"matchId": 123, "type": "HOME_WIN"}]}`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST", headers: { "Authorization": `Bearer ${API_KEYS.GROQ}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: "API JSON Stricte." }, { role: "user", content: prompt }], temperature: 0.5, response_format: { type: "json_object" } })
        });
        const data = await response.json();
        let raw = data.choices[0]?.message?.content;
        const first = raw.indexOf('{'); const last = raw.lastIndexOf('}');
        if (first !== -1 && last !== -1) raw = raw.substring(first, last + 1);
        
        let content;
        try { content = JSON.parse(raw); } catch (e) { setTicketResult("⚠️ Erreur format IA:\n" + raw); setLoadingTicket(false); return; }

        setTicketResult(content.display_text || "Erreur d'affichage.");
        if (content.bets && Array.isArray(content.bets) && content.bets.length > 0) {
            const currentBets = JSON.parse(localStorage.getItem('vip_active_bets') || '[]');
            const newBets = [...currentBets, ...content.bets];
            localStorage.setItem('vip_active_bets', JSON.stringify(newBets));
            setActiveBetsList(newBets);
            setStats(prev => ({...prev, pending: newBets.length}));
            setTicketSaved(true);
        }
    } catch (err) { setTicketResult("❌ Erreur: " + err.message); } finally { setLoadingTicket(false); }
  };

  // 4. ANALYSE EXPERT
  const handleAnalyzeMatch = async (match) => {
    if (analyses[match.id]) return; 
    setAnalyzingId(match.id);
    try {
        const prompt = `Expert foot Canal+. Analyse: ${match.homeTeam.name} vs ${match.awayTeam.name}.
        Règles: 
        1. David vs Goliath = Prono VICTOIRE.
        2. Équilibré = Prono MOINS DE 2.5 BUTS ou NUL.
        Format: 🏆 PRONO : [Choix] \n📝 ANALYSE : [1 phrase] \n🛡️ CONFIANCE : [?/10]`;
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST", headers: { "Authorization": `Bearer ${API_KEYS.GROQ}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], temperature: 0.7 })
        });
        const data = await res.json();
        setAnalyses(prev => ({ ...prev, [match.id]: data.choices[0]?.message?.content }));
    } catch(e) {} finally { setAnalyzingId(null); }
  };

  const toggleReveal = (id) => { setRevealedIds(prev => ({ ...prev, [id]: !prev[id] })); };

  const getBetStatusLabel = (bet, match) => {
      if (!match) return "Chargement...";
      if (match.status === "SCHEDULED" || match.status === "TIMED") return "📅 À venir";
      const h = match.score.fullTime.home ?? 0; const a = match.score.fullTime.away ?? 0;
      if (match.status === "FINISHED") {
          let w = false;
          if ((bet.type === "HOME_WIN" && h > a) || (bet.type === "AWAY_WIN" && a > h) || (bet.type === "DRAW" && h === a)) w = true;
          return w ? "✅ GAGNÉ" : "❌ PERDU";
      }
      if (bet.type === "HOME_WIN") return h > a ? <span style={{color:"#2ea043"}}>🟢 Gagne</span> : <span style={{color:"#da3633"}}>🔴 Perd</span>;
      if (bet.type === "AWAY_WIN") return a > h ? <span style={{color:"#2ea043"}}>🟢 Gagne</span> : <span style={{color:"#da3633"}}>🔴 Perd</span>;
      return <span style={{color:"#fff"}}>En cours</span>;
  };

  const styles = {
    container: { backgroundImage: "url('https://images.unsplash.com/photo-1629255869408-725d2e7b57b1?q=80&w=2070&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
    overlay: { backgroundColor: "rgba(9, 11, 16, 0.90)", minHeight: "100vh", paddingBottom: "50px", color: "#e0e0e0" },
    statsBar: { backgroundColor: "rgba(0, 0, 0, 0.9)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", backdropFilter: "blur(10px)", padding: isMobile ? "10px" : "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", fontSize: isMobile ? "0.75rem" : "0.9rem", position: "sticky", top: 0, zIndex: 100 },
    logoText: { fontSize: isMobile ? "1.5rem" : "2rem", fontWeight: "900", letterSpacing: "-2px", color: "#fff", textShadow: "0 0 20px rgba(0, 224, 255, 0.5)" },
    accent: { color: "#00E0FF" }, 
    grid: { display: "flex", flexDirection: "column", gap: "15px", maxWidth: "900px", margin: "0 auto", padding: isMobile ? "0 10px" : "0 20px" },
    ticketSection: { backgroundColor: "rgba(22, 27, 34, 0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "16px", padding: isMobile ? "20px" : "30px", margin: "0 auto 30px auto", maxWidth: "800px", textAlign: "center", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)" },
    card: { padding: "15px 20px", display: "grid", gridTemplateColumns: isMobile ? "1fr 3fr" : "0.8fr 3.5fr 1fr", alignItems: "center", gap: "10px" },
    teamName: { fontWeight: "700", fontSize: isMobile ? "0.85rem" : "0.95rem", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    scores: { fontWeight: "800", fontSize: "1.2rem", color:"#00E0FF", backgroundColor: "rgba(0,0,0,0.4)", padding: "8px 12px", borderRadius: "8px", minWidth: isMobile ? "60px" : "80px", textAlign: "center", whiteSpace: "nowrap" },
    btnGenerate: { background: "linear-gradient(135deg, #00E0FF 0%, #0099FF 100%)", color: "#000", border: "none", padding: "14px 28px", fontSize: "1rem", fontWeight: "900", borderRadius: "8px", cursor: "pointer", width:"100%", textTransform: "uppercase", boxShadow: "0 0 20px rgba(0, 224, 255, 0.4)" },
    btnAnalyze: { backgroundColor: "transparent", border: "1px solid #444", color: "#aaa", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold", width: "100%", marginTop: isMobile ? "10px" : "0" },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" },
    modalContent: { backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "12px", padding: "25px", width: "90%", maxWidth: "600px", maxHeight: "80vh", overflowY: "auto" },
    ticketResultBox: { marginTop: "25px", textAlign: "left", backgroundColor: "rgba(0, 0, 0, 0.6)", padding: "20px", borderRadius: "12px", borderLeft: "4px solid #00E0FF", whiteSpace: "pre-wrap", fontFamily: "'Inter', sans-serif", color: "#fff", lineHeight: "1.6", fontSize: "0.9rem" },
    cardWrapper: { backgroundColor: "rgba(30, 30, 30, 0.7)", backdropFilter: "blur(5px)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" },
    matchContent: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 5px" },
    team: { display: "flex", alignItems: "center", gap: "10px", width: "40%" },
    teamLogo: { width: "28px", height: "28px", objectFit: "contain", filter: "drop-shadow(0 0 5px rgba(0,0,0,0.5))" },
    aiBox: { padding: "20px", backgroundColor: "rgba(0, 224, 255, 0.05)", borderTop: "1px solid rgba(0,224,255,0.1)", fontSize: "0.9rem", color: "#ddd", whiteSpace: "pre-wrap", lineHeight:"1.6" },
    btnReveal: { backgroundColor: "#00E0FF", color: "#000", border: "none", padding: "10px 20px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const winRate = (stats.wins + stats.losses) > 0 ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(0) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        <div style={styles.statsBar}>
          <div style={styles.statItem}>🏆 <span style={{color:"#2ea043"}}>{stats.wins}</span></div>
          <div style={styles.statItem}>❌ <span style={{color:"#da3633"}}>{stats.losses}</span></div>
          <button style={{...styles.btnAnalyze, backgroundColor:"rgba(255, 193, 7, 0.1)", border:"1px solid #ffc107", color:"#ffc107", marginTop:0, width:"auto"}} onClick={() => setShowPendingModal(true)}>
             ⏳ {stats.pending} {isMobile ? "" : "EN COURS"}
          </button>
          <div style={styles.statItem}>{isMobile ? "WR:" : "RÉUSSITE:"} <span style={{color:"#fff"}}>{winRate}%</span></div>
        </div>

        {showPendingModal && (
            <div style={styles.modalOverlay} onClick={() => setShowPendingModal(false)}>
                <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:"20px"}}>
                        <h3 style={{margin:0, color:"#fff"}}>🎫 Paris en cours</h3>
                        <button onClick={() => setShowPendingModal(false)} style={{background:"none", border:"none", color:"#fff", cursor:"pointer", fontSize:"1.2rem"}}>✕</button>
                    </div>
                    {activeBetsList.length === 0 ? <p style={{color:"#888", textAlign:"center"}}>Aucun pari actif.</p> : activeBetsList.map((bet, idx) => {
                        const match = matches.find(m => m.id === bet.matchId);
                        return (
                            <div key={idx} style={{...styles.betRow, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? "5px" : "0", padding:"10px", borderBottom:"1px solid #333"}}>
                                <div>
                                    <div style={{fontWeight:"bold", color:"#fff"}}>{match ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : `Match ${bet.matchId}`}</div>
                                    <div style={{color:"#888", fontSize:"0.8rem"}}>Pari : {bet.type}</div>
                                </div>
                                <div>{getBetStatusLabel(bet, match)}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        <header style={{...styles.statsBar, background:"transparent", borderBottom:"none", position:"relative", marginBottom:"10px", justifyContent:"center"}}>
          <div style={styles.logoText}>PASSION<span style={styles.accent}>VIP</span></div>
        </header>

        <div style={styles.grid}>
          <div style={styles.ticketSection}>
              <h2 style={{marginTop:0, color:"#fff", fontSize: isMobile ? "1.2rem" : "1.5rem", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"20px"}}>💎 Espace VIP Prédictions</h2>
              <button style={styles.btnGenerate} onClick={generateTicket} disabled={loadingTicket}>
                  {loadingTicket ? "⚡ Analyse IA..." : "🚀 GÉNÉRER TICKETS"}
              </button>
              {ticketResult && (
                  <div style={styles.ticketResultBox}>
                      {ticketResult}
                      {ticketSaved && <div style={{marginTop:"20px", color:"#2ea043", fontWeight:"bold", fontSize:"0.8rem", textAlign:"center", borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:"15px"}}>✅ ENREGISTRÉ (Auto-Refresh activé)</div>}
                  </div>
              )}
          </div>

          <div style={{color:"#888", marginBottom:"15px", fontWeight:"bold", textTransform:"uppercase", letterSpacing:"1px", fontSize:"0.8rem", textAlign: isMobile ? "center" : "left"}}>
             📅 Matchs & Pronostics ({matches.length})
          </div>

          {!loading && matches.map((match) => (
            <div key={match.id} style={styles.cardWrapper}>
              <div style={styles.card}>
                <div style={{fontSize: "0.75rem", color: "#aaa", textTransform:"uppercase", gridColumn: isMobile ? "1 / span 2" : "auto"}}>
                  <span style={{color:"#fff", fontWeight:"bold"}}>{match.competition.name}</span>
                  <br/>{match.status === "IN_PLAY" || match.status === "PAUSED" ? <span style={{color:"#ff4b4b", fontWeight:"900"}}>LIVE {match.minute}'</span> : formatTime(match.utcDate)}
                </div>
                <div style={{...styles.matchContent, gridColumn: isMobile ? "1 / span 2" : "auto"}}>
                  <div style={{...styles.team, justifyContent: "flex-end", textAlign:"right"}}>
                    {!isMobile && <span style={styles.teamName}>{match.homeTeam.name}</span>}
                    {isMobile && <span style={{...styles.teamName, fontSize:"0.8rem"}}>{match.homeTeam.tla || match.homeTeam.name.substring(0,3)}</span>}
                    <img src={match.homeTeam.crest} alt="" style={styles.teamLogo} />
                  </div>
                  <div style={styles.scores}>
                    {match.status === "SCHEDULED" ? <span style={{color:"#666", fontSize:"1rem"}}>-</span> : `${match.score.fullTime.home ?? 0} - ${match.score.fullTime.away ?? 0}`}
                  </div>
                  <div style={{...styles.team, justifyContent: "flex-start"}}>
                    <img src={match.awayTeam.crest} alt="" style={styles.teamLogo} />
                    {!isMobile && <span style={styles.teamName}>{match.awayTeam.name}</span>}
                    {isMobile && <span style={{...styles.teamName, fontSize:"0.8rem"}}>{match.awayTeam.tla || match.awayTeam.name.substring(0,3)}</span>}
                  </div>
                </div>
                <div style={{gridColumn: isMobile ? "1 / span 2" : "auto"}}>
                    <button onClick={() => handleAnalyzeMatch(match)} style={styles.btnAnalyze}>
                        {analyses[match.id] ? (revealedIds[match.id] ? "Fermer" : "VOIR") : "Analyse"}
                    </button>
                </div>
              </div>
              {analyses[match.id] && (
                <div style={styles.aiBox}>
                    {!revealedIds[match.id] ? (
                        <button onClick={() => toggleReveal(match.id)} style={styles.btnReveal}>👁️ DÉVOILER</button>
                    ) : (
                        <div>{analyses[match.id]}</div>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;