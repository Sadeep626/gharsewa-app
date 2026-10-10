/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  INITIAL_UNITS,
  INITIAL_WATER_READINGS,
  INITIAL_ELECTRIC_READINGS,
  INITIAL_WASTE_FEES,
  INITIAL_INVOICES,
  INITIAL_MAINTENANCE_TICKETS,
  INITIAL_NOTICES,
  INITIAL_LEGAL_NOTICES,
  INITIAL_DISPUTES,
  INITIAL_GROCERY_ITEMS,
  INITIAL_FAMILY_CARTS,
  INITIAL_GROCERY_ORDERS,
} from './data/mockData';
import {
  UserRole,
  PropertyUnit,
  WaterMeterReading,
  ElectricMeterReading,
  WasteManagementFee,
  ConsolidatedInvoice,
  MaintenanceTicket,
  BuildingNotice,
  LegalNoticeDraft,
  TenancyDispute,
  GroceryItem,
  CartItem,
  FamilyGroceryOrder,
} from './types';
import { formatNRS } from './utils/currency';
import {
  identifyOverdueInvoicesAndGenerateNotices,
  mergeOverdueNotices,
} from './utils/overdueWatchdog';
import { TopBar } from './components/TopBar';
import { DashboardOverview } from './components/DashboardOverview';
import { UtilityBillsView } from './components/UtilityBillsView';
import { WasteSanitationView } from './components/WasteSanitationView';
import { MaintenanceBridge } from './components/MaintenanceBridge';
import { LegalConsultationView } from './components/LegalConsultationView';
import { NoticeBoardView } from './components/NoticeBoardView';
import { FamilyGroceriesView } from './components/FamilyGroceriesView';
import { FamilyCartModal } from './components/FamilyCartModal';
import { LogMeterModal } from './components/LogMeterModal';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { PaymentModal } from './components/PaymentModal';
import { LeaseRenewalModal } from './components/LeaseRenewalModal';
import { NotificationCenterSidebar } from './components/NotificationCenterSidebar';

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>('landlord');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('unit-201');
  const [currentTab, setCurrentTab] = useState<string>('overview');

  // Application Data States (persistent in memory during session)
  const [units, setUnits] = useState<PropertyUnit[]>(INITIAL_UNITS);
  const [waterReadings, setWaterReadings] = useState<WaterMeterReading[]>(INITIAL_WATER_READINGS);
  const [electricReadings, setElectricReadings] = useState<ElectricMeterReading[]>(INITIAL_ELECTRIC_READINGS);
  const [wasteFees, setWasteFees] = useState<WasteManagementFee[]>(INITIAL_WASTE_FEES);
  const [invoices, setInvoices] = useState<ConsolidatedInvoice[]>(INITIAL_INVOICES);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>(INITIAL_MAINTENANCE_TICKETS);
  
  // Initialize notices with automated 7-day overdue watchdog scan
  const [notices, setNotices] = useState<BuildingNotice[]>(() => {
    const audit = identifyOverdueInvoicesAndGenerateNotices(INITIAL_INVOICES, INITIAL_UNITS, new Date(), 7);
    return mergeOverdueNotices(INITIAL_NOTICES, audit.generatedNotices);
  });

  const [legalNotices, setLegalNotices] = useState<LegalNoticeDraft[]>(INITIAL_LEGAL_NOTICES);
  const [disputes, setDisputes] = useState<TenancyDispute[]>(INITIAL_DISPUTES);

  // Groceries & Family Cart States
  const [groceryItems] = useState<GroceryItem[]>(INITIAL_GROCERY_ITEMS);
  const [familyCarts, setFamilyCarts] = useState<Record<string, CartItem[]>>(INITIAL_FAMILY_CARTS);
  const [groceryOrders, setGroceryOrders] = useState<FamilyGroceryOrder[]>(INITIAL_GROCERY_ORDERS);
  const [isFamilyCartOpen, setIsFamilyCartOpen] = useState(false);

  // Modals state
  const [isLogMeterOpen, setIsLogMeterOpen] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<ConsolidatedInvoice | null>(null);
  const [payInvoice, setPayInvoice] = useState<ConsolidatedInvoice | null>(null);
  const [selectedExpiringUnitForModal, setSelectedExpiringUnitForModal] = useState<PropertyUnit | null>(null);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // Current Unit Family Cart
  const currentCartItems = familyCarts[selectedUnitId] || [];
  const familyCartCount = currentCartItems.reduce((acc, i) => acc + i.quantity, 0);

  // Computations for notification badges
  const unpaidCount = invoices.filter((i) => i.status !== 'paid').length;
  const openTicketsCount = maintenanceTickets.filter((t) => t.status !== 'resolved').length;
  const overdueAlertsCount = notices.filter((n) => {
    if (n.category !== 'overdue_payment') return false;
    if (userRole === 'landlord') return n.targetRole === 'landlord';
    return n.targetRole === 'tenant' && n.targetUnitId === selectedUnitId;
  }).length;

  // Consolidated notification count across rent deadlines, maintenance reminders, and legal statuses
  const totalNotificationCount = useMemo(() => {
    let count = 0;
    // 1. Rent deadlines & overdue invoices
    if (userRole === 'landlord') {
      count += invoices.filter((i) => i.status !== 'paid').length;
    } else {
      count += invoices.filter((i) => i.unitId === selectedUnitId && i.status !== 'paid').length;
    }

    // 2. Maintenance reminders
    if (userRole === 'landlord') {
      count += maintenanceTickets.filter((t) => t.status !== 'resolved').length;
    } else {
      count += maintenanceTickets.filter((t) => t.unitId === selectedUnitId && t.status !== 'resolved').length;
    }

    // 3. Legal notices & lease alerts
    if (userRole === 'landlord') {
      count += legalNotices.filter((ln) => ln.status === 'draft' || ln.status === 'served').length;
      count += notices.filter((n) => n.targetRole === 'landlord').length;
    } else {
      count += legalNotices.filter((ln) => ln.unitId === selectedUnitId && ln.status === 'served').length;
      count += notices.filter((n) => n.targetRole === 'tenant' && (!n.targetUnitId || n.targetUnitId === selectedUnitId)).length;
    }

    return count;
  }, [userRole, selectedUnitId, invoices, maintenanceTickets, legalNotices, notices]);

  const handleSaveMeterReadings = (
    newWater: WaterMeterReading,
    newElectric: ElectricMeterReading,
    newInvoice: ConsolidatedInvoice
  ) => {
    setWaterReadings([newWater, ...waterReadings]);
    setElectricReadings([newElectric, ...electricReadings]);
    setInvoices([newInvoice, ...invoices]);
  };

  const handleConfirmPayment = (
    invoiceId: string,
    paymentMethod: ConsolidatedInvoice['paymentMethod'],
    reference: string
  ) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: 'paid',
              paidDate: new Date().toISOString().substring(0, 10),
              paymentMethod,
              receiptReference: reference,
            }
          : inv
      )
    );

    // Clear automated overdue notices for this settled invoice
    setNotices((prev) => prev.filter((n) => n.invoiceId !== invoiceId));
  };

  const handleRunOverdueAudit = () => {
    const audit = identifyOverdueInvoicesAndGenerateNotices(invoices, units, new Date(), 7);
    setNotices((prev) => mergeOverdueNotices(prev, audit.generatedNotices));
    return {
      scannedCount: audit.scannedCount,
      overdueCount: audit.overdueInvoices.length,
    };
  };

  // Grocery Cart Management Handlers
  const handleUpdateCartQuantity = (cartItemId: string, newQty: number) => {
    setFamilyCarts((prev) => {
      const unitCart = prev[selectedUnitId] || [];
      if (newQty <= 0) {
        return {
          ...prev,
          [selectedUnitId]: unitCart.filter((i) => i.id !== cartItemId),
        };
      }
      return {
        ...prev,
        [selectedUnitId]: unitCart.map((i) =>
          i.id === cartItemId ? { ...i, quantity: newQty } : i
        ),
      };
    });
  };

  const handleAddToCart = (
    item: GroceryItem,
    quantity: number = 1,
    addedBy: string = 'Family Member'
  ) => {
    setFamilyCarts((prev) => {
      const unitCart = prev[selectedUnitId] || [];
      const existingIndex = unitCart.findIndex((i) => i.groceryItemId === item.id);
      if (existingIndex > -1) {
        const updated = [...unitCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return { ...prev, [selectedUnitId]: updated };
      } else {
        const newCartItem: CartItem = {
          id: `cart-${selectedUnitId}-${Date.now()}`,
          groceryItemId: item.id,
          name: item.name,
          nepaliName: item.nepaliName,
          unit: item.unit,
          price: item.price,
          quantity,
          imageEmoji: item.imageEmoji,
          addedByMember: addedBy,
        };
        return { ...prev, [selectedUnitId]: [newCartItem, ...unitCart] };
      }
    });
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setFamilyCarts((prev) => ({
      ...prev,
      [selectedUnitId]: (prev[selectedUnitId] || []).filter((i) => i.id !== cartItemId),
    }));
  };

  const handleAddCustomCartItem = (customItem: Omit<CartItem, 'id'>) => {
    const newItem: CartItem = {
      ...customItem,
      id: `custom-${selectedUnitId}-${Date.now()}`,
    };
    setFamilyCarts((prev) => ({
      ...prev,
      [selectedUnitId]: [newItem, ...(prev[selectedUnitId] || [])],
    }));
  };

  const handleClearCart = () => {
    setFamilyCarts((prev) => ({
      ...prev,
      [selectedUnitId]: [],
    }));
  };

  const handlePlaceOrder = (order: FamilyGroceryOrder) => {
    setGroceryOrders((prev) => [order, ...prev]);
    setFamilyCarts((prev) => ({
      ...prev,
      [selectedUnitId]: [],
    }));

    if (order.paymentMethod === 'add_to_monthly_bill') {
      const activeUnit = units.find((u) => u.id === selectedUnitId);
      const groceryNotice: BuildingNotice = {
        id: `notif-gro-${Date.now()}`,
        title: `Pantry Delivery Added to Monthly Ledger: ${order.orderNumber}`,
        category: 'community',
        content: `Grocery order of ${formatNRS(order.totalAmount)} (${order.items.length} items) for ${activeUnit?.unitNumber || 'Unit'} has been added to the upcoming monthly living bill ledger.`,
        publishDate: new Date().toISOString().substring(0, 10),
        effectiveDate: new Date().toISOString().substring(0, 10),
        author: 'Building Mart Coordination',
        isUrgent: false,
        targetRole: 'all',
        targetUnitId: selectedUnitId,
      };
      setNotices((prev) => [groceryNotice, ...prev]);
    }
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    newStatus: FamilyGroceryOrder['status']
  ) => {
    setGroceryOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const handleUpdateTicket = (updated: MaintenanceTicket) => {
    setMaintenanceTickets((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  const handleAddTicket = (newTicket: MaintenanceTicket) => {
    setMaintenanceTickets([newTicket, ...maintenanceTickets]);
  };

  const handleAddNotice = (newNotice: BuildingNotice) => {
    setNotices([newNotice, ...notices]);
  };

  const handleAddLegalNotice = (notice: LegalNoticeDraft) => {
    setLegalNotices([notice, ...legalNotices]);
  };

  const handleAddDispute = (dispute: TenancyDispute) => {
    setDisputes([dispute, ...disputes]);
  };

  const handleUpdateDispute = (updated: TenancyDispute) => {
    setDisputes((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
  };

  const handleConfirmRenewal = (
    unitId: string,
    newLeaseEnd: string,
    newBaseRent: number,
    notes: string
  ) => {
    const targetUnit = units.find((u) => u.id === unitId);
    if (!targetUnit) return;

    setUnits((prev) =>
      prev.map((u) =>
        u.id === unitId
          ? {
              ...u,
              leaseEnd: newLeaseEnd,
              baseRent: newBaseRent,
            }
          : u
      )
    );

    // Broadcast formal confirmation notice
    const renewalNotice: BuildingNotice = {
      id: `not-renew-${Date.now()}`,
      title: `Lease Renewal Confirmed: ${targetUnit.unitNumber} (${targetUnit.tenantFamilyName})`,
      category: 'legal_notice',
      publishDate: new Date().toISOString().substring(0, 10),
      effectiveDate: newLeaseEnd,
      author: 'Arthur Pendelton (Property Owner)',
      isUrgent: false,
      targetRole: 'all',
      content: `The tenancy agreement for ${targetUnit.unitNumber} has been mutually extended through ${newLeaseEnd}. Monthly base rent updated to $${newBaseRent.toFixed(2)}. Existing utility meters and municipal sanitation services remain active.`,
    };
    setNotices((prev) => [renewalNotice, ...prev]);

    // Add legal document draft to Legal Notices
    const legalDoc: LegalNoticeDraft = {
      id: `ln-renew-${Date.now()}`,
      noticeType: 'rent_increase',
      title: `Formal Lease Extension & Rent Addendum (${targetUnit.unitNumber})`,
      unitId,
      createdDate: new Date().toISOString().substring(0, 10),
      senderRole: 'landlord',
      recipientName: targetUnit.tenantFamilyName,
      statutoryReference: 'Residential Tenancy Extension Agreement',
      content: `MUTUAL LEASE RENEWAL ADDENDUM\n\nPremises: ${targetUnit.unitNumber}, 742 Evergreen Terrace\nTenant: ${targetUnit.tenantFamilyName}\nNew Expiration Date: ${newLeaseEnd}\nAgreed Base Rent: $${newBaseRent.toFixed(2)}/month\n\n${notes}`,
      status: 'served',
    };
    setLegalNotices((prev) => [legalDoc, ...prev]);
  };

  const handleIssueVacateNotice = (unitId: string, vacateDate: string, reason: string) => {
    const targetUnit = units.find((u) => u.id === unitId);
    if (!targetUnit) return;

    const vacateNotice: BuildingNotice = {
      id: `not-vacate-${Date.now()}`,
      title: `Statutory 30-Day Notice of Non-Renewal: ${targetUnit.unitNumber}`,
      category: 'legal_notice',
      publishDate: new Date().toISOString().substring(0, 10),
      effectiveDate: vacateDate,
      author: 'Rajan Shrestha (Houseowner)',
      isUrgent: true,
      targetRole: 'landlord',
      content: `Formal 30-day notice of non-renewal served for ${targetUnit.unitNumber}. Vacation date set for ${vacateDate}. Joint inspection and meter reconciliation will be scheduled pursuant to Nepal Civil Code 2074.`,
    };
    setNotices((prev) => [vacateNotice, ...prev]);

    const legalVacate: LegalNoticeDraft = {
      id: `ln-vacate-${Date.now()}`,
      noticeType: 'cure_or_quit',
      title: `Statutory 30-Day Notice of Non-Renewal and Intent to Vacate`,
      unitId,
      createdDate: new Date().toISOString().substring(0, 10),
      senderRole: 'landlord',
      recipientName: targetUnit.tenantFamilyName,
      statutoryReference: 'Nepal Civil Code 2074 (Muluki Dewani Samhita) § 387 — Notice of Lease Termination',
      content: `TO: ${targetUnit.tenantFamilyName}, Residents of ${targetUnit.unitNumber}, Himalayan Heights Residency, New Baneshwor, Kathmandu.\n\nPLEASE TAKE NOTICE that your residential fixed-term tenancy for ${targetUnit.unitNumber} will not be renewed and terminates on ${vacateDate}.\n\nGROUNDS: ${reason}\n\nPursuant to Section 387-390 of the Nepal Civil Code Act 2074, a joint move-out inspection and utility meter reconciliation (KUKL water, NEA electricity & waste sanitation) will be conducted upon handover.`,
      status: 'served',
    };
    setLegalNotices((prev) => [legalVacate, ...prev]);
  };

  // Find associated unit and meter readings for the detail modal
  const detailUnit = detailInvoice
    ? units.find((u) => u.id === detailInvoice.unitId)
    : undefined;
  const detailWater = detailInvoice
    ? waterReadings.find((w) => w.unitId === detailInvoice.unitId && w.billingMonth === detailInvoice.billingMonth)
    : undefined;
  const detailElectric = detailInvoice
    ? electricReadings.find((e) => e.unitId === detailInvoice.unitId && e.billingMonth === detailInvoice.billingMonth)
    : undefined;
  const detailWaste = detailInvoice
    ? wasteFees.find((wf) => wf.unitId === detailInvoice.unitId)
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation Top Bar */}
      <TopBar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={setUserRole}
        units={units}
        selectedUnitId={selectedUnitId}
        setSelectedUnitId={setSelectedUnitId}
        unpaidCount={unpaidCount}
        openTicketsCount={openTicketsCount}
        overdueAlertsCount={overdueAlertsCount}
        totalNotificationCount={totalNotificationCount}
        familyCartCount={familyCartCount}
        onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
        onOpenFamilyCart={() => setIsFamilyCartOpen(true)}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'overview' && (
          <DashboardOverview
            userRole={userRole}
            units={units}
            selectedUnitId={selectedUnitId}
            setSelectedUnitId={setSelectedUnitId}
            invoices={invoices}
            waterReadings={waterReadings}
            electricReadings={electricReadings}
            wasteFees={wasteFees}
            maintenanceTickets={maintenanceTickets}
            notices={notices}
            onNavigateTab={setCurrentTab}
            onOpenLogReadingModal={() => setIsLogMeterOpen(true)}
            onOpenPayModal={(inv) => setPayInvoice(inv)}
            onOpenInvoiceDetail={(inv) => setDetailInvoice(inv)}
            onOpenNewTicketModal={() => setCurrentTab('maintenance')}
            onOpenLeaseRenewalModal={(unit) => setSelectedExpiringUnitForModal(unit)}
          />
        )}

        {currentTab === 'bills' && (
          <UtilityBillsView
            userRole={userRole}
            units={units}
            selectedUnitId={selectedUnitId}
            invoices={invoices}
            waterReadings={waterReadings}
            electricReadings={electricReadings}
            wasteFees={wasteFees}
            onOpenLogReadingModal={() => setIsLogMeterOpen(true)}
            onOpenPayModal={(inv) => setPayInvoice(inv)}
            onOpenInvoiceDetail={(inv) => setDetailInvoice(inv)}
          />
        )}

        {currentTab === 'groceries' && (
          <FamilyGroceriesView
            userRole={userRole}
            units={units}
            selectedUnitId={selectedUnitId}
            groceryItems={groceryItems}
            cartItems={currentCartItems}
            groceryOrders={groceryOrders}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onAddToCart={handleAddToCart}
            onOpenCartModal={() => setIsFamilyCartOpen(true)}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {currentTab === 'waste' && (
          <WasteSanitationView
            userRole={userRole}
            units={units}
            selectedUnitId={selectedUnitId}
            wasteFees={wasteFees}
          />
        )}

        {currentTab === 'maintenance' && (
          <MaintenanceBridge
            userRole={userRole}
            units={units}
            selectedUnitId={selectedUnitId}
            tickets={maintenanceTickets}
            onUpdateTicket={handleUpdateTicket}
            onAddTicket={handleAddTicket}
          />
        )}

        {currentTab === 'legal' && (
          <LegalConsultationView
            userRole={userRole}
            units={units}
            selectedUnitId={selectedUnitId}
            legalNotices={legalNotices}
            disputes={disputes}
            onAddNotice={handleAddLegalNotice}
            onAddDispute={handleAddDispute}
            onUpdateDispute={handleUpdateDispute}
          />
        )}

        {currentTab === 'notices' && (
          <NoticeBoardView
            userRole={userRole}
            selectedUnitId={selectedUnitId}
            units={units}
            invoices={invoices}
            notices={notices}
            onAddNotice={handleAddNotice}
            onRunOverdueAudit={handleRunOverdueAudit}
            onOpenPayModal={(inv) => setPayInvoice(inv)}
            onOpenInvoiceDetail={(inv) => setDetailInvoice(inv)}
            onNavigateTab={setCurrentTab}
          />
        )}
      </main>

      {/* Modals */}
      <LogMeterModal
        isOpen={isLogMeterOpen}
        onClose={() => setIsLogMeterOpen(false)}
        units={units}
        waterReadings={waterReadings}
        electricReadings={electricReadings}
        onSaveReadings={handleSaveMeterReadings}
      />

      <InvoiceDetailModal
        isOpen={Boolean(detailInvoice)}
        onClose={() => setDetailInvoice(null)}
        invoice={detailInvoice}
        unit={detailUnit}
        waterReading={detailWater}
        electricReading={detailElectric}
        wasteFee={detailWaste}
        userRole={userRole}
        onOpenPayModal={(inv) => {
          setDetailInvoice(null);
          setPayInvoice(inv);
        }}
      />

      <PaymentModal
        isOpen={Boolean(payInvoice)}
        onClose={() => setPayInvoice(null)}
        invoice={payInvoice}
        unit={payInvoice ? units.find((u) => u.id === payInvoice.unitId) : undefined}
        userRole={userRole}
        onConfirmPayment={handleConfirmPayment}
      />

      <LeaseRenewalModal
        isOpen={Boolean(selectedExpiringUnitForModal)}
        onClose={() => setSelectedExpiringUnitForModal(null)}
        unit={selectedExpiringUnitForModal}
        onConfirmRenewal={handleConfirmRenewal}
        onIssueVacateNotice={handleIssueVacateNotice}
      />

      {/* Family Grocery Cart Modal */}
      <FamilyCartModal
        isOpen={isFamilyCartOpen}
        onClose={() => setIsFamilyCartOpen(false)}
        cartItems={currentCartItems}
        selectedUnit={units.find((u) => u.id === selectedUnitId) || units[0]}
        userRole={userRole}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onAddCustomItem={handleAddCustomCartItem}
        onClearCart={handleClearCart}
        onPlaceOrder={handlePlaceOrder}
      />

      {/* Notification Center Sidebar */}
      <NotificationCenterSidebar
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        userRole={userRole}
        selectedUnitId={selectedUnitId}
        units={units}
        invoices={invoices}
        maintenanceTickets={maintenanceTickets}
        notices={notices}
        legalNotices={legalNotices}
        groceryOrders={groceryOrders}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          setIsNotificationCenterOpen(false);
        }}
        onOpenPayModal={(inv) => {
          setIsNotificationCenterOpen(false);
          setPayInvoice(inv);
        }}
        onOpenInvoiceDetail={(inv) => {
          setIsNotificationCenterOpen(false);
          setDetailInvoice(inv);
        }}
        onOpenLeaseRenewalModal={(unit) => {
          setIsNotificationCenterOpen(false);
          setSelectedExpiringUnitForModal(unit);
        }}
      />

      {/* Clean Uncluttered Footer adhering to Anti-Slop Rule 1.B */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">KinHome</span>
            <span aria-hidden="true">·</span>
            <span>Landlord & Tenant Living Bridge</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Water (m³) & Electric (kWh) Sub-metering</span>
            <span aria-hidden="true">·</span>
            <span>Municipal Sanitation Schedules</span>
            <span aria-hidden="true">·</span>
            <span>Tenancy Legal Advice</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
