import React, { useState } from 'react';
import {
  Bell,
  Calendar,
  AlertCircle,
  PlusCircle,
  Wrench,
  Trash2,
  Scale,
  Users,
  ClockAlert,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  BuildingNotice,
  UserRole,
  PropertyUnit,
  ConsolidatedInvoice,
} from '../types';

interface NoticeBoardViewProps {
  userRole: UserRole;
  selectedUnitId: string;
  units: PropertyUnit[];
  invoices: ConsolidatedInvoice[];
  notices: BuildingNotice[];
  onAddNotice: (notice: BuildingNotice) => void;
  onRunOverdueAudit: () => { scannedCount: number; overdueCount: number };
  onOpenPayModal: (invoice: ConsolidatedInvoice) => void;
  onOpenInvoiceDetail: (invoice: ConsolidatedInvoice) => void;
  onNavigateTab: (tab: string) => void;
}

export const NoticeBoardView: React.FC<NoticeBoardViewProps> = ({
  userRole,
  selectedUnitId,
  units,
  invoices,
  notices,
  onAddNotice,
  onRunOverdueAudit,
  onOpenPayModal,
  onOpenInvoiceDetail,
  onNavigateTab,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [auditFeedback, setAuditFeedback] = useState<string | null>(null);

  // New notice form states
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<BuildingNotice['category']>('utility_maintenance');
  const [newContent, setNewContent] = useState('');
  const [newEffectiveDate, setNewEffectiveDate] = useState('');
  const [newIsUrgent, setNewIsUrgent] = useState(false);

  // Filter notices based on role and active unit
  const visibleNotices = notices.filter((n) => {
    if (userRole === 'landlord') {
      // Landlord sees broadcast notices and landlord-specific notices
      if (n.targetRole === 'tenant') return false;
      return true;
    } else {
      // Tenant sees broadcast notices and tenant-specific notices for their unit
      if (n.targetRole === 'landlord') return false;
      if (n.targetRole === 'tenant' && n.targetUnitId && n.targetUnitId !== selectedUnitId) {
        return false;
      }
      return true;
    }
  });

  const filteredNotices = visibleNotices.filter((n) => {
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    return true;
  });

  // Count active overdue notices for current user view
  const overdueAlertsCount = visibleNotices.filter((n) => n.category === 'overdue_payment').length;

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const notice: BuildingNotice = {
      id: `not-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      content: newContent.trim(),
      publishDate: new Date().toISOString().substring(0, 10),
      effectiveDate: newEffectiveDate || new Date().toISOString().substring(0, 10),
      author: 'Arthur Pendelton (Property Owner)',
      isUrgent: newIsUrgent,
      targetRole: 'all',
    };

    onAddNotice(notice);
    setNewTitle('');
    setNewContent('');
    setShowAddModal(false);
  };

  const handleTriggerAudit = () => {
    const result = onRunOverdueAudit();
    setAuditFeedback(
      `Audit executed: Scanned ${result.scannedCount} invoices across Cedar Crest. Identified ${result.overdueCount} invoice(s) overdue by >7 days.`
    );
    setTimeout(() => setAuditFeedback(null), 5000);
  };

  const getCategoryBadge = (category: BuildingNotice['category']) => {
    switch (category) {
      case 'overdue_payment':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <ClockAlert className="w-3 h-3 text-rose-600" />
            Overdue Payment Sentinel (&gt;7d)
          </span>
        );
      case 'utility_maintenance':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <Wrench className="w-3 h-3" />
            Utility Maintenance
          </span>
        );
      case 'waste_collection':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <Trash2 className="w-3 h-3" />
            Waste & Sanitation
          </span>
        );
      case 'legal_notice':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            <Scale className="w-3 h-3" />
            Statutory Inspection
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            <Users className="w-3 h-3" />
            Community
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Bell className="w-4 h-4 text-indigo-600" />
              <span>Building Communications & System Alerts</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              Official Notice Board & Automated Payment Sentinel
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Verified announcements for utility maintenance, waste sanitation schedules, and automated overdue payment notifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {userRole === 'landlord' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Post Broadcast Notice</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 mt-5 p-1 bg-slate-100 rounded-lg w-fit border border-slate-200/80 text-xs">
          {[
            { id: 'all', label: 'All Notices' },
            { id: 'overdue_payment', label: `Payment Sentinel (${overdueAlertsCount})` },
            { id: 'utility_maintenance', label: 'Utility Work' },
            { id: 'waste_collection', label: 'Waste & Sanitation' },
            { id: 'legal_notice', label: 'Statutory Inspections' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Automated Overdue Sentinel Watchdog Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                Automated Overdue Invoices Watchdog
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Active · 7-Day Threshold
              </span>
            </div>
            <p className="text-slate-500 mt-0.5">
              Continuously inspects all consolidated rent & utility bills. Invoices unpaid for &gt;7 days trigger automated system alerts with statutory next steps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={handleTriggerAudit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Run Overdue Audit Now</span>
          </button>
        </div>
      </div>

      {/* Audit Feedback Banner */}
      {auditFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{auditFeedback}</span>
        </div>
      )}

      {/* Notices Feed */}
      <div className="space-y-4">
        {filteredNotices.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
            No notices match the selected category.
          </div>
        ) : (
          filteredNotices.map((n) => {
            const isOverdue = n.category === 'overdue_payment';
            const matchedInvoice = n.invoiceId
              ? invoices.find((inv) => inv.id === n.invoiceId)
              : null;
            const matchedUnit = n.targetUnitId
              ? units.find((u) => u.id === n.targetUnitId)
              : null;

            return (
              <div
                key={n.id}
                className={`bg-white rounded-xl border p-5 shadow-xs space-y-3 transition-colors ${
                  isOverdue
                    ? 'border-rose-300 bg-rose-50/20 shadow-xs'
                    : n.isUrgent
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{n.title}</h3>

                      {isOverdue && n.daysOverdue && (
                        <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                          {n.daysOverdue} Days Overdue
                        </span>
                      )}

                      {isOverdue && n.outstandingAmount && (
                        <span className="text-[11px] font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          Outstanding: ${n.outstandingAmount.toFixed(2)}
                        </span>
                      )}

                      {!isOverdue && n.isUrgent && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          Important
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                      <span>Posted: {n.publishDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>Author: {n.author}</span>
                      {matchedUnit && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-slate-700">
                            Target: {matchedUnit.unitNumber} ({matchedUnit.tenantFamilyName})
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>{getCategoryBadge(n.category)}</div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-4xl">
                  {n.content}
                </p>

                {/* Overdue Action Toolbar */}
                {isOverdue && matchedInvoice && (
                  <div className="pt-3 border-t border-rose-100/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-rose-800 font-medium">
                      Status: {matchedInvoice.status.toUpperCase()} · Due date was {matchedInvoice.dueDate}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenInvoiceDetail(matchedInvoice)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
                      >
                        Inspect Itemized Bill
                      </button>

                      {userRole === 'tenant' ? (
                        <button
                          onClick={() => onOpenPayModal(matchedInvoice)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Pay Balance Now (${matchedInvoice.totalDue.toFixed(2)})</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onNavigateTab('legal')}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Scale className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Draft Statutory Notice to Cure</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Post Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Publish Building Notice to All Tenants
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Notice Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water Main Flushed or Waste Pickup Rescheduled"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                  >
                    <option value="utility_maintenance">Utility Maintenance</option>
                    <option value="waste_collection">Waste & Sanitation</option>
                    <option value="legal_notice">Statutory Inspection</option>
                    <option value="community">Community / Building</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newEffectiveDate}
                    onChange={(e) => setNewEffectiveDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Notice Content & Instructions for Families
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="State the timeline, impacted units, and guidelines..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={newIsUrgent}
                  onChange={(e) => setNewIsUrgent(e.target.checked)}
                  className="rounded text-slate-900"
                />
                <label htmlFor="urgent" className="text-slate-700 font-medium cursor-pointer">
                  Mark as High Priority (Send immediate alert to all families)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md transition-colors"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
