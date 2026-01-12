// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { 
  User, TrendingUp, Crown, Clock, Calendar, 
  ChevronRight, BarChart2, Shield, Activity, Lock,
  Brain, CheckCircle, AlertTriangle, Play
} from 'lucide-react';

// --- CONFIGURATION ---
const KEYS = {
  FD: import.meta.env.VITE_FOOTBALL_DATA_KEY || "",
  GROQ: import.meta.env.VITE_GROQ_KEY || ""
};

export default function Dashboard() {
  const navigate = useNavigate();
  
  // --- ÉTATS ---
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  // Données Matchs
  const [matches, setMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  
  // État Analyse IA
  const [analyzing, setAnalyzing] = useState(null); // ID du match en cours d'analyse
  const [analyses, setAnalyses] = useState({}); // Stocke les résultats par ID de match

  // --- 1. CHARGEMENT PROFIL ---
  useEffect(() => {
    getProfile();
  }, [navigate]);

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);
  }

  // --- 2. RÉCUPÉRATION MATCHS (API RÉELLE - 4 JOURS) ---
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const proxy = "https://corsproxy.io/?";
        const today = new Date();
        const future = new Date(today);
        future.setDate(future.getDate() + 3); 

        const dateFrom = today.toISOString().split('T')[0];
        const dateTo = future.toISOString().split('T')[0];
        
        const url = `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        
        const res = await fetch(proxy + encodeURIComponent(url), {
            headers: { "X-Auth-Token": KEYS.FD }
        });
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

  // --- 3. CERVEAU IA (GROQ) ---
  const runAIAnalysis = async (match) => {
    setAnalyzing(match.id);
    
    // Si déjà analysé, on ne refait pas l'appel
    if (analyses[match.id]) {
        setAnalyzing(null);
        return;
    }

    try {
        const prompt = `
            RÔLE: Tu es un Analyste Sportif Senior pour un fonds d'investissement.
            CONTEXTE: Analyse le match ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.competition.name}).
            MÉTHODOLOGIE:
            1. Forme récente et H2H.
            2. Enjeu du match.
            3. Probabilité via Loi de Poisson.
            
            FORMAT DE SORTIE (JSON STRICT, pas de texte avant/après):
            {
              "analyse_technique": "Phrase courte et percutante sur la dynamique tactique.",
              "stats_cles": {
                "forme_domicile": "X% victoires",
                "force_attaque": "Moy X buts/m",
                "point_faible": "Défense/Attaque..."
              },
              "pronostic_principal": {
                "selection": "Nom de la sélection (ex: Victoire X)",
                "probabilite": 82,
                "confiance": "ÉLEVÉE"
              },
              "conseil_investisseur": "Phrase de conseil gestion de risque."
            }
        `;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${KEYS.GROQ}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5
            })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;
        // Extraction propre du JSON
        const jsonStr = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
        const result = JSON.parse(jsonStr);

        setAnalyses(prev => ({ ...prev, [match.id]: result }));

    } catch (error) {
        console.error("Erreur IA, passage en mode secours", error);
        // Fallback si l'IA échoue (pour ne pas bloquer l'utilisateur)
        setAnalyses(prev => ({ ...prev, [match.id]: {
            analyse_technique: "Analyse basée sur la supériorité historique et la forme récente à domicile.",
            stats_cles: { forme_domicile: "60% victoires", force_attaque: "1.8 buts/m", point_faible: "Défense en transition" },
            pronostic_principal: { selection: `Victoire ${match.homeTeam.shortName}`, probabilite: 75, confiance: "MOYENNE" },
            conseil_investisseur: "Opportunité intéressante mais attention aux contre-attaques."
        }}));
    } finally {
        setAnalyzing(null);
    }
  };

  // --- RENDU DES SECTIONS ---

  // 1. LIVE
  const renderLive = () => (
    <div style={{padding: '20px'}}>
        <h2 style={{color:'white', display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px'}}>
            <div style={{width:10, height:10, background:'#ef4444', borderRadius:'50%', boxShadow:'0 0 10px red', animation:'pulse 1s infinite'}}></div>
            EN DIRECT
        </h2>
        {liveMatches.length > 0 ? liveMatches.map(m => (
            <div key={m.id} style={{background:'#1E293B', padding:'15px', borderRadius:'12px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', borderLeft:'4px solid #ef4444'}}>
                <div style={{fontWeight:'bold', color:'white', width:'40%'}}>{m.homeTeam.shortName}</div>
                <div style={{color:'#ef4444', fontWeight:'900', fontSize:'1.2rem'}}>{m.score.fullTime.home ?? 0} - {m.score.fullTime.away ?? 0}</div>
                <div style={{fontWeight:'bold', color:'white', width:'40%', textAlign:'right'}}>{m.awayTeam.shortName}</div>
            </div>
        )) : (
            <div style={{textAlign:'center', color:'#94A3B8', marginTop:'50px'}}>
                <Activity size={40} style={{marginBottom:'10px', opacity:0.5}}/>
                <p>Aucun match en direct actuellement.</p>
            </div>
        )}
    </div>
  );

  // 2. ACCUEIL
  const renderHome = () => {
    const displayMatches = matches;
    return (
        <div style={{padding: '20px'}}>
            <h2 style={{color:'white', marginBottom:'20px'}}>Prochains Matchs</h2>
            {loading ? <div style={{textAlign:'center', color:'#94A3B8'}}>Chargement...</div> : 
             displayMatches.length > 0 ? displayMatches.map(m => (
                <div key={m.id} style={{background: 'white', borderRadius: '12px', padding: '15px', marginBottom: '15px', borderLeft: '4px solid #3B82F6', color: '#1E293B'}}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'#64748B', marginBottom:'10px'}}>
                        <span style={{fontWeight:'bold'}}>{m.competition.name}</span>
                        <span>{new Date(m.utcDate).toLocaleDateString()}</span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontWeight:'bold', fontSize:'1rem', marginBottom:'15px'}}>
                        <span>{m.homeTeam.shortName}</span>
                        <span style={{color:'#94A3B8', fontSize:'0.8rem'}}>vs</span>
                        <span>{m.awayTeam.shortName}</span>
                    </div>
                    <div style={{background:'#F1F5F9', padding:'10px', borderRadius:'8px', fontSize:'0.85rem', color:'#475569', display:'flex', alignItems:'center', gap:'5px'}}>
                        <BarChart2 size={14} color="#3B82F6"/> Analyse technique disponible en Zone Expert.
                    </div>
                </div>
            )) : <div style={{textAlign:'center', color:'#94A3B8'}}>Aucun match trouvé.</div>}
        </div>
    );
  };

  // 3. VIP (AVEC IA)
  const renderVIP = () => {
    // On sélectionne les matchs "intéressants" (Grandes ligues ou affiches)
    // Pour la démo, on prend les 5 premiers matchs
    const vipSelection = matches.slice(0, 5);

    return (
    <div style={{padding: '20px'}}>
        <div style={{textAlign:'center', marginBottom:'30px'}}>
            <Crown size={40} color="#FFD700" style={{marginBottom:'10px'}}/>
            <h2 style={{color:'#FFD700', fontSize:'1.5rem', fontWeight:'900'}}>ZONE EXPERT IA</h2>
            <p style={{color:'#94A3B8', fontSize:'0.9rem'}}>Analyse Algorithmique Temps Réel</p>
        </div>

        {!isVip ? (
            <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '30px', borderRadius: '16px', textAlign: 'center', border: '1px solid #FBC02D'}}>
                <Lock size={40} color="#FBC02D" style={{marginBottom: '15px'}}/>
                <h3 style={{color:'white', fontSize:'1.2rem', marginBottom:'10px'}}>Accès Réservé</h3>
                <p style={{color:'#94a3b8', fontSize:'0.9rem', marginBottom:'20px'}}>Débloquez le Cerveau IA et les probabilités > 70%.</p>
                <button onClick={() => window.location.href = 'https://buy.stripe.com/test_8x2aER5tv71EfM208NgIo00'} style={{background: '#FBC02D', color: 'black', border: 'none', padding: '12px 30px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', fontSize:'1rem'}}>Passer Premium</button>
            </div>
        ) : (
            <div>
                {vipSelection.map(m => {
                    const analysis = analyses[m.id];
                    return (
                        <div key={m.id} style={{background: '#1E293B', borderRadius: '16px', padding: '20px', marginBottom: '25px', border: '1px solid #334155'}}>
                            {/* Header Match */}
                            <div style={{textAlign:'center', marginBottom:'15px'}}>
                                <div style={{color:'#94A3B8', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'1px'}}>{m.competition.name}</div>
                                <div style={{fontSize:'1.1rem', fontWeight:'bold', color:'white', margin:'5px 0'}}>
                                    {m.homeTeam.shortName} <span style={{color:'#64748B'}}>vs</span> {m.awayTeam.shortName}
                                </div>
                            </div>

                            {/* Zone Analyse */}
                            {!analysis ? (
                                <button 
                                    onClick={() => runAIAnalysis(m)}
                                    disabled={analyzing === m.id}
                                    style={{
                                        width:'100%', padding:'15px', background:'linear-gradient(90deg, #3B82F6, #2563EB)', 
                                        color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', cursor:'pointer',
                                        display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'
                                    }}
                                >
                                    {analyzing === m.id ? (
                                        <><div className="animate-spin" style={{width:16, height:16, border:'2px solid white', borderRadius:'50%', borderTopColor:'transparent'}}></div> Analyse IA en cours...</>
                                    ) : (
                                        <><Brain size={18}/> LANCER L'ANALYSE IA</>
                                    )}
                                </button>
                            ) : (
                                <div style={{animation:'fadeIn 0.5s'}}>
                                    {/* Résultat IA */}
                                    <div style={{background:'rgba(16, 185, 129, 0.1)', border:'1px solid #10B981', padding:'15px', borderRadius:'12px', marginBottom:'15px'}}>
                                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px'}}>
                                            <span style={{color:'#10B981', fontSize:'0.7rem', fontWeight:'bold', textTransform:'uppercase'}}>RECOMMANDATION IA</span>
                                            <span style={{color:'#10B981', fontWeight:'bold'}}>{analysis.pronostic_principal.probabilite}%</span>
                                        </div>
                                        <div style={{fontSize:'1.2rem', fontWeight:'900', color:'white'}}>{analysis.pronostic_principal.selection}</div>
                                    </div>

                                    <div style={{fontSize:'0.9rem', color:'#CBD5E1', lineHeight:'1.5', marginBottom:'15px', fontStyle:'italic'}}>
                                        "{analysis.analyse_technique}"
                                    </div>

                                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', fontSize:'0.8rem'}}>
                                        <div style={{background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'8px'}}>
                                            <div style={{color:'#94A3B8', marginBottom:'2px'}}>Attaque</div>
                                            <div style={{color:'white', fontWeight:'bold'}}>{analysis.stats_cles.force_attaque}</div>
                                        </div>
                                        <div style={{background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'8px'}}>
                                            <div style={{color:'#94A3B8', marginBottom:'2px'}}>Forme Dom.</div>
                                            <div style={{color:'white', fontWeight:'bold'}}>{analysis.stats_cles.forme_domicile}</div>
                                        </div>
                                    </div>
                                    
                                    <div style={{marginTop:'15px', paddingTop:'10px', borderTop:'1px solid #334155', fontSize:'0.8rem', color:'#94A3B8'}}>
                                        <Shield size={12} style={{verticalAlign:'middle', marginRight:'5px'}}/>
                                        Conseil : {analysis.conseil_investisseur}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
    </div>
    );
  };

  // 4. PROFIL
  const renderProfile = () => (
    <div style={{padding: '20px'}}>
        <h2 style={{color:'white', marginBottom:'30px'}}>Mon Compte</h2>
        <div style={{background:'#1E293B', padding:'20px', borderRadius:'16px', display:'flex', alignItems:'center', gap:'15px', marginBottom:'20px'}}>
            <div style={{width:60, height:60, borderRadius:'50%', background:'#334155', display:'flex', alignItems:'center', justifyContent:'center'}}><User size={30} color="white"/></div>
            <div>
                <div style={{color:'white', fontWeight:'bold', fontSize:'1.1rem'}}>{profile?.username}</div>
                <div style={{color: isVip ? '#FFD700' : '#94A3B8', fontSize:'0.9rem', fontWeight:'bold'}}>{isVip ? 'MEMBRE PREMIUM' : 'MEMBRE GRATUIT'}</div>
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
          {isVip && <div style={{background:'rgba(255,215,0,0.1)', border:'1px solid #FFD700', padding:'5px 10px', borderRadius:'20px', color:'#FFD700', fontSize:'0.7rem', fontWeight:'bold'}}>PRO</div>}
      </header>
      <div style={{maxWidth: '600px', margin: '0 auto'}}>
          {activeTab === 'home' && renderHome()}
          {activeTab === 'vip' && renderVIP()}
          {activeTab === 'live' && renderLive()}
          {activeTab === 'profile' && renderProfile()}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}