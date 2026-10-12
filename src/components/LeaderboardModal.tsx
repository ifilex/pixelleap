// Global & Daily Leaderboards Modal

import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { cloudService, COSMETIC_CATALOG } from '../services/cloudStorage';
import { sound } from '../audio/soundEngine';

interface LeaderboardModalProps {
  currentUserId: string;
  currentScore: number;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  currentUserId,
  currentScore,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'global' | 'daily' | 'friends'>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [friendCode, setFriendCode] = useState('');

  const loadScores = async (mode: 'global' | 'daily') => {
    setIsLoading(true);
    const data = await cloudService.getLeaderboard(mode);
    setEntries(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'global') {
      loadScores('global');
    } else if (activeTab === 'daily') {
      loadScores('daily');
    }
  }, [activeTab]);

  const getSkinName = (skinId: string) => {
    const s = COSMETIC_CATALOG.find((c) => c.id === skinId);
    return s ? s.name : 'Pixel Bob';
  };

  const filteredEntries = activeTab === 'friends'
    ? entries.filter((e) => !friendCode || e.username.toLowerCase().includes(friendCode.toLowerCase()) || e.userId === currentUserId)
    : entries;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-pixel select-none">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-800/90 border-b border-slate-700 px-4 py-3 flex justify-between items-center">
          <h2 className="text-xs sm:text-sm text-cyan-300 font-bold flex items-center gap-2">
            🏆 TABLAS DE CLASIFICACIÓN MUNDIAL
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
              setActiveTab('global');
            }}
            className={`flex-1 py-2.5 text-center font-bold transition cursor-pointer ${
              activeTab === 'global'
                ? 'bg-slate-800 text-cyan-300 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌍 GLOBAL
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('daily');
            }}
            className={`flex-1 py-2.5 text-center font-bold transition cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-slate-800 text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌟 DESAFÍO DIARIO
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('friends');
            }}
            className={`flex-1 py-2.5 text-center font-bold transition cursor-pointer ${
              activeTab === 'friends'
                ? 'bg-slate-800 text-purple-300 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👥 AMIGOS
          </button>
        </div>

        {/* Friends Filter input */}
        {activeTab === 'friends' && (
          <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Buscar por nombre o ID de amigo..."
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1 text-[9px] text-slate-100 placeholder:text-slate-600"
            />
            <button
              onClick={() => loadScores('global')}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[8px] font-bold rounded cursor-pointer"
            >
              BUSCAR
            </button>
          </div>
        )}

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="py-12 text-center text-[10px] text-slate-500 animate-pulse">
              Cargando clasificaciones mundiales...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-12 text-center text-[10px] text-slate-500">
              Aún no hay puntuaciones registradas en este modo. ¡Sé el primero en jugar!
            </div>
          ) : (
            filteredEntries.map((entry, index) => {
              const isCurrentUser = entry.userId === currentUserId;
              const rank = index + 1;

              return (
                <div
                  key={entry.id || index}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-[9px] transition ${
                    isCurrentUser
                      ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-sm'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className="w-6 text-center font-bold">
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </div>

                    {/* Player Info */}
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{entry.username}</span>
                        {isCurrentUser && (
                          <span className="text-[7px] bg-cyan-500 text-slate-950 px-1 py-0.2 rounded font-bold">
                            TÚ
                          </span>
                        )}
                      </div>
                      <div className="text-[7px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Nivel {entry.level}</span>
                        <span>•</span>
                        <span>{getSkinName(entry.skinId)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-amber-300 font-bold">
                      {entry.score.toLocaleString()} PTS
                    </div>
                    <div className="text-[7px] text-slate-500">{entry.date}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-800/90 border-t border-slate-700 px-4 py-2.5 flex justify-between items-center text-[8px] text-slate-400">
          <span>Tu puntuación actual: <strong className="text-cyan-300">{currentScore.toLocaleString()}</strong></span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
