// Push Notifications & Special Events Drawer

import React, { useState } from 'react';
import { PushNotificationItem } from '../types';
import { cloudService } from '../services/cloudStorage';
import { sound } from '../audio/soundEngine';

interface NotificationsDrawerProps {
  notifications: PushNotificationItem[];
  onOpenShopWithDiscount?: (skinId: string) => void;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  notifications,
  onOpenShopWithDiscount,
  onClose
}) => {
  const [hasPermission, setHasPermission] = useState<boolean>(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const requestPermission = async () => {
    sound.playClick();
    const granted = await cloudService.requestPushPermission();
    setHasPermission(granted);
    if (granted) {
      setStatusMsg('¡Notificaciones Push activadas en tu navegador!');
      cloudService.triggerNativeNotification(
        '⚡ Pixel Leap 2D: Notificaciones Activas',
        'Te avisaremos cuando haya torneos diarios y aspectos con descuento.'
      );
    } else {
      setStatusMsg('Permiso de notificaciones denegado o no disponible en este dispositivo.');
    }
  };

  const testPush = () => {
    sound.playGem();
    cloudService.triggerNativeNotification(
      '🔥 ¡Oferta Relámpago en Aspecto!',
      'Cyber Ronin tiene 30% de descuento por las próximas horas en Pixel Leap.'
    );
    setStatusMsg('¡Notificación push enviada!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-xs font-pixel select-none">
      <div className="bg-slate-900 border-l-2 border-slate-700 w-full max-w-md h-full shadow-2xl flex flex-col p-4 animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-base">🔔</span>
            <h2 className="text-xs sm:text-sm text-cyan-300 font-bold">
              EVENTOS Y OFERTAS PUSH
            </h2>
          </div>
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

        {/* Browser Push Permission Banner */}
        <div className="my-3 p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-200 font-bold">Notificaciones en el Navegador</span>
            <span className={`text-[7px] px-1.5 py-0.5 rounded font-bold ${
              hasPermission ? 'bg-emerald-950 text-emerald-400 border border-emerald-500' : 'bg-amber-950 text-amber-400 border border-amber-600'
            }`}>
              {hasPermission ? 'ACTIVADAS' : 'DESACTIVADAS'}
            </span>
          </div>
          <p className="text-[7px] text-slate-400 leading-normal">
            Recibe avisos directos cuando inicie el Torneo Diario de la comunidad o se desbloqueen descuentos exclusivos.
          </p>

          <div className="flex gap-2 pt-1">
            {!hasPermission ? (
              <button
                onClick={requestPermission}
                className="flex-1 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[8px] font-bold rounded cursor-pointer transition shadow"
              >
                HABILITAR NOTIFICACIONES PUSH
              </button>
            ) : (
              <button
                onClick={testPush}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[8px] font-bold rounded cursor-pointer"
              >
                PROBAR NOTIFICACIÓN PUSH
              </button>
            )}
          </div>

          {statusMsg && (
            <p className="text-[7px] text-amber-300 font-bold">{statusMsg}</p>
          )}
        </div>

        {/* List of Special Events & Limited Offers */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="text-[8px] text-slate-400 uppercase tracking-wider">
            Ofertas y Anuncios Vigentes ({notifications.length})
          </div>

          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border transition ${
                item.tag === 'OFERTA LIMITADA'
                  ? 'bg-rose-950/30 border-rose-500/60'
                  : 'bg-slate-800/40 border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded ${
                  item.tag === 'OFERTA LIMITADA'
                    ? 'bg-rose-600 text-white'
                    : 'bg-cyan-600 text-slate-950'
                }`}>
                  {item.tag}
                </span>
                <span className="text-[7px] text-slate-500">
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>

              <h4 className="text-[10px] text-slate-100 font-bold mt-2 leading-tight">
                {item.title}
              </h4>

              <p className="text-[8px] text-slate-400 mt-1 leading-relaxed">
                {item.body}
              </p>

              {item.discountSkinId && onOpenShopWithDiscount && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenShopWithDiscount(item.discountSkinId!);
                  }}
                  className="mt-2.5 w-full py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-[8px] font-bold rounded cursor-pointer transition shadow"
                >
                  VER EN LA TIENDA (-{item.discountPercent}%)
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] rounded cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
