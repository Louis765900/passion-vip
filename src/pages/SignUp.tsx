// @ts-nocheck
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, Mail, Lock, User, Wallet } from 'lucide-react';

export default function SignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    tier: 'novice',
    bankroll: '100'
  });

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Création du compte avec les métadonnées (Bankroll, Tier, Pseudo)
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          username: formData.username,
          tier: formData.tier,
          bankroll: formData.bankroll
        }
      }
    });

    if (error) {
      alert("❌ Erreur : " + error.message);
    } else {
      alert("✅ Compte créé ! Vérifie tes emails pour confirmer.");
      navigate('/'); // On renverra vers le Login plus tard
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '30px', borderRadius: '24px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'white', margin: 0 }}>
            REJOINS <span style={{ color: '#00D9FF' }}>L'ÉLITE</span>
          </h1>
          <p style={{ color: '#94A3B8', marginTop: '10px' }}>Configure ton profil parieur</p>
        </div>

        <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Email */}
          <div style={{ position: 'relative' }}>
            <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input required type="email" name="email" placeholder="Email" onChange={handleChange}
              style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white' }} />
          </div>

          {/* Username */}
          <div style={{ position: 'relative' }}>
            <User size={18} color="#94A3B8" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input required type="text" name="username" placeholder="Pseudo" onChange={handleChange}
              style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white' }} />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input required type="password" name="password" placeholder="Mot de passe (min 6 car.)" onChange={handleChange}
              style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white' }} />
          </div>

          {/* Sélection TIER */}
          <div style={{ marginTop: '10px' }}>
            <label style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '5px', display: 'block' }}>Ton niveau ?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {['novice', 'moderate', 'confirmed'].map((t) => (
                <button type="button" key={t} onClick={() => setFormData({...formData, tier: t})}
                  style={{
                    padding: '10px', borderRadius: '10px', border: formData.tier === t ? '1px solid #00D9FF' : '1px solid rgba(255,255,255,0.1)',
                    background: formData.tier === t ? 'rgba(0, 217, 255, 0.2)' : 'transparent', color: formData.tier === t ? '#00D9FF' : '#94A3B8',
                    textTransform: 'capitalize', fontWeight: 'bold', cursor: 'pointer'
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Sélection BANKROLL */}
          <div>
            <label style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '5px', display: 'block' }}>Bankroll de départ (Virtuel)</label>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
              {['100', '200', '500', '1000'].map((b) => (
                <button type="button" key={b} onClick={() => setFormData({...formData, bankroll: b})}
                  style={{
                    padding: '8px 15px', borderRadius: '10px', border: formData.bankroll === b ? '1px solid #00FF7F' : '1px solid rgba(255,255,255,0.1)',
                    background: formData.bankroll === b ? 'rgba(0, 255, 127, 0.2)' : 'transparent', color: formData.bankroll === b ? '#00FF7F' : '#94A3B8',
                    fontWeight: 'bold', cursor: 'pointer', flexShrink: 0
                  }}>
                  {b} €
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{
              marginTop: '20px', padding: '15px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)', color: 'white',
              fontWeight: '900', fontSize: '1rem', cursor: 'pointer', opacity: loading ? 0.7 : 1
            }}>
            {loading ? 'Création...' : "S'INSCRIRE GRATUITEMENT"}
          </button>

        </form>
        
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#94A3B8' }}>
          Déjà un compte ? <Link to="/login" style={{ color: '#00D9FF', textDecoration: 'none' }}>Connexion</Link>
        </div>
      </div>
    </div>
  );
}