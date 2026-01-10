import React, { useEffect, useState } from 'react';
import { X, Brain, AlertTriangle, Shield, Target, Flame, Save, CheckCircle, Lock } from 'lucide-react';
import { Match, AIAnalysis, BetRecommendation } from '../types.ts';
import { analyzeMatchWithGemini } from '../services/geminiService.ts';

interface AnalysisModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  isVip: boolean;
  onSavePrediction: (match: Match, prediction: BetRecommendation) => void;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ match, isOpen, onClose, isVip, onSavePrediction }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [savedBetIndex, setSavedBetIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && match) {
      setLoading(true);
      setAnalysis(null);
      setSavedBetIndex(null);
      analyzeMatchWithGemini(match, isVip)
        .then(data => {
          setAnalysis(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, match, isVip]);

  if (!isOpen || !match) return null;

  const handleSave = (pred: BetRecommendation, index: number) => {
    onSavePrediction(match, pred);
    setSavedBetIndex(index);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-cyber-dark w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cyber-cyan/30 shadow-[0_0_50px_rgba(0,212,255,0.1)] relative">
        
        <div className="sticky top-0 bg-cyber-dark/95 backdrop-blur border-b border-gray-800 p-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <Brain className="text-cyber-pink w-6 h-6 animate-pulse" />
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-white tracking-tight">NEURAL ANALYSE</h2>
              <span className="text-[10px] text-cyber-cyan font-mono uppercase tracking-widest">{match.homeTeam.name} vs {match.awayTeam.name}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800/50 p-2 rounded-full hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-cyber-cyan/30 rounded-full animate-spin"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-t-cyber-cyan border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                 <p className="text-cyber-cyan font-bold font-mono text-lg animate-pulse">EXTRACTION DES DONNÉES...</p>
                 <p className="text-gray-500 text-sm mt-2">Analyse forme, cotes et psychologie en cours.</p>
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-8">
              
              <div className="bg-gradient-to-r from-cyber-panel to-transparent border-l-4 border-cyber-cyan p-4 rounded-r-lg">
                <h3 className="text-cyber-cyan text-xs font-bold uppercase tracking-widest mb-1">SNAPSHOT</h3>
                <p className="text-lg text-white font-medium leading-relaxed">
                  {analysis.snapshot}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysis.predictions.map((pred, idx) => {
                  let borderColor = 'border-gray-700';
                  let icon = <Target className="w-5 h-5" />;
                  let titleColor = 'text-gray-300';
                  let bgGradient = 'from-gray-900';

                  if (pred.type === 'BANKER') {
                    borderColor = 'border-green-500';
                    icon = <Shield className="w-5 h-5 text-green-400" />;
                    titleColor = 'text-green-400';
                    bgGradient = 'from-green-900/20';
                  } else if (pred.type === 'VALUE') {
                    borderColor = 'border-cyber-cyan';
                    icon = <Target className="w-5 h-5 text-cyber-cyan" />;
                    titleColor = 'text-cyber-cyan';
                    bgGradient = 'from-cyan-900/20';
                  } else if (pred.type === 'LONG_SHOT') {
                    borderColor = 'border-cyber-pink';
                    icon = <Flame className="w-5 h-5 text-cyber-pink" />;
                    titleColor = 'text-cyber-pink';
                    bgGradient = 'from-pink-900/20';
                  }

                  return (
                    <div key={idx} className={`relative bg-gradient-to-b ${bgGradient} to-cyber-panel border ${borderColor} rounded-xl p-4 flex flex-col h-full shadow-lg group hover:scale-[1.02] transition-transform duration-300`}>
                      <div className="flex items-center gap-2 mb-3">
                        {icon}
                        <span className={`font-bold text-sm uppercase tracking-wider ${titleColor}`}>{pred.type.replace('_', ' ')}</span>
                      </div>
                      
                      <div className="mb-4 flex-grow">
                        <div className="text-xl font-bold text-white mb-1">{pred.selection}</div>
                        <div className="flex items-center gap-2">
                           <span className="bg-black/30 px-2 py-0.5 rounded text-xs text-gray-400 border border-gray-700">Cote: <span className="text-white font-bold">{pred.odds}</span></span>
                           <span className="bg-black/30 px-2 py-0.5 rounded text-xs text-gray-400 border border-gray-700">Conf: <span className={`${pred.confidence > 70 ? 'text-green-400' : 'text-yellow-400'} font-bold`}>{pred.confidence}%</span></span>
                        </div>
                        <p className="text-xs text-gray-400 mt-3 italic border-t border-gray-800/50 pt-2">{pred.reasoning}</p>
                      </div>

                      <button 
                        onClick={() => handleSave(pred, idx)}
                        disabled={savedBetIndex === idx}
                        className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                          savedBetIndex === idx 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                        }`}
                      >
                        {savedBetIndex === idx ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> ENREGISTRÉ</>
                        ) : (
                          <><Save className="w-3 h-3 mr-1" /> SAUVEGARDER</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-cyber-panel p-5 rounded-xl border border-gray-800">
                    <h3 className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center">
                      <Target className="w-3 h-3 mr-1" /> SCÉNARIO DE MATCH
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {analysis.scenario}
                    </p>
                 </div>
                 <div className="bg-cyber-panel p-5 rounded-xl border border-red-900/30">
                    <h3 className="text-red-400 text-xs font-bold uppercase mb-2 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" /> GESTION DES RISQUES
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {analysis.riskManagement}
                    </p>
                 </div>
              </div>

              <div className={`rounded-xl p-5 border relative overflow-hidden ${isVip ? 'bg-gradient-to-r from-cyber-blue/20 to-cyber-pink/20 border-cyber-pink/50' : 'bg-gray-900 border-gray-800'}`}>
                {!isVip && (
                  <div className="absolute inset-0 backdrop-blur-[4px] bg-black/60 z-10 flex flex-col items-center justify-center text-center p-4">
                    <Lock className="w-8 h-8 text-cyber-pink mb-2" />
                    <p className="text-white font-bold tracking-wider">ZONE VIP VERROUILLÉE</p>
                    <p className="text-xs text-gray-400 mt-1">Accédez aux insights exclusifs et handicaps.</p>
                  </div>
                )}
                
                <div className="relative z-0">
                  <h3 className="text-cyber-pink font-bold text-sm uppercase tracking-widest mb-2 flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    CONSEIL EXPERT (VIP)
                  </h3>
                  <p className="text-white text-lg font-mono">
                    {analysis.vipAdvice || "Hidden content"}
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-red-500 text-center py-10">
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              Impossible de générer l'analyse. Vérifiez votre connexion.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;