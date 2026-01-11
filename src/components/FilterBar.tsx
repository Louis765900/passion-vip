// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

// Liste des ligues avec les VRAIS logos officiels
const leagues = [
  { code: 'ALL', label: 'Tous', image: null, icon: Globe },
  { code: 'PL', label: 'Premier League', image: 'https://media.api-sports.io/football/leagues/39.png' },
  { code: 'PD', label: 'La Liga', image: 'https://media.api-sports.io/football/leagues/140.png' },
  { code: 'SA', label: 'Serie A', image: 'https://media.api-sports.io/football/leagues/135.png' },
  { code: 'BL1', label: 'Bundesliga', image: 'https://media.api-sports.io/football/leagues/78.png' },
  { code: 'FL1', label: 'Ligue 1', image: 'https://media.api-sports.io/football/leagues/61.png' },
  { code: 'CL', label: 'Champions League', image: 'https://media.api-sports.io/football/leagues/2.png' },
  { code: 'EL', label: 'Europa League', image: 'https://media.api-sports.io/football/leagues/3.png' },
];

export default function FilterBar({ selectedLeague, setSelectedLeague }) {
  return (
    <div style={{
      display: 'flex',
      gap: '12px', // Un peu plus d'espace entre les boutons
      overflowX: 'auto',
      paddingBottom: '10px', // Espace pour l'ombre
      marginBottom: '10px',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      cursor: 'grab',
      paddingLeft: '5px' // Petit padding au début
    }}>
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>

      {leagues.map((league) => {
        const Icon = league.icon;
        const isSelected = selectedLeague === league.code;
        
        return (
        <motion.button
          key={league.code}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedLeague(league.code)}
          style={{
            // Fond dégradé si actif, sinon verre fumé sombre
            background: isSelected 
              ? 'linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)' 
              : 'rgba(15, 23, 42, 0.6)', 
            color: 'white',
            // Bordure lumineuse si actif
            border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '10px 16px',
            borderRadius: '16px', // Coins plus arrondis
            whiteSpace: 'nowrap',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            // Ombre portée néon si actif
            boxShadow: isSelected ? '0 4px 20px rgba(0, 217, 255, 0.4)' : 'none',
            flexShrink: 0,
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px', // Espace entre logo et texte
            transition: 'all 0.2s ease'
          }}
        >
          {/* Affichage du logo officiel ou de l'icône Globe pour "Tous" */}
          {league.image ? (
            <img src={league.image} alt={league.label} style={{ width: '24px', height: '24px', objectFit: 'contain', filter: isSelected ? 'none' : 'grayscale(100%) brightness(1.5)' }} />
          ) : (
            <Icon size={20} color={isSelected ? 'white' : '#94A3B8'} />
          )}
          
          <span style={{ color: isSelected ? 'white' : (league.image ? 'white' : '#94A3B8') }}>
            {league.label}
          </span>
        </motion.button>
      )})}
    </div>
  );
}