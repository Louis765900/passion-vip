import React from 'react';
import { ShieldCheck, Menu, LayoutDashboard, History as HistoryIcon, Target, Trophy, Star, Calendar } from 'lucide-react';
import { Logo } from './Logo.tsx';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  isVip: boolean;
  toggleVip: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, isVip, toggleVip }) => {
  const navItems = [
    { id: 'home', label: 'Live Center', icon: <Target className="w-4 h-4 mr-1"/> },
    { id: 'competitions', label: 'Compétitions', icon: <Trophy className="w-4 h-4 mr-1"/> },
    { id: 'favorites', label: 'Favoris', icon: <Star className="w-4 h-4 mr-1"/> },
    { id: 'calendar', label: 'Calendrier', icon: <Calendar className="w-4 h-4 mr-1"/> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 mr-1"/> },
    { id: 'history', label: 'Historique', icon: <HistoryIcon className="w-4 h-4 mr-1"/> },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-cyber-dark/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer group" onClick={() => setView('home')}>
            <Logo className="h-10 w-10 mr-3 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(0,212,255,0.3)]" />
            <span className="text-xl font-bold tracking-tighter text-white">
              LA PASSION <span className="text-cyber-pink neon-text-cyan">VIP</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                  currentView === item.id 
                    ? 'text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/30 shadow-[0_0_15px_rgba(0,212,255,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            
            <div className="h-6 w-px bg-gray-700 mx-2"></div>

            <button
              onClick={toggleVip}
              className={`flex items-center px-4 py-2 rounded-full text-xs font-bold border transition-all duration-500 ${
                isVip 
                  ? 'bg-cyber-pink/10 border-cyber-pink text-cyber-pink neon-border-pink shadow-[0_0_15px_rgba(255,0,110,0.3)]' 
                  : 'bg-transparent border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 mr-1" />
              {isVip ? 'VIP ACTIVÉ' : 'MODE GRATUIT'}
            </button>
          </div>

          <div className="md:hidden">
            <button className="text-gray-400 hover:text-white p-2">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;