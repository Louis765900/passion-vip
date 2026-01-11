// @ts-nocheck
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      alert("❌ Erreur : " + error.message);
    } else {
      navigate('/dashboard'); // Direction le jeu !
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '30px', borderRadius: '24px' }}>
        <h1 style={{ textAlign: 'center', color: 'white', marginBottom: '30px' }}>
          CONNEXION <span style={{ color: '#00D9FF' }}>VIP</span>
        </h1>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input required type="email" placeholder="Email" onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input required type="password" placeholder="Mot de passe" onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white' }} />
          </div>
          <button type="submit" disabled={loading} style={{ marginTop: '20px', padding: '15px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)', color: 'white', fontWeight: '900', cursor: 'pointer' }}>
            {loading ? 'Connexion...' : "SE CONNECTER"}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#94A3B8' }}>
          Pas encore membre ? <Link to="/signup" style={{ color: '#00D9FF', textDecoration: 'none' }}>Créer un compte</Link>
        </div>
      </div>
    </div>
  );
}