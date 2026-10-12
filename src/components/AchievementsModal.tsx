// Achievements and Daily Quests Modal

import React, { useState } from 'react';
import { Achievement, DailyQuest } from '../types';
import { sound } from '../audio/soundEngine';

interface AchievementsModalProps {
  achievements: Achievement[];
  quests: DailyQuest[];
  onClaimQuest: (questId: string) => void;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  achievements,
  quests,
  onClaimQuest,
  onClose
}) => {
  const [tab, setTab] = useState<'quests' | 'achievements'>('quests');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-pixel select-none">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-800/90 border-b border-slate-700 px-4 py-3 flex justify-between items-center">
          <h2 className="text-xs sm:text-sm text-amber-300 font-bold flex items-center gap-2">
            🎯 MISIONES Y LOGROS
          </h2>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-950/60 text-[9px]">
          <button
            onClick={() => {
              sound.playClick();
              setTab('quests');
            }}
            className={`flex-1 py-2.5 text-center font-bold transition cursor-pointer ${
              tab === 'quests'
                ? 'bg-slate-800 text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📜 MISIONES DIARIAS ({quests.filter((q) => q.completed && !q.claimed).length} Listas)
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setTab('achievements');
            }}
            className={`flex-1 py-2.5 text-center font-bold transition cursor-pointer ${
              tab === 'achievements'
                ? 'bg-slate-800 text-cyan-300 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏆 LOGROS ({achievements.filter((a) => a.unlocked).length}/{achievements.length})
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === 'quests' ? (
            <div className="space-y-2.5">
              <p className="text-[8px] text-slate-400 mb-2">
                Completa estas misiones en tus partidas de hoy para ganar monedas para la tienda.
              </p>
              {quests.map((q) => {
                const progressPct = Math.min(100, Math.round((q.current / q.target) * 100));

                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-lg border flex justify-between items-center gap-3 ${
                      q.claimed
                        ? 'bg-slate-950/60 border-slate-800 opacity-60'
                        : q.completed
                        ? 'bg-amber-950/40 border-amber-500 shadow-sm'
                        : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-100 font-bold">{q.title}</span>
                        <span className="text-[8px] text-amber-400 font-bold">+{q.rewardCoins} 🪙</span>
                      </div>
                      <p className="text-[7px] text-slate-400 mt-0.5">{q.description}</p>

                      {/* Progress Bar */}
                      <div className="mt-2 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-700">
                        <div
                          className="bg-amber-400 h-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="text-[7px] text-slate-400 mt-1">
                        Progreso: {q.current} / {q.target} ({progressPct}%)
                      </div>
                    </div>

                    <div>
                      {q.claimed ? (
                        <span className="text-[8px] text-slate-500 font-bold">RECLAMADO</span>
                      ) : q.completed ? (
                        <button
                          onClick={() => {
                            sound.playGem();
                            onClaimQuest(q.id);
                          }}
                          className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[8px] font-bold rounded shadow animate-bounce cursor-pointer"
                        >
                          RECLAMAR
                        </button>
                      ) : (
                        <span className="text-[8px] text-slate-500">EN CURSO</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-[8px] text-slate-400 mb-2">
                Desafíos permanentes que ponen a prueba tus habilidades de plataformeo.
              </p>
              {achievements.map((a) => {
                const progressPct = Math.min(100, Math.round((a.progress / a.maxProgress) * 100));

                return (
                  <div
                    key={a.id}
                    className={`p-3 rounded-lg border flex items-center gap-3 ${
                      a.unlocked
                        ? 'bg-cyan-950/40 border-cyan-500 text-slate-200'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-2xl p-1 bg-slate-950 rounded border border-slate-700">
                      {a.icon}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-100">{a.title}</span>
                        {a.unlocked && (
                          <span className="text-[7px] bg-cyan-500 text-slate-950 px-1 py-0.2 rounded font-bold">
                            DESBLOQUEADO
                          </span>
                        )}
                      </div>
                      <p className="text-[7px] text-slate-400 mt-0.5">{a.description}</p>

                      <div className="mt-2 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-700">
                        <div
                          className="bg-cyan-400 h-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[8px] text-amber-300 font-bold">+{a.rewardPoints} 🪙</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
