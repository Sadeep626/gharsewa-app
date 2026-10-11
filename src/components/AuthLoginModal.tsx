import React, { useState } from 'react';
import {
  Lock,
  UserCheck,
  Shield,
  KeyRound,
  Building2,
  Users,
  Smartphone,
  Hash,
  CheckCircle2,
  AlertCircle,
  X,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  accounts: UserAccount[];
  onSelectUser: (user: UserAccount, method: string) => void;
  onLogout: () => void;
}

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  accounts,
  onSelectUser,
  onLogout,
}) => {
  const [authTab, setAuthTab] = useState<'profiles' | 'credentials' | 'accessCode'>('profiles');
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  if (!isOpen) return null;

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanId = identifier.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!cleanId || !cleanPin) {
      setErrorMessage('Please enter both your phone/email and 4-digit PIN.');
      return;
    }

    const matched = accounts.find((acc) => {
      const matchEmail = acc.email.toLowerCase() === cleanId;
      const matchPhone = acc.phone.replace(/[^0-9]/g, '').includes(cleanId.replace(/[^0-9]/g, ''));
      const matchUsername = acc.username.toLowerCase() === cleanId;
      return (matchEmail || matchPhone || matchUsername) && acc.pin === cleanPin;
    });

    if (matched) {
      onSelectUser(matched, 'Credentials (Phone/PIN)');
      onClose();
    } else {
      setErrorMessage('Invalid credentials or PIN. Use PIN 1234 for Landlord or 2026 for Flat 201.');
    }
  };

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCode = accessCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Please enter a building or flat access code.');
      return;
    }

    const matched = accounts.find((acc) => acc.accessCode.toUpperCase() === cleanCode);

    if (matched) {
      onSelectUser(matched, `Flat Passcode (${cleanCode})`);
      onClose();
    } else {
      setErrorMessage('Passcode not recognized. Try "HH-201", "HH-104", "HH-302" or "OWNER-KTM".');
    }
  };

  const handleQuickLogin = (account: UserAccount) => {
    onSelectUser(account, '1-Click Profile Selection');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">KinHome Login Facility</h2>
              <p className="text-xs text-slate-300">
                Himalayan Heights Residency · Living & Grocery Portal
              </p>
            </div>
          </div>

          {currentUser ? (
            <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/15 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{currentUser.avatar}</span>
                <div>
                  <div className="text-xs text-slate-300">Currently logged in as:</div>
                  <div className="text-sm font-semibold text-white">
                    {currentUser.name} {currentUser.unitNumber ? `(${currentUser.unitNumber})` : ''}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onLogout();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-xs font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-300 mt-2">
              Sign in to manage sub-meters, rent settlements, family groceries, or building maintenance.
            </p>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2 text-xs font-medium text-slate-600">
          <button
            onClick={() => {
              setAuthTab('profiles');
              setErrorMessage('');
            }}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              authTab === 'profiles'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Select Resident / Owner</span>
          </button>
          <button
            onClick={() => {
              setAuthTab('credentials');
              setErrorMessage('');
            }}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              authTab === 'credentials'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone & PIN</span>
          </button>
          <button
            onClick={() => {
              setAuthTab('accessCode');
              setErrorMessage('');
            }}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              authTab === 'accessCode'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Flat Passcode</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: Fast Profile Switcher */}
          {authTab === 'profiles' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Choose account to authenticate directly:</span>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Instant Access
                </span>
              </div>

              <div className="space-y-2.5">
                {accounts.map((acc) => {
                  const isCurrent = currentUser?.id === acc.id;
                  const isOwner = acc.role === 'landlord';

                  return (
                    <div
                      key={acc.id}
                      onClick={() => handleQuickLogin(acc)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isCurrent
                          ? 'border-indigo-500 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-400'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shadow-2xs group-hover:scale-105 transition-transform">
                          {acc.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {acc.name}
                            </span>
                            {isOwner ? (
                              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5" />
                                Houseowner
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <Users className="w-2.5 h-2.5" />
                                {acc.unitNumber}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{acc.nepaliName}</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono text-[11px] text-slate-400">{acc.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-right">
                        {isCurrent ? (
                          <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                            Active
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all">
                            Sign In →
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Phone & PIN Login Form */}
          {authTab === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number or Email
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="+977 98510-23456 or sharma.201"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    4-Digit Security PIN
                  </label>
                  <span className="text-[11px] text-slate-500">Demo PIN: 1234 or 2026</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-9 pr-3 py-2 text-sm tracking-widest font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Quick Fill presets for convenience */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block mb-1.5 font-medium">Quick Credentials Fill:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('+977 98510-11223');
                      setPin('1234');
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-[11px] font-medium"
                  >
                    Landlord Rajan (1234)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('+977 98510-23456');
                      setPin('2026');
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-[11px] font-medium"
                  >
                    Apt 201 Sharma (2026)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('+977 98412-34567');
                      setPin('1040');
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-[11px] font-medium"
                  >
                    Apt 104 Shrestha (1040)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Keep session signed in</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Sign In Securely</span>
              </button>
            </form>
          )}

          {/* TAB 3: Flat Passcode Login */}
          {authTab === 'accessCode' && (
            <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apartment Flat Access Code
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="e.g. HH-201, HH-104, or OWNER-KTM"
                    className="w-full pl-9 pr-3 py-2 text-sm uppercase tracking-wider font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Unique passkey provided in your physical tenancy agreement packet.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block mb-1.5 font-medium">Available Flat Codes:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAccessCode('OWNER-KTM')}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-[11px] font-mono"
                  >
                    OWNER-KTM
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessCode('HH-201')}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-[11px] font-mono"
                  >
                    HH-201
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessCode('HH-104')}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-[11px] font-mono"
                  >
                    HH-104
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessCode('HH-302')}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-[11px] font-mono"
                  >
                    HH-302
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessCode('CARE-KTM')}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-[11px] font-mono"
                  >
                    CARE-KTM
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Verify & Enter Flat Portal</span>
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted local session · Kathmandu Residency</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
