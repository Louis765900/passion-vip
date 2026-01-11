// @ts-nocheck
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, TrendingUp, ShieldCheck, Zap, Check } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* NAVBAR */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp color="#00D9FF" size={28} />
          <span style={{ fontWeight: '900', fontSize: '1.5rem', letterSpacing: '-1px' }}>PASSION VIP</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontWeight: 'bold' }}>Connexion</button>
          <button onClick={() => navigate('/signup')} style={{ background: '#00D9FF', border: 'none', padding: '10px 20px', borderRadius: '20px', color: '#0F172A', fontWeight: 'bold', cursor: 'pointer' }}>S'inscrire</button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'inline-block', padding: '5px 15px', background: 'rgba(0, 217, 255, 0.1)', color: '#00D9FF', borderRadius: '20px', fontSize: '0.9rem', marginBottom: '20px', fontWeight: 'bold' }}>
          🚀 LA RÉVOLUTION DU PARI SPORTIF
        </div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '900', lineHeight: '1.1', marginBottom: '20px', background: 'linear-gradient(to right, #fff, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Arrêtez de parier au hasard.<br/>Suivez l'Intelligence Artificielle.
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#94A3B8', marginBottom: '40px', lineHeight: '1.6' }}>
          Passion VIP analyse des milliers de matchs en temps réel pour vous donner les probabilités exactes. Rejoignez l'élite des parieurs.
        </p>
        <button onClick={() => navigate('/signup')} style={{ padding: '18px 40px', fontSize: '1.2rem', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0, 102, 255, 0.3)', transition: 'transform 0.2s' }}>
          COMMENCER GRATUITEMENT
        </button>
        <div style={{ marginTop: '20px', color: '#64748B', fontSize: '0.9rem' }}>Pas de carte bancaire requise • Annulable à tout moment</div>
      </header>

      {/* FEATURES */}
      <section style={{ padding: '60px 20px', background: '#1E293B' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
          <div style={{ padding: '30px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px' }}>
            <Zap size={40} color="#FFD700" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Analyses IA</h3>
            <p style={{ color: '#94A3B8' }}>Notre algorithme Groq™ scanne la forme des équipes, les blessés et l'historique pour prédire le score.</p>
          </div>
          <div style={{ padding: '30px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px' }}>
            <Trophy size={40} color="#00FF7F" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Bankroll Manager</h3>
            <p style={{ color: '#94A3B8' }}>Gérez votre budget virtuel comme un pro. Suivez vos gains et pertes avec des graphiques précis.</p>
          </div>
          <div style={{ padding: '30px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px' }}>
            <ShieldCheck size={40} color="#00D9FF" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>100% Sécurisé</h3>
            <p style={{ color: '#94A3B8' }}>Entraînez-vous sans risque avec de l'argent virtuel avant de passer dans le monde réel.</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '50px' }}>Choisis ton niveau</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
          
          {/* FREE */}
          <div style={{ width: '300px', padding: '40px', borderRadius: '24px', border: '1px solid #334155', background: '#0F172A', textAlign: 'left' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', marginBottom: '10px' }}>NOVICE</div>
            <div style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '20px' }}>0€ <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/mois</span></div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '30px', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px' }}><Check color="#00D9FF" /> 3 Paris par jour</li>
              <li style={{ display: 'flex', gap: '10px' }}><Check color="#00D9FF" /> Accès aux cotes</li>
              <li style={{ display: 'flex', gap: '10px' }}><Check color="#00D9FF" /> Bankroll basique</li>
            </ul>
            <button 
              onClick={() => navigate('/signup')} 
              style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              S'inscrire Gratuitement
            </button>
          </div>

          {/* VIP - AVEC TON LIEN STRIPE */}
          <div style={{ width: '300px', padding: '40px', borderRadius: '24px', border: '1px solid #00D9FF', background: 'rgba(0, 217, 255, 0.05)', textAlign: 'left', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#00D9FF', color: '#000', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem' }}>POPULAIRE</div>
            <div style={{ color: '#00D9FF', fontWeight: 'bold', marginBottom: '10px' }}>CONFIRMÉ</div>
            <div style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '20px' }}>9.99€ <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/mois</span></div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '30px', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px' }}><Check color="#00FF7F" /> <b>10 Paris par jour</b></li>
              <li style={{ display: 'flex', gap: '10px' }}><Check color="#00FF7F" /> Analyse IA illimitée</li>
              <li style={{ display: 'flex', gap: '10px' }}><Check color="#00FF7F" /> Statut VIP sur le profil</li>
            </ul>
            <button 
              onClick={() => window.location.href = 'https://buy.stripe.com/test_8x2aER5tv71EfM208NgIo00'} 
              style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#00D9FF', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s' }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Devenir VIP
            </button>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px', textAlign: 'center', borderTop: '1px solid #334155', color: '#64748B', fontSize: '0.9rem' }}>
        © 2024 Passion VIP. Jouez de manière responsable.
      </footer>
    </div>
  );
}