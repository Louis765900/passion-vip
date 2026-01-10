import React from 'react';
import { Clock, TrendingUp, Zap, Trophy, Shield } from 'lucide-react';
import { Match } from '../types.ts';

interface MatchCardProps {
  match: Match;
  onAnalyze: (match: Match) => void;
}

const TeamEmblem: React.FC<{ name: string; url?: string; align: 'left' | 'right' }> = ({ name, url, align }) => {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const gradient = align === 'left' ? 'from-cyber-blue to-purple-900' : 'from-cyber-pink to-red-900';
  
  return (
    <div className={`relative group ${align === 'right' ? 'items-end' : 'items-start'} flex flex-col`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/10 bg-gradient-to-br ${gradient} p-0.5 transition-transform duration-300 group-hover:scale-105 group-hover:border-white/30`}>
        <div className="w-full h-full bg-black/40 rounded-xl backdrop-blur-sm flex items-center justify-center overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
          
          {url ? (
            <img src={url} alt={name} className="w-10 h-10 object-contain drop-shadow-md" />
          ) : (
            <span className="text-xl font-black text-white/90 tracking-tighter">{initials}</span>
          )}
        </div>
      </div>
      <h3 className={`text-sm font-bold text-gray-100 mt-3 max-w-[100px] leading-tight ${align === 'right' ? 'text-right' : 'text-left'}`}>
        {name}
      </h3>
      <p className={`text-[10px] text-cyber-cyan mt-1 font-mono uppercase ${align === 'right' ? 'text-right' : 'text-left'}`}>
        {align === 'left' ? 'DOMICILE' : 'EXTÉRIEUR'}
      </p>
    </div>
  );
};

const MatchCard: React.FC<MatchCardProps> = ({ match, onAnalyze }) => {
  const isLive = match.status === 'LIVE' || match.status === 'IN_PLAY';
  const matchDate = new Date(match.date);

  return (
    <div className="group relative w-full">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyber-cyan/30 to-cyber-pink/30 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
      
      <div className="relative h-full flex flex-col glass-panel rounded-2xl p-0 overflow-hidden">
        
        <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center bg-black/20">
          <div className="flex items-center space-x-2">
            <Trophy className="w-3 h-3 text-yellow-500" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
              {match.league}
            </span>
          </div>
          <div className={`flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${isLive ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-gray-700 bg-gray-800/30 text-gray-400'}`}>
            {isLive ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5"></span> LIVE {match.minute}'</>
            ) : (
              <><Clock className="w-3 h-3 mr-1" /> {matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</>
            )}
          </div>
        </div>

        <div className="p-6 flex items-center justify-between relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[80px] font-black text-white/5 select-none pointer-events-none italic">VS</div>

          <TeamEmblem name={match.homeTeam.name} url={match.homeTeam.logoUrl} align="left" />

          <div className="flex flex-col items-center z-10 mx-2">
            {isLive || match.score?.home !== undefined ? (
              <div className="flex items-center space-x-3 bg-black/40 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-md">
                <span className="text-2xl font-bold text-white">{match.score?.home ?? 0}</span>
                <span className="text-gray-500">:</span>
                <span className="text-2xl font-bold text-white">{match.score?.away ?? 0}</span>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-cyber-panel border border-white/10 flex items-center justify-center shadow-lg">
                <span className="text-xs font-bold text-gray-500">VS</span>
              </div>
            )}
          </div>

          <TeamEmblem name={match.awayTeam.name} url={match.awayTeam.logoUrl} align="right" />
        </div>

        <div className="mt-auto bg-black/20 p-4 border-t border-white/5 space-y-4">
          
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center bg-cyber-panel/50 rounded p-1 border border-white/5 hover:border-cyber-cyan/30 transition-colors">
              <span className="text-[9px] text-gray-500 uppercase mb-0.5">1 ({match.homeTeam.name})</span>
              <span className="text-sm font-bold text-cyber-cyan">{match.odds.home}</span>
            </div>
            <div className="flex flex-col items-center bg-cyber-panel/50 rounded p-1 border border-white/5">
              <span className="text-[9px] text-gray-500 uppercase mb-0.5">Nul</span>
              <span className="text-sm font-bold text-white">{match.odds.draw}</span>
            </div>
            <div className="flex flex-col items-center bg-cyber-panel/50 rounded p-1 border border-white/5 hover:border-cyber-pink/30 transition-colors">
              <span className="text-[9px] text-gray-500 uppercase mb-0.5">2 ({match.awayTeam.name})</span>
              <span className="text-sm font-bold text-cyber-pink">{match.odds.away}</span>
            </div>
          </div>

          <button
            onClick={() => onAnalyze(match)}
            className="w-full relative overflow-hidden rounded-lg p-[1px] group/btn focus:outline-none"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-pink opacity-70 group-hover/btn:opacity-100 transition-opacity duration-300"></span>
            <div className="relative bg-cyber-dark/90 hover:bg-cyber-dark/80 text-white h-full px-4 py-2.5 rounded-[7px] flex items-center justify-center transition-colors">
              <Zap className="w-4 h-4 mr-2 text-yellow-400 group-hover/btn:animate-pulse" />
              <span className="text-sm font-bold tracking-wide">ANALYSE IA VIP</span>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default MatchCard;