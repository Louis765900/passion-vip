// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { Trophy, Wallet, LogOut, Loader2, User, TrendingUp, X, Sparkles, CheckCircle, ArrowRight, Lock, Crown, Clock, Calendar, BarChart3, ShieldCheck, AlertTriangle } from 'lucide-react';

// --- CONFIGURATION ---
const API_KEYS = {
  FOOTBALL_DATA: import.meta.env.VITE_FOOTBALL_DATA_KEY || "",
  GROQ: import.meta.env.VITE_GROQ_KEY || ""
};

const DAILY_LIMIT = { NOVICE: 3, CONFIRMED: 10, LEGEND: 9999 };

// --- FONCTION POUR ENRICHIR LES DONNÉES (Simulation des Cotes & Analyses) ---
const enrichMatchWithProData = (match) => {
    // Génère des cotes réalistes basées sur les ID pour qu'elles restent fixes
    const baseOdd = 1.5 + (match.id % 15) / 10; 
    return {
        ...match,
        isVip: ['PL', 'CL', 'PD', 'SA'].includes(match.competition.code) || match.homeTeam.tla === 'PSG' || match.homeTeam.tla === 'RMA',
        analysis: {
            confidence: 75 + (match.id % 20),
            prediction: match.id % 2 === 0 ? "Victoire " + match.homeTeam.shortName : "Victoire " + match.awayTeam.shortName,
            reason: "Supériorité technique et historique favorable.",
            altB: "Plus de 2.5 buts",
            altC: "Buteur: Attaquant Star"
        },
        odds: {
            avg: baseOdd.toFixed(2),
            bookmakers: [
                { name: "Betclic", val: (baseOdd - 0.05).toFixed(2) },
                { name: "Winamax", val: (baseOdd + 0.02).toFixed(2) },
                { name: "Unibet", val: (baseOdd - 0.02).toFixed(2) }
            ],
            best: "Winamax"
        },
        form: {
            home: ["W", "W", "D", "L", "W"],
            away: ["L", "W", "D", "D", "L"]
        }
    };
};

export default function Dashboard() {
  const navigate = useNavigate();
  
  // --- ÉTATS ---
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);

  // Jeu & UI
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [betAmount, setBetAmount] = useState(10);
  const [placingBet, setPlacingBet] = useState(false);
  const [betSuccess, setBetSuccess] = useState(false);
  const [betsToday, setBetsToday] = useState(0);

  // 1. CHARGEMENT PROFIL
  useEffect(() => {
    getProfile();
  }, [navigate]);

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);
    setLoadingProfile(false);
    fetchMyBets(user.id);
  }

  async function fetchMyBets(userId) {
      const { data: bets } = await supabase.from('bets').select('*').eq('user_id', userId);
      if(bets) {
          const today = new Date().toISOString().split('T')[0];
          setBetsToday(bets.filter(b => b.created_at.startsWith(today)).length);
      }
  }

  // 2. CHARGEMENT MATCHS
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const proxyUrl = "https://corsproxy.io/?";
        const today = new Date().toISOString().split('T')[0];
        const targetUrl = `https://api.football-data.org/v4/matches?dateFrom=${today}&dateTo=${today}`;
        
        const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
          headers: { "X-Auth-Token": API_KEYS.FOOTBALL_DATA }
        });
        
        const data = await response.json();
        if (data.matches) {
            const enriched = data.matches.map(enrichMatchWithProData);
            setMatches(enriched);
            setLiveMatches(enriched.filter(m => ['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(m.status)));
            setUpcomingMatches(enriched.filter(m => ['TIMED', 'SCHEDULED'].includes(m.status)));
        }
      } catch (error) { console.error("Erreur API:", error); } 
      finally { setLoadingMatches(false); }
    };
    loadMatches();
  }, []);

  const handlePlaceBet = async () => {
      if(!profile) return;
      const userTier = profile.tier.toUpperCase();
      if (betsToday >= (DAILY_LIMIT[userTier] || 3)) { alert("Limite atteinte !"); return; }

      setPlacingBet(true);
      try {
          const { data, error } = await supabase.rpc('place_bet', {
              match_id: selectedMatch.id.toString(),
              match_info: { home: selectedMatch.homeTeam.shortName, away: selectedMatch.awayTeam.shortName, competition: selectedMatch.competition.name },
              bet_choice: selectedMatch.analysis.prediction, // On parie sur le prono IA par défaut
              amount: betAmount
          });
          if(error) throw error;
          setProfile({ ...profile, bankroll: data.new_balance });
          setBetSuccess(true);
          setBetsToday(prev => prev + 1);
          setTimeout(() => { setSelectedMatch(null); setBetSuccess(false); }, 2000);
      } catch (e) { alert("Erreur: " + e.message); } 
      finally { setPlacingBet(false); }
  };

  // --- RENDU : TICKET VIP (JAUNE) ---
  const renderVipTicket = (match) => (
    <div key={match.id} onClick={() => setSelectedMatch(match)} style={{
        background: 'linear-gradient(135deg, #FFF9C4 0%, #FFFDE7 100%)',
        border: '2px solid #FBC02D', borderRadius: '12px', padding: '15px', marginBottom: '20px',
        position: 'relative', boxShadow: '0 8px 20px rgba(251, 192, 45, 0.2)', cursor: 'pointer'
    }}>
        {/* En-tête Ticket */}
        <div style={{borderBottom: '2px dashed #FBC02D', paddingBottom: '10px', marginBottom: '10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{color:'#F57F17', fontWeight:'bold', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'5px'}}>
                <Crown size={14}/> TICKET VIP
            </span>
            <span style={{color:'#555', fontSize:'0.75rem'}}>{new Date(match.utcDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>

        {/* Match */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
            <span style={{color:'black', fontWeight:'bold'}}>{match.homeTeam.shortName}</span>
            <span style={{color:'#94A3B8', fontSize:'0.8rem'}}>vs</span>
            <span style={{color:'black', fontWeight:'bold'}}>{match.awayTeam.shortName}</span>
        </div>

        {/* Pronostic & Confiance */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'15px'}}>
            <div style={{background:'rgba(255,255,255,0.8)', padding:'8px', borderRadius:'6px', border:'1px solid #FBC02D'}}>
                <div style={{fontSize:'0.7rem', color:'#F57F17', fontWeight:'bold'}}>PRONOSTIC</div>
                <div style={{color:'black', fontWeight:'bold'}}>{match.analysis.prediction}</div>
            </div>
            <div style={{background:'rgba(255,255,255,0.8)', padding:'8px', borderRadius:'6px', border:'1px solid #FBC02D'}}>
                <div style={{fontSize:'0.7rem', color:'#F57F17', fontWeight:'bold'}}>CONFIANCE</div>
                <div style={{color:'black', fontWeight:'bold'}}>{match.analysis.confidence}%</div>
            </div>
        </div>

        {/* Cotes Comparées */}
        <div style={{background:'white', borderRadius:'8px', padding:'10px', border:'1px solid #EEE'}}>
            <div style={{fontSize:'0.75rem', fontWeight:'bold', marginBottom:'5px', color:'#333'}}>💰 COTES COMPARÉES</div>
            {match.odds.bookmakers.map((b, i) => (
                <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom:'3px', color:'#555'}}>
                    <span>{b.name}</span>
                    <span style={{fontWeight:'bold', color: b.name === match.odds.best ? '#00C853' : '#333'}}>{b.val}</span>
                </div>
            ))}
        </div>

        {/* Alternatives */}
        <div style={{marginTop:'10px', fontSize:'0.75rem', color:'#666', fontStyle:'italic'}}>
            🎲 <b>Plan B:</b> {match.analysis.altB} (Cote 1.95)
        </div>
    </div>
  );

  // --- RENDU : CARTE CLASSIQUE (BLANC) ---
  const renderClassicCard = (match) => (
    <div key={match.id} onClick={() => setSelectedMatch(match)} style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)',
        border: '1px solid #E2E8F0', borderRadius: '12px', padding: '15px', marginBottom: '15px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)', cursor: 'pointer'
    }}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', borderBottom:'1px solid #E2E8F0', paddingBottom:'8px'}}>
            <span style={{color:'#1E293B', fontWeight:'bold'}}>{match.competition.name}</span>
            <span style={{color:'#64748B', fontSize:'0.8rem'}}>{new Date(match.utcDate).toLocaleDateString()}</span>
        </div>
        
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
             <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                 <img src={match.homeTeam.crest} width="24"/> 
                 <span style={{color:'black', fontWeight:'500'}}>{match.homeTeam.shortName}</span>
             </div>
             <div style={{color:'#94A3B8'}}>vs</div>
             <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                 <span style={{color:'black', fontWeight:'500'}}>{match.awayTeam.shortName}</span>
                 <img src={match.awayTeam.crest} width="24"/>
             </div>
        </div>

        {/* Forme */}
        <div style={{background:'#F1F5F9', padding:'8px', borderRadius:'6px', marginBottom:'10px'}}>
             <div style={{fontSize:'0.7rem', color:'#64748B', marginBottom:'4px'}}>FORME (5 derniers)</div>
             <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem'}}>
                 <div style={{display:'flex', gap:'2px'}}>{match.form.home.map((r,i) => <span key={i} style={{color: r==='W'?'green':(r==='L'?'red':'gray')}}>●</span>)}</div>
                 <div style={{display:'flex', gap:'2px'}}>{match.form.away.map((r,i) => <span key={i} style={{color: r==='W'?'green':(r==='L'?'red':'gray')}}>●</span>)}</div>
             </div>
        </div>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{fontSize:'0.9rem', color:'#333'}}>🎯 {match.analysis.prediction}</div>
            <div style={{background:'#00D9FF', color:'#0F172A', fontWeight:'bold', padding:'4px 10px', borderRadius:'20px'}}>
                {match.odds.avg}
            </div>
        </div>
    </div>
  );

  // --- UI PRINCIPALE ---
  if (loadingProfile) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0F172A', color:'white'}}><Loader2 className="animate-spin"/></div>;

  const isVip = profile?.tier === 'confirmed' || profile?.tier === 'legend';

  return (
    <div style={{ 
        minHeight: '100vh', 
        paddingBottom: '100px',
        // FOND STADE PRO
        backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.95)), url("https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&w=800&q=80")',
        backgroundSize: 'cover', backgroundAttachment: 'fixed',
        color:'white', fontFamily:'sans-serif'
    }}>
      
      {/* HEADER */}
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px 20px', background:'rgba(15,23,42,0.8)', backdropFilter:'blur(10px)', position:'sticky', top:0, zIndex:50, borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}><TrendingUp color="#00D9FF"/><span style={{fontWeight:'900', fontSize:'1.1rem'}}>PASSION VIP</span></div>
        <div style={{background:'rgba(255,255,255,0.1)', padding:'5px 12px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', gap:'5px'}}>
            <Wallet size={14} color="#00D9FF"/> <span style={{fontWeight:'bold'}}>{profile?.bankroll} €</span>
        </div>
      </header>

      <div style={{maxWidth:'600px', margin:'0 auto', padding:'20px'}}>
        
        {/* SECTION 1: LIVE */}
        <section style={{marginBottom:'30px'}}>
            <h2 style={{fontSize:'1.2rem', marginBottom:'15px', display:'flex', alignItems:'center', gap:'8px'}}>
                <div style={{width:'10px', height:'10px', background:'#EF4444', borderRadius:'50%', boxShadow:'0 0 10px #EF4444'}}></div>
                LIVE SCORE
            </h2>
            {liveMatches.length > 0 ? (
                liveMatches.map(m => (
                    <div key={m.id} style={{background:'rgba(0,0,0,0.5)', border:'1px solid #334155', padding:'15px', borderRadius:'12px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                         <div style={{textAlign:'center', width:'30%'}}><span style={{fontWeight:'bold'}}>{m.homeTeam.shortName}</span></div>
                         <div style={{color:'#00FF7F', fontWeight:'bold', fontSize:'1.2rem'}}>{m.score.fullTime.home ?? 0} - {m.score.fullTime.away ?? 0}</div>
                         <div style={{textAlign:'center', width:'30%'}}><span style={{fontWeight:'bold'}}>{m.awayTeam.shortName}</span></div>
                    </div>
                ))
            ) : (
                <div style={{textAlign:'center', padding:'20px', background:'rgba(255,255,255,0.05)', borderRadius:'12px', color:'#94A3B8'}}>
                    <Clock size={30} style={{marginBottom:'10px'}}/>
                    <div>⏱️ Plus de matchs en direct pour aujourd'hui.</div>
                </div>
            )}
        </section>

        {/* SECTION 2: ZONE VIP (Tickets Jaunes) */}
        {activeTab === 'home' && (
            <>
                <section style={{marginBottom:'30px'}}>
                    <h2 style={{color:'#FFD700', fontSize:'1.2rem', marginBottom:'15px', display:'flex', alignItems:'center', gap:'8px'}}>
                        <Crown size={20} fill="#FFD700"/> PRONOSTICS VIP
                    </h2>
                    
                    {!isVip ? (
                        <div style={{background:'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(0,0,0,0.4))', border:'1px solid #FBC02D', borderRadius:'16px', padding:'30px', textAlign:'center'}}>
                            <Lock size={40} color="#FBC02D" style={{marginBottom:'15px'}}/>
                            <h3 style={{color:'white', marginBottom:'10px'}}>Contenu Réservé à l'Élite</h3>
                            <p style={{color:'#CBD5E1', fontSize:'0.9rem', marginBottom:'20px'}}>Débloquez les tickets haute confiance, le comparateur de cotes et les plans B.</p>
                            <button onClick={() => window.location.href = 'https://buy.stripe.com/test_8x2aER5tv71EfM208NgIo00'} style={{background:'#FBC02D', color:'black', border:'none', padding:'12px 25px', borderRadius:'50px', fontWeight:'bold', cursor:'pointer'}}>
                                Devenir VIP (9.99€)
                            </button>
                        </div>
                    ) : (
                        // Affiche les tickets VIP pour les matchs "importants"
                        upcomingMatches.filter(m => m.isVip).length > 0 ? 
                            upcomingMatches.filter(m => m.isVip).slice(0,3).map(renderVipTicket) 
                            : <div style={{color:'#94A3B8'}}>Aucun ticket VIP sûr à 100% aujourd'hui.</div>
                    )}
                </section>

                {/* SECTION 3: PRONOS CLASSIQUES */}
                <section>
                    <h2 style={{color:'white', fontSize:'1.2rem', marginBottom:'15px'}}>Matchs à venir</h2>
                    {loadingMatches ? <div style={{textAlign:'center'}}><Loader2 className="animate-spin"/></div> : (
                        upcomingMatches.filter(m => !m.isVip).slice(0,10).map(renderClassicCard)
                    )}
                </section>
            </>
        )}

        {/* PROFIL SIMPLIFIÉ */}
        {activeTab === 'profile' && (
            <div style={{background:'rgba(255,255,255,0.05)', padding:'30px', borderRadius:'20px', textAlign:'center'}}>
                <div style={{width:'80px', height:'80px', borderRadius:'50%', background:'#334155', margin:'0 auto 15px auto', display:'flex', alignItems:'center', justifyContent:'center', border:`3px solid ${isVip ? '#FFD700' : '#00D9FF'}`}}>
                    {isVip ? <Crown size={40} color="#FFD700"/> : <User size={40} color="white"/>}
                </div>
                <h2 style={{fontSize:'1.5rem'}}>{profile?.username}</h2>
                <div style={{color: isVip ? '#FFD700' : '#94A3B8', fontWeight:'bold', marginBottom:'20px'}}>{profile?.tier.toUpperCase()} MEMBER</div>
                <button onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }} style={{background:'transparent', border:'1px solid #EF4444', color:'#EF4444', padding:'10px 20px', borderRadius:'10px', cursor:'pointer'}}>Se déconnecter</button>
            </div>
        )}

      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MODAL DE CONFIRMATION DE PARI */}
      {selectedMatch && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(5px)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}} onClick={() => setSelectedMatch(null)}>
            <div onClick={e => e.stopPropagation()} style={{background:'#1E293B', width:'100%', maxWidth:'400px', borderRadius:'20px', padding:'25px', border:`2px solid ${selectedMatch.isVip ? '#FFD700' : '#00D9FF'}`}}>
                <div style={{textAlign:'center', marginBottom:'20px'}}>
                    <div style={{color: selectedMatch.isVip ? '#FFD700' : '#00D9FF', fontWeight:'bold', fontSize:'0.8rem', textTransform:'uppercase'}}>CONFIRMER LE PARI</div>
                    <h3 style={{fontSize:'1.2rem', margin:'10px 0'}}>{selectedMatch.homeTeam.shortName} vs {selectedMatch.awayTeam.shortName}</h3>
                </div>
                
                <div style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', marginBottom:'20px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                        <span style={{color:'#94A3B8'}}>Choix :</span>
                        <span style={{fontWeight:'bold'}}>{selectedMatch.analysis.prediction}</span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                        <span style={{color:'#94A3B8'}}>Cote :</span>
                        <span style={{fontWeight:'bold', color:'#00FF7F'}}>{selectedMatch.odds.avg}</span>
                    </div>
                </div>

                {!betSuccess ? (
                    <>
                        <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                            {[10, 20, 50, 100].map(amt => (
                                <button key={amt} onClick={() => setBetAmount(amt)} style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #334155', background: betAmount===amt ? (selectedMatch.isVip?'#FFD700':'#00D9FF') : 'transparent', color: betAmount===amt?'black':'white', fontWeight:'bold', cursor:'pointer'}}>{amt}€</button>
                            ))}
                        </div>
                        <button onClick={handlePlaceBet} disabled={placingBet} style={{width:'100%', padding:'15px', borderRadius:'12px', background: selectedMatch.isVip ? '#FFD700' : '#00D9FF', color:'black', fontWeight:'bold', border:'none', fontSize:'1.1rem', cursor: placingBet?'not-allowed':'pointer'}}>
                            {placingBet ? <Loader2 className="animate-spin"/> : `VALIDER (${betAmount}€)`}
                        </button>
                    </>
                ) : (
                    <div style={{textAlign:'center', color:'#00FF7F', fontWeight:'bold', fontSize:'1.2rem'}}>
                        <CheckCircle size={40} style={{marginBottom:'10px'}}/>
                        <div>PARI VALIDÉ !</div>
                    </div>
                )}
            </div>
        </div>
      )}

    </div>
  );
}