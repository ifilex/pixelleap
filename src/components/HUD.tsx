// HUD Component for Pixel Leap 2D

import React from 'react';
import { DailyModifier } from '../types';
import { sound } from '../audio/soundEngine';

interface HUDProps {
  health: number;
  maxHealth: number;
  score: number;
  coins: number;
  gems: number;
  level: number;
  biomeName: string;
  combo: number;
  isDailyChallenge: boolean;
  dailyModifier?: DailyModifier;
  isTouchDetected: boolean;
  touchEnabled: boolean;
  cloudSynced: boolean;
  unreadNotificationsCount: number;
  onToggleTouch: () => void;
  onTogglePause: () => void;
  onOpenNotifications: () => void;
  onOpenShop: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  health,
  maxHealth,
  score,
  coins,
  gems,
  level,
  biomeName,
  combo,
  isDailyChallenge,
  dailyModifier,
  isTouchDetected,
  touchEnabled,
  cloudSynced,
  unreadNotificationsCount,
  onToggleTouch,
  onTogglePause,
  onOpenNotifications,
  onOpenShop
}) => {
  return (
    <div
      id="game-hud"
      className="absolute top-0 left-0 right-0 p-3 pointer-events-none z-20 flex flex-col gap-2 font-pixel select-none"
    >
      {/* Top Bar Row */}
      <div className="flex justify-between items-center w-full">
        {/* Left: Hearts & Level info */}
        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-md backdrop-blur-xs">
          {/* Health Hearts */}
          <div className="flex items-center gap-1">
            {Array.from({ length: maxHealth }).map((_, i) => (
              <span
                key={i}
                className={`text-sm transition-transform duration-150 ${
                  i < health ? 'text-rose-500 scale-100' : 'text-slate-600 scale-90'
                }`}
              >
                ♥
              </span>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Level / Biome */}
          <div className="flex flex-col">
            <span className="text-[9px] text-cyan-400 leading-none">
              NVL {level}
            </span>
            <span className="text-[7px] text-slate-400 leading-none truncate max-w-[90px]">
              {biomeName}
            </span>
          </div>
        </div>

        {/* Center: Score & Combo */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-900/85 border border-cyan-500/50 px-4 py-1.5 rounded-lg shadow-md backdrop-blur-xs">
            <span className="text-xs text-cyan-300 font-bold tracking-wider">
              {score.toLocaleString()} PTS
            </span>
          </div>

          {combo > 1 && (
            <div className="mt-1 animate-bounce bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 px-2 py-0.5 rounded text-[8px] font-bold shadow-sm">
              COMBO {combo}x!
            </div>
          )}
        </div>

        {/* Right: Currency & Interactive Action Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Currency Pill */}
          <button
            id="hud-shop-shortcut"
            onClick={() => {
              sound.playClick();
              onOpenShop();
            }}
            className="flex items-center gap-2 bg-slate-900/80 border border-amber-500/40 px-2.5 py-1.5 rounded-lg shadow-md hover:bg-slate-800 transition cursor-pointer"
            title="Abrir Tienda"
          >
            <div className="flex items-center gap-1">
              <span className="text-amber-400 text-xs">🪙</span>
              <span className="text-[9px] text-amber-300 font-bold">{coins}</span>
            </div>
            {gems > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-cyan-400 text-xs">💎</span>
                <span className="text-[9px] text-cyan-300 font-bold">{gems}</span>
              </div>
            )}
          </button>

          {/* Touch Controls quick toggle (ONLY visible if touch device is detected) */}
          {isTouchDetected && (
            <button
              id="hud-touch-toggle"
              onClick={() => {
                sound.playClick();
                onToggleTouch();
              }}
              className={`px-2 py-1.5 rounded-lg border text-[8px] font-bold transition cursor-pointer ${
                touchEnabled
                  ? 'bg-cyan-900/70 border-cyan-400 text-cyan-200'
                  : 'bg-slate-900/70 border-slate-700 text-slate-500'
              }`}
              title="Alternar Controles Táctiles"
            >
              🕹️ {touchEnabled ? 'ON' : 'OFF'}
            </button>
          )}

          {/* Notifications / Events Bell */}
          <button
            id="hud-notif-button"
            onClick={() => {
              sound.playClick();
              onOpenNotifications();
            }}
            className="relative bg-slate-900/80 border border-slate-700 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
            title="Ofertas y Eventos"
          >
            <span>🔔</span>
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[7px] flex items-center justify-center font-bold animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Cloud Sync Status Indicator */}
          <div
            className="hidden sm:flex items-center gap-1 bg-slate-900/80 border border-slate-700 px-2 py-1.5 rounded-lg text-[7px] text-slate-400"
            title={cloudSynced ? 'Guardado en la nube sincronizado' : 'Guardado localmente'}
          >
            <span>{cloudSynced ? '☁️' : '💾'}</span>
          </div>

          {/* Pause Button */}
          <button
            id="hud-pause-button"
            onClick={() => {
              sound.playClick();
              onTogglePause();
            }}
            className="bg-slate-900/80 border border-slate-700 hover:border-slate-500 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:text-white transition cursor-pointer"
            title="Pausar / Menú"
          >
            ⏸
          </button>
        </div>
      </div>

      {/* Daily Challenge Banner Strip if in Daily mode */}
      {isDailyChallenge && dailyModifier && (
        <div className="self-center bg-amber-950/80 border border-amber-500/70 px-3 py-1 rounded-full text-[8px] text-amber-200 flex items-center gap-2 shadow-lg animate-pulse">
          <span>🌟 DESAFÍO DIARIO:</span>
          <span className="font-bold text-amber-400">{dailyModifier.name}</span>
          <span className="text-[7px] text-amber-300/80">({dailyModifier.desc})</span>
        </div>
      )}
    </div>
  );
};
