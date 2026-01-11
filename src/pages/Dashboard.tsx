// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import FilterBar from '../components/FilterBar';
import DateFilter from '../components/DateFilter';
import { Trophy, Wallet, LogOut, Loader2, User, Brain, TrendingUp, X, Sparkles, CheckCircle, ArrowRight, Clock, Lock, Crown, Star } from 'lucide-react';

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
  const [betsToday, setBetsToday] = useState(0);

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
        future.setDate(today.getDate() + 5); // On charge 5 jours pour avoir de la marge
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
  }, [activeTab]);

  const fetchMyBetsAndCheck = async () => {
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

        // Vérification des résultats (seulement sur profil)
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
    // Rechargement des paris
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
    
    // --- VÉRIFICATION LIMITE ---
    const userTier = profile.tier.toUpperCase();
    const limit = DAILY_LIMIT[userTier] || 3;
    
    if (betsToday >= limit) {
        alert("🔒 Limite atteinte. Passez VIP pour parier plus !");
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
      setBetsToday(betsToday + 1);
      setTimeout(() => { setSelectedMatch(null); setBetSuccess(false); }, 2500);
    } catch (error) { alert("Erreur: " + error.message); } finally { setPlacingBet(false); }
  };

  const renderScore = (match) => { 
    const status = match.status;
    if (['IN_PLAY', 'PAUSED', 'FINISHED', 'HALFTIME'].includes(status)) {
      return (<div style={{ display: 'flex', gap: '10px', fontWeight: 'bold', fontSize: '1.2rem', color: '#00FF7F' }}><span>{match.score.fullTime.home ?? 0}</span><span>-</span><span>{match.score.fullTime.away ?? 0}</span></div>);
    }
    return <div style={{ color: '#00D9FF', fontWeight: 'bold', fontSize: '0.9rem' }}>{new Date(match.utcDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>;
  };

  // --- LOGIQUE DE FILTRAGE AMÉLIORÉE ---
  const getFilteredMatches = () => {
    return matches.filter(m => {
        // 1. Filtre Ligue
        const leagueMatch = selectedLeague === 'ALL' || m.competition.code === selectedLeague;
        
        // 2. Filtre Date
        let dateMatch = true;
        if (selectedDate !== 'ALL') {
            // L'API renvoie "2024-01-11T20:00:00Z", on prend juste "2024-01-11"
            dateMatch = m.utcDate.startsWith(selectedDate);
        }
        
        return leagueMatch && dateMatch;
    });
  };

  // --- RENDU CONTENU ---
  const renderContent = () => {
    // 🏠 ACCUEIL
    if (activeTab === 'home') {
      const filteredMatches = getFilteredMatches();
      const userTier = profile?.tier.toUpperCase() || 'NOVICE';
      const limit = DAILY_LIMIT[userTier] || 3;
      const progress = Math.min((betsToday / limit) * 100, 100);

      return (
        <div style={{ padding: '20px' }}>
          
          {/* BARRE DE PROGRESSION */}
          <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: '#94A3B8' }}>
                <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                    {userTier === 'CONFIRMED' ? <Crown size={14} color="#FFD700"/> : <User size={14}/>}
                    Status: <span style={{color: userTier === 'CONFIRMED' ? '#FFD700' : 'white', fontWeight:'bold'}}>{userTier}</span>
                </span>
                <span style={{ color: betsToday >= limit ? '#EF4444' : 'white' }}>{betsToday} / {limit} Paris</span>
             </div>
             <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: betsToday >= limit ? '#EF4444' : 'linear-gradient(90deg, #00D9FF, #0066FF)', transition: 'width 0.5s' }}></div>
             </div>
             {betsToday >= limit && <div style={{ fontSize:'0.75rem', color:'#EF4444', marginTop:'8px', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold' }}><Lock size={12}/> Limite atteinte. Upgradez pour continuer !</div>}
          </div>

          <FilterBar selectedLeague={selectedLeague} onSelectLeague={setSelectedLeague} />
          <DateFilter selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          
          <h3 style={{ color: 'white', marginTop: '20px', marginBottom: '15px' }}>Matchs disponibles</h3>
          {loadingMatches ? <div style={{textAlign:'center', color:'#94A3B8'}}><Loader2 className="animate-spin"/> Chargement...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredMatches.length > 0 ? filteredMatches.map(match => (
                <div key={match.id} onClick={() => { setSelectedMatch(match); setAiPrediction(null); setBetSuccess(false); }} className="glass-panel" style={{ padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.1s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}><img src={match.homeTeam.crest} style={{ width: '24px' }} alt="" /><span style={{ color: 'white', fontSize: '0.9rem' }}>{match.homeTeam.shortName}</span></div>
                  <div style={{ flex: '0 0 80px', textAlign: 'center' }}>{renderScore(match)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end' }}><span style={{ color: 'white', fontSize: '0.9rem' }}>{match.awayTeam.shortName}</span><img src={match.awayTeam.crest} style={{ width: '24px' }} alt="" /></div>
                </div>
              )) : <div style={{textAlign:'center', color:'#64748B'}}>Aucun match pour cette date.</div>}
            </div>
          )}
        </div>
      );
    }

    // 💎 VIP (NOUVEAU : ACTIVÉ)
    if (activeTab === 'vip') {
        const isVip = profile?.tier === 'confirmed' || profile?.tier === 'legend';
        
        // On simule des matchs "Sûrs" en prenant les grosses équipes
        const vipMatches = matches.filter(m => 
            ['MCI', 'RMA', 'BAR', 'PSG', 'BAY', 'INT', 'LIV', 'ARS'].includes(m.homeTeam.tla) || 
            ['MCI', 'RMA', 'BAR', 'PSG', 'BAY', 'INT', 'LIV', 'ARS'].includes(m.awayTeam.tla)
        ).slice(0, 5);

        return (
            <div style={{ padding: '20px' }}>
                <div style={{textAlign:'center', marginBottom:'30px'}}>
                    <Crown size={50} color="#FFD700" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))' }} />
                    <h2 style={{color:'white', margin:'10px 0'}}>Zone Elite</h2>
                    <p style={{color:'#94A3B8', fontSize:'0.9rem'}}>Pronostics haute confiance (+75%)</p>
                </div>

                {!isVip ? (
                    // 🔒 ÉCRAN DE BLOCAGE POUR NOVICES
                    <div className="glass-panel" style={{ padding: '30px', borderRadius: '20px', textAlign: 'center', border: '1px solid #334155', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ filter: 'blur(5px)', opacity: 0.3, pointerEvents: 'none' }}>
                            <div style={{marginBottom:'15px', background:'#1E293B', height:'60px', borderRadius:'10px'}}></div>
                            <div style={{marginBottom:'15px', background:'#1E293B', height:'60px', borderRadius:'10px'}}></div>
                            <div style={{marginBottom:'15px', background:'#1E293B', height:'60px', borderRadius:'10px'}}></div>
                        </div>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%' }}>
                            <Lock size={40} color="#EF4444" style={{ marginBottom: '15px' }} />
                            <h3 style={{ color: 'white', marginBottom: '10px' }}>Réservé aux VIP</h3>
                            <button onClick={() => window.location.href = 'https://buy.stripe.com/test_8x2aER5tv71EfM208NgIo00'} style={{ background: '#00D9FF', border: 'none', padding: '12px 24px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', color: '#0F172A' }}>
                                Débloquer pour 9.99€
                            </button>
                        </div>
                    </div>
                ) : (
                    // ✅ LISTE DES MATCHS VIP
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {vipMatches.length > 0 ? vipMatches.map(match => (
                            <div key={match.id} onClick={() => { setSelectedMatch(match); setAiPrediction(null); setBetSuccess(false); }} className="glass-panel" style={{ padding: '15px', borderRadius: '12px', border: '1px solid #FFD700', background: 'rgba(255, 215, 0, 0.05)', cursor:'pointer' }}>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                                    <div style={{background:'#FFD700', color:'black', fontSize:'0.7rem', padding:'2px 8px', borderRadius:'10px', fontWeight:'bold'}}>SUREBET 🔥</div>
                                    <div style={{color:'#FFD700', fontSize:'0.8rem', fontWeight:'bold'}}>Confiance: 85%</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><img src={match.homeTeam.crest} style={{ width: '24px' }} alt="" /><span style={{ color: 'white' }}>{match.homeTeam.shortName}</span></div>
                                    <div style={{ color: '#94A3B8' }}>vs</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: 'white' }}>{match.awayTeam.shortName}</span><img src={match.awayTeam.crest} style={{ width: '24px' }} alt="" /></div>
                                </div>
                            </div>
                        )) : <div style={{color:'#94A3B8', textAlign:'center'}}>Aucun "Surebet" détecté aujourd'hui.</div>}
                    </div>
                )}
            </div>
        );
    }

    if (activeTab === 'live') return <div style={{padding:'20px', textAlign:'center', color:'#94A3B8', marginTop:'50px'}}><Trophy size={40} style={{marginBottom:'20px'}}/><br/>Le mode Live arrive bientôt !</div>;

    // 👤 PROFIL
    if (activeTab === 'profile') return (
        <div style={{ padding: '20px' }}>
            <h2 style={{color:'white', marginBottom:'20px'}}>Mon Espace</h2>
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px', marginBottom: '30px', textAlign:'center', position:'relative', overflow:'hidden' }}>
               <div style={{position:'absolute', top:0, left:0, width:'100%', height:'5px', background: profile?.tier === 'confirmed' ? '#FFD700' : '#334155'}}></div>
               <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', border: `2px solid ${profile?.tier === 'confirmed' ? '#FFD700' : '#00D9FF'}` }}>
                   {profile?.tier === 'confirmed' ? <Crown size={40} color="#FFD700" /> : <User size={40} color="#00D9FF" />}
               </div>
               <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>{profile?.username}</div>
               <div style={{ color: profile?.tier === 'confirmed' ? '#FFD700' : '#94A3B8', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight:'bold', marginTop:'5px' }}>{profile?.tier === 'confirmed' ? '👑 MEMBRE VIP' : 'MEMBRE NOVICE'}</div>
               <div style={{ color: '#00D9FF', fontSize: '2.5rem', fontWeight: '900', margin: '15px 0' }}>{profile?.bankroll} €</div>
            </div>

            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
               <h3 style={{color:'white', margin:0}}>Historique</h3>
               {checkingResults && <div style={{color:'#00D9FF', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'5px'}}><Loader2 size={14} className="animate-spin"/> Matchs en cours...</div>}
            </div>
            
            {loadingBets ? <div style={{color:'#94A3B8', textAlign:'center'}}>Chargement...</div> : myBets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myBets.map(bet => (
                  <div key={bet.id} className="glass-panel" style={{ padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: bet.status === 'won' ? '4px solid #00FF7F' : (bet.status === 'lost' ? '4px solid #EF4444' : '4px solid #FACC15') }}>
                    <div>
                      <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>{bet.match_info.home} vs {bet.match_info.away}</div>
                      <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Pari : <span style={{ color: 'white' }}>{bet.bet_choice}</span></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'white', fontWeight: 'bold' }}>{bet.bet_amount} €</div>
                      <div style={{ fontSize: '0.7rem', color: bet.status === 'pending' ? '#FACC15' : (bet.status === 'won' ? '#00FF7F' : '#EF4444'), fontWeight:'bold' }}>
                        {bet.status === 'pending' && 'EN ATTENTE'}
                        {bet.status === 'won' && <span>+{bet.bet_amount * 2}€</span>}
                        {bet.status === 'lost' && 'PERDU'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={{ textAlign: 'center', color: '#64748B', padding: '20px' }}>Aucun pari pour l'instant.</div>}
            
            <button onClick={handleLogout} style={{ width: '100%', padding:'15px', background:'transparent', border:'1px solid #334155', color:'#94A3B8', borderRadius:'12px', marginTop:'40px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}><LogOut size={16}/> Se déconnecter</button>
        </div>
    );
  };
  
  // LOGIQUE DE BLOCAGE BOUTON (Global)
  const isLimitReached = (betsToday || 0) >= (DAILY_LIMIT[profile?.tier?.toUpperCase()] || 3);

  if (loadingProfile) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'white'}}><Loader2 className="animate-spin" size={40} color="#00D9FF"/></div>;
  
  return (
    <div style={{ paddingBottom: '100px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh', background:'#0F172A' }}>
      {/* HEADER FIXE */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{background: 'linear-gradient(135deg, #00D9FF, #0066FF)', padding:'5px', borderRadius:'8px'}}><TrendingUp color="white" size={20} /></div>
            <span style={{ fontWeight: '900', color: 'white', fontSize: '1.1rem', letterSpacing:'-0.5px' }}>PASSION VIP</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(30, 41, 59, 0.8)', padding: '6px 12px', borderRadius: '20px', border: '1px solid #334155' }}>
            <Wallet size={14} color="#00D9FF" />
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>{profile?.bankroll} €</span>
        </div>
      </header>

      {renderContent()}
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* MODAL DE PARI */}
      {selectedMatch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedMatch(null)}>
          <div onClick={(e) => e.stopPropagation()} className="glass-panel" style={{ width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '25px', border: '1px solid rgba(0, 217, 255, 0.3)', position: 'relative', boxShadow: '0 0 50px rgba(0, 217, 255, 0.1)', background: '#1E293B' }}>
            <button onClick={() => setSelectedMatch(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={24} /></button>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ color: '#00D9FF', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight:'bold' }}>{selectedMatch.competition.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '15px' }}>
                    <div style={{textAlign:'center'}}><img src={selectedMatch.homeTeam.crest} style={{ width: '40px', marginBottom:'5px' }} alt="" /><div style={{fontSize:'0.8rem', color:'white', maxWidth:'80px'}}>{selectedMatch.homeTeam.shortName}</div></div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#64748B' }}>VS</div>
                    <div style={{textAlign:'center'}}><img src={selectedMatch.awayTeam.crest} style={{ width: '40px', marginBottom:'5px' }} alt="" /><div style={{fontSize:'0.8rem', color:'white', maxWidth:'80px'}}>{selectedMatch.awayTeam.shortName}</div></div>
                </div>
            </div>

            {aiPrediction ? (
              <div style={{ animation: 'fadeIn 0.5s' }}>
                <div style={{ background: 'rgba(0, 255, 127, 0.05)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(0, 255, 127, 0.3)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ color: '#00FF7F', fontSize:'0.8rem', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px' }}><Brain size={14}/> L'IA CONSEILLE :</span>
                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{aiPrediction.winner}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic', lineHeight:'1.4' }}>" {aiPrediction.reason} "</div>
                </div>

                {!betSuccess ? (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#94A3B8', fontSize: '0.9rem' }}><span>Mise</span><span>Gain pot.: <span style={{color:'#00FF7F'}}>~{(betAmount * 1.8).toFixed(2)}€</span></span></div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        {[10, 20, 50, 100].map(amt => (
                            <button key={amt} onClick={() => setBetAmount(amt)} disabled={isLimitReached} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #334155', background: betAmount === amt ? '#00D9FF' : 'transparent', color: betAmount === amt ? 'black' : 'white', fontWeight: 'bold', cursor: isLimitReached ? 'not-allowed' : 'pointer', opacity: isLimitReached ? 0.3 : 1 }}>{amt}€</button>
                        ))}
                    </div>
                    {isLimitReached ? (
                       <button style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#EF4444', color: 'white', fontWeight: '900', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'not-allowed' }}><Lock size={20} /> LIMITE ATTEINTE ({DAILY_LIMIT[profile?.tier?.toUpperCase()]} max)</button>
                    ) : (
                       <button onClick={handlePlaceBet} disabled={placingBet} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #00FF7F 0%, #00CC66 100%)', color: '#003319', fontWeight: '900', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: placingBet ? 'not-allowed' : 'pointer', opacity: placingBet ? 0.7 : 1, boxShadow:'0 4px 15px rgba(0, 255, 127, 0.3)' }}>{placingBet ? <Loader2 className="animate-spin"/> : <ArrowRight size={22} />}{placingBet ? 'VALIDATION...' : `PARIER ${betAmount} €`}</button>
                    )}
                  </div>
                ) : (<div style={{ background: 'rgba(0, 255, 127, 0.1)', border:'1px solid #00FF7F', padding: '20px', borderRadius: '16px', color: 'white', textAlign: 'center', fontWeight: 'bold' }}><CheckCircle size={40} color="#00FF7F" style={{ margin: '0 auto 10px auto' }} />PARI VALIDÉ !<br/><span style={{fontSize:'0.8rem', color:'#94A3B8', fontWeight:'normal'}}>Bonne chance 🍀</span></div>)}
              </div>
            ) : (<div style={{ marginBottom: '10px' }}>{loadingAI ? <div style={{ textAlign: 'center', color: '#00D9FF', padding: '20px' }}><Loader2 size={40} className="animate-spin" style={{ margin: '0 auto' }} /><p style={{ marginTop: '10px', fontSize:'0.9rem' }}>Analyse tactique en cours...</p></div> : <button onClick={handleAnalyzeMatch} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)', color: 'white', fontWeight: '900', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0, 102, 255, 0.4)' }}><Sparkles size={20} />ANALYSER AVEC L'IA</button>}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}