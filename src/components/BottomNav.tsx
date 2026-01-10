import React from 'react';
import { Home, Ticket, Trophy, User } from 'lucide-react';
import { motion } from 'framer-motion';

// On définit les onglets du menu
const tabs = [
  { id: 'home', icon: Home, label: 'Accueil' },
  { id: 'vip', icon: Ticket, label: 'Pronos VIP' },
  { id: 'live', icon: Trophy, label: 'Live' },
  { id: 'profile', icon: User, label: 'Profil' },
];

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <div className="glass-panel" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '80px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingBottom: '15px',
      zIndex: 1000,
      borderTopLeftRadius: '20px',
      borderTopRightRadius: '20px',
      borderBottom: 'none'
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: isActive ? '#00D9FF' : '#94A3B8',
              position: 'relative',
              width: '60px'
            }}
          >
            <motion.div
              animate={{ scale: isActive ? 1.2 : 1, y: isActive ? -2 : 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </motion.div>

            <span style={{ fontSize: '10px', fontWeight: isActive ? '600' : '400' }}>
              {tab.label}
            </span>

            {isActive && (
              <motion.div
                layoutId="nav-light"
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: '#00D9FF',
                  boxShadow: '0 0 10px #00D9FF'
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}