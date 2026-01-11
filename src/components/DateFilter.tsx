// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

export default function DateFilter({ selectedDate, setSelectedDate }) {
  const dates = [];
  
  // Option "TOUS"
  dates.push({ value: 'ALL', label: '📅 Tous' });

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split('T')[0];
    
    let label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    if (i === 0) label = "Aujourd'hui";
    if (i === 1) label = "Demain";

    dates.push({ value, label });
  }

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      paddingBottom: '10px',
      marginBottom: '10px',
      scrollbarWidth: 'none',
      cursor: 'grab',
      paddingLeft: '5px'
    }}>
      {/* Hack Scrollbar */}
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>

      {dates.map((date) => (
        <motion.button
          key={date.value}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedDate(date.value)}
          style={{
            background: selectedDate === date.value ? '#00D9FF' : 'rgba(30, 41, 59, 0.6)',
            color: selectedDate === date.value ? '#0F172A' : '#94A3B8',
            border: selectedDate === date.value ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '6px 12px',
            borderRadius: '10px',
            whiteSpace: 'nowrap',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            flexShrink: 0,
            backdropFilter: 'blur(5px)'
          }}
        >
          {date.label}
        </motion.button>
      ))}
    </div>
  );
}