import React from 'react';
import {
  Bike,
  Navigation,
  Bell,
  Sparkles,
  Zap
} from 'lucide-react';
import { ActiveTab, PartnerProfile, Order } from '../types';

interface NavbarProps {
  partner: PartnerProfile;
  activeTab: ActiveTab;
  activeOrder: Order | null;
  onSelectTab: (tab: ActiveTab) => void;
  onToggleOnline: (isOnline: boolean) => void;
  onSimulateOrder: () => void;
  onResetDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  partner,
  activeTab,
  activeOrder,
  onSelectTab,
  onToggleOnline,
  onSimulateOrder,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Driver Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/10">
            <Bike className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white tracking-tight">
                SwiftDrop Partner
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono font-bold">
                {partner.vehicleNumber}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="font-semibold text-slate-300">{partner.name}</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-[11px] text-slate-400">{partner.id}</span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Simulation Trigger */}
          <button
            type="button"
            onClick={onSimulateOrder}
            disabled={!partner.isOnline || !!activeOrder}
            title="Simulate receiving an incoming delivery order"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 disabled:opacity-30 border border-slate-800 text-amber-400 text-xs font-semibold transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate Order</span>
          </button>

          {/* Online/Offline Status Switch Pill */}
          <button
            type="button"
            id="nav-toggle-duty-status"
            onClick={() => onToggleOnline(!partner.isOnline)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition border cursor-pointer ${
              partner.isOnline
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                partner.isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-600'
              }`}
            />
            <span>{partner.isOnline ? 'Online' : 'Offline'}</span>
          </button>

          {/* Profile Avatar Button */}
          <button
            type="button"
            id="nav-profile-chip"
            onClick={() => onSelectTab('profile')}
            className={`p-0.5 rounded-xl border transition ${
              activeTab === 'profile'
                ? 'border-amber-400 ring-2 ring-amber-400/20'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <img
              src={partner.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
              alt={partner.name}
              className="w-8 h-8 rounded-[10px] object-cover"
            />
          </button>
        </div>
      </div>
    </header>
  );
};

