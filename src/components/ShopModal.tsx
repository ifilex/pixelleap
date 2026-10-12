// Cosmetics & Skins Shop Modal for Pixel Leap 2D

import React, { useEffect, useRef, useState } from 'react';
import { COSMETIC_CATALOG } from '../services/cloudStorage';
import { PixelRenderer } from '../game/pixelSprites';
import { sound } from '../audio/soundEngine';

interface ShopModalProps {
  coins: number;
  gems: number;
  unlockedSkins: string[];
  selectedSkin: string;
  discountSkinId?: string;
  discountPercent?: number;
  onBuySkin: (skinId: string) => boolean;
  onEquipSkin: (skinId: string) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  coins,
  gems,
  unlockedSkins,
  selectedSkin,
  discountSkinId,
  discountPercent,
  onBuySkin,
  onEquipSkin,
  onClose
}) => {
  const [activePreviewSkin, setActivePreviewSkin] = useState<string>(selectedSkin);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Animated Pixel Preview on Canvas
  useEffect(() => {
    let step = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    const loop = () => {
      step++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle pedestal
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(20, 92, 88, 8);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(24, 90, 80, 2);

      // Draw Player animated
      PixelRenderer.drawPlayer(ctx, {
        x: 52,
        y: 62 + (Math.sin(step * 0.1) * 2),
        width: 24,
        height: 32,
        facing: 1,
        state: Math.floor(step / 30) % 2 === 0 ? 'idle' : 'run',
        animFrame: Math.floor(step / 6),
        skinId: activePreviewSkin,
        invulnerableTimer: 0
      });

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [activePreviewSkin]);

  const selectedSkinData = COSMETIC_CATALOG.find((c) => c.id === activePreviewSkin) || COSMETIC_CATALOG[0];
  const isUnlocked = unlockedSkins.includes(activePreviewSkin);
  const isEquipped = selectedSkin === activePreviewSkin;

  // Calculate price taking active discount into account
  const rawPrice = selectedSkinData.price;
  const hasDiscount = discountSkinId === activePreviewSkin && discountPercent && discountPercent > 0;
  const finalPrice = hasDiscount ? Math.round(rawPrice * (1 - discountPercent! / 100)) : rawPrice;
  const canAfford = coins >= finalPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-pixel select-none">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800/90 border-b border-slate-700 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-xs sm:text-sm text-amber-300 font-bold flex items-center gap-2">
              🛍️ TIENDA DE ASPECTOS COSMÉTICOS
            </h2>
          </div>
          {/* User Currency Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-full border border-amber-500/50 text-[10px]">
              <span className="text-amber-400">🪙</span>
              <span className="text-amber-300 font-bold">{coins}</span>
            </div>
            {gems > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-full border border-cyan-500/50 text-[10px]">
                <span className="text-cyan-400">💎</span>
                <span className="text-cyan-300 font-bold">{gems}</span>
              </div>
            )}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="text-slate-400 hover:text-white text-base cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body: Left Preview, Right Grid */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 sm:grid-cols-3 p-4 gap-4">
          
          {/* Left: Interactive Live Avatar Preview */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-between text-center">
            <div>
              <span className="text-[8px] uppercase tracking-wider text-slate-400">Vista Previa</span>
              <h3 className="text-xs text-cyan-300 font-bold mt-1">{selectedSkinData.name}</h3>
              <span className={`text-[7px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                selectedSkinData.rarity === 'legendary' ? 'bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-500' :
                selectedSkinData.rarity === 'epic' ? 'bg-purple-950 text-purple-300 border border-purple-500' :
                selectedSkinData.rarity === 'rare' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500' :
                'bg-slate-800 text-slate-300'
              }`}>
                {selectedSkinData.rarity.toUpperCase()}
              </span>
            </div>

            {/* Canvas Viewport */}
            <div className="my-2 bg-slate-900/60 rounded-lg p-2 border border-slate-800">
              <canvas
                ref={canvasRef}
                width={128}
                height={110}
                className="pixel-art"
              />
            </div>

            <p className="text-[8px] text-slate-400 leading-relaxed max-w-[180px]">
              {selectedSkinData.description}
            </p>

            {/* Action button */}
            <div className="w-full mt-3">
              {isEquipped ? (
                <div className="w-full py-2 bg-emerald-950 border border-emerald-500 text-emerald-300 text-[9px] font-bold rounded text-center">
                  ✓ EQUIPADO
                </div>
              ) : isUnlocked ? (
                <button
                  onClick={() => {
                    sound.playCoin();
                    onEquipSkin(activePreviewSkin);
                  }}
                  className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[9px] font-bold rounded shadow cursor-pointer transition"
                >
                  EQUIPAR ASPECTO
                </button>
              ) : (
                <button
                  disabled={!canAfford}
                  onClick={() => {
                    const success = onBuySkin(activePreviewSkin);
                    if (success) sound.playGem();
                  }}
                  className={`w-full py-2 text-[9px] font-bold rounded shadow transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    canAfford
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <span>COMPRAR POR</span>
                  <span className="flex items-center gap-0.5">
                    {finalPrice} 🪙
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Skin Grid */}
          <div className="sm:col-span-2 overflow-y-auto space-y-2 pr-1">
            <p className="text-[8px] text-slate-400 mb-2">
              Gana monedas y gemas superando niveles y completando misiones diarias.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {COSMETIC_CATALOG.map((item) => {
                const unlocked = unlockedSkins.includes(item.id);
                const equipped = selectedSkin === item.id;
                const active = activePreviewSkin === item.id;
                const isDiscounted = discountSkinId === item.id && discountPercent && discountPercent > 0;
                const currentPrice = isDiscounted ? Math.round(item.price * (1 - discountPercent! / 100)) : item.price;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      sound.playClick();
                      setActivePreviewSkin(item.id);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between relative ${
                      active
                        ? 'bg-slate-800 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {/* Discount badge */}
                    {isDiscounted && !unlocked && (
                      <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded shadow animate-pulse">
                        -{discountPercent}%
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      {/* Color swatch dot */}
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: item.primaryColor }}
                      />
                      <span className="text-[9px] text-slate-200 font-bold truncate">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[8px]">
                      {equipped ? (
                        <span className="text-emerald-400 font-bold">En Uso</span>
                      ) : unlocked ? (
                        <span className="text-slate-400">Desbloqueado</span>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-300 font-bold">
                          {isDiscounted && (
                            <span className="line-through text-slate-500 text-[7px]">{item.price}</span>
                          )}
                          <span>{currentPrice} 🪙</span>
                        </div>
                      )}

                      <span className="text-[7px] text-slate-500 uppercase">
                        {item.rarity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
