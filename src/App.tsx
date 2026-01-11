// @ts-nocheck
import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import { Trophy, Zap, Wallet } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);

  // Simulation chargement (On remettra tes vraies données après)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // --- SPLASH SCREEN (Écran de chargement) ---
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', background: '#0F172A', color: 'white' 
      }}>
        <div style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-2px' }}>
          PASSION<span style={{ color: '#00D9FF' }}>VIP</span>
        </div>
        <div style={{ marginTop: '20px', color: '#00D9FF', fontSize: '0.9rem' }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* 1. HEADER */}
      <header className="glass-panel" style={{
        position: 'sticky', top: 0, zIndex: 50, padding: '15px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', borderTop: 'none', borderLeft:'none', borderRight:'none'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-1px', color: '#fff' }}>
          PASSION<span style={{ color: '#00D9FF' }}>VIP</span>
        </div>
        
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', 
          background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)' 
        }}>
          <Wallet size={16} color="#00FF7F" />
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#00FF7F' }}>1,250 €</span>
        </div>
      </header>

      {/* 2. CONTENU PRINCIPAL */}
      <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* ONGLET ACCUEIL */}
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Carte Bienvenue */}
            <div style={{
              background: 'linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)',
              borderRadius: '20px', padding: '25px', color: 'white',
              boxShadow: '0 10px 30px rgba(0, 217, 255, 0.3)',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '1.4rem' }}>Prêt à gagner ? 🚀</h2>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>L'IA analyse les matchs de ce soir.</p>
              </div>
            </div>

            {/* Stats Rapides */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="glass-panel" style={{ padding: '15px', borderRadius: '16px', textAlign: 'center' }}>
                <Trophy size={24} color="#FFD700" style={{ marginBottom: '5px' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>82%</div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Réussite Hebdo</div>
              </div>
              <div className="glass-panel" style={{ padding: '15px', borderRadius: '16px', textAlign: 'center' }}>
                <Zap size={24} color="#00D9FF" style={{ marginBottom: '5px' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>12</div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Pronos Dispo</div>
              </div>
            </div>

            {/* Teaser Matchs */}
            <h3 style={{ marginTop: '10px', marginBottom: '10px', color: 'white' }}>🔥 Matchs Tendance</h3>
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel" style={{ 
                padding: '15px', borderRadius: '16px', marginBottom: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#333', borderRadius: '50%' }}></div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Real Madrid vs Barça</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>21:00 • Liga</div>
                  </div>
                </div>
                <button style={{ 
                  background: 'rgba(0, 217, 255, 0.1)', color: '#00D9FF', border: 'none',
                  padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem'
                }}>
                  Analyser
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'vip' && <div style={{ textAlign: 'center', marginTop: '50px', color: '#94A3B8' }}>💎 Zone VIP (Bientôt)</div>}
        {activeTab === 'live' && <div style={{ textAlign: 'center', marginTop: '50px', color: '#94A3B8' }}>📡 Live Score (Bientôt)</div>}
        {activeTab === 'profile' && <div style={{ textAlign: 'center', marginTop: '50px', color: '#94A3B8' }}>👤 Profil (Bientôt)</div>}

      </main>

      {/* 3. MENU NAVIGATION */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    
    </div>
  );
}

export default App;