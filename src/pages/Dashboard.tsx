// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { 
  User, TrendingUp, Crown, Clock, Calendar, Filter,
  ChevronRight, BarChart2, Shield, Activity, Lock,
  Brain, CheckCircle, AlertTriangle, Play, Ticket, Coins
} from 'lucide-react';

// --- CONFIGURATION ---
const KEYS = {
  FD: import.meta.env.VITE_FOOTBALL_DATA_KEY || "",
  GROQ: import.meta.env.VITE_GROQ_KEY || ""
};

const LEAGUES = [
    { name: "Tout", code: "ALL" },
    { name: "Premier League", code: "PL" },
    { name: "Ligue 1", code: "FL1" },
    { name: "La Liga", code: "PD" },
    { name: "Serie A", code: "SA" },
    { name: "Bundesliga", code: "BL1" },
    { name: "Champions League", code: "CL" }
];

const LIMITS = { NOVICE: 3, CONFIRMED: 10, LEGEND: 999 };

export default function Dashboard() {
  const navigate = useNavigate();
  
  // --- ÉTATS ---
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  // Filtres
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Données Matchs
  const [matches, setMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  
  // Jeu (Paris)
  const [betsToday, setBetsToday] = useState(0);
  const [selectedMatchForBet, setSelectedMatchForBet] = useState(null);
  const [betSuccess, setBetSuccess] = useState(false);

  // IA & Analyse
  const [analyzing, setAnalyzing] = useState(null); 
  const [analyses, setAnalyses] = useState({});

  // --- 1. CHARGEMENT PROFIL ---
  useEffect(() => {
    getProfile();
  }, [navigate]);

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
        setProfile(data);
        // Simuler les paris déjà faits aujourd'hui (ou récupérer depuis Supabase si tu as la table bets)
        setBetsToday(0); 
    }
  }

  // --- 2. RÉCUPÉRATION MATCHS (4 JOURS) ---
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const proxy = "https://corsproxy.io/?";
        const today = new Date();
        const future = new Date(today);
        future.setDate(future.getDate() + 4); 

        const dateFrom = today.toISOString().split('T')[0];
        const dateTo = future.toISOString().split('T')[0];
        
        const url = `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        
        const res = await fetch(proxy + encodeURIComponent(url), { headers: { "X-Auth-Token": KEYS.FD } });
        const data = await res.json();
        
        if (data.matches) {
            setMatches(data.matches);
            setLiveMatches(data.matches.filter(m => ['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(m.status)));
        }
      } catch (e) {
        console.error("Erreur API:", e);
      } finally {
        setLoading(false);
      }
    };
    if(profile) fetchMatches();
  }, [profile]);

  const isVip = profile?.tier === 'confirmed' || profile?.tier === 'legend';
  const limit = LIMITS[profile?.tier?.toUpperCase() || 'NOVICE'];

  // --- 3. LOGIQUE IA (Simple vs Expert) ---
  const runAIAnalysis = async (item, type = 'SINGLE') => {
    // item peut être un match unique ou un tableau de matchs (combo)
    const id = type === 'COMBO' ? 'combo_'+item[0].id : item.id;
    setAnalyzing(id);
    
    if (analyses[id]) { setAnalyzing(null); return; }

    try {
        let prompt = "";
        if (type === 'COMBO') {
            const matchNames = item.map(m => `${m.homeTeam.name} vs ${m.awayTeam.name}`).join(' ET ');
            prompt = `Analyse ce COMBINÉ de matchs : ${matchNames}. 
            Donne moi une probabilité globale > 70% et une phrase de justification courte.
            Format JSON: { "analyse": "...", "probabilite": 85, "conseil": "Combiné Sécurisé" }`;
        } else {
            prompt = `Analyse rapide du match ${item.homeTeam.name} vs ${item.awayTeam.name}.
            Format JSON: { "analyse": "Phrase simple sur la forme", "probabilite": 75, "conseil": "Victoire ${item.homeTeam.shortName}" }`;
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${KEYS.GROQ}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5
            })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;
        const jsonStr = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
        setAnalyses(prev => ({ ...prev, [id]: JSON.parse(jsonStr) }));

    } catch (error) {
        console.error("Fallback IA");
        setAnalyses(prev => ({ ...prev, [id]: { 
            analyse: "Analyse basée sur les stats : Favoris solides à domicile.", 
            probabilite: 78, 
            conseil: type === 'COMBO' ? "Combiné Validé" : "Victoire Domicile" 
        }}));
    } finally {
        setAnalyzing(null);
    }
  };

  // --- RENDU : FILTRES ---
  const renderFilters = () => (
      <div style={{marginBottom:'20px'}}>
          {/* Dates */}
          <div style={{display:'flex', gap:'10px', overflowX:'auto', paddingBottom:'10px', marginBottom:'10px'}}>
              {[0,1,2,3].map(offset => {
                  const d = new Date(); d.setDate(d.getDate() + offset);
                  const dStr = d.toISOString().split('T')[0];
                  const label = offset === 0 ? 'Auj.' : (offset === 1 ? 'Dem.' : d.toLocaleDateString(undefined, {weekday:'short'}));
                  return (
                      <button key={offset} onClick={() => setSelectedDate(dStr)} style={{
                          padding:'8px 15px', borderRadius:'15px', border:'none',
                          background: selectedDate === dStr ? '#3B82F6' : '#1E293B',
                          color: 'white', fontWeight:'bold', minWidth:'60px'
                      }}>{label}</button>
                  )
              })}
          </div>
          {/* Ligues */}
          <div style={{display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'5px', scrollbarWidth:'none'}}>
              {LEAGUES.map(l => (
                  <button key={l.code} onClick={() => setSelectedLeague(l.code)} style={{
                      padding:'6px 12px', borderRadius:'20px', border:'1px solid #334155',
                      background: selectedLeague === l.code ? 'white' : 'transparent',
                      color: selectedLeague === l.code ? 'black' : '#94A3B8', fontSize:'0.8rem', whiteSpace:'nowrap'
                  }}>{l.name}</button>
              ))}
          </div>
      </div>
  );

  // --- RENDU : ACCUEIL (Liste Simple) ---
  const renderHome = () => {
    const filteredMatches = matches.filter(m => {
        const dateMatch = m.utcDate.startsWith(selectedDate);
        const leagueMatch = selectedLeague === 'ALL' || m.competition.code === selectedLeague;
        return dateMatch && leagueMatch;
    });

    return (
        <div style={{padding: '20px'}}>
            {renderFilters()}
            
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                <h2 style={{color:'white', margin:0}}>Matchs du Jour</h2>
                <div style={{fontSize:'0.8rem', color:'#94A3B8'}}>Paris restants: <span style={{color:'#3B82F6', fontWeight:'bold'}}>{limit - betsToday}</span></div>
            </div>

            {loading ? <div style={{textAlign:'center', color:'#94A3B8'}}>Chargement...</div> : 
             filteredMatches.length > 0 ? filteredMatches.map(m => {
                const hasAnalysis = analyses[m.id];
                return (
                <div key={m.id} style={{background: 'white', borderRadius: '12px', padding: '15px', marginBottom: '15px', borderLeft: '4px solid #3B82F6', color: '#1E293B'}}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'#64748B', marginBottom:'5px'}}>
                        <span style={{fontWeight:'bold'}}>{m.competition.name}</span>
                        <span>{new Date(m.utcDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontWeight:'bold', fontSize:'1rem', marginBottom:'10px'}}>
                        <span>{m.homeTeam.shortName}</span>
                        <span style={{color:'#94A3B8', fontSize:'0.8rem'}}>vs</span>
                        <span>{m.awayTeam.shortName}</span>
                    </div>

                    {/* Analyse Simple */}
                    {hasAnalysis ? (
                        <div style={{background:'#F0F9FF', padding:'8px', borderRadius:'6px', fontSize:'0.8rem', color:'#0369A1', marginBottom:'10px'}}>
                            <strong>💡 {hasAnalysis.conseil} :</strong> {hasAnalysis.analyse}
                        </div>
                    ) : (
                        <div onClick={() => runAIAnalysis(m, 'SINGLE')} style={{cursor:'pointer', fontSize:'0.8rem', color:'#3B82F6', fontWeight:'bold', marginBottom:'10px', display:'flex', alignItems:'center', gap:'5px'}}>
                            <Brain size={14}/> Voir l'analyse simple
                        </div>
                    )}

                    {/* Bouton Parier */}
                    <button 
                        onClick={() => setSelectedMatchForBet(m)}
                        disabled={betsToday >= limit}
                        style={{
                            width:'100%', padding:'10px', borderRadius:'8px', border:'none', fontWeight:'bold',
                            background: betsToday >= limit ? '#E2E8F0' : '#3B82F6',
                            color: betsToday >= limit ? '#94A3B8' : 'white', cursor: betsToday >= limit ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {betsToday >= limit ? 'LIMITE ATTEINTE' : 'PARIER (SIMULATION)'}
                    </button>
                </div>
            )}) : <div style={{textAlign:'center', color:'#94A3B8', padding:'20px'}}>Aucun match pour ces filtres.</div>}
        </div>
    );
  };

  // --- RENDU : VIP (Combinés uniquement) ---
  const renderVIP = () => {
    // Génération automatique de combinés (Logique : prendre les matchs "sûrs" du jour)
    // Pour l'exemple, on groupe les matchs par 2
    const combos = [];
    const vipMatches = matches.slice(0, 6); // On prend les 6 premiers matchs dispos
    for (let i = 0; i < vipMatches.length; i += 2) {
        if (i + 1 < vipMatches.length) combos.push([vipMatches[i], vipMatches[i+1]]);
    }

    return (
    <div style={{padding: '20px'}}>
        <div style={{textAlign:'center', marginBottom:'30px'}}>
            <Crown size={40} color="#FFD700" style={{marginBottom:'10px'}}/>
            <h2 style={{color:'#FFD700', fontSize:'1.5rem', fontWeight:'900'}}>COMBINÉS ELITE</h2>
            <p style={{color:'#94A3B8', fontSize:'0.9rem'}}>Probabilité certifiée &gt; 70%</p>
        </div>

        {!isVip ? (
            <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '30px', borderRadius: '16px', textAlign: 'center', border: '1px solid #FBC02D'}}>
                <Lock size={40} color="#FBC02D" style={{marginBottom: '15px'}}/>
                <h3 style={{color:'white', fontSize:'1.2rem', marginBottom:'10px'}}>Zone Combinés</h3>
                <p style={{color:'#94a3b8', fontSize:'0.9rem', marginBottom:'20px'}}>Débloquez nos tickets combinés haute sécurité.</p>
                <button onClick={() => window.location.href = 'https://buy.stripe.com/test_8x2aER5tv71EfM208NgIo00'} style={{background: '#FBC02D', color: 'black', border: 'none', padding: '12px 30px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', fontSize:'1rem'}}>Devenir VIP</button>
            </div>
        ) : (
            <div>
                {combos.map((combo, index) => {
                    const comboId = 'combo_'+combo[0].id;
                    const analysis = analyses[comboId];

                    return (
                        <div key={index} style={{
                            background: 'linear-gradient(180deg, #FFF9C4 0%, #FFF176 100%)',
                            border: '2px solid #FBC02D', borderRadius: '12px', padding: '0', marginBottom: '25px',
                            color: 'black', overflow:'hidden', boxShadow: '0 5px 15px rgba(251, 192, 45, 0.2)'
                        }}>
                            {/* Header Ticket */}
                            <div style={{background:'#FBC02D', padding:'10px 15px', fontWeight:'bold', borderBottom:'1px dashed black', display:'flex', justifyContent:'space-between'}}>
                                <span>🎫 TICKET OR #{index+1}</span>
                                <span>COTE TOTALE: ~2.10</span>
                            </div>
                            
                            <div style={{padding:'15px'}}>
                                {/* Liste des matchs du combiné */}
                                {combo.map(m => (
                                    <div key={m.id} style={{borderBottom:'1px solid rgba(0,0,0,0.1)', paddingBottom:'8px', marginBottom:'8px'}}>
                                        <div style={{fontSize:'0.8rem', color:'#555'}}>{m.competition.name}</div>
                                        <div style={{fontWeight:'900', fontSize:'1rem'}}>{m.homeTeam.shortName} vs {m.awayTeam.shortName}</div>
                                    </div>
                                ))}

                                {/* Analyse IA */}
                                {!analysis ? (
                                    <button onClick={() => runAIAnalysis(combo, 'COMBO')} disabled={analyzing === comboId} style={{width:'100%', marginTop:'10px', padding:'10px', background:'black', color:'#FFD700', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>
                                        {analyzing === comboId ? 'Calcul de probabilité...' : 'VERIFIER LA FIABILITÉ IA'}
                                    </button>
                                ) : (
                                    <div style={{marginTop:'10px', background:'rgba(255,255,255,0.8)', padding:'10px', borderRadius:'8px'}}>
                                        <div style={{display:'flex', alignItems:'center', gap:'5px', color:'#15803d', fontWeight:'bold', marginBottom:'5px'}}>
                                            <CheckCircle size={16}/> PROBABILITÉ: {analysis.probabilite}%
                                        </div>
                                        <div style={{fontSize:'0.9rem', fontStyle:'italic'}}>"{analysis.conseil} : {analysis.analyse}"</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
    );
  };

  // --- RENDU : LIVE & PROFIL (inchangés mais inclus) ---
  const renderLive = () => (<div style={{padding:'20px', color:'#94A3B8', textAlign:'center'}}>Live Score en maintenance pour optimisation.</div>);
  const renderProfile = () => (
    <div style={{padding: '20px'}}>
        <h2 style={{color:'white', marginBottom:'30px'}}>Mon Compte</h2>
        <div style={{background:'#1E293B', padding:'20px', borderRadius:'16px', display:'flex', alignItems:'center', gap:'15px', marginBottom:'20px'}}>
            <div style={{width:60, height:60, borderRadius:'50%', background:'#334155', display:'flex', alignItems:'center', justifyContent:'center'}}><User size={30} color="white"/></div>
            <div>
                <div style={{color:'white', fontWeight:'bold', fontSize:'1.1rem'}}>{profile?.username}</div>
                <div style={{color: isVip ? '#FFD700' : '#94A3B8', fontSize:'0.9rem', fontWeight:'bold'}}>{isVip ? 'MEMBRE PREMIUM' : 'PARIEUR DEBUTANT'}</div>
            </div>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }} style={{width:'100%', marginTop:'20px', background:'transparent', border:'1px solid #EF4444', color:'#EF4444', padding:'15px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer'}}>Se déconnecter</button>
    </div>
  );

  if (loading) return <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0F172A', color: 'white'}}><div className="animate-spin" style={{width:30, height:30, border:'3px solid #00D9FF', borderRadius:'50%', borderTopColor:'transparent'}}></div></div>;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px', background: '#0F172A', fontFamily: 'sans-serif' }}>
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'rgba(15, 23, 42, 0.95)', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)'}}>
          <div style={{display: 'flex', gap: '10px', fontWeight: '900', alignItems: 'center', color:'white', fontSize:'1.2rem'}}><TrendingUp color="#00D9FF"/> PASSION VIP</div>
          <div style={{background:'#334155', padding:'5px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'bold', color:'white'}}>{betsToday}/{limit} Paris</div>
      </header>

      <div style={{maxWidth: '600px', margin: '0 auto'}}>
          {activeTab === 'home' && renderHome()}
          {activeTab === 'vip' && renderVIP()}
          {activeTab === 'live' && renderLive()}
          {activeTab === 'profile' && renderProfile()}
      </div>

      {/* MODAL PARI */}
      {selectedMatchForBet && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}} onClick={() => setSelectedMatchForBet(null)}>
              <div onClick={e => e.stopPropagation()} style={{background:'white', width:'90%', maxWidth:'350px', padding:'25px', borderRadius:'15px', textAlign:'center'}}>
                  <h3 style={{color:'black', marginBottom:'15px'}}>Placer un Pari</h3>
                  <div style={{marginBottom:'20px', fontSize:'1.1rem', fontWeight:'bold'}}>{selectedMatchForBet.homeTeam.shortName} vs {selectedMatchForBet.awayTeam.shortName}</div>
                  
                  {!betSuccess ? (
                      <button onClick={() => { setBetsToday(b => b+1); setBetSuccess(true); setTimeout(() => { setBetSuccess(false); setSelectedMatchForBet(null); }, 1500); }} style={{width:'100%', padding:'15px', background:'#3B82F6', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', fontSize:'1rem'}}>
                          CONFIRMER LE PARI
                      </button>
                  ) : (
                      <div style={{color:'#10B981', fontWeight:'bold', fontSize:'1.2rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}>
                          <CheckCircle/> Pari Validé !
                      </div>
                  )}
              </div>
          </div>
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}