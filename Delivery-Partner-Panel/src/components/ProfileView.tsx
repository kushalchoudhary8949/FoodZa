import React from 'react';
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  Bike,
  Building,
  Star,
  Lock,
  LogOut
} from 'lucide-react';
import { PartnerProfile } from '../types';

interface ProfileViewProps {
  partner: PartnerProfile;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ partner, onLogout }) => {
  return (
    <div id="profile-view" className="max-w-3xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Partner Account</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified partner credentials, vehicle info, and payout details
          </p>
        </div>
        <button
          type="button"
          id="btn-partner-logout"
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-800 hover:border-rose-600/30 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <img
            src={partner.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
            alt={partner.name}
            className="w-16 h-16 rounded-2xl object-cover border border-amber-400/40"
          />

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg font-bold text-white">{partner.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {partner.id}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>KYC Verified</span>
              </span>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{partner.phone}</span>
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{partner.email}</span>
              </span>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 pt-2 text-xs">
              <span className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-amber-400 font-semibold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{partner.rating} / 5.0 Rating</span>
              </span>
              <span className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-400 font-mono text-[11px]">
                Member since {partner.joinedDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Vehicle & Banking Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Vehicle */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Bike className="w-4 h-4 text-amber-400" />
            <span>Delivery Vehicle</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Vehicle Type:</span>
              <span className="text-slate-200 font-semibold">{partner.vehicleType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Plate Number:</span>
              <span className="text-amber-400 font-mono font-bold">{partner.vehicleNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">RC & Insurance:</span>
              <span className="text-emerald-400 font-semibold">Active & Valid</span>
            </div>
          </div>
        </div>

        {/* Banking */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Building className="w-4 h-4 text-sky-400" />
            <span>Bank Account</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Account Holder:</span>
              <span className="text-slate-200 font-semibold">{partner.bankDetails.accountHolder}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Account No:</span>
              <span className="text-slate-200 font-mono">{partner.bankDetails.accountNumberMasked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">IFSC Code:</span>
              <span className="text-slate-200 font-mono">{partner.bankDetails.ifscCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">UPI VPA:</span>
              <span className="text-amber-400 font-mono">{partner.bankDetails.upiId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Access Info */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
          <Lock className="w-3.5 h-3.5" />
          <span>Security & Isolation</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Session is authenticated to Partner ID <strong className="text-slate-200">{partner.id}</strong>. Only your personal assigned deliveries and financial ledger are accessible.
        </p>
      </div>
    </div>
  );
};

