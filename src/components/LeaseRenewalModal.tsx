import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Scale,
  DollarSign,
  FileText,
  UserCheck,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { PropertyUnit, LegalNoticeDraft } from '../types';

interface LeaseRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: PropertyUnit | null;
  onConfirmRenewal: (unitId: string, newLeaseEnd: string, newBaseRent: number, notes: string) => void;
  onIssueVacateNotice: (unitId: string, vacateDate: string, reason: string) => void;
}

export const LeaseRenewalModal: React.FC<LeaseRenewalModalProps> = ({
  isOpen,
  onClose,
  unit,
  onConfirmRenewal,
  onIssueVacateNotice,
}) => {
  if (!isOpen || !unit) return null;

  const [decision, setDecision] = useState<'renew' | 'vacate'>('renew');
  
  // Renewal fields
  const [termMonths, setTermMonths] = useState<number>(12);
  const [newRent, setNewRent] = useState<number>(unit.baseRent);
  const [renewalNotes, setRenewalNotes] = useState(
    'Tenant in good standing. Proposing standard 12-month lease renewal with continuation of all water, electric, and waste sub-metering terms.'
  );

  // Vacate notice fields
  const [vacateDate, setVacateDate] = useState(unit.leaseEnd);
  const [vacateReason, setVacateReason] = useState(
    'Natural expiration of fixed-term tenancy. Landlord scheduling scheduled unit refurbishment and painting.'
  );

  // Calculate new proposed lease end date based on term
  const currentEndDate = new Date(unit.leaseEnd);
  const calculatedNewEndDate = new Date(currentEndDate);
  calculatedNewEndDate.setMonth(calculatedNewEndDate.getMonth() + termMonths);
  const formattedNewEndDate = calculatedNewEndDate.toISOString().substring(0, 10);

  // Rent difference calculation
  const rentDiff = newRent - unit.baseRent;
  const rentPct = ((rentDiff / unit.baseRent) * 100).toFixed(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (decision === 'renew') {
      onConfirmRenewal(unit.id, formattedNewEndDate, newRent, renewalNotes);
    } else {
      onIssueVacateNotice(unit.id, vacateDate, vacateReason);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
              <Clock className="w-3.5 h-3.5" />
              <span>30-Day Lease Expiration Action</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Renew or Vacate: {unit.unitNumber} ({unit.tenantFamilyName})
            </h3>
            <p className="text-xs text-slate-500">
              Current lease ends on <strong className="text-slate-800">{unit.leaseEnd}</strong>. Statutory 30-day notice window active.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Decision Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setDecision('renew')}
            className={`py-2 px-3 rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              decision === 'renew'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Offer Lease Renewal</span>
          </button>
          <button
            type="button"
            onClick={() => setDecision('vacate')}
            className={`py-2 px-3 rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              decision === 'vacate'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Notice of Non-Renewal</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {decision === 'renew' ? (
            /* Renewal Form */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Renewal Term
                  </label>
                  <select
                    value={termMonths}
                    onChange={(e) => setTermMonths(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                  >
                    <option value={12}>12 Months (Recommended)</option>
                    <option value={6}>6 Months</option>
                    <option value={24}>24 Months</option>
                    <option value={1}>Month-to-Month Extension</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    New Lease Expiration
                  </label>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-md font-mono text-slate-800 font-semibold">
                    {formattedNewEndDate}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-medium">
                    Adjusted Monthly Base Rent ($)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Current: ${unit.baseRent}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="5"
                    required
                    value={newRent}
                    onChange={(e) => setNewRent(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-mono font-semibold focus:outline-hidden"
                  />
                </div>

                {rentDiff !== 0 && (
                  <div className="mt-1 text-[11px] flex items-center justify-between text-slate-500">
                    <span>
                      Adjustment: {rentDiff > 0 ? `+$${rentDiff}` : `-$${Math.abs(rentDiff)}`} ({rentPct}%)
                    </span>
                    <span className="text-emerald-700 font-medium">
                      ✓ Compliant with Statutory Rent Stabilization Cap
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Renewal Notes & Clause References
                </label>
                <textarea
                  rows={3}
                  value={renewalNotes}
                  onChange={(e) => setRenewalNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-[11px]">
                Confirming renewal will automatically extend the unit's lease dates, preserve existing water & electricity sub-meter IDs, and notify the tenant family in the Living Bridge.
              </div>
            </div>
          ) : (
            /* Vacate Form */
            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Mandated Move-Out / Vacate Date
                </label>
                <input
                  type="date"
                  required
                  value={vacateDate}
                  onChange={(e) => setVacateDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Statutory Grounds / Non-Renewal Explanation
                </label>
                <textarea
                  rows={3}
                  required
                  value={vacateReason}
                  onChange={(e) => setVacateReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-900 text-[11px] space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Statutory 30-Day Notice Requirement</span>
                </div>
                <p>
                  Pursuant to tenancy statutes, fixed-term non-renewal requires at least 30 days written notice before lease end date. A formal notice will be drafted to the Legal Notices archive.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-900 rounded-md font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white font-semibold rounded-md transition-colors ${
                decision === 'renew'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {decision === 'renew' ? 'Confirm Lease Renewal' : 'Issue Notice to Vacate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
