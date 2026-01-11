// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import FilterBar from '../components/FilterBar';
import DateFilter from '../components/DateFilter';
import { Trophy, Wallet, LogOut, Loader2, User, Brain, TrendingUp, X, Sparkles, CheckCircle, ArrowRight, Clock, Lock, Crown } from 'lucide-react';

// --- CONFIGURATION ---
const API_KEYS = {
  FOOTBALL_DATA: import.meta.env.VITE_FOOTBALL_DATA_KEY || "",
  GROQ: import.meta.env.VITE_GROQ_KEY || ""
};

// --- LIMITES DU JEU ---
const DAILY_LIMIT = {
  NOVICE: 3,
  CONFIRMED: 10,
  LEGEND: 9999
};

export default function Dashboard() {
  const navigate = useNavigate();
  
  // --- ÉTATS ---
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const [activeTab, setActiveTab] = useState('home');
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('ALL');
  
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // Jeu
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [placingBet, setPlacingBet] = useState(false);
  const [betSuccess, setBetSuccess] = useState(false);

  // Historique & Limites
  const [myBets, setMyBets] = useState([]);
  const [loadingBets, setLoadingBets] = useState(false);
  const [checkingResults, setCheckingResults] = useState(false);
  const [betsToday, setBetsToday] = useState(0); // Compteur du jour

  // 1. CHARGEMENT DU PROFIL
  useEffect(() => {
    getProfile();
  }, [navigate]);

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);
    setLoadingProfile(false);
  }

  // 2. CHARGEMENT DES MATCHS
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const today = new Date();
        const dateFrom = today.toISOString().split('T')[0];
        const future = new Date();
        future.setDate(today.getDate() + 3);
        const dateTo = future.toISOString().split('T')[0];

        const proxyUrl = "https://corsproxy.io/?";
        const targetUrl = `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        
        const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
          headers: { "X-Auth-Token": API_KEYS.FOOTBALL_DATA }
        });
        
        const data = await response.json();
        if (data.matches) setMatches(data.matches);
      } catch (error) {
        console.error("Erreur API Foot:", error);
      } finally {
        setLoadingMatches(false);
      }
    };
    loadMatches();
  }, []);

  // 3. CHARGEMENT HISTORIQUE & CALCUL DES LIMITES
  useEffect(() => {
    fetchMyBetsAndCheck();
  }, [activeTab]); // On recharge à chaque changement d'onglet pour être sûr

  const fetchMyBetsAndCheck = async () => {
    // setLoadingBets(true); // On évite le loading intempestif ici
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: bets } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (bets) {
        setMyBets(bets);
        
        // --- CALCUL DES PARIS DU JOUR ---
        const today = new Date().toISOString().split('T')[0];
        const todaysBets = bets.filter(b => b.created_at.startsWith(today));
        setBetsToday(todaysBets.length);

        // Vérification des résultats (seulement si on est sur le profil)
        if (activeTab === 'profile') checkResults(bets);
      }
    }
    setLoadingBets(false);
  };

  const checkResults = async (bets) => {
    const pendingBets = bets.filter(b => b.status === 'pending');
    if (pendingBets.length === 0) return;

    setCheckingResults(true);
    const proxyUrl = "https://corsproxy.io/?";

    for (const bet of pendingBets) {
      try {
        const targetUrl = `https://api.football-data.org/v4/matches/${bet.match_id}`;
        const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
            headers: { "X-Auth-Token": API_KEYS.FOOTBALL_DATA }
        });
        const data = await response.json();

        if (data.status === 'FINISHED') {
            const winnerCode = data.score.winner;
            let won = false;

            if (winnerCode === 'HOME_TEAM' && bet.bet_choice === bet.match_info.home) won = true;
            else if (winnerCode === 'AWAY_TEAM' && bet.bet_choice === bet.match_info.away) won = true;
            else if (winnerCode === 'DRAW' && (bet.bet_choice.toLowerCase().includes('nul') || bet.bet_choice.toLowerCase().includes('draw'))) won = true;

            const payout = won ? (bet.bet_amount * 2) : 0;
            const newStatus = won ? 'won' : 'lost';

            await supabase.rpc('resolve_bet', {
                bet_id: bet.id,
                new_status: newStatus,
                payout: payout
            });
        }
      } catch (error) {
        console.error("Erreur vérification match:", error);
      }
    }
    
    setCheckingResults(false);
    getProfile(); 
    // Rechargement discret des paris
    const { data: updatedBets } = await supabase.from('bets').select('*').order('created_at', { ascending: false });
    if(updatedBets) setMyBets(updatedBets);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // --- IA & PARI ---
  const handleAnalyzeMatch = async () => { 
    if (!selectedMatch) return;
    setLoadingAI(true);
    setAiPrediction(null);
    setBetSuccess(false);

    try {
      const prompt = `Tu es un expert. Analyse : ${selectedMatch.homeTeam.shortName} vs ${selectedMatch.awayTeam.shortName}. Réponds UNIQUEMENT JSON strict: {"winner": "Nom exact équipe gagnante", "score": "Score", "confidence": "%", "reason": "Phrase courte"}`;
      
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Authorization": `Bearer ${API_KEYS.GROQ}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], temperature: 0.7 })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      const jsonString = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
      setAiPrediction(JSON.parse(jsonString));
    } catch (error) { console.error(error); alert("Erreur IA"); } finally { setLoadingAI(false); }
  };

  const handlePlaceBet = async () => { 
    if (!aiPrediction || !profile) return;
    
    // --- NOUVEAU : VÉRIFICATION LIMITE ---
    const userTier = profile.tier.toUpperCase(); // 'NOVICE' ou 'CONFIRMED'
    const limit = DAILY_LIMIT[userTier] || 3;
    
    if (betsToday >= limit) {
        alert("Limite atteinte pour aujourd'hui ! Passez VIP pour continuer.");
        return;
    }

    setPlacingBet(true);
    try {
      const { data, error } = await supabase.rpc('place_bet', {
        match_id: selectedMatch.id.toString(),
        match_info: { home: selectedMatch.homeTeam.shortName, away: selectedMatch.awayTeam.shortName, competition: selectedMatch.competition.name },
        bet_choice: aiPrediction.winner,
        amount: betAmount
      });
      if (error) throw error;
      setProfile({ ...profile, bankroll: data.new_balance });
      setBetSuccess(true);
      setBetsToday(betsToday + 1); // On incrémente le compteur localement
      setTimeout(() => { setSelectedMatch(null); setBetSuccess(false); }, 2500);
    } catch (error) { alert("Erreur pari"); } finally { setPlacingBet(false); }
  };

  const renderScore = (match) => { 
    const status = match.status;
    if (['IN_PLAY', 'PAUSED', 'FINISHED', 'HALFTIME'].includes(status)) {
      return (<div style={{ display: 'flex', gap: '10px', fontWeight: 'bold', fontSize: '1.2rem', color: '#00FF7F' }}><span>{match.score.fullTime.home ?? 0}</span><span>-</span><span>{match.score.fullTime.away ?? 0}</span></div>);
    }
    return <div style={{ color: '#00D9FF', fontWeight: 'bold', fontSize: '0.9rem' }}>{new Date(match.utcDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>;
  };

  // --- RENDU ---
  const renderContent = () => {
    if (activeTab === 'home') {
      const filteredMatches = matches.filter(m => selectedLeague === 'ALL' || m.competition.code === selectedLeague);
      
      // Calcul progression limite
      const userTier = profile?.tier.toUpperCase() || 'NOVICE';
      const limit = DAILY_LIMIT[userTier] || 3;
      const progress = Math.min((betsToday / limit) * 100, 100);

      return (
        <div style={{ padding: '20px' }}>
          
          {/* BARRE DE PROGRESSION QUOTIDIENNE */}
          <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: '#94A3B8' }}>
                <span>Paris du jour ({userTier})</span>
                <span style={{ color: betsToday >= limit ? '#EF4444' : 'white' }}>{betsToday} / {limit}</span>
             </div>
             <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: betsToday >= limit ? '#EF4444' : '#00D9FF', transition: 'width 0.5s' }}></div>
             </div>
             {betsToday >= limit && <div style={{ fontSize:'0.75rem', color:'#EF4444', marginTop:'8px', display:'flex', alignItems:'center', gap:'5px' }}><Lock size={12}/> Limite atteinte. Revenez demain.</div>}
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '25px', display: 'flex', justifyContent: 'space-around' }}>
             <div style={{ textAlign: 'center' }}><div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Niveau</div><div style={{ color: '#FFD700', fontWeight: 'bold', textTransform: 'uppercase' }}>{profile?.tier}</div></div>
             <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
             <div style={{ textAlign: 'center' }}><div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Solde</div><div style={{ color: '#00D9FF', fontWeight: 'bold' }}>{profile?.bankroll} €</div></div>
          </div>
          <FilterBar selectedLeague={selectedLeague} onSelectLeague={setSelectedLeague} />
          <DateFilter selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          <h3 style={{ color: 'white', marginTop: '20px', marginBottom: '15px' }}>Matchs à l'affiche</h3>
          {loadingMatches ? <div style={{textAlign:'center', color:'#94A3B8'}}>Chargement...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredMatches.slice(0, 10).map(match => (
                <div key={match.id} onClick={() => { setSelectedMatch(match); setAiPrediction(null); setBetSuccess(false); }} className="glass-panel" style={{ padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}><img src={match.homeTeam.crest} style={{ width: '24px' }} alt="" /><span style={{ color: 'white', fontSize: '0.9rem' }}>{match.homeTeam.shortName}</span></div>
                  <div style={{ flex: '0 0 80px', textAlign: 'center' }}>{renderScore(match)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end' }}><span style={{ color: 'white', fontSize: '0.9rem' }}>{match.awayTeam.shortName}</span><img src={match.awayTeam.crest} style={{ width: '24px' }} alt="" /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (activeTab === 'live' || activeTab === 'vip') return <div style={{padding:'20px', textAlign:'center', color:'white', marginTop:'50px'}}>Zone {activeTab.toUpperCase()} (Bientôt)</div>;

    // --- PROFIL ---
    if (activeTab === 'profile') return (
        <div style={{ padding: '20px' }}>
            <h2 style={{color:'white', marginBottom:'20px'}}>Profil</h2>
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px', marginBottom: '30px', textAlign:'center' }}>
               <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', border: '2px solid #00D9FF' }}><User size={40} color="white" /></div>
               <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>{profile?.username}</div>
               <div style={{ color: '#00D9FF', fontSize: '2.5rem', fontWeight: '900', margin: '10px 0' }}>{profile?.bankroll} €</div>
               <div style={{ color: '#FFD700', textTransform: 'uppercase', fontSize: '0.8rem' }}>{profile?.tier} MEMBER</div>
            </div>

            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
               <h3 style={{color:'white', margin:0}}>Historique</h3>
               {checkingResults && <div style={{color:'#00D9FF', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'5px'}}><Loader2 size={14} className="animate-spin"/> Vérification...</div>}
            </div>
            
            {loadingBets ? <div style={{color:'#94A3B8', textAlign:'center'}}>Chargement...</div> : myBets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myBets.map(bet => (
                  <div key={bet.id} className="glass-panel" style={{ padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: bet.status === 'won' ? '4px solid #00FF7F' : (bet.status === 'lost' ? '4px solid #EF4444' : '4px solid #FACC15') }}>
                    <div>
                      <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>{bet.match_info.home} vs {bet.match_info.away}</div>
                      <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Misé : <span style={{ color: bet.status==='won'?'#00FF7F':(bet.status==='lost'?'#EF4444':'#00D9FF') }}>{bet.bet_choice}</span></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'white', fontWeight: 'bold' }}>{bet.bet_amount} €</div>
                      <div style={{ fontSize: '0.7rem', color: bet.status === 'pending' ? '#FACC15' : (bet.status === 'won' ? '#00FF7F' : '#EF4444'), display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        {bet.status === 'pending' && 'EN COURS'}
                        {bet.status === 'won' && <span>GAIN: +{bet.bet_amount * 2}€</span>}
                        {bet.status === 'lost' && 'PERDU'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={{ textAlign: 'center', color: '#64748B', padding: '20px' }}>Aucun pari.</div>}
            <button onClick={handleLogout} style={{ width: '100%', padding:'15px', background:'rgba(239, 68, 68, 0.2)', border:'1px solid rgba(239, 68, 68, 0.5)', color:'#EF4444', borderRadius:'12px', marginTop:'40px', cursor:'pointer', fontWeight: 'bold' }}>Se déconnecter</button>
        </div>
    );
  };
  
  // LOGIQUE DE BLOCAGE BOUTON
  const isLimitReached = (betsToday || 0) >= (DAILY_LIMIT[profile?.tier?.toUpperCase()] || 3);

  if (loadingProfile) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'white'}}>Chargement...</div>;
  
  return (
    <div style={{ paddingBottom: '100px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'rgba(20, 20, 30, 0.9)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><TrendingUp color="#00D9FF" /><span style={{ fontWeight: '900', color: 'white', fontSize: '1.1rem' }}>PASSION VIP</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 217, 255, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(0, 217, 255, 0.3)' }}><Wallet size={14} color="#00D9FF" /><span style={{ color: '#00D9FF', fontWeight: 'bold', fontSize: '0.85rem' }}>{profile?.bankroll} €</span></div>
      </header>
      {renderContent()}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      {selectedMatch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedMatch(null)}>
          <div onClick={(e) => e.stopPropagation()} className="glass-panel" style={{ width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '25px', border: '1px solid rgba(0, 217, 255, 0.3)', position: 'relative', boxShadow: '0 0 50px rgba(0, 217, 255, 0.2)', background: '#0F172A' }}>
            <button onClick={() => setSelectedMatch(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={24} /></button>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}><div style={{ color: '#00D9FF', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedMatch.competition.name}</div><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '15px' }}><img src={selectedMatch.homeTeam.crest} style={{ width: '50px' }} alt="" /><div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>VS</div><img src={selectedMatch.awayTeam.crest} style={{ width: '50px' }} alt="" /></div></div>
            {aiPrediction ? (
              <div style={{ animation: 'fadeIn 0.5s' }}>
                <div style={{ background: 'rgba(0, 255, 127, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid #00FF7F', marginBottom: '20px' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}><span style={{ color: '#94A3B8' }}>Conseil IA :</span><span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>{aiPrediction.winner}</span></div><div style={{ fontSize: '0.9rem', color: '#CBD5E1', fontStyle: 'italic' }}>" {aiPrediction.reason} "</div></div>
                {!betSuccess ? (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#94A3B8', fontSize: '0.9rem' }}><span>Mise (€)</span><span>Potentiel: ~{(betAmount * 1.8).toFixed(2)}€</span></div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>{[10, 20, 50, 100].map(amt => (<button key={amt} onClick={() => setBetAmount(amt)} disabled={isLimitReached} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #334155', background: betAmount === amt ? '#00D9FF' : 'rgba(255,255,255,0.05)', color: betAmount === amt ? 'black' : 'white', fontWeight: 'bold', cursor: isLimitReached ? 'not-allowed' : 'pointer', opacity: isLimitReached ? 0.3 : 1 }}>{amt}€</button>))}</div>
                    {isLimitReached ? (
                       <button style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#EF4444', color: 'white', fontWeight: '900', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'not-allowed' }}><Lock size={22} /> LIMITE ATTEINTE</button>
                    ) : (
                       <button onClick={handlePlaceBet} disabled={placingBet} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #00FF7F 0%, #00CC66 100%)', color: '#003319', fontWeight: '900', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: placingBet ? 'not-allowed' : 'pointer', opacity: placingBet ? 0.7 : 1 }}>{placingBet ? <Loader2 className="animate-spin"/> : <ArrowRight size={22} />}{placingBet ? 'VALIDATION...' : `PARIER ${betAmount} €`}</button>
                    )}
                  </div>
                ) : (<div style={{ background: '#00FF7F', padding: '20px', borderRadius: '16px', color: '#003319', textAlign: 'center', fontWeight: 'bold' }}><CheckCircle size={40} style={{ margin: '0 auto 10px auto' }} />PARI VALIDÉ !<br/>Bonne chance 🍀</div>)}
              </div>
            ) : (<div style={{ marginBottom: '20px' }}>{loadingAI ? <div style={{ textAlign: 'center', color: '#00D9FF', padding: '20px' }}><Loader2 size={40} className="animate-spin" style={{ margin: '0 auto' }} /><p style={{ marginTop: '10px' }}>Analyse tactique en cours...</p></div> : <button onClick={handleAnalyzeMatch} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)', color: 'white', fontWeight: '900', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0, 102, 255, 0.4)' }}><Sparkles size={22} />LANCER L'ANALYSE & PARIER</button>}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}