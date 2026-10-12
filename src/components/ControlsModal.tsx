// Custom Controls & Cloud Save Settings Modal

import React, { useState } from 'react';
import { PlayerControls, TouchSettings } from '../types';
import { sound } from '../audio/soundEngine';

interface ControlsModalProps {
  controls: PlayerControls;
  touchSettings: TouchSettings;
  isTouchDetected: boolean;
  userId: string;
  onSaveControls: (newControls: PlayerControls) => void;
  onSaveTouchSettings: (newTouch: TouchSettings) => void;
  onRestoreCloudSave: (restoreUserId: string) => Promise<boolean>;
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({
  controls,
  touchSettings,
  isTouchDetected,
  userId,
  onSaveControls,
  onSaveTouchSettings,
  onRestoreCloudSave,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'keyboard' | 'touch' | 'cloud'>('keyboard');
  const [keyMap, setKeyMap] = useState<PlayerControls>({ ...controls });
  const [touch, setTouch] = useState<TouchSettings>({ ...touchSettings });
  const [listeningAction, setListeningAction] = useState<keyof PlayerControls | null>(null);
  
  // Cloud restore state
  const [inputCode, setInputCode] = useState('');
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Key listening effect
  const handleKeyRebind = (action: keyof PlayerControls) => {
    sound.playClick();
    setListeningAction(action);
  };

  React.useEffect(() => {
    if (!listeningAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      setKeyMap((prev) => ({
        ...prev,
        [listeningAction]: e.code
      }));
      setListeningAction(null);
      sound.playCoin();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listeningAction]);

  const handleSave = () => {
    sound.playClick();
    onSaveControls(keyMap);
    onSaveTouchSettings(touch);
    onClose();
  };

  const copyUserId = () => {
    sound.playClick();
    navigator.clipboard.writeText(userId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRestore = async () => {
    if (!inputCode.trim()) return;
    sound.playClick();
    setCloudStatus('Cargando datos...');
    const ok = await onRestoreCloudSave(inputCode.trim());
    if (ok) {
      setCloudStatus('¡Datos restaurados con éxito!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setCloudStatus('Error: No se encontró partida en la nube con ese código.');
    }
  };

  const actionLabels: Record<keyof PlayerControls, string> = {
    left: 'Mover Izquierda',
    right: 'Mover Derecha',
    jump: 'Saltar',
    dash: 'Air Dash',
    stomp: 'Pisotón (Caer Rápido)',
    pause: 'Pausa / Menú'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-pixel select-none">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-800/90 border-b border-slate-700 px-4 py-3 flex justify-between items-center">
          <h2 className="text-xs sm:text-sm text-cyan-300 font-bold flex items-center gap-2">
            ⚙️ CONTROLES Y GUARDADO
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

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-700 bg-slate-950/60 text-[9px]">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('keyboard');
            }}
            className={`flex-1 py-2.5 text-center font-bold transition cursor-pointer ${
              activeTab === 'keyboard'
                ? 'bg-slate-800 text-cyan-300 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⌨️ TECLADO
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('touch');
            }}
            className={`flex-1 py-2.5 text-center font-bold transition cursor-pointer ${
              activeTab === 'touch'
                ? 'bg-slate-800 text-cyan-300 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📱 TÁCTIL {isTouchDetected && '✓'}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('cloud');
            }}
            className={`flex-1 py-2.5 text-center font-bold transition cursor-pointer ${
              activeTab === 'cloud'
                ? 'bg-slate-800 text-cyan-300 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ☁️ NUBE
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'keyboard' && (
            <div className="space-y-2.5">
              <p className="text-[8px] text-slate-400 mb-2">
                Haz clic en una acción y presiona la tecla que deseas asignar.
              </p>
              {(Object.keys(actionLabels) as Array<keyof PlayerControls>).map((action) => (
                <div
                  key={action}
                  className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60"
                >
                  <span className="text-[9px] text-slate-200">{actionLabels[action]}</span>
                  <button
                    onClick={() => handleKeyRebind(action)}
                    className={`px-3 py-1.5 rounded text-[8px] font-bold border transition cursor-pointer ${
                      listeningAction === action
                        ? 'bg-amber-500/30 border-amber-400 text-amber-300 animate-pulse'
                        : 'bg-slate-700 hover:bg-slate-600 border-slate-500 text-slate-100'
                    }`}
                  >
                    {listeningAction === action ? 'Presiona Tecla...' : keyMap[action]}
                  </button>
                </div>
              ))}

              <div className="pt-2 flex justify-between items-center text-[8px] text-slate-400">
                <span>Presets rápidos:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setKeyMap({
                        left: 'ArrowLeft',
                        right: 'ArrowRight',
                        jump: 'Space',
                        dash: 'KeyZ',
                        stomp: 'ArrowDown',
                        pause: 'Escape'
                      });
                    }}
                    className="px-2 py-1 bg-slate-800 rounded border border-slate-700 hover:border-slate-500 cursor-pointer text-slate-300"
                  >
                    Flechas
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setKeyMap({
                        left: 'KeyA',
                        right: 'KeyD',
                        jump: 'KeyW',
                        dash: 'KeyJ',
                        stomp: 'KeyS',
                        pause: 'Escape'
                      });
                    }}
                    className="px-2 py-1 bg-slate-800 rounded border border-slate-700 hover:border-slate-500 cursor-pointer text-slate-300"
                  >
                    WASD
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'touch' && (
            <div className="space-y-4">
              {!isTouchDetected && (
                <div className="p-2.5 bg-amber-950/40 border border-amber-600/50 rounded-lg text-[8px] text-amber-300">
                  ℹ️ Nota: No se ha detectado una pantalla táctil en este dispositivo. Los controles táctiles permanecen ocultos automáticamente durante la partida, pero puedes configurar tus preferencias aquí.
                </div>
              )}

              {/* Enable / Disable Toggle */}
              <div className="flex justify-between items-center bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                <div>
                  <div className="text-[10px] text-slate-200 font-bold">Activar Pantalla Táctil</div>
                  <div className="text-[7px] text-slate-400">Muestra los botones y joystick transparentes</div>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    setTouch((prev) => ({ ...prev, enabled: !prev.enabled }));
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    touch.enabled ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      touch.enabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Opacity / Transparency Slider */}
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-200">Transparencia / Opacidad:</span>
                  <span className="text-[9px] text-cyan-400 font-bold">{Math.round(touch.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={touch.opacity}
                  onChange={(e) => setTouch((prev) => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[7px] text-slate-500">
                  <span>Ultra Transparente (10%)</span>
                  <span>Opaco (90%)</span>
                </div>
              </div>

              {/* Control Type: Joystick vs DPad */}
              <div className="flex justify-between items-center bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                <span className="text-[9px] text-slate-200">Tipo de Dirección:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setTouch((prev) => ({ ...prev, controlType: 'joystick' }));
                    }}
                    className={`px-2.5 py-1.5 rounded text-[8px] font-bold border cursor-pointer ${
                      touch.controlType === 'joystick'
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                        : 'bg-slate-700 border-slate-600 text-slate-400'
                    }`}
                  >
                    🕹️ Joystick
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setTouch((prev) => ({ ...prev, controlType: 'dpad' }));
                    }}
                    className={`px-2.5 py-1.5 rounded text-[8px] font-bold border cursor-pointer ${
                      touch.controlType === 'dpad'
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                        : 'bg-slate-700 border-slate-600 text-slate-400'
                    }`}
                  >
                    ◀ ▶ D-Pad
                  </button>
                </div>
              </div>

              {/* Haptics */}
              <div className="flex justify-between items-center bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                <span className="text-[9px] text-slate-200">Vibración Háptica:</span>
                <button
                  onClick={() => {
                    sound.playClick();
                    setTouch((prev) => ({ ...prev, haptics: !prev.haptics }));
                  }}
                  className={`px-2.5 py-1 rounded text-[8px] font-bold border cursor-pointer ${
                    touch.haptics
                      ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                      : 'bg-slate-700 border-slate-600 text-slate-400'
                  }`}
                >
                  {touch.haptics ? 'ACTIVADA' : 'DESACTIVADA'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="space-y-4">
              {/* My Cloud Code */}
              <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700 space-y-2">
                <div className="text-[10px] text-slate-200 font-bold">Tu Código Único de Nube</div>
                <div className="text-[7px] text-slate-400">
                  Usa este código para restaurar tus monedas, aspectos desbloqueados y récords en cualquier otro móvil o navegador.
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    readOnly
                    value={userId}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-cyan-300 font-mono"
                  />
                  <button
                    onClick={copyUserId}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[8px] font-bold rounded cursor-pointer"
                  >
                    {isCopied ? '¡COPIADO!' : 'COPIAR'}
                  </button>
                </div>
              </div>

              {/* Restore Cloud Save */}
              <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700 space-y-2">
                <div className="text-[10px] text-slate-200 font-bold">Restaurar Partida Guardada</div>
                <div className="text-[7px] text-slate-400">
                  Pega el código de otra sesión para descargar tu progreso de la nube.
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="px_xxxxxx..."
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100 font-mono"
                  />
                  <button
                    onClick={handleRestore}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[8px] font-bold rounded cursor-pointer"
                  >
                    RESTAURAR
                  </button>
                </div>
                {cloudStatus && (
                  <p className="text-[8px] text-amber-300 mt-1 font-bold">{cloudStatus}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-800/90 border-t border-slate-700 px-4 py-3 flex justify-end gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-3 py-1.5 rounded text-[8px] text-slate-400 hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[8px] font-bold rounded shadow cursor-pointer"
          >
            GUARDAR CAMBIOS
          </button>
        </div>
      </div>
    </div>
  );
};
