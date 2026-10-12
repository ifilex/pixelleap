// Daily Challenge Banner & Info Widget

import React from 'react';
import { DailyChallengeData } from '../types';
import { sound } from '../audio/soundEngine';

interface DailyChallengeBannerProps {
  data: DailyChallengeData | null;
  dailyHighScore: number;
  onPlayDaily: () => void;
}

export const DailyChallengeBanner: React.FC<DailyChallengeBannerProps> = ({
  data,
  dailyHighScore,
  onPlayDaily
}) => {
  if (!data) return null;

  return (
    <div className="bg-gradient-to-r from-amber-950/60 via-slate-900/90 to-purple-950/60 border border-amber-500/50 rounded-xl p-3 sm:p-4 font-pixel select-none shadow-xl flex flex-col sm:flex-row justify-between items-center gap-3">
      <div className="space-y-1 text-center sm:text-left">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <span className="text-amber-400 text-xs">🌟</span>
          <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
            DESAFÍO DIARIO MUNDIAL ({data.date})
          </span>
        </div>
        <div className="text-xs text-white font-bold">
          Modificador: <span className="text-cyan-400">{data.modifier.name}</span>
        </div>
        <p className="text-[8px] text-slate-300 max-w-md leading-relaxed">
          {data.modifier.desc}
        </p>
        <div className="text-[7px] text-amber-400 flex items-center gap-3 pt-0.5">
          <span>🎯 Récord de hoy: <strong>{dailyHighScore} PTS</strong></span>
          <span>•</span>
          <span>🎁 Recompensa: <strong>+{data.modifier.rewardCoins} Monedas</strong></span>
        </div>
      </div>

      <button
        onClick={() => {
          sound.playClick();
          onPlayDaily();
        }}
        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-[9px] font-bold rounded-lg shadow-lg hover:scale-102 active:scale-98 transition cursor-pointer shrink-0"
      >
        JUGAR DESAFÍO DIARIO ➔
      </button>
    </div>
  );
};
