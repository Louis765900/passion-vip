// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { 
  User, TrendingUp, Crown, Clock, Calendar, 
  ChevronRight, BarChart2, Shield, Activity, Lock 
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
        
        // CORRECTION ICI : On cherche sur 4 jours
        const today = new Date();
        const future = new Date(today);
        future.setDate(future.getDate() + 3); // +3 jours

        const dateFrom = today.toISOString().split('T')[0];
        const dateTo = future.toISOString().split('T')[0];
        
        // On récupère les matchs
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
                <div style={{fontSize:'0.7rem', color:'#94A3B8', position:'absolute', marginTop:'40px', left:'50%', transform:'translateX(-50%)'}}>
                    {m.status === 'HALFTIME' ? 'MI-TEMPS' : 'EN COURS'}
                </div>
            </div>
        )) : (
            <div style={{textAlign:'center', color:'#94A3B8', marginTop:'50px'}}>
                <Activity size={40} style={{marginBottom:'10px', opacity:0.5}}/>
                <p>Aucun match en direct actuellement.</p>
            </div>
        )}
    </div>
  );

  // 2. ACCUEIL (Analyses)
  const renderHome = () => {
    // On affiche tous les matchs récupérés (pas de filtre strict pour l'instant pour être sûr de voir qqch)
    const displayMatches = matches;

    return (
        <div style={{padding: '20px'}}>
            <h2 style={{color:'white', marginBottom:'20px'}}>Prochains Matchs</h2>
            
            {loading ? (
                <div style={{textAlign:'center', color:'#94A3B8'}}>Chargement des données...</div>
            ) : displayMatches.length > 0 ? (
                displayMatches.map(m => (
                <div key={m.id} style={{
                    background: 'white', borderRadius: '12px', padding: '15px', marginBottom: '15px',
                    borderLeft: '4px solid #3B82F6', color: '#1E293B'
                }}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'#64748B', marginBottom:'10px'}}>
                        <span style={{fontWeight:'bold'}}>{m.competition.name}</span>
                        <span>{new Date(m.utcDate).toLocaleDateString()} à {new Date(m.utcDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontWeight:'bold', fontSize:'1rem', marginBottom:'15px'}}>
                        <span>{m.homeTeam.shortName}</span>
                        <span style={{color:'#94A3B8', fontSize:'0.8rem'}}>vs</span>
                        <span>{m.awayTeam.shortName}</span>
                    </div>

                    <div style={{background:'#F1F5F9', padding:'10px', borderRadius:'8px', fontSize:'0.85rem'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'5px', color:'#3B82F6', fontWeight:'bold', marginBottom:'5px'}}>
                            <BarChart2 size={14}/> ANALYSE
                        </div>
                        <div style={{color:'#475569'}}>
                            Analyse technique et historique des confrontations disponible.
                        </div>
                    </div>
                </div>
            ))) : (
                <div style={{textAlign:'center', color:'#94A3B8', background:'rgba(255,255,255,0.05)', padding:'20px', borderRadius:'12px'}}>
                    <Calendar size={40} style={{marginBottom:'10px', opacity:0.5}}/>
                    <p>Aucun match trouvé pour les 4 prochains jours.</p>
                </div>
            )}
        </div>
    );
  };

  // 3. VIP
  const renderVIP = () => (
    <div style={{padding: '20px'}}>
        <div style={{textAlign:'center', marginBottom:'30px'}}>
            <Crown size={40} color="#FFD700" style={{marginBottom:'10px'}}/>
            <h2 style={{color:'#FFD700', fontSize:'1.5rem', fontWeight:'900'}}>ZONE EXPERT</h2>
            <p style={{color:'#94A3B8', fontSize:'0.9rem'}}>Probabilités &gt; 70% • Analyses Tactiques</p>
        </div>

        {!isVip ? (
            <div style={{
                background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '30px', 
                borderRadius: '16px', textAlign: 'center', border: '1px solid #FBC02D'
            }}>
                <Lock size={40} color="#FBC02D" style={{marginBottom: '15px'}}/>
                <h3 style={{color:'white', fontSize:'1.2rem', marginBottom:'10px'}}>Accès Réservé aux Abonnés</h3>
                <p style={{color:'#94a3b8', fontSize:'0.9rem', marginBottom:'20px'}}>
                    Débloquez les analyses détaillées, les probabilités mathématiques et les choix de nos experts.
                </p>
                <button onClick={() => window.location.href = 'https://buy.stripe.com/test_8x2aER5tv71EfM208NgIo00'} style={{
                    background: '#FBC02D', color: 'black', border: 'none', padding: '12px 30px', 
                    borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', fontSize:'1rem'
                }}>
                    Passer Premium (9.99€/mois)
                </button>
            </div>
        ) : (
            <div style={{textAlign:'center', color:'#94A3B8'}}>
                <p>Bienvenue Membre VIP.</p>
                <p>Le module d'analyse IA sera activé à la prochaine étape.</p>
            </div>
        )}
    </div>
  );

  // 4. PROFIL
  const renderProfile = () => (
    <div style={{padding: '20px'}}>
        <h2 style={{color:'white', marginBottom:'30px'}}>Mon Compte</h2>
        <div style={{background:'#1E293B', padding:'20px', borderRadius:'16px', display:'flex', alignItems:'center', gap:'15px', marginBottom:'20px'}}>
            <div style={{width:60, height:60, borderRadius:'50%', background:'#334155', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <User size={30} color="white"/>
            </div>
            <div>
                <div style={{color:'white', fontWeight:'bold', fontSize:'1.1rem'}}>{profile?.username}</div>
                <div style={{color: isVip ? '#FFD700' : '#94A3B8', fontSize:'0.9rem', fontWeight:'bold'}}>
                    {isVip ? 'MEMBRE PREMIUM' : 'MEMBRE GRATUIT'}
                </div>
            </div>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            <button style={{background:'#334155', color:'white', padding:'15px', borderRadius:'12px', border:'none', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span>Historique d'activité</span> <ChevronRight size={16}/>
            </button>
            <button style={{background:'#334155', color:'white', padding:'15px', borderRadius:'12px', border:'none', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span>Gérer mon abonnement</span> <ChevronRight size={16}/>
            </button>
            <button onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }} style={{
                marginTop:'20px', background:'transparent', border:'1px solid #EF4444', color:'#EF4444', 
                padding:'15px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer'
            }}>
                Se déconnecter
            </button>
        </div>
    </div>
  );

  if (loading) return <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0F172A', color: 'white'}}><div className="animate-spin" style={{width:30, height:30, border:'3px solid #00D9FF', borderRadius:'50%', borderTopColor:'transparent'}}></div></div>;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px', background: '#0F172A', fontFamily: 'sans-serif' }}>
      
      {/* HEADER FIXE */}
      <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '15px 20px', background: 'rgba(15, 23, 42, 0.95)', position: 'sticky', top: 0, zIndex: 50,
          borderBottom: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)'
      }}>
          <div style={{display: 'flex', gap: '10px', fontWeight: '900', alignItems: 'center', color:'white', fontSize:'1.2rem'}}>
              <TrendingUp color="#00D9FF"/> PASSION VIP
          </div>
          {isVip && <div style={{background:'rgba(255,215,0,0.1)', border:'1px solid #FFD700', padding:'5px 10px', borderRadius:'20px', color:'#FFD700', fontSize:'0.7rem', fontWeight:'bold'}}>PRO</div>}
      </header>

      {/* CONTENU PRINCIPAL */}
      <div style={{maxWidth: '600px', margin: '0 auto'}}>
          {activeTab === 'home' && renderHome()}
          {activeTab === 'vip' && renderVIP()}
          {activeTab === 'live' && renderLive()}
          {activeTab === 'profile' && renderProfile()}
      </div>

      {/* NAVIGATION */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}