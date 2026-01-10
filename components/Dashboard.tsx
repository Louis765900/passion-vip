import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { UserStats } from '../types.ts';

interface DashboardProps {
  stats: UserStats;
}

const chartData = [
  { name: 'Lun', profit: 0 },
  { name: 'Mar', profit: 10 },
  { name: 'Mer', profit: -5 },
  { name: 'Jeu', profit: 25 },
  { name: 'Ven', profit: 45 },
  { name: 'Sam', profit: 80 },
  { name: 'Dim', profit: 120 },
];

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-6">Tableau de Bord <span className="text-cyber-cyan">Performance</span></h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-cyber-panel p-6 rounded-xl border border-gray-800 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-cyber-cyan/10 rounded-full group-hover:bg-cyber-cyan/20 transition-all"></div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider z-10 relative">Profit Total (u)</p>
          <p className={`text-3xl font-bold mt-2 z-10 relative ${stats.profit >= 0 ? 'text-green-400' : 'text-red-500'}`}>
            {stats.profit > 0 ? '+' : ''}{stats.profit.toFixed(1)}u
          </p>
        </div>

        <div className="bg-cyber-panel p-6 rounded-xl border border-gray-800 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-cyber-pink/10 rounded-full group-hover:bg-cyber-pink/20 transition-all"></div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider z-10 relative">Win Rate</p>
          <p className="text-3xl font-bold text-cyber-pink mt-2 z-10 relative">{stats.winRate}%</p>
          <p className="text-[10px] text-gray-500 mt-1">{stats.wonBets}/{stats.totalBets} paris gagnés</p>
        </div>

        <div className="bg-cyber-panel p-6 rounded-xl border border-gray-800 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-cyber-blue/10 rounded-full group-hover:bg-cyber-blue/20 transition-all"></div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider z-10 relative">Série Actuelle</p>
          <p className="text-3xl font-bold text-cyber-blue mt-2 z-10 relative">{stats.currentStreak}</p>
          <p className="text-[10px] text-gray-500 mt-1">Victoires consécutives</p>
        </div>

        <div className="bg-cyber-panel p-6 rounded-xl border border-gray-800 flex flex-col justify-center items-center">
           <div className="text-center">
             <span className="inline-block px-3 py-1 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-xs font-bold mb-2">
               TIER ACTUEL
             </span>
             <p className="text-xl font-bold text-white">VIP MEMBER</p>
           </div>
        </div>
      </div>

      <div className="bg-cyber-panel p-6 rounded-xl border border-gray-800 h-80">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyber-cyan"></span>
          Évolution du Profit (ROI)
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: '#151725', border: '1px solid #374151', borderRadius: '8px' }}
              itemStyle={{ color: '#00d4ff' }}
            />
            <Area type="monotone" dataKey="profit" stroke="#00d4ff" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;