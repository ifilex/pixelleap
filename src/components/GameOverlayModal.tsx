// Overlay Modals for Game Over, Level Complete and Pause

import React from 'react';
import { sound } from '../audio/soundEngine';

interface GameOverlayProps {
  type: 'game_over' | 'level_complete' | 'paused';
  score: number;
  coins: number;
  level: number;
  isDaily: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onResume?: () => void;
  onRestart: () => void;
  onNextLevel?: () => void;
  onOpenShop: () => void;
  onOpenLeaderboard: () => void;
  onOpenControls: () => void;
}

export const GameOverlayModal: React.FC<GameOverlayProps> = ({
  type,
  score,
  coins,
  level,
  isDaily,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic,
  onResume,
  onRestart,
  onNextLevel,
  onOpenShop,
  onOpenLeaderboard,
  onOpenControls
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 font-pixel select-none">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-6 w-full max-w-md text-center shadow-2xl space-y-4">
        
        {/* Title */}
        {type === 'game_over' && (
          <div>
            <div className="text-3xl mb-1">💀</div>
            <h2 className="text-sm sm:text-base text-rose-400 font-bold tracking-wider">
              ¡FIN DE LA PARTIDA!
            </h2>
            <p className="text-[8px] text-slate-400 mt-1">
              {isDaily ? 'Intento del Desafío Diario registrado.' : '¡Buen intento! Cada salto te acerca al récord.'}
            </p>
          </div>
        )}

        {type === 'level_complete' && (
          <div>
            <div className="text-3xl mb-1">🎉</div>
            <h2 className="text-sm sm:text-base text-emerald-400 font-bold tracking-wider">
              ¡PORTAL ALCANZADO!
            </h2>
            <p className="text-[8px] text-slate-400 mt-1">
              Has superado el Nivel {level}. ¡El siguiente mundo te espera!
            </p>
          </div>
        )}

        {type === 'paused' && (
          <div>
            <div className="text-2xl mb-1">⏸️</div>
            <h2 className="text-sm sm:text-base text-cyan-300 font-bold tracking-wider">
              JUEGO EN PAUSA
            </h2>
          </div>
        )}

        {/* Stats card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1.5">
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-slate-400">Puntuación:</span>
            <span className="text-amber-300 font-bold">{score.toLocaleString()} PTS</span>
          </div>
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-slate-400">Monedas conseguidas:</span>
            <span className="text-amber-400 font-bold">+{coins} 🪙</span>
          </div>
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-slate-400">Nivel alcanzado:</span>
            <span className="text-cyan-300 font-bold">Nivel {level}</span>
          </div>
        </div>

        {/* Sound toggles (especially useful in pause) */}
        <div className="flex justify-center gap-3 py-1">
          <button
            onClick={() => {
              sound.playClick();
              onToggleMusic();
            }}
            className={`px-3 py-1 rounded text-[8px] border cursor-pointer font-bold ${
              musicEnabled ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            🎵 Música {musicEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onToggleSound();
            }}
            className={`px-3 py-1 rounded text-[8px] border cursor-pointer font-bold ${
              soundEnabled ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            🔊 Sonidos {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {type === 'paused' && onResume && (
            <button
              onClick={() => {
                sound.playClick();
                onResume();
              }}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[9px] font-bold rounded shadow cursor-pointer transition"
            >
              ▶ CONTINUAR
            </button>
          )}

          {type === 'level_complete' && onNextLevel && (
            <button
              onClick={() => {
                sound.playClick();
                onNextLevel();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-[9px] font-bold rounded shadow cursor-pointer transition"
            >
              AVANZAR AL NIVEL {level + 1} ➔
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[9px] font-bold rounded shadow cursor-pointer transition"
          >
            🔄 {type === 'game_over' ? 'JUGAR DE NUEVO' : 'REINICIAR PARTIDA'}
          </button>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => {
                sound.playClick();
                onOpenShop();
              }}
              className="py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[8px] font-bold rounded cursor-pointer"
            >
              🛍️ Tienda
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenLeaderboard();
              }}
              className="py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[8px] font-bold rounded cursor-pointer"
            >
              🏆 Ranking
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenControls();
              }}
              className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[8px] font-bold rounded cursor-pointer"
            >
              ⚙️ Ajustes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
