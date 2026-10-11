import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Plus,
  Shield,
  Clock,
  User,
  Building,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Smartphone,
  Calendar,
  RefreshCw,
  SlidersHorizontal,
  Lock,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { ActivityLogEntry, UserAccount, UserRole, PropertyUnit } from '../types';

interface ActivityLogsViewProps {
  logs: ActivityLogEntry[];
  currentUser: UserAccount | null;
  units: PropertyUnit[];
  onAddManualLog: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  onOpenLoginModal: () => void;
}

export const ActivityLogsView: React.FC<ActivityLogsViewProps> = ({
  logs,
  currentUser,
  units,
  onAddManualLog,
  onOpenLoginModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [isAddLogModalOpen, setIsAddLogModalOpen] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState<ActivityLogEntry | null>(null);

  // Manual Log Form State
  const [newAction, setNewAction] = useState('');
  const [newCategory, setNewCategory] = useState<ActivityLogEntry['category']>('meter');
  const [newDescription, setNewDescription] = useState('');
  const [newUnitNumber, setNewUnitNumber] = useState('All Units');
  const [newSeverity, setNewSeverity] = useState<ActivityLogEntry['severity']>('info');

  const categories = [
    { id: 'all', label: 'All Activities (सबै)', count: logs.length },
    { id: 'auth', label: 'Login & Sessions (लॉगिन)', count: logs.filter((l) => l.category === 'auth').length },
    { id: 'meter', label: 'Sub-Meters (मिटर)', count: logs.filter((l) => l.category === 'meter').length },
    { id: 'billing', label: 'Billing & Rent (भाडा/बिल)', count: logs.filter((l) => l.category === 'billing').length },
    { id: 'groceries', label: 'Pantry Groceries (भान्सा)', count: logs.filter((l) => l.category === 'groceries').length },
    { id: 'maintenance', label: 'Maintenance (मर्मत)', count: logs.filter((l) => l.category === 'maintenance').length },
    { id: 'notices', label: 'Notices & Legal (सूचना)', count: logs.filter((l) => l.category === 'notices' || l.category === 'legal').length },
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'notices') {
          if (log.category !== 'notices' && log.category !== 'legal') return false;
        } else if (log.category !== selectedCategory) {
          return false;
        }
      }

      // Unit filter
      if (selectedUnit !== 'all') {
        if (!log.unitNumber || !log.unitNumber.includes(selectedUnit)) return false;
      }

      // Severity filter
      if (selectedSeverity !== 'all' && log.severity !== selectedSeverity) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesDesc = log.description.toLowerCase().includes(q);
        const matchesActor = log.actorName.toLowerCase().includes(q);
        const matchesDevice = log.ipOrDevice?.toLowerCase().includes(q);
        const matchesUnit = log.unitNumber?.toLowerCase().includes(q);
        return matchesAction || matchesDesc || matchesActor || matchesDevice || matchesUnit;
      }

      return true;
    });
  }, [logs, selectedCategory, selectedUnit, selectedSeverity, searchQuery]);

  // Export functions
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kinhome-audit-log-${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Category', 'Action', 'Severity', 'Actor', 'Role', 'Unit', 'Description', 'Device'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.category,
      `"${l.action.replace(/"/g, '""')}"`,
      l.severity,
      `"${l.actorName.replace(/"/g, '""')}"`,
      l.actorRole,
      l.unitNumber || 'N/A',
      `"${l.description.replace(/"/g, '""')}"`,
      `"${(l.ipOrDevice || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kinhome-audit-log-${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSubmitManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.trim() || !newDescription.trim()) return;

    onAddManualLog({
      action: newAction.trim(),
      category: newCategory,
      description: newDescription.trim(),
      actorName: currentUser ? currentUser.name : 'Duty Manager',
      actorRole: currentUser ? currentUser.role : 'landlord',
      unitNumber: newUnitNumber === 'All Units' ? undefined : newUnitNumber,
      severity: newSeverity,
      ipOrDevice: 'Manual Log Facility · KinHome Desk',
    });

    setNewAction('');
    setNewDescription('');
    setIsAddLogModalOpen(false);
  };

  const getSeverityBadge = (severity: ActivityLogEntry['severity']) => {
    switch (severity) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Success
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Warning
          </span>
        );
      case 'alert':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Alert
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
            <Info className="w-3 h-3 text-indigo-600" />
            Info
          </span>
        );
    }
  };

  const formatLogTime = (ts: string) => {
    try {
      const date = new Date(ts);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                लॉग सुविधा · Operational Audit Trail
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">Real-Time Event Stream</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Activity & Security Logging Facility
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Centralized, tamper-evident audit logs tracking resident logins, sub-meter readings,
              rent settlements, family grocery dispatches, and maintenance status changes across Himalayan Heights.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddLogModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Record Log Entry</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors shadow-2xs"
              title="Download CSV report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors shadow-2xs"
              title="Download JSON audit log"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total Log Entries
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
              {logs.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Active residency logs</div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider">
              Auth & Logins
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-0.5">
              {logs.filter((l) => l.category === 'auth').length}
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Verified sessions</div>
          </div>

          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
            <div className="text-[11px] font-medium text-indigo-800 uppercase tracking-wider">
              Bills & Payments
            </div>
            <div className="text-2xl font-extrabold text-indigo-700 font-mono mt-0.5">
              {logs.filter((l) => l.category === 'billing').length}
            </div>
            <div className="text-[11px] text-indigo-700 mt-0.5">eSewa / Ledger events</div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <div className="text-[11px] font-medium text-amber-800 uppercase tracking-wider">
              Groceries & Field
            </div>
            <div className="text-2xl font-extrabold text-amber-700 font-mono mt-0.5">
              {logs.filter((l) => l.category === 'groceries' || l.category === 'meter').length}
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">Pantry & Sub-meters</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs by action, resident name, flat number, or device..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Unit selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Units / Flats</option>
              <option value="201">Apt 201 (Sharma)</option>
              <option value="104">Apt 104 (Shrestha)</option>
              <option value="302">Apt 302 (Adhikari)</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Severities</option>
              <option value="success">Success</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="alert">Alert</option>
            </select>
          </div>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex overflow-x-auto gap-1.5 pt-1 pb-1 scrollbar-none border-t border-slate-100">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Logs Table / Stream */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Audit Stream ({filteredLogs.length} events)
            </span>
            {searchQuery && (
              <span className="text-xs text-slate-500">matching "{searchQuery}"</span>
            )}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Audit Logger Active</span>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No matching log entries found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search terms or selecting a different category filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLogDetail(log)}
                  className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {log.category === 'auth' && (
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                          <Lock className="w-4 h-4" />
                        </div>
                      )}
                      {log.category === 'meter' && (
                        <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                          <SlidersHorizontal className="w-4 h-4" />
                        </div>
                      )}
                      {log.category === 'billing' && (
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      {log.category === 'groceries' && (
                        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                          <Layers className="w-4 h-4" />
                        </div>
                      )}
                      {log.category === 'maintenance' && (
                        <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                      {(log.category === 'notices' || log.category === 'legal') && (
                        <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                          <Shield className="w-4 h-4" />
                        </div>
                      )}
                      {log.category === 'system' && (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {log.action}
                        </span>
                        {getSeverityBadge(log.severity)}
                        {log.unitNumber && (
                          <span className="text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                            {log.unitNumber}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 md:line-clamp-1">
                        {log.description}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-500">
                          <User className="w-3 h-3" />
                          <span>{log.actorName} ({log.actorRole})</span>
                        </span>
                        <span>·</span>
                        {log.ipOrDevice && (
                          <>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Smartphone className="w-3 h-3" />
                              <span>{log.ipOrDevice}</span>
                            </span>
                            <span>·</span>
                          </>
                        )}
                        <span className="font-mono text-slate-400">ID: {log.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 md:pl-4 flex md:flex-col items-center md:items-end justify-between gap-1">
                    <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatLogTime(log.timestamp)}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {log.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Log Modal */}
      {isAddLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Record Building Activity Log</h3>
                <p className="text-xs text-slate-300">
                  Manual field entry or inspection note for Himalayan Heights
                </p>
              </div>
              <button
                onClick={() => setIsAddLogModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitManualLog} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Action Title
                </label>
                <input
                  type="text"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  placeholder="e.g. Overhead Tank Cleaning Inspected"
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  >
                    <option value="meter">Sub-Meter</option>
                    <option value="billing">Billing</option>
                    <option value="groceries">Groceries</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="notices">Notice/Legal</option>
                    <option value="auth">Auth/Security</option>
                    <option value="system">System/Facility</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="alert">Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Apartment / Unit
                </label>
                <select
                  value={newUnitNumber}
                  onChange={(e) => setNewUnitNumber(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-slate-50"
                >
                  <option value="All Units">Building-Wide (All Units)</option>
                  <option value="Apt 201">Apt 201 (The Sharma Family)</option>
                  <option value="Apt 104">Apt 104 (The Shrestha Family)</option>
                  <option value="Apt 302">Apt 302 (The Adhikari Family)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Operational Notes
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter details of the action or event..."
                  required
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLogModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Commit Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Detail Drawer / Modal */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Audit Record Details</h3>
              </div>
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="text-slate-400 hover:text-slate-700 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Action Title
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                  {selectedLogDetail.action}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Category:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {selectedLogDetail.category}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Severity:</span>
                  <div>{getSeverityBadge(selectedLogDetail.severity)}</div>
                </div>
                <div>
                  <span className="text-slate-500 block">Actor:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedLogDetail.actorName} ({selectedLogDetail.actorRole})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Flat / Unit:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedLogDetail.unitNumber || 'All Building'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Description & Event Log
                </span>
                <p className="p-3 bg-slate-100 rounded-lg text-slate-700 leading-relaxed font-sans">
                  {selectedLogDetail.description}
                </p>
              </div>

              <div className="space-y-1 text-slate-500 pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span className="font-mono text-slate-700">{selectedLogDetail.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span>Device / Terminal:</span>
                  <span className="font-mono text-slate-700">{selectedLogDetail.ipOrDevice || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Audit ID:</span>
                  <span className="font-mono text-slate-700">{selectedLogDetail.id}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
