import React from 'react';
import {
  Droplets,
  Zap,
  Trash2,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  CheckCircle,
  FileText,
  Wrench,
  Scale,
  DollarSign,
  PlusCircle,
  Users,
  ShoppingCart,
} from 'lucide-react';
import {
  PropertyUnit,
  ConsolidatedInvoice,
  WaterMeterReading,
  ElectricMeterReading,
  WasteManagementFee,
  MaintenanceTicket,
  BuildingNotice,
  UserRole,
} from '../types';
import { formatNRS } from '../utils/currency';
import { OccupancyAndIncomeChart } from './OccupancyAndIncomeChart';
import { EnergyEfficiencyInsights } from './EnergyEfficiencyInsights';
import { UtilityCostTrendChart } from './UtilityCostTrendChart';

interface DashboardOverviewProps {
  userRole: UserRole;
  units: PropertyUnit[];
  selectedUnitId: string;
  setSelectedUnitId: (id: string) => void;
  invoices: ConsolidatedInvoice[];
  waterReadings: WaterMeterReading[];
  electricReadings: ElectricMeterReading[];
  wasteFees: WasteManagementFee[];
  maintenanceTickets: MaintenanceTicket[];
  notices: BuildingNotice[];
  onNavigateTab: (tab: string) => void;
  onOpenLogReadingModal: () => void;
  onOpenPayModal: (invoice: ConsolidatedInvoice) => void;
  onOpenInvoiceDetail: (invoice: ConsolidatedInvoice) => void;
  onOpenNewTicketModal: () => void;
  onOpenLeaseRenewalModal?: (unit: PropertyUnit) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  userRole,
  units,
  selectedUnitId,
  setSelectedUnitId,
  invoices,
  waterReadings,
  electricReadings,
  wasteFees,
  maintenanceTickets,
  notices,
  onNavigateTab,
  onOpenLogReadingModal,
  onOpenPayModal,
  onOpenInvoiceDetail,
  onOpenNewTicketModal,
  onOpenLeaseRenewalModal,
}) => {
  const selectedUnit = units.find((u) => u.id === selectedUnitId) || units[0];

  // 30-Day Lease Expiration Watchdog calculation
  const expiringUnits = React.useMemo(() => {
    const refTime = new Date().getTime();
    return units
      .map((u) => {
        const endTime = new Date(u.leaseEnd).getTime();
        const daysRemaining = Math.ceil((endTime - refTime) / (1000 * 60 * 60 * 24));
        return { unit: u, daysRemaining };
      })
      .filter((item) => item.daysRemaining <= 30 && item.daysRemaining >= 0);
  }, [units]);

  const tenantExpiringInfo = React.useMemo(() => {
    const endTime = new Date(selectedUnit.leaseEnd).getTime();
    const daysRemaining = Math.ceil((endTime - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 30 && daysRemaining >= 0) {
      return { unit: selectedUnit, daysRemaining };
    }
    return null;
  }, [selectedUnit]);

  // Tenant-specific current month items
  const currentTenantInvoice = invoices.find(
    (inv) => inv.unitId === selectedUnit.id && inv.billingMonth.includes('October')
  ) || invoices.find((inv) => inv.unitId === selectedUnit.id);

  const currentWaterReading = waterReadings.find(
    (w) => w.unitId === selectedUnit.id && w.billingMonth.includes('October')
  );

  const currentElectricReading = electricReadings.find(
    (e) => e.unitId === selectedUnit.id && e.billingMonth.includes('October')
  );

  const currentWasteFee = wasteFees.find(
    (wf) => wf.unitId === selectedUnit.id && wf.billingMonth.includes('October')
  );

  const tenantTickets = maintenanceTickets.filter((t) => t.unitId === selectedUnit.id);

  // Landlord aggregations
  const totalBilledOct = invoices
    .filter((inv) => inv.billingMonth.includes('October'))
    .reduce((acc, inv) => acc + inv.totalDue, 0);

  const totalCollectedOct = invoices
    .filter((inv) => inv.billingMonth.includes('October') && inv.status === 'paid')
    .reduce((acc, inv) => acc + inv.totalDue, 0);

  const totalWaterConsumption = waterReadings
    .filter((w) => w.billingMonth.includes('October'))
    .reduce((acc, w) => acc + w.consumption, 0);

  const totalElectricConsumption = electricReadings
    .filter((e) => e.billingMonth.includes('October'))
    .reduce((acc, e) => acc + e.consumption, 0);

  const leakAlertUnits = waterReadings.filter((w) => w.hasLeakWarning);

  return (
    <div className="space-y-6">
      {/* Top Banner or Welcome Statement */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              {userRole === 'landlord' ? 'Houseowner Command Center' : 'Renting Family Portal'}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {userRole === 'landlord'
                ? 'Himalayan Heights Residency — Kathmandu Property & Utility Overview'
                : `Welcome Home, ${selectedUnit.tenantFamilyName}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {userRole === 'landlord'
                ? 'Shanti Marga, New Baneshwor, Kathmandu (Ward 10) · Rental contracts, KUKL water & NEA sub-meters, and municipal waste management.'
                : `Residence: ${selectedUnit.unitNumber} · ${selectedUnit.areaSqFt} sq ft · Sub-meters active (KUKL Water: ${selectedUnit.waterMeterId} · NEA Power: ${selectedUnit.electricMeterId})`}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {userRole === 'landlord' ? (
              <>
                <button
                  onClick={onOpenLogReadingModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Log Meter Readings</span>
                </button>
                <button
                  onClick={() => onNavigateTab('legal')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Tenancy Legal Advisor</span>
                </button>
              </>
            ) : (
              <>
                {currentTenantInvoice && currentTenantInvoice.status !== 'paid' && (
                  <button
                    onClick={() => onOpenPayModal(currentTenantInvoice)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs whitespace-nowrap"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Pay October Bill ({formatNRS(currentTenantInvoice.totalDue)})</span>
                  </button>
                )}
                <button
                  onClick={onOpenNewTicketModal}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Report Maintenance</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 30-Day Lease Expiration 'Renew or Vacate' Alert for Landlords */}
      {userRole === 'landlord' && expiringUnits.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-200/80 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0 mt-0.5">
                <Clock className="w-5 h-5 text-amber-800" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-amber-950 text-sm">
                    Renew or Vacate Alert (30-Day Lease Expiration Watchdog)
                  </span>
                  <span className="text-[11px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                    {expiringUnits.length} Unit{expiringUnits.length > 1 ? 's' : ''} Expiring
                  </span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed max-w-3xl">
                  {expiringUnits.map((item, idx) => (
                    <span key={item.unit.id}>
                      {idx > 0 && ' · '}
                      <strong>{item.unit.unitNumber} ({item.unit.tenantFamilyName})</strong> lease ends on <strong>{item.unit.leaseEnd}</strong> ({item.daysRemaining} days remaining). Under Muluki Civil Code 2074 (House Rent Chapter), offer standard lease renewal terms or serve statutory 30-day notice of non-renewal.
                    </span>
                  ))}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
              {expiringUnits.map((item) => (
                <button
                  key={item.unit.id}
                  onClick={() => onOpenLeaseRenewalModal?.(item.unit)}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Renew or Vacate ({item.unit.unitNumber})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 30-Day Lease Expiration Notice for Tenant Family */}
      {userRole === 'tenant' && tenantExpiringInfo && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm">
          <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-950">
              Upcoming Lease Expiration ({tenantExpiringInfo.daysRemaining} Days Remaining)
            </span>
            <p className="text-amber-900 text-xs leading-relaxed">
              Your fixed-term tenancy for {selectedUnit.unitNumber} reaches its expiration date on <strong>{selectedUnit.leaseEnd}</strong>. Houseowner Rajan Shrestha has received the 30-day statutory notice reminder. Please discuss lease renewal terms or move-out inspection arrangements.
            </p>
            <div className="pt-1 flex items-center gap-3">
              <button
                onClick={() => onNavigateTab('legal')}
                className="text-xs font-semibold text-amber-900 underline hover:text-amber-700"
              >
                View Tenancy Renewal Rights (Muluki Civil Code 2074)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leak Alert Banner if any */}
      {leakAlertUnits.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-semibold text-amber-900">
              High Water Consumption Warning:
            </span>{' '}
            <span className="text-amber-800">
              {userRole === 'landlord'
                ? `Unit 104 (The Shrestha Family) recorded an unexpected 65% surge in water meter usage (24.8 m³). Potential running toilet flapper or pinhole leak detected.`
                : selectedUnit.id === 'unit-104'
                ? 'Your October water meter usage spiked to 24.8 m³. Our diagnostic algorithm flagged a potential running toilet or under-sink drip. A mediation review is active.'
                : 'Building water telemetry: Municipal KUKL pressure tests scheduled for Oct 14.'}
            </span>
            <div className="mt-2 flex gap-3">
              <button
                onClick={() => onNavigateTab('bills')}
                className="text-xs font-semibold text-amber-900 underline hover:text-amber-700"
              >
                Inspect Water Meter Table
              </button>
              <button
                onClick={() => onNavigateTab('legal')}
                className="text-xs font-semibold text-amber-900 underline hover:text-amber-700"
              >
                View Leak Responsibility Statute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* METRIC GRIDS: Tabular Figures formatted in NRs. */}
      {userRole === 'landlord' ? (
        /* Landlord Metrics */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Total October Billing</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
              {formatNRS(totalBilledOct)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Collected: <strong className="font-mono text-emerald-600 font-medium">{formatNRS(totalCollectedOct)}</strong></span>
              <span className="text-amber-600 font-medium">Pending: {formatNRS(totalBilledOct - totalCollectedOct)}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Building Water Used</span>
              <Droplets className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
              {totalWaterConsumption.toFixed(1)} <span className="text-sm font-normal text-slate-500">m³</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Across 3 units · Avg {formatNRS((totalWaterConsumption * 45) / 3)} / unit base
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Building NEA Power</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
              {totalElectricConsumption.toLocaleString()} <span className="text-sm font-normal text-slate-500">kWh</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Active sub-meters · Rate NRs. 12.50/kWh
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Maintenance & Waste</span>
              <Trash2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
              {maintenanceTickets.filter((t) => t.status !== 'resolved').length} <span className="text-sm font-normal text-slate-500">Active</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Ward 10 Trash: Tue/Fri · Recycling: Wed
            </div>
          </div>
        </div>
      ) : (
        /* Tenant Family Metrics */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Due Card */}
          <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Consolidated Statement · October 2026
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                    {currentTenantInvoice ? formatNRS(currentTenantInvoice.totalDue) : 'NRs. 0'}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      currentTenantInvoice?.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : currentTenantInvoice?.status === 'overdue'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {currentTenantInvoice?.status === 'paid'
                      ? 'Paid in Full'
                      : currentTenantInvoice?.status === 'overdue'
                      ? 'Payment Overdue'
                      : 'Due Oct 10, 2026'}
                  </span>
                </div>
              </div>

              {currentTenantInvoice && (
                <button
                  onClick={() => onOpenInvoiceDetail(currentTenantInvoice)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 underline"
                >
                  View Itemized Receipt
                </button>
              )}
            </div>

            {/* Sub-utility Breakdown Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50">
                <div className="text-slate-500">Base Rent</div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                  {formatNRS(selectedUnit.baseRent)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100/80">
                <div className="text-blue-700 flex items-center gap-1">
                  <Droplets className="w-3 h-3" />
                  <span>KUKL Water</span>
                </div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                  {formatNRS(currentWaterReading?.totalAmount || 0)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {currentWaterReading?.consumption} m³
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100/80">
                <div className="text-amber-800 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>NEA Electricity</span>
                </div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                  {formatNRS(currentElectricReading?.totalAmount || 0)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {currentElectricReading?.consumption} kWh
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100/80">
                <div className="text-emerald-800 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />
                  <span>Ward 10 Waste</span>
                </div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                  {formatNRS(currentWasteFee?.totalAmount || 450)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  3 services incl.
                </div>
              </div>
            </div>
          </div>

          {/* Waste Schedule Card for Tenant Family */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>Sanitation Schedule</span>
                <Trash2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">General Waste:</span>
                  <span className="font-medium text-slate-900">Tuesday & Friday</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-blue-700">Recyclables:</span>
                  <span className="font-medium text-slate-900">Wednesday</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-emerald-700">Organic Compost:</span>
                  <span className="font-medium text-slate-900">Mon & Thu</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => onNavigateTab('groceries')}
                className="w-full text-center text-xs font-semibold text-emerald-800 hover:text-emerald-950 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Family Groceries & 20L Water Jars</span>
              </button>
              <button
                onClick={() => onNavigateTab('waste')}
                className="w-full text-center text-xs font-semibold text-slate-700 hover:text-slate-900 py-1 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors"
              >
                Request Bulky Waste Pickup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automated Alert System: Energy Efficiency Insights Component */}
      <EnergyEfficiencyInsights
        units={units}
        waterReadings={waterReadings}
        electricReadings={electricReadings}
        userRole={userRole}
        selectedUnitId={selectedUnitId}
        onNavigateTab={onNavigateTab}
        onOpenNewTicketModal={onOpenNewTicketModal}
      />

      {/* Occupancy and Monthly Rental Income Trends Chart Visualization */}
      <OccupancyAndIncomeChart
        invoices={invoices}
        units={units}
        userRole={userRole}
        selectedUnitId={selectedUnitId}
      />

      {/* Monthly Utility Cost Trends Line Chart Visualization */}
      <UtilityCostTrendChart
        invoices={invoices}
        userRole={userRole}
        selectedUnitId={selectedUnitId}
        units={units}
      />

      {/* Main Content Split: Units Management (Landlord) or Family Ledger (Tenant) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {userRole === 'landlord' ? (
            /* Landlord's Units Roster & Billing Status */
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Rental Units & Active Tenancy Status
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live overview of occupant families in New Baneshwor, meter readings, and invoice collection.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('bills')}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                >
                  <span>All Invoices</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-200">
                {units.map((unit) => {
                  const unitInvoice = invoices.find(
                    (inv) => inv.unitId === unit.id && inv.billingMonth.includes('October')
                  );
                  const water = waterReadings.find(
                    (w) => w.unitId === unit.id && w.billingMonth.includes('October')
                  );
                  const electric = electricReadings.find(
                    (e) => e.unitId === unit.id && e.billingMonth.includes('October')
                  );

                  const expiringInfo = expiringUnits.find((item) => item.unit.id === unit.id);

                  return (
                    <div key={unit.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {unit.unitNumber}
                            </span>
                            <span aria-hidden="true" className="text-slate-400">·</span>
                            <span className="font-medium text-slate-800 text-sm">
                              {unit.tenantFamilyName}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({unit.primaryContact.familyMembersCount} residents)
                            </span>
                            {expiringInfo && (
                              <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded">
                                Lease Ends in {expiringInfo.daysRemaining}d
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                            <span>Base Rent: {formatNRS(unit.baseRent)}</span>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1 text-blue-700">
                              <Droplets className="w-3 h-3" />
                              {water?.consumption || 0} m³ ({formatNRS(water?.totalAmount || 0)})
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1 text-amber-700">
                              <Zap className="w-3 h-3" />
                              {electric?.consumption || 0} kWh ({formatNRS(electric?.totalAmount || 0)})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {expiringInfo && (
                            <button
                              onClick={() => onOpenLeaseRenewalModal?.(unit)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-amber-950 bg-amber-100 border border-amber-300 rounded-md hover:bg-amber-200 transition-colors"
                            >
                              Renew / Vacate
                            </button>
                          )}

                          <div className="text-right">
                            <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                              {unitInvoice ? formatNRS(unitInvoice.totalDue) : 'NRs. 0'}
                            </div>
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                                unitInvoice?.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : unitInvoice?.status === 'overdue'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {unitInvoice?.status}
                            </span>
                          </div>

                          {unitInvoice && (
                            <button
                              onClick={() => onOpenInvoiceDetail(unitInvoice)}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
                            >
                              Details
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Tenant's Utility Meters & Consumption Ledger */
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Your Utility Meter Readings & Math Verification
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Transparent sub-meter formulas for water, electricity, and sanitation.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('bills')}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                >
                  <span>Detailed History</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                {/* Water Detailed Card */}
                <div className="p-4 rounded-lg border border-blue-100 bg-blue-50/30">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          KUKL Water Sub-Meter ({selectedUnit.waterMeterId})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Previous: {currentWaterReading?.previousReading} m³ → Current: {currentWaterReading?.currentReading} m³
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                        {formatNRS(currentWaterReading?.totalAmount || 0)}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {currentWaterReading?.consumption} m³ net
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-blue-100 text-xs text-slate-600 grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-500">Consumption Rate:</span>
                      <div className="font-mono text-slate-800">NRs. {currentWaterReading?.ratePerCubicMeter}/m³</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Base Meter Fee:</span>
                      <div className="font-mono text-slate-800">NRs. {currentWaterReading?.baseCharge}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Sewer Surcharge:</span>
                      <div className="font-mono text-slate-800">NRs. {currentWaterReading?.sewerSurcharge}</div>
                    </div>
                  </div>
                </div>

                {/* Electricity Detailed Card */}
                <div className="p-4 rounded-lg border border-amber-100 bg-amber-50/30">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          NEA Electric Sub-Meter ({selectedUnit.electricMeterId})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Previous: {currentElectricReading?.previousReading} kWh → Current: {currentElectricReading?.currentReading} kWh
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                        {formatNRS(currentElectricReading?.totalAmount || 0)}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {currentElectricReading?.consumption} kWh net
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-amber-100 text-xs text-slate-600 grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-500">Energy Tariff:</span>
                      <div className="font-mono text-slate-800">NRs. {currentElectricReading?.ratePerKwh}/kWh</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Peak Demand Charge:</span>
                      <div className="font-mono text-slate-800">NRs. {currentElectricReading?.peakCharge}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Fuel Adj. & Taxes:</span>
                      <div className="font-mono text-slate-800">NRs. {currentElectricReading?.fuelAdjustment}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Bridge Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Maintenance & Repair Status
                </h3>
                <p className="text-xs text-slate-500">
                  Direct communication bridge for water leaks, electrical faults, and sanitation.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('maintenance')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                View All Tickets
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {(userRole === 'landlord' ? maintenanceTickets : tenantTickets).map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{ticket.title}</span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.2 rounded ${
                          ticket.priority === 'urgent_48h'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ticket.priority.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-1">{ticket.description}</p>
                    <div className="text-slate-500 text-[11px]">
                      Reported: {ticket.createdAt} {ticket.contractorName && `· Dispatched: ${ticket.contractorName}`}
                    </div>
                  </div>

                  <div>
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        ticket.status === 'scheduled'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : ticket.status === 'in_progress'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : ticket.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Building Notices & Legal Quick Bridge */}
        <div className="space-y-6">
          {/* Legal Consultation Quick Box */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              <span>Tenancy Legal Consultation</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1.5">
              Kathmandu Residential Tenancy Rights Advisor
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Have questions about right of entry, plumbing repair responsibilities, security deposit refunds under Muluki Civil Code 2074, or rent agreements? Get certified statutory guidance.
            </p>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => onNavigateTab('legal')}
                className="w-full text-left p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-xs text-slate-200 flex items-center justify-between"
              >
                <span>Can landlord enter without 24h notice?</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigateTab('legal')}
                className="w-full text-left p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-xs text-slate-200 flex items-center justify-between"
              >
                <span>Who pays for toilet/sink leaks in Kathmandu?</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <button
              onClick={() => onNavigateTab('legal')}
              className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg text-center transition-colors shadow-xs"
            >
              Open Legal Consultation Portal
            </button>
          </div>

          {/* Building Notices */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">
                Official Building Notices
              </h3>
              <button
                onClick={() => onNavigateTab('notices')}
                className="text-xs text-slate-600 hover:text-slate-900 underline"
              >
                View all
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {notices.map((n) => (
                <div key={n.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{n.title}</span>
                    {n.isUrgent && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        Important
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mt-1 line-clamp-2">{n.content}</p>
                  <div className="text-[11px] text-slate-400 mt-2">
                    Effective: {n.effectiveDate} · By {n.author.split('(')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
