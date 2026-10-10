import React from 'react';
import {
  Building2,
  Users,
  Home,
  Receipt,
  Trash2,
  Wrench,
  Scale,
  Bell,
  ArrowRightLeft,
  CheckCircle2,
  ShoppingCart,
} from 'lucide-react';
import { UserRole, PropertyUnit } from '../types';

interface TopBarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  units: PropertyUnit[];
  selectedUnitId: string;
  setSelectedUnitId: (unitId: string) => void;
  unpaidCount: number;
  openTicketsCount: number;
  overdueAlertsCount?: number;
  totalNotificationCount?: number;
  familyCartCount?: number;
  onOpenNotificationCenter?: () => void;
  onOpenFamilyCart?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  units,
  selectedUnitId,
  setSelectedUnitId,
  unpaidCount,
  openTicketsCount,
  overdueAlertsCount = 0,
  totalNotificationCount = 0,
  familyCartCount = 0,
  onOpenNotificationCenter,
  onOpenFamilyCart,
}) => {
  const selectedUnit = units.find((u) => u.id === selectedUnitId) || units[0];

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'bills', label: 'Utility & Rent Bills', icon: Receipt },
    {
      id: 'groceries',
      label: userRole === 'landlord' ? 'Groceries & Drops' : 'Family Groceries',
      icon: ShoppingCart,
    },
    { id: 'waste', label: 'Waste Management', icon: Trash2 },
    { id: 'maintenance', label: 'Maintenance Bridge', icon: Wrench },
    { id: 'legal', label: 'Legal Consultation', icon: Scale },
    { id: 'notices', label: 'Building Notices', icon: Bell },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Primary Navigation Row adhering strictly to Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('overview')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors">
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  KinHome
                </span>
                <span className="hidden sm:inline-block text-xs text-slate-500 ml-2">
                  Landlord & Tenant Living Bridge
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-6 Clean navigation links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs lg:text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-900' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.id === 'bills' && unpaidCount > 0 && (
                    <span className="ml-1 text-[11px] font-mono font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      {unpaidCount}
                    </span>
                  )}
                  {item.id === 'groceries' && familyCartCount > 0 && (
                    <span className="ml-1 text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      {familyCartCount}
                    </span>
                  )}
                  {item.id === 'maintenance' && openTicketsCount > 0 && (
                    <span className="ml-1 text-[11px] font-mono font-medium text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                      {openTicketsCount}
                    </span>
                  )}
                  {item.id === 'notices' && overdueAlertsCount !== undefined && overdueAlertsCount > 0 && (
                    <span className="ml-1 text-[11px] font-mono font-medium text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 animate-pulse">
                      {overdueAlertsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Active role switcher and perspective selector */}
          <div className="flex items-center gap-2.5">
            {/* Role switch toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setUserRole('landlord')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  userRole === 'landlord'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Manage all units, bill utilities, view occupancy"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Houseowner</span>
              </button>
              <button
                onClick={() => setUserRole('tenant')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  userRole === 'tenant'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View family utility bills, submit repairs, ask legal advisor"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tenant Family</span>
              </button>
            </div>

            {/* If tenant role, family selector */}
            {userRole === 'tenant' && (
              <div className="hidden lg:flex items-center">
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitNumber} - {u.tenantFamilyName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Family Grocery Basket Quick Trigger */}
            {onOpenFamilyCart && userRole === 'tenant' && (
              <button
                onClick={onOpenFamilyCart}
                className="relative p-2 rounded-lg text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center justify-center shadow-xs border border-emerald-200"
                title="Open Family Grocery Basket"
              >
                <ShoppingCart className="w-4 h-4" />
                {familyCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-emerald-700 text-white rounded-full text-[10px] font-mono font-bold flex items-center justify-center">
                    {familyCartCount > 9 ? '9+' : familyCartCount}
                  </span>
                )}
              </button>
            )}

            {/* Notification Center Trigger */}
            {onOpenNotificationCenter && (
              <button
                onClick={onOpenNotificationCenter}
                className="relative p-2 rounded-lg text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center shadow-xs"
                title="Open Consolidated Notification Center"
              >
                <Bell className="w-4 h-4" />
                {totalNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-600 text-white rounded-full text-[10px] font-mono font-bold flex items-center justify-center animate-pulse">
                    {totalNotificationCount > 9 ? '9+' : totalNotificationCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="md:hidden flex overflow-x-auto py-2 gap-1 border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Context Notification Bar */}
      <div className="bg-slate-50 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-1.5 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              {userRole === 'landlord'
                ? 'Houseowner View: Rajan Shrestha (Houseowner)'
                : `Tenant Portal: ${selectedUnit.tenantFamilyName} (${selectedUnit.unitNumber})`}
            </span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span>Himalayan Heights Residency, New Baneshwor, Kathmandu</span>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            {userRole === 'tenant' ? (
              <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Active Tenancy · Lease ends {selectedUnit.leaseEnd}</span>
              </div>
            ) : (
              <span>3 Units Total · 100% Occupancy · Water, Electric & Waste Meters Active</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
