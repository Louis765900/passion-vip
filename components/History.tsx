import React from 'react';
import { StoredPrediction, PredictionStatus } from '../types.ts';
import { CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';

interface HistoryProps {
  predictions: StoredPrediction[];
  onUpdateStatus: (id: string, status: PredictionStatus) => void;
  onDelete: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ predictions, onUpdateStatus, onDelete }) => {
  if (predictions.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p>Aucun pronostic enregistré.</p>
        <p className="text-sm">Lancez une analyse pour sauvegarder des paris.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <Clock className="w-6 h-6 mr-2 text-cyber-cyan" />
        HISTORIQUE <span className="text-cyber-dim ml-2 text-sm font-normal">({predictions.length})</span>
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {predictions.map((pred) => (
          <div key={pred.id} className="bg-cyber-panel border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-gray-700 transition-colors">
            
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  pred.type === 'BANKER' ? 'bg-green-900/30 text-green-400 border-green-900' :
                  pred.type === 'VALUE' ? 'bg-cyan-900/30 text-cyber-cyan border-cyan-900' :
                  'bg-pink-900/30 text-cyber-pink border-pink-900'
                }`}>
                  {pred.type.replace('_', ' ')}
                </span>
                <span className="text-gray-500 text-xs">{new Date(pred.date).toLocaleDateString()}</span>
              </div>
              <h3 className="font-bold text-white text-lg">{pred.selection}</h3>
              <p className="text-sm text-gray-400 mb-1">{pred.matchTitle}</p>
              <div className="text-xs text-gray-500">Cote: <span className="text-gray-300 font-bold">{pred.odds}</span></div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {pred.status === PredictionStatus.PENDING ? (
                <>
                  <button 
                    onClick={() => onUpdateStatus(pred.id, PredictionStatus.WON)}
                    className="flex-1 md:flex-none px-3 py-2 bg-green-900/20 text-green-500 hover:bg-green-900/40 rounded-lg text-xs font-bold transition-colors border border-green-900/50"
                  >
                    GAGNÉ
                  </button>
                  <button 
                    onClick={() => onUpdateStatus(pred.id, PredictionStatus.LOST)}
                    className="flex-1 md:flex-none px-3 py-2 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-lg text-xs font-bold transition-colors border border-red-900/50"
                  >
                    PERDU
                  </button>
                </>
              ) : (
                <div className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center ${
                  pred.status === PredictionStatus.WON ? 'text-green-400 bg-green-900/10 border border-green-900/50' : 'text-red-400 bg-red-900/10 border border-red-900/50'
                }`}>
                  {pred.status === PredictionStatus.WON ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                  {pred.status === PredictionStatus.WON ? 'GAGNÉ' : 'PERDU'}
                </div>
              )}
              
              <button 
                onClick={() => onDelete(pred.id)}
                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;