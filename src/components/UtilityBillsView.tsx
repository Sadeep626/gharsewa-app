import React, { useState } from 'react';
import {
  Droplets,
  Zap,
  Trash2,
  Receipt,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  FileCheck,
  Search,
  Filter,
  DollarSign,
  Info,
} from 'lucide-react';
import {
  PropertyUnit,
  ConsolidatedInvoice,
  WaterMeterReading,
  ElectricMeterReading,
  WasteManagementFee,
  UserRole,
} from '../types';
import { formatNRS } from '../utils/currency';

interface UtilityBillsViewProps {
  userRole: UserRole;
  units: PropertyUnit[];
  selectedUnitId: string;
  invoices: ConsolidatedInvoice[];
  waterReadings: WaterMeterReading[];
  electricReadings: ElectricMeterReading[];
  wasteFees: WasteManagementFee[];
  onOpenLogReadingModal: () => void;
  onOpenPayModal: (invoice: ConsolidatedInvoice) => void;
  onOpenInvoiceDetail: (invoice: ConsolidatedInvoice) => void;
}

export const UtilityBillsView: React.FC<UtilityBillsViewProps> = ({
  userRole,
  units,
  selectedUnitId,
  invoices,
  waterReadings,
  electricReadings,
  wasteFees,
  onOpenLogReadingModal,
  onOpenPayModal,
  onOpenInvoiceDetail,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'consolidated' | 'water' | 'electric'>('consolidated');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Units filter depending on role
  const filteredInvoices = invoices.filter((inv) => {
    // If tenant, only show for their selected unit
    if (userRole === 'tenant' && inv.unitId !== selectedUnitId) return false;
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (searchTerm) {
      const unit = units.find((u) => u.id === inv.unitId);
      const searchMatch =
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.billingMonth.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (unit && unit.tenantFamilyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (unit && unit.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!searchMatch) return false;
    }
    return true;
  });

  const filteredWater = waterReadings.filter((w) => {
    if (userRole === 'tenant' && w.unitId !== selectedUnitId) return false;
    return true;
  });

  const filteredElectric = electricReadings.filter((e) => {
    if (userRole === 'tenant' && e.unitId !== selectedUnitId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header with Sub-tabs and Action Button */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Utility & Rent Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Transparent itemized accounting for Water (m³), Electricity (kWh), Municipal Sanitation, and Base Rent.
            </p>
          </div>

          {userRole === 'landlord' && (
            <button
              onClick={onOpenLogReadingModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Log Meter Readings</span>
            </button>
          )}
        </div>

        {/* Sub-tab segmented selector */}
        <div className="flex items-center gap-1.5 mt-5 p-1 bg-slate-100 rounded-lg w-fit border border-slate-200/80">
          <button
            onClick={() => setActiveSubTab('consolidated')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'consolidated'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-indigo-600" />
            <span>Consolidated Invoices</span>
          </button>
          <button
            onClick={() => setActiveSubTab('water')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'water'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-blue-600" />
            <span>Water Utility Meters</span>
          </button>
          <button
            onClick={() => setActiveSubTab('electric')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'electric'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Electricity Meters</span>
          </button>
        </div>
      </div>

      {/* 1. CONSOLIDATED INVOICES TAB */}
      {activeSubTab === 'consolidated' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search invoice # or family..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 self-start sm:self-auto">
              {(['all', 'pending', 'paid', 'overdue'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Unit & Family</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4 text-right">Base Rent</th>
                    <th className="py-3 px-4 text-right">Water</th>
                    <th className="py-3 px-4 text-right">Power</th>
                    <th className="py-3 px-4 text-right">Waste</th>
                    <th className="py-3 px-4 text-right">Total Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        No invoices match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const unit = units.find((u) => u.id === inv.unitId);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{unit?.unitNumber}</div>
                            <div className="text-[11px] text-slate-500">{unit?.tenantFamilyName}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                            {inv.billingMonth}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                            {formatNRS(inv.baseRent)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-blue-700">
                            {formatNRS(inv.waterAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-amber-700">
                            {formatNRS(inv.electricAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-700">
                            {formatNRS(inv.wasteAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900 text-sm">
                            {formatNRS(inv.totalDue)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : inv.status === 'overdue'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onOpenInvoiceDetail(inv)}
                                className="px-2.5 py-1 text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 font-medium"
                                title="View printable itemized statement"
                              >
                                View
                              </button>
                              {inv.status !== 'paid' && (
                                <button
                                  onClick={() => onOpenPayModal(inv)}
                                  className="px-2.5 py-1 text-white bg-slate-900 hover:bg-slate-800 rounded-md font-medium"
                                >
                                  {userRole === 'landlord' ? 'Mark Paid' : 'Pay'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. WATER UTILITY TAB */}
      {activeSubTab === 'water' && (
        <div className="space-y-4">
          {/* Water Formula Info Bar */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Sub-meter Calculation Formula:</span>
              <span className="ml-1 font-mono">
                Total Water = (Current Reading - Previous Reading) × NRs. 45/m³ + NRs. 250 Base Fee + NRs. 350 Sewer Surcharge.
              </span>
              <p className="mt-1 text-blue-800">
                Each unit has a dedicated pulse water sub-meter. Continuous flow alerts are flagged automatically if usage increases &gt;40% above the 3-month baseline.
              </p>
            </div>
          </div>

          {/* Water Readings Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Water Sub-Meter Logs by Unit
              </h2>
              <span className="text-xs text-slate-500">Rate: NRs. 45 / m³</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4 text-right">Prev Reading (m³)</th>
                    <th className="py-3 px-4 text-right">Curr Reading (m³)</th>
                    <th className="py-3 px-4 text-right">Net Used (m³)</th>
                    <th className="py-3 px-4 text-right">Base Fee</th>
                    <th className="py-3 px-4 text-right">Sewer Surcharge</th>
                    <th className="py-3 px-4 text-right">Total Bill</th>
                    <th className="py-3 px-4 text-center">Diagnostic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWater.map((w) => {
                    const unit = units.find((u) => u.id === w.unitId);
                    return (
                      <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {unit?.unitNumber}
                          <span className="block text-[11px] font-normal text-slate-500">
                            {unit?.tenantFamilyName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{w.billingMonth}</td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                          {w.previousReading.toFixed(1)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900 font-medium">
                          {w.currentReading.toFixed(1)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-blue-700">
                          {w.consumption.toFixed(1)} m³
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                          {formatNRS(w.baseCharge)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                          {formatNRS(w.sewerSurcharge)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                          {formatNRS(w.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {w.hasLeakWarning ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Leak Surge Warning
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Normal Flow
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. ELECTRICITY UTILITY TAB */}
      {activeSubTab === 'electric' && (
        <div className="space-y-4">
          {/* Power Info Bar */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Electric Sub-meter Formula:</span>
              <span className="ml-1 font-mono">
                Total Electric = (Current kWh - Previous kWh) × NRs. 12.50/kWh + NEA Demand Factor + Fuel Adjustment.
              </span>
              <p className="mt-1 text-amber-800">
                All electrical meters are inspected under Nepal Electricity Authority (NEA) guidelines and Kathmandu Metropolitan City electrical code standards.
              </p>
            </div>
          </div>

          {/* Electric Readings Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Electricity Meter Logs by Unit
              </h2>
              <span className="text-xs text-slate-500">Tariff: NRs. 12.50 / kWh</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4 text-right">Prev kWh</th>
                    <th className="py-3 px-4 text-right">Curr kWh</th>
                    <th className="py-3 px-4 text-right">Net Consumption</th>
                    <th className="py-3 px-4 text-right">Peak Charge</th>
                    <th className="py-3 px-4 text-right">Fuel Adj. / Tax</th>
                    <th className="py-3 px-4 text-right">Total Bill</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredElectric.map((e) => {
                    const unit = units.find((u) => u.id === e.unitId);
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {unit?.unitNumber}
                          <span className="block text-[11px] font-normal text-slate-500">
                            {unit?.tenantFamilyName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{e.billingMonth}</td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                          {e.previousReading.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900 font-medium">
                          {e.currentReading.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-amber-700">
                          {e.consumption.toLocaleString()} kWh
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                          {formatNRS(e.peakCharge)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                          {formatNRS(e.fuelAdjustment)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                          {formatNRS(e.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Synchronized
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
