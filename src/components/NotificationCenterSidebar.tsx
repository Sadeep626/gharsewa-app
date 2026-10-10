import React, { useState, useMemo } from 'react';
import {
  Bell,
  X,
  Calendar,
  Wrench,
  Scale,
  Receipt,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Droplets,
  DollarSign,
  Trash2,
  ShoppingCart,
} from 'lucide-react';
import {
  ConsolidatedInvoice,
  MaintenanceTicket,
  BuildingNotice,
  LegalNoticeDraft,
  PropertyUnit,
  UserRole,
  FamilyGroceryOrder,
} from '../types';
import { formatNRS } from '../utils/currency';

interface NotificationCenterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  selectedUnitId: string;
  units: PropertyUnit[];
  invoices: ConsolidatedInvoice[];
  maintenanceTickets: MaintenanceTicket[];
  notices: BuildingNotice[];
  legalNotices: LegalNoticeDraft[];
  groceryOrders?: FamilyGroceryOrder[];
  onNavigateTab: (tab: string) => void;
  onOpenPayModal: (invoice: ConsolidatedInvoice) => void;
  onOpenInvoiceDetail: (invoice: ConsolidatedInvoice) => void;
  onOpenLeaseRenewalModal?: (unit: PropertyUnit) => void;
}

type NotificationCategory = 'all' | 'deadlines' | 'maintenance' | 'legal';

interface ConsolidatedNotificationItem {
  id: string;
  type: 'deadline' | 'maintenance' | 'legal';
  title: string;
  subtitle: string;
  description: string;
  timestamp: string;
  isUrgent: boolean;
  badgeText: string;
  badgeColor: string;
  unitId?: string;
  unitNumber?: string;
  actionLabel?: string;
  actionHandler?: () => void;
}

export const NotificationCenterSidebar: React.FC<NotificationCenterSidebarProps> = ({
  isOpen,
  onClose,
  userRole,
  selectedUnitId,
  units,
  invoices,
  maintenanceTickets,
  notices,
  legalNotices,
  groceryOrders = [],
  onNavigateTab,
  onOpenPayModal,
  onOpenInvoiceDetail,
  onOpenLeaseRenewalModal,
}) => {
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Build consolidated list of notifications
  const allNotifications = useMemo(() => {
    const list: ConsolidatedNotificationItem[] = [];
    const today = new Date();

    // 1. Rent & Utility Deadlines
    invoices.forEach((inv) => {
      // Filter for tenant
      if (userRole === 'tenant' && inv.unitId !== selectedUnitId) return;

      const unit = units.find((u) => u.id === inv.unitId);
      const isPaid = inv.status === 'paid';
      if (isPaid) return; // Only show pending/overdue deadlines

      const dueDate = new Date(inv.dueDate);
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = diffDays < 0;

      list.push({
        id: `notif-inv-${inv.id}`,
        type: 'deadline',
        title: isOverdue
          ? `Overdue Payment: ${unit?.unitNumber || 'Unit'}`
          : `Upcoming Rent Due: ${unit?.unitNumber || 'Unit'}`,
        subtitle: `${inv.billingMonth} Consolidated Bill`,
        description: `Total amount due is ${formatNRS(inv.totalDue)} (Base Rent: ${formatNRS(inv.baseRent)}, Utilities: ${formatNRS(inv.waterAmount + inv.electricAmount + inv.wasteAmount)}). Due date: ${inv.dueDate}.`,
        timestamp: isOverdue ? `${Math.abs(diffDays)}d overdue` : `Due in ${diffDays}d`,
        isUrgent: isOverdue,
        badgeText: isOverdue ? 'Overdue' : 'Due Soon',
        badgeColor: isOverdue
          ? 'bg-rose-100 text-rose-800 border-rose-200'
          : 'bg-amber-100 text-amber-800 border-amber-200',
        unitId: inv.unitId,
        unitNumber: unit?.unitNumber,
        actionLabel: userRole === 'tenant' ? 'Pay Now' : 'View Bill',
        actionHandler: () => {
          onClose();
          if (userRole === 'tenant') {
            onOpenPayModal(inv);
          } else {
            onOpenInvoiceDetail(inv);
          }
        },
      });
    });

    // 2. Maintenance Reminders
    maintenanceTickets.forEach((ticket) => {
      if (userRole === 'tenant' && ticket.unitId !== selectedUnitId) return;
      if (ticket.status === 'resolved') return;

      const unit = units.find((u) => u.id === ticket.unitId);
      const isUrgent = ticket.priority === 'emergency_24h' || ticket.priority === 'urgent_48h';

      list.push({
        id: `notif-ticket-${ticket.id}`,
        type: 'maintenance',
        title: `Maintenance: ${ticket.title}`,
        subtitle: `${unit?.unitNumber || 'Unit'} · Status: ${ticket.status.replace('_', ' ')}`,
        description: ticket.scheduledDate
          ? `Contractor ${ticket.contractorName || 'assigned'} scheduled for ${ticket.scheduledDate}. Ensure premise access.`
          : ticket.description,
        timestamp: ticket.scheduledDate ? `Visit: ${ticket.scheduledDate}` : ticket.createdAt,
        isUrgent,
        badgeText: ticket.status.replace('_', ' ').toUpperCase(),
        badgeColor:
          ticket.status === 'scheduled'
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : isUrgent
            ? 'bg-rose-100 text-rose-800 border-rose-200'
            : 'bg-slate-100 text-slate-700 border-slate-200',
        unitId: ticket.unitId,
        unitNumber: unit?.unitNumber,
        actionLabel: 'Inspect Ticket',
        actionHandler: () => {
          onClose();
          onNavigateTab('maintenance');
        },
      });
    });

    // 3. Legal Notice & Lease Statuses
    // Check expiring leases (30-day window)
    units.forEach((unit) => {
      if (userRole === 'tenant' && unit.id !== selectedUnitId) return;
      const endTime = new Date(unit.leaseEnd).getTime();
      const daysRemaining = Math.ceil((endTime - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 30 && daysRemaining >= 0) {
        list.push({
          id: `notif-lease-${unit.id}`,
          type: 'legal',
          title: `Lease Expiration Alert: ${unit.unitNumber}`,
          subtitle: `${unit.tenantFamilyName} · ${daysRemaining} days remaining`,
          description: `Tenancy agreement ends on ${unit.leaseEnd}. Under Muluki Civil Code 2074, serve 30-day notice or finalize lease renewal addendum.`,
          timestamp: `${daysRemaining}d left`,
          isUrgent: true,
          badgeText: 'Renew / Vacate',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          actionLabel: userRole === 'landlord' ? 'Renew / Vacate' : 'View Rights',
          actionHandler: () => {
            onClose();
            if (userRole === 'landlord' && onOpenLeaseRenewalModal) {
              onOpenLeaseRenewalModal(unit);
            } else {
              onNavigateTab('legal');
            }
          },
        });
      }
    });

    // Check legal notices
    legalNotices.forEach((ln) => {
      if (userRole === 'tenant' && ln.unitId && ln.unitId !== selectedUnitId) return;
      list.push({
        id: `notif-legal-${ln.id}`,
        type: 'legal',
        title: ln.title,
        subtitle: `Ref: ${ln.statutoryReference}`,
        description: ln.content.substring(0, 140) + '...',
        timestamp: ln.createdDate,
        isUrgent: ln.noticeType === 'cure_or_quit',
        badgeText: ln.status.toUpperCase(),
        badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        unitId: ln.unitId,
        actionLabel: 'Open Legal Portal',
        actionHandler: () => {
          onClose();
          onNavigateTab('legal');
        },
      });
    });

    // 4. Active Family Grocery & Bulk Deliveries
    if (groceryOrders) {
      groceryOrders.forEach((order) => {
        if (userRole === 'tenant' && order.unitId !== selectedUnitId) return;
        if (order.status === 'delivered_at_door' || order.status === 'cancelled') return;

        const unit = units.find((u) => u.id === order.unitId);
        const isOutForDelivery = order.status === 'out_for_delivery';

        list.push({
          id: `notif-gro-${order.id}`,
          type: 'deadline',
          title: `Grocery Delivery: ${order.orderNumber}`,
          subtitle: `${unit?.unitNumber || 'Unit'} · ${order.items.length} items (${formatNRS(order.totalAmount)})`,
          description: isOutForDelivery
            ? `Doorstep delivery is out on van to ${order.deliveryLocation}. Arriving shortly.`
            : `Order confirmed for delivery slot: ${order.deliverySlot.replace(/_/g, ' ')}.`,
          timestamp: order.orderDate,
          isUrgent: isOutForDelivery,
          badgeText: order.status.replace(/_/g, ' ').toUpperCase(),
          badgeColor: isOutForDelivery
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : 'bg-emerald-100 text-emerald-800 border-emerald-200',
          unitId: order.unitId,
          unitNumber: unit?.unitNumber,
          actionLabel: 'Track Delivery',
          actionHandler: () => {
            onClose();
            onNavigateTab('groceries');
          },
        });
      });
    }

    return list;
  }, [invoices, maintenanceTickets, legalNotices, groceryOrders, units, userRole, selectedUnitId]);

  // Filter by category and dismissal
  const filteredList = useMemo(() => {
    return allNotifications.filter((item) => {
      if (dismissedIds.has(item.id)) return false;
      if (activeCategory === 'deadlines') return item.type === 'deadline';
      if (activeCategory === 'maintenance') return item.type === 'maintenance';
      if (activeCategory === 'legal') return item.type === 'legal';
      return true;
    });
  }, [allNotifications, activeCategory, dismissedIds]);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const handleDismissAll = () => {
    setDismissedIds(new Set(allNotifications.map((n) => n.id)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Bell className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Notification & Action Center
                  </h2>
                  <p className="text-xs text-slate-500">
                    Consolidated deadlines, maintenance & legal statuses
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                title="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-4 p-1 bg-slate-200/70 rounded-lg text-xs">
              {[
                { id: 'all', label: 'All', count: allNotifications.length },
                { id: 'deadlines', label: 'Rent Deadlines', count: allNotifications.filter((n) => n.type === 'deadline').length },
                { id: 'maintenance', label: 'Maintenance', count: allNotifications.filter((n) => n.type === 'maintenance').length },
                { id: 'legal', label: 'Legal & Lease', count: allNotifications.filter((n) => n.type === 'legal').length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id as NotificationCategory)}
                  className={`flex-1 py-1.5 px-2 rounded-md font-medium text-center transition-colors flex items-center justify-center gap-1 ${
                    activeCategory === tab.id
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="text-[10px] font-mono px-1.5 rounded-full bg-slate-100 text-slate-600">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredList.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-800">All Caught Up!</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  No pending rent deadlines, unresolved repairs, or urgent statutory legal notices for this view.
                </p>
              </div>
            ) : (
              filteredList.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all space-y-2 relative group ${
                    item.isUrgent
                      ? 'border-rose-200 bg-rose-50/30 hover:border-rose-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Top line badge & dismiss button */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${item.badgeColor}`}>
                        {item.badgeText}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {item.timestamp}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDismiss(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 p-1 text-xs transition-opacity"
                      title="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title & subtitle */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Content body */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Action Link Button */}
                  {item.actionLabel && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={item.actionHandler}
                        className="text-xs font-semibold text-slate-900 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                      >
                        <span>{item.actionLabel}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {item.type === 'deadline' && (
                        <span className="text-[11px] font-mono text-slate-400">
                          Invoice Ledger
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono">
              {filteredList.length} active notification{filteredList.length !== 1 ? 's' : ''}
            </span>

            {filteredList.length > 0 && (
              <button
                onClick={handleDismissAll}
                className="text-slate-600 hover:text-slate-900 font-medium underline"
              >
                Clear all from view
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
