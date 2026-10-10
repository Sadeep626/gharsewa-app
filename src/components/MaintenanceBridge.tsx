import React, { useState } from 'react';
import {
  Wrench,
  Droplets,
  Zap,
  Trash2,
  Home,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Calendar,
  MessageSquare,
  DollarSign,
  Filter,
} from 'lucide-react';
import { MaintenanceTicket, PropertyUnit, UserRole } from '../types';
import { MaintenanceHeatmap } from './MaintenanceHeatmap';
import { formatNRS } from '../utils/currency';

interface MaintenanceBridgeProps {
  userRole: UserRole;
  units: PropertyUnit[];
  selectedUnitId: string;
  tickets: MaintenanceTicket[];
  onUpdateTicket: (updated: MaintenanceTicket) => void;
  onAddTicket: (newTicket: MaintenanceTicket) => void;
}

export const MaintenanceBridge: React.FC<MaintenanceBridgeProps> = ({
  userRole,
  units,
  selectedUnitId,
  tickets,
  onUpdateTicket,
  onAddTicket,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedTicketForEdit, setSelectedTicketForEdit] = useState<MaintenanceTicket | null>(null);

  // New ticket form states
  const [newUnitId, setNewUnitId] = useState(userRole === 'tenant' ? selectedUnitId : 'unit-201');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<MaintenanceTicket['category']>('water_plumbing');
  const [newPriority, setNewPriority] = useState<MaintenanceTicket['priority']>('routine');
  const [newDescription, setNewDescription] = useState('');

  // Edit ticket states for Landlord
  const [editStatus, setEditStatus] = useState<MaintenanceTicket['status']>('reported');
  const [editContractor, setEditContractor] = useState('');
  const [editScheduledDate, setEditScheduledDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCost, setEditCost] = useState<number | undefined>(undefined);

  const filteredTickets = tickets.filter((t) => {
    if (userRole === 'tenant' && t.unitId !== selectedUnitId) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const ticket: MaintenanceTicket = {
      id: `maint-${Date.now()}`,
      unitId: newUnitId,
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'reported',
      description: newDescription.trim(),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    onAddTicket(ticket);
    setNewTitle('');
    setNewDescription('');
    setShowNewModal(false);
  };

  const handleOpenEdit = (ticket: MaintenanceTicket) => {
    setSelectedTicketForEdit(ticket);
    setEditStatus(ticket.status);
    setEditContractor(ticket.contractorName || '');
    setEditScheduledDate(ticket.scheduledDate || '');
    setEditNotes(ticket.landlordNotes || '');
    setEditCost(ticket.cost);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForEdit) return;

    const updated: MaintenanceTicket = {
      ...selectedTicketForEdit,
      status: editStatus,
      contractorName: editContractor || undefined,
      scheduledDate: editScheduledDate || undefined,
      landlordNotes: editNotes || undefined,
      cost: editCost,
    };

    onUpdateTicket(updated);
    setSelectedTicketForEdit(null);
  };

  const getCategoryIcon = (category: MaintenanceTicket['category']) => {
    switch (category) {
      case 'water_plumbing':
        return <Droplets className="w-4 h-4 text-blue-600" />;
      case 'electrical':
        return <Zap className="w-4 h-4 text-amber-600" />;
      case 'waste_sanitation':
        return <Trash2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Home className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Maintenance & Habitability Bridge
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Direct incident reporting for plumbing leaks, electrical faults, sanitation, and prompt contractor scheduling.
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Submit Maintenance Ticket</span>
          </button>
        </div>
      </div>

      {/* Visual Building Heatmap for Structural Defects & Active Tickets */}
      <MaintenanceHeatmap
        tickets={tickets}
        units={units}
        userRole={userRole}
        selectedUnitId={selectedUnitId}
        onSelectUnitFilter={(uId) => {
          if (uId === 'all') {
            setCategoryFilter('all');
          }
        }}
      />

      {/* Ticket Management & Filter Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Category:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
              {[
                { id: 'all', label: 'All Issues' },
                { id: 'water_plumbing', label: 'Plumbing & Water' },
                { id: 'electrical', label: 'Electrical' },
                { id: 'waste_sanitation', label: 'Sanitation & Waste' },
                { id: 'structural_other', label: 'Structural' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                    categoryFilter === c.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Status:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
              {['all', 'reported', 'scheduled', 'in_progress', 'resolved'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                    statusFilter === s ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
            No maintenance tickets match the selected filters.
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const unit = units.find((u) => u.id === ticket.unitId);
            return (
              <div
                key={ticket.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="p-1.5 rounded-md bg-slate-100 flex items-center justify-center">
                        {getCategoryIcon(ticket.category)}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {ticket.title}
                      </h3>
                      <span className="text-xs text-slate-500">
                        ({unit?.unitNumber} · {unit?.tenantFamilyName})
                      </span>

                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          ticket.priority === 'emergency_24h'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : ticket.priority === 'urgent_48h'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ticket.priority.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 max-w-3xl leading-relaxed">
                      {ticket.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span>Reported: {ticket.createdAt}</span>
                      {ticket.scheduledDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 text-blue-700 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            Scheduled: {ticket.scheduledDate}
                          </span>
                        </>
                      )}
                      {ticket.contractorName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 text-slate-700">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            {ticket.contractorName}
                          </span>
                        </>
                      )}
                    </div>

                    {ticket.landlordNotes && (
                      <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">
                        <strong className="text-slate-800">Landlord Update:</strong> {ticket.landlordNotes}
                      </div>
                    )}
                  </div>

                  {/* Actions & Status Badge */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
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

                    {userRole === 'landlord' ? (
                      <button
                        onClick={() => handleOpenEdit(ticket)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        Manage & Dispatch
                      </button>
                    ) : (
                      ticket.status !== 'resolved' && (
                        <span className="text-[11px] text-slate-400">Under review by landlord</span>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Submit Maintenance or Habitability Ticket
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Apartment Unit
                </label>
                <select
                  value={newUnitId}
                  onChange={(e) => setNewUnitId(e.target.value)}
                  disabled={userRole === 'tenant'}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitNumber} - {u.tenantFamilyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Issue Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water dripping under kitchen sink, or flickering corridor light"
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
                    <option value="water_plumbing">Plumbing & Water Leak</option>
                    <option value="electrical">Electrical & Lighting</option>
                    <option value="waste_sanitation">Sanitation & Garbage Corral</option>
                    <option value="structural_other">Door / Window / HVAC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Urgency & Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                  >
                    <option value="routine">Routine (5–7 days)</option>
                    <option value="urgent_48h">Urgent (Within 48 Hours)</option>
                    <option value="emergency_24h">Emergency (Burst pipe / No power - 24h)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Detailed Description & Location
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe when the issue began, exact location, and whether emergency shutoff was attempted..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-slate-600 text-[11px]">
                Under standard habitability guidelines, urgent plumbing and electrical issues trigger a 24-hour statutory notice for repair entry.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md transition-colors"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Landlord Edit / Dispatch Modal */}
      {selectedTicketForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Manage Maintenance Ticket
                </h3>
                <p className="text-xs text-slate-500">{selectedTicketForEdit.title}</p>
              </div>
              <button
                onClick={() => setSelectedTicketForEdit(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Ticket Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                >
                  <option value="reported">Reported (Pending review)</option>
                  <option value="scheduled">Scheduled (Contractor booked)</option>
                  <option value="in_progress">In Progress (Work underway)</option>
                  <option value="resolved">Resolved (Completed)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Assigned Contractor / Tech
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Plumbing Co."
                    value={editContractor}
                    onChange={(e) => setEditContractor(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Scheduled Appointment
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2026-10-12 14:00"
                    value={editScheduledDate}
                    onChange={(e) => setEditScheduledDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Landlord Notes / Tenant Communication
                </label>
                <textarea
                  rows={2}
                  placeholder="Add notes for tenant family regarding access window or parts delivery..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Incurred Repair Expense (NRs.) (Houseowner Record)
                </label>
                <input
                  type="number"
                  step="50"
                  placeholder="Optional cost in NRs."
                  value={editCost !== undefined ? editCost : ''}
                  onChange={(e) => setEditCost(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-mono focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForEdit(null)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md transition-colors"
                >
                  Save & Update Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
