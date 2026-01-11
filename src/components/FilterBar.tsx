// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

const leagues = [
  { code: 'ALL', label: '🌍 Tous' },
  { code: 'FL1', label: '🇫🇷 Ligue 1' },
  { code: 'PL', label: '🇬🇧 Premier League' },
  { code: 'PD', label: '🇪🇸 La Liga' },
  { code: 'SA', label: '🇮🇹 Serie A' },
  { code: 'BL1', label: '🇩🇪 Bundesliga' },
  { code: 'CL', label: '🇪🇺 Champions League' },
  { code: 'EL', label: '🇪🇺 Europa League' },
];

export default function FilterBar({ selectedLeague, setSelectedLeague }) {
  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      overflowX: 'auto',
      paddingBottom: '5px',
      marginBottom: '15px',
      scrollbarWidth: 'none', // Cache scrollbar Firefox
      msOverflowStyle: 'none', // Cache scrollbar IE
      cursor: 'grab'
    }}>
      {/* Hack CSS pour cacher la scrollbar sur Chrome/Safari */}
      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>

      {leagues.map((league) => (
        <motion.button
          key={league.code}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedLeague(league.code)}
          style={{
            background: selectedLeague === league.code 
              ? 'linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)' 
              : 'rgba(30, 41, 59, 0.70)',
            color: selectedLeague === league.code ? 'white' : '#94A3B8',
            border: selectedLeague === league.code ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '8px 16px',
            borderRadius: '20px',
            whiteSpace: 'nowrap',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: selectedLeague === league.code ? '0 4px 15px rgba(0, 217, 255, 0.3)' : 'none',
            flexShrink: 0, // Empêche les boutons de s'écraser
            backdropFilter: 'blur(10px)'
          }}
        >
          {league.label}
        </motion.button>
      ))}
    </div>
  );
}