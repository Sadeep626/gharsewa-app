import React from 'react';
import {
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Droplets,
  Zap,
  Trash2,
  Wrench,
  ShieldCheck,
} from 'lucide-react';
import {
  ConsolidatedInvoice,
  PropertyUnit,
  WaterMeterReading,
  ElectricMeterReading,
  WasteManagementFee,
  UserRole,
} from '../types';
import { formatNRS } from '../utils/currency';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: ConsolidatedInvoice | null;
  unit: PropertyUnit | undefined;
  waterReading: WaterMeterReading | undefined;
  electricReading: ElectricMeterReading | undefined;
  wasteFee: WasteManagementFee | undefined;
  userRole: UserRole;
  onOpenPayModal: (invoice: ConsolidatedInvoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  unit,
  waterReading,
  electricReading,
  wasteFee,
  userRole,
  onOpenPayModal,
}) => {
  if (!isOpen || !invoice || !unit) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8">
        {/* Top Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Official Tenancy & Utility Statement
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-sm font-semibold px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Invoice Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
                  KH
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Himalayan Heights Residency
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Shanti Marga, New Baneshwor, Kathmandu (Ward 10) · Houseowner: Rajan Shrestha
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-lg font-bold font-mono text-slate-900">
                {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Issue Date: {invoice.issueDate} · Due: {invoice.dueDate}
              </div>
              <div className="mt-1">
                <span
                  className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                    invoice.status === 'paid'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : invoice.status === 'overdue'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {invoice.status === 'paid' ? 'PAID IN FULL' : invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Tenant Information Box */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 block">Billed To (Tenant Family):</span>
              <span className="font-bold text-slate-900 text-sm">{unit.tenantFamilyName}</span>
              <div className="text-slate-600 text-[11px] mt-0.5">
                {unit.unitNumber} ({unit.bedrooms} Bed, {unit.bathrooms} Bath · {unit.areaSqFt} sq ft)
              </div>
            </div>
            <div>
              <span className="text-slate-500 block">Contact & Lease:</span>
              <span className="font-medium text-slate-800">{unit.primaryContact.name}</span>
              <div className="text-slate-600 text-[11px] mt-0.5">
                {unit.primaryContact.phone} · Lease ends {unit.leaseEnd}
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Item & Statutory Description</th>
                <th className="py-2.5 px-3 text-right">Meter Reading / Basis</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* Base Rent */}
              <tr>
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-900">Residential Base Rent</div>
                  <div className="text-[11px] text-slate-500">Monthly dwelling occupancy for {invoice.billingMonth}</div>
                </td>
                <td className="py-3 px-3 text-right font-mono">1 Month</td>
                <td className="py-3 px-3 text-right font-mono">{formatNRS(unit.baseRent)}</td>
                <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                  {formatNRS(invoice.baseRent)}
                </td>
              </tr>

              {/* Water */}
              <tr>
                <td className="py-3 px-3">
                  <div className="font-semibold text-blue-900 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-600" />
                    <span>KUKL Potable Water & Deep Borewell Sub-Meter</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Meter ID: {unit.waterMeterId} (Base meter NRs. 250 + Sewer surcharge NRs. 350)
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {waterReading ? `${waterReading.consumption} m³` : '14.4 m³'}
                </td>
                <td className="py-3 px-3 text-right font-mono">NRs. 45 / m³</td>
                <td className="py-3 px-3 text-right font-mono font-medium text-blue-900">
                  {formatNRS(invoice.waterAmount)}
                </td>
              </tr>

              {/* Electricity */}
              <tr>
                <td className="py-3 px-3">
                  <div className="font-semibold text-amber-900 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>NEA Electricity Sub-Meter Consumption</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Meter ID: {unit.electricMeterId} (Demand factor NRs. 150 + Fuel/Taxes NRs. 75)
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {electricReading ? `${electricReading.consumption} kWh` : '320 kWh'}
                </td>
                <td className="py-3 px-3 text-right font-mono">NRs. 12.50 / kWh</td>
                <td className="py-3 px-3 text-right font-mono font-medium text-amber-900">
                  {formatNRS(invoice.electricAmount)}
                </td>
              </tr>

              {/* Waste Management */}
              <tr>
                <td className="py-3 px-3">
                  <div className="font-semibold text-emerald-900 flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ward 10 Municipal Sanitation & Waste Collection</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Household Trash (Tue/Fri) + Recyclables (Wed) + Compost (Mon/Thu)
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-mono">3 Streams</td>
                <td className="py-3 px-3 text-right font-mono">KMC Ward Levy</td>
                <td className="py-3 px-3 text-right font-mono font-medium text-emerald-900">
                  {formatNRS(invoice.wasteAmount)}
                </td>
              </tr>

              {/* Common Maintenance */}
              <tr>
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-900 flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-slate-500" />
                    <span>Common Area Maintenance & Power</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Shared corridor lighting, water pump operation, building safety</div>
                </td>
                <td className="py-3 px-3 text-right font-mono">Building Share</td>
                <td className="py-3 px-3 text-right font-mono">Fixed Ratio</td>
                <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                  {formatNRS(invoice.maintenanceFee)}
                </td>
              </tr>
            </tbody>

            {/* Total Footer */}
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colSpan={3} className="py-3 px-3 text-right font-bold text-slate-900 text-sm">
                  Total Amount Due:
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-base">
                  {formatNRS(invoice.totalDue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment History / Receipt Details if paid */}
        {invoice.status === 'paid' && (
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Official Payment Receipt Confirmed</span>
            </div>
            <div className="text-emerald-900 flex flex-wrap items-center gap-3 pt-1">
              <span>Paid Date: {invoice.paidDate}</span>
              <span aria-hidden="true">·</span>
              <span>Method: {invoice.paymentMethod}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">Ref: {invoice.receiptReference}</span>
            </div>
          </div>
        )}

        {/* Footer Notes & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-200 text-xs text-slate-500 print:hidden">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Compliant with Municipal Sub-metering & Fair Housing Regulations</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-900 rounded-md font-medium"
            >
              Close
            </button>
            {invoice.status !== 'paid' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPayModal(invoice);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md transition-colors"
              >
                {userRole === 'landlord' ? 'Mark Invoice as Paid' : 'Pay Invoice Online'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
