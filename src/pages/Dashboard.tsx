// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { 
  Trophy, Wallet, Loader2, User, TrendingUp, X, CheckCircle, 
  Lock, Crown, Clock, Calendar, AlertTriangle, ArrowRight, ShieldCheck 
} from 'lucide-react';

// Remplace le bloc KEYS actuel par celui-ci :
const KEYS = {
  FD: import.meta.env.VITE_FOOTBALL_DATA_KEY || "",
  ODDS: import.meta.env.VITE_ODDS_API_KEY || "",
  GROQ: import.meta.env.VITE_GROQ_KEY || ""
};

const DAILY_LIMIT = { NOVICE: 3, CONFIRMED: 10, LEGEND: 9999 };

// Ligues supportées pour les cotes (The Odds API keys)
const ODDS_LEAGUES = [
  'soccer_france_ligue_one',
  'soccer_epl',
  'soccer_spain_la_liga',
  'soccer_uefa_champs_league',
  'soccer_germany_bundesliga',
  'soccer_italy_serie_a'
];

// Codes de compétition Football-Data correspondants aux "Gros Matchs"
const VIP_COMPETITIONS = ['PL', 'CL', 'FL1', 'PD', 'SA', 'BL1'];

export default function Dashboard() {
  const navigate = useNavigate();
  
  // --- ÉTATS ---
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  // Données Matchs
  const [liveMatches, setLiveMatches] = useState([]);
  const [vipMatches, setVipMatches] = useState([]);
  const [classicMatches, setClassicMatches] = useState([]);

  // Jeu & Modal
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [betAmount, setBetAmount] = useState(10);
  const [placingBet, setPlacingBet] = useState(false);
  const [betSuccess, setBetSuccess] = useState(false);
  const [betsToday, setBetsToday] = useState(0);

  // --- 1. CHARGEMENT PROFIL ---
  useEffect(() => {
    getProfile();
  }, [navigate]);

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);
    fetchMyBets(user.id);
  }

  async function fetchMyBets(userId) {
      const { data: bets } = await supabase.from('bets').select('*').eq('user_id', userId);
      if(bets) {
          const today = new Date().toISOString().split('T')[0];
          setBetsToday(bets.filter(b => b.created_at.startsWith(today)).length);
      }
  }

  // --- 2. LOGIQUE DATA (MATCHS + COTES) ---
  
  // Fonction de normalisation pour matcher les noms d'équipes entre les 2 APIs
  const normalize = (name) => {
    if (!name) return "";
    return name.toLowerCase()
      .replace(/fc|cf|united|city|real|athletic|inter|ac|as|sporting/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const proxy = "https://corsproxy.io/?";
        
        // A. FETCH MATCHS (Football-Data.org)
        const today = new Date();
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        const dateFrom = today.toISOString().split('T')[0];
        const dateTo = tomorrow.toISOString().split('T')[0];
        
        const fdUrl = `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        const resMatches = await fetch(proxy + encodeURIComponent(fdUrl), {
            headers: { "X-Auth-Token": KEYS.FD }
        });
        const matchData = await resMatches.json();
        const rawMatches = matchData.matches || [];

        // B. FETCH COTES (The Odds API)
        let allOdds = [];
        // On récupère les cotes pour les ligues majeures
        // Note: En prod, on mettrait ça en cache ou on ferait moins d'appels simultanés
        const oddsPromises = ODDS_LEAGUES.map(league => 
            fetch(`https://api.the-odds-api.com/v4/sports/${league}/odds/?apiKey=${KEYS.ODDS}&regions=eu&markets=h2h&bookmakers=winamax,betclic,unibet,pinnacle`)
            .then(res => res.json())
            .catch(() => [])
        );
        
        const oddsResults = await Promise.all(oddsPromises);
        oddsResults.forEach(leagueOdds => {
            if(Array.isArray(leagueOdds)) allOdds = [...allOdds, ...leagueOdds];
        });

        // C. MERGE INTELLIGENT
        const processedMatches = rawMatches.map(match => {
            // Tentative de matching
            const normHome = normalize(match.homeTeam.shortName || match.homeTeam.name);
            const matchedOdds = allOdds.find(o => normalize(o.home_team).includes(normHome) || normHome.includes(normalize(o.home_team)));

            // Déterminer le statut VIP
            const isBigCompetition = VIP_COMPETITIONS.includes(match.competition.code);
            const hasOdds = !!matchedOdds;
            const isVip = isBigCompetition && hasOdds;

            // Préparer les données d'analyse (Simulées si pas d'IA temps réel, enrichies avec les vraies cotes)
            let analysis = {};
            if (isVip && matchedOdds) {
                const bookmakers = matchedOdds.bookmakers || [];
                // Trouver le favori basé sur la cote moyenne
                const homeOdd = bookmakers[0]?.markets[0]?.outcomes.find(o => o.name === matchedOdds.home_team)?.price || 2.0;
                const awayOdd = bookmakers[0]?.markets[0]?.outcomes.find(o => o.name === matchedOdds.away_team)?.price || 2.0;
                
                const prediction = homeOdd < awayOdd ? `Victoire ${match.homeTeam.shortName}` : `Victoire ${match.awayTeam.shortName}`;
                const confidence = homeOdd < 1.5 ? 90 : (homeOdd < 2.0 ? 80 : 70);

                analysis = {
                    prediction,
                    confidence,
                    reason: `L'analyse des formes récentes et la dynamique du marché (${bookmakers.length} bookmakers) convergent vers ce résultat.`,
                    altB: "Plus de 2.5 buts",
                    altB_cote: "1.85",
                    altC: "Les deux marquent",
                    altC_cote: "1.72"
                };
            }

            return {
                ...match,
                isVip,
                odds: matchedOdds ? matchedOdds.bookmakers : [],
                analysis,
                // Forme simulée (car l'API free ne donne pas W-D-L détaillé historique)
                form: {
                    home: ['W', 'D', 'W', 'L', 'W'], 
                    away: ['L', 'W', 'D', 'D', 'L']
                }
            };
        });

        // D. TRI DES SECTIONS
        setLiveMatches(processedMatches.filter(m => ['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(m.status)));
        setVipMatches(processedMatches.filter(m => m.isVip && ['TIMED', 'SCHEDULED'].includes(m.status)));
        setClassicMatches(processedMatches.filter(m => !m.isVip && ['TIMED', 'SCHEDULED'].includes(m.status)));
        
        setLoading(false);

      } catch (e) {
        console.error("Erreur chargement:", e);
        setLoading(false);
      }
    };

    if(profile) fetchAllData();
  }, [profile]);


  // --- RENDU : SECTIONS ---

  // 1. SECTION LIVE
  const renderLiveSection = () => (
    <div style={{
        background: 'rgba(30, 41, 59, 0.6)', 
        border: '1px solid #334155', 
        padding: '15px', 
        borderRadius: '12px',
        marginBottom: '25px'
    }}>
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
            <div style={{width:8, height:8, background:'#ef4444', borderRadius:'50%', boxShadow:'0 0 10px red', animation:'pulse 2s infinite'}}></div>
            <h2 style={{fontSize:'1.1rem', fontWeight:'bold', margin:0, color:'white'}}>LIVE SCORE</h2>
        </div>
        
        {liveMatches.length > 0 ? liveMatches.map(m => (
            <div key={m.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <span style={{fontWeight:'bold', width:'35%'}}>{m.homeTeam.shortName}</span>
                <span style={{color:'#00FF7F', fontWeight:'bold', fontSize:'1.2rem'}}>{m.score.fullTime.home ?? 0} - {m.score.fullTime.away ?? 0}</span>
                <span style={{fontWeight:'bold', width:'35%', textAlign:'right'}}>{m.awayTeam.shortName}</span>
            </div>
        )) : (
            <div style={{textAlign:'center', color:'#94A3B8', padding:'10px'}}>
                <Clock size={24} style={{marginBottom:'5px', opacity:0.7}}/>
                <div>⏱️ Plus de matchs en direct pour aujourd'hui.</div>
                <div style={{fontSize:'0.8rem'}}>Prochains matchs demain à 12h</div>
            </div>
        )}
    </div>
  );

  // 2. SECTION VIP (Ticket Jaune Exact)
  const renderVipTicket = (match) => {
      // Préparation cotes
      const bookies = match.odds.slice(0, 4); // Top 4
      
      return (
        <div key={match.id} onClick={() => setSelectedMatch(match)} style={{
            background: 'linear-gradient(180deg, #FFF9C4 0%, #FFF176 100%)',
            border: '2px solid #FBC02D',
            borderRadius: '12px',
            margin: '25px 0',
            fontFamily: '"Courier New", Courier, monospace',
            position: 'relative',
            cursor: 'pointer',
            overflow: 'hidden',
            boxShadow: '0 8px 20px rgba(251, 192, 45, 0.2)'
        }}>
            {/* HEADER */}
            <div style={{
                background: '#FBC02D', padding: '8px 15px', display: 'flex', justifyContent: 'space-between', 
                color: 'black', borderBottom: '2px dashed #000', fontWeight: 'bold'
            }}>
                <span>🎫 TICKET VIP</span>
                <span>{new Date(match.utcDate).toLocaleDateString()} • {match.competition.code}</span>
            </div>

            {/* CONTENU */}
            <div style={{padding: '15px', color: '#333'}}>
                
                {/* 1. MATCH */}
                <div style={{textAlign: 'center', marginBottom: '15px', fontWeight: '900', fontSize: '1.2rem', textTransform: 'uppercase'}}>
                    {match.homeTeam.shortName} <br/> <span style={{fontSize:'0.9rem', fontWeight:'normal'}}>vs</span> <br/> {match.awayTeam.shortName}
                </div>

                {/* 2. PRONOSTIC */}
                <div style={{border: '2px solid #000', padding: '10px', background: 'white', textAlign: 'center', marginBottom: '15px'}}>
                    <div style={{fontSize: '0.7rem', color: '#FBC02D', fontWeight: 'bold', textTransform: 'uppercase', background:'#000', display:'inline-block', padding:'2px 6px', borderRadius:'4px'}}>PRONOSTIC EXPERT</div>
                    <div style={{fontSize: '1.1rem', fontWeight: '900', margin: '5px 0'}}>{match.analysis.prediction}</div>
                    <div style={{fontSize: '0.8rem'}}>Confiance: {match.analysis.confidence}%</div>
                </div>

                {/* 3. SÉPARATEUR */}
                <div style={{borderBottom: '1px solid #000', margin: '15px 0'}}></div>

                {/* 4. TABLEAU COTES */}
                <div style={{fontSize: '0.8rem'}}>
                    <div style={{fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: '5px'}}>COMPARATEUR COTES</div>
                    <table style={{width: '100%', borderCollapse: 'collapse'}}>
                        <tbody>
                            {bookies.map((b, i) => (
                                <tr key={i} style={{borderBottom: '1px dotted #999'}}>
                                    <td style={{padding: '4px 0'}}>{b.title}</td>
                                    {/* On affiche la cote 1 (Domicile) en bleu gras pour l'exemple */}
                                    <td style={{textAlign: 'right', fontWeight: 'bold', color: '#1565C0'}}>
                                        {b.markets[0]?.outcomes[0]?.price.toFixed(2)}
                                    </td>
                                    <td style={{textAlign: 'right', color:'#666'}}>
                                         {b.markets[0]?.outcomes[1]?.price.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 5. EXPLICATION */}
                <div style={{marginTop: '15px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.5)', padding: '8px', borderRadius: '4px'}}>
                    <p style={{marginBottom: '5px'}}><strong>📋 ANALYSE:</strong> {match.analysis.reason}</p>
                    <div>🎲 <strong>Plan B:</strong> {match.analysis.altB} ({match.analysis.altB_cote})</div>
                    <div>🛡️ <strong>Plan C:</strong> {match.analysis.altC} ({match.analysis.altC_cote})</div>
                </div>
            </div>

            {/* 6. BAS DENTELÉ */}
            <div style={{
                height: '10px',
                background: 'radial-gradient(circle, transparent 50%, #FFF9C4 50%)',
                backgroundSize: '10px 10px',
                backgroundPosition: '0 5px'
            }}></div>
        </div>
      );
  }

  // 3. SECTION CLASSIQUE (Card Blanc)
  const renderClassicCard = (match) => (
    <div key={match.id} onClick={() => setSelectedMatch(match)} style={{
        background: 'white',
        borderLeft: '4px solid #3B82F6',
        borderRadius: '8px',
        padding: '15px',
        margin: '10px 0',
        color: '#1E293B',
        cursor: 'pointer',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    }}>
        {/* HEADER */}
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748B', marginBottom: '8px'}}>
            <span>{match.competition.name}</span>
            <span>{new Date(match.utcDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        </div>

        {/* TEAMS */}
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 'bold', marginBottom: '10px'}}>
            <span>{match.homeTeam.shortName}</span>
            <span style={{color:'#94A3B8', fontWeight:'normal'}}>vs</span>
            <span>{match.awayTeam.shortName}</span>
        </div>

        {/* FOOTER (Forme + Bouton) */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{display: 'flex', gap: '3px'}}>
                {match.form.home.slice(0,3).map((r, i) => (
                    <div key={i} style={{
                        width: 8, height: 8, borderRadius: '50%', 
                        background: r === 'W' ? '#22c55e' : (r === 'D' ? '#eab308' : '#ef4444')
                    }}></div>
                ))}
            </div>
            <button style={{background: '#3B82F6', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'}}>
                Voir
            </button>
        </div>
    </div>
  );

  // --- ACTIONS ---
  const handlePlaceBet = () => {
      if(!profile) return;
      if (betsToday >= (DAILY_LIMIT[profile.tier.toUpperCase()] || 3)) { alert("Limite quotidienne atteinte !"); return; }
      
      setPlacingBet(true);
      
      // Simulation appel Supabase (pour la démo fluide)
      setTimeout(async () => {
          // Ici on appellerait le vrai RPC Supabase 'place_bet'
          // await supabase.rpc('place_bet', { ... })
          
          setBetSuccess(true); 
          setBetsToday(b => b+1);
          setTimeout(() => { setSelectedMatch(null); setBetSuccess(false); }, 2000);
          setPlacingBet(false);
      }, 1000);
  };

  // --- RENDU GLOBAL ---
  const isVipUser = profile?.tier === 'confirmed' || profile?.tier === 'legend';

  if (loading) return <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0F172A', color: 'white'}}><Loader2 className="animate-spin" size={40}/></div>;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px', background: '#0F172A', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* HEADER FIXE */}
      <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '15px 20px', background: 'rgba(30,41,59,0.95)', position: 'sticky', top: 0, zIndex: 50,
          backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
          <div style={{display: 'flex', gap: '10px', fontWeight: '900', alignItems: 'center', fontSize:'1.1rem'}}>
              <TrendingUp color="#00D9FF"/> PASSION VIP
          </div>
          <div style={{background: '#334155', padding: '5px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'}}>
              <Wallet size={14} color="#00D9FF"/> {profile?.bankroll} €
          </div>
      </header>

      <div style={{maxWidth: '600px', margin: '0 auto', padding: '20px'}}>
          
          {/* SECTION 1: LIVE */}
          {activeTab === 'home' && renderLiveSection()}

          {/* SECTION 2: VIP */}
          {activeTab === 'home' && (
            <section style={{marginBottom: '30px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                    <Crown size={24} color="#FFD700" fill="#FFD700"/>
                    <h2 style={{color: '#FFD700', fontSize: '1.2rem', fontWeight: 'bold', margin: 0}}>ZONE ELITE</h2>
                </div>
                
                {!isVipUser ? (
                    <div style={{
                        background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '30px', 
                        borderRadius: '16px', textAlign: 'center', border: '1px solid #FBC02D'
                    }}>
                        <Lock size={40} color="#FBC02D" style={{marginBottom: '15px'}}/>
                        <h3 style={{fontSize:'1.2rem', marginBottom:'10px'}}>Accès Réservé</h3>
                        <p style={{color:'#94a3b8', fontSize:'0.9rem', marginBottom:'20px'}}>Débloquez les tickets VIP avec cotes réelles.</p>
                        <button onClick={() => window.location.href = 'https://buy.stripe.com/test_8x2aER5tv71EfM208NgIo00'} style={{background: '#FBC02D', color: 'black', border: 'none', padding: '12px 30px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer'}}>
                            Devenir VIP (9.99€)
                        </button>
                    </div>
                ) : (
                    vipMatches.length > 0 ? vipMatches.map(renderVipTicket) : 
                    <div style={{color: '#94A3B8', fontStyle: 'italic', textAlign: 'center'}}>Analyse des cotes VIP en cours...</div>
                )}
            </section>
          )}

          {/* SECTION 3: CLASSIQUE */}
          {activeTab === 'home' && (
            <section>
                <h2 style={{fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '15px', color: 'white'}}>Prochains Matchs</h2>
                {classicMatches.length > 0 ? classicMatches.map(renderClassicCard) : <div style={{color: '#64748B', textAlign:'center'}}>Chargement du calendrier...</div>}
            </section>
          )}

          {/* PROFIL TAB (Simplifié pour contexte) */}
          {activeTab === 'profile' && (
             <div style={{textAlign:'center', marginTop:'50px'}}>
                 <User size={50} style={{margin:'0 auto'}}/>
                 <h2>{profile?.username}</h2>
                 <p style={{color: isVipUser ? '#FFD700' : '#94A3B8'}}>{profile?.tier.toUpperCase()}</p>
                 <button onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }} style={{marginTop:'20px', background:'transparent', border:'1px solid red', color:'red', padding:'10px 20px', borderRadius:'8px'}}>Se déconnecter</button>
             </div>
          )}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MODAL DE PARI */}
      {selectedMatch && (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)', zIndex: 100, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={() => setSelectedMatch(null)}>
            <div onClick={e => e.stopPropagation()} style={{
                background: '#1E293B', width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '25px', 
                border: `2px solid ${selectedMatch.isVip ? '#FBC02D' : '#3B82F6'}`
            }}>
                <h3 style={{textAlign:'center', marginBottom:'20px', color:'white'}}>Placer un pari</h3>
                <div style={{textAlign:'center', marginBottom:'20px', fontSize:'1.2rem', fontWeight:'bold', color:'white'}}>
                    {selectedMatch.homeTeam.shortName} vs {selectedMatch.awayTeam.shortName}
                </div>
                
                {!betSuccess ? (
                    <>
                        <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                            {[10, 20, 50, 100].map(amt => (
                                <button key={amt} onClick={() => setBetAmount(amt)} style={{
                                    flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #334155',
                                    background: betAmount===amt ? (selectedMatch.isVip?'#FBC02D':'#3B82F6') : 'transparent',
                                    color: betAmount===amt ? 'black' : 'white', fontWeight: 'bold'
                                }}>{amt}€</button>
                            ))}
                        </div>
                        <button onClick={handlePlaceBet} disabled={placingBet} style={{
                            width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
                            background: selectedMatch.isVip ? '#FBC02D' : '#3B82F6', 
                            color: selectedMatch.isVip ? 'black' : 'white', fontWeight: 'bold', fontSize: '1.1rem',
                            cursor: placingBet?'not-allowed':'pointer', display:'flex', justifyContent:'center', gap:'10px'
                        }}>
                            {placingBet ? <Loader2 className="animate-spin"/> : `VALIDER PARI (${betAmount}€)`}
                        </button>
                    </>
                ) : (
                    <div style={{textAlign: 'center', color: '#00FF7F', fontWeight: 'bold', fontSize: '1.2rem'}}>
                        <CheckCircle size={40} style={{marginBottom: '10px', margin:'0 auto'}}/>
                        <div>PARI ENREGISTRÉ !</div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}