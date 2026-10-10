import { ConsolidatedInvoice, PropertyUnit, BuildingNotice } from '../types';

export interface OverdueAuditResult {
  overdueInvoices: {
    invoice: ConsolidatedInvoice;
    unit: PropertyUnit;
    daysOverdue: number;
  }[];
  generatedNotices: BuildingNotice[];
  scannedCount: number;
}

/**
 * Identifies unpaid invoices that are overdue by more than thresholdDays (default 7)
 * and generates targeted automated system notices for both Landlords and Tenants.
 *
 * @param invoices List of consolidated invoices
 * @param units List of property units
 * @param referenceDate Base date for calculation (defaults to current time or Oct 8, 2026)
 * @param thresholdDays Minimum days overdue to trigger notification (default: 7)
 */
export function identifyOverdueInvoicesAndGenerateNotices(
  invoices: ConsolidatedInvoice[],
  units: PropertyUnit[],
  referenceDate: Date = new Date(),
  thresholdDays: number = 7
): OverdueAuditResult {
  const overdueItems: OverdueAuditResult['overdueInvoices'] = [];
  const generatedNotices: BuildingNotice[] = [];

  const refTime = referenceDate.getTime();
  const dateStr = referenceDate.toISOString().substring(0, 10);

  invoices.forEach((inv) => {
    // Only check invoices that have not been settled
    if (inv.status === 'paid') return;

    const dueTime = new Date(inv.dueDate).getTime();
    if (isNaN(dueTime)) return;

    // Calculate days overdue
    const diffMs = refTime - dueTime;
    const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysOverdue > thresholdDays) {
      const unit = units.find((u) => u.id === inv.unitId) || {
        id: inv.unitId,
        unitNumber: 'Unit',
        buildingName: 'Himalayan Heights Residency',
        address: 'Shanti Marga, New Baneshwor, Kathmandu (Ward 10)',
        floor: 1,
        bedrooms: 2,
        bathrooms: 1,
        areaSqFt: 900,
        baseRent: inv.baseRent,
        securityDeposit: inv.baseRent * 2,
        tenantFamilyName: 'Tenant Family',
        primaryContact: {
          name: 'Resident',
          email: 'tenant.ktm@example.com',
          phone: '+977 98510-00000',
          familyMembersCount: 2,
        },
        leaseStart: '',
        leaseEnd: '',
        waterMeterId: '',
        electricMeterId: '',
        status: 'occupied',
      };

      overdueItems.push({
        invoice: inv,
        unit,
        daysOverdue,
      });

      // 1. Automated System Notice for HOUSEOWNER / LANDLORD
      const landlordNotice: BuildingNotice = {
        id: `sys-overdue-ll-${inv.id}`,
        title: `Overdue Collection Alert: ${unit.unitNumber} (${unit.tenantFamilyName})`,
        category: 'overdue_payment',
        publishDate: dateStr,
        effectiveDate: dateStr,
        author: 'KinHome Automated Billing Sentinel',
        isUrgent: true,
        targetRole: 'landlord',
        targetUnitId: inv.unitId,
        invoiceId: inv.id,
        daysOverdue,
        outstandingAmount: inv.totalDue,
        content: `Automated System Audit: Consolidated rental & utility invoice ${inv.invoiceNumber} (${inv.billingMonth}) is currently ${daysOverdue} days past due (Due date was ${inv.dueDate}). Total outstanding balance: NRs. ${inv.totalDue.toLocaleString('en-IN')} [Base Rent: NRs. ${inv.baseRent.toLocaleString('en-IN')}, Water: NRs. ${inv.waterAmount.toLocaleString('en-IN')}, NEA Power: NRs. ${inv.electricAmount.toLocaleString('en-IN')}, Waste: NRs. ${inv.wasteAmount.toLocaleString('en-IN')}, Common: NRs. ${inv.maintenanceFee.toLocaleString('en-IN')}]. Recommended action: Review payment status, send formal courtesy reminder, or generate statutory notice pursuant to Muluki Civil Code 2074 (House Rent Chapter) in the Legal Consultation Center.`,
      };

      // 2. Automated System Notice for TENANT FAMILY
      const tenantNotice: BuildingNotice = {
        id: `sys-overdue-tn-${inv.id}`,
        title: `Urgent Payment Reminder: Overdue Rent & Utilities (${unit.unitNumber})`,
        category: 'overdue_payment',
        publishDate: dateStr,
        effectiveDate: dateStr,
        author: 'KinHome Automated Billing Sentinel',
        isUrgent: true,
        targetRole: 'tenant',
        targetUnitId: inv.unitId,
        invoiceId: inv.id,
        daysOverdue,
        outstandingAmount: inv.totalDue,
        content: `Automated Account Alert: Your consolidated monthly statement ${inv.invoiceNumber} (${inv.billingMonth}) was due on ${inv.dueDate} and is now ${daysOverdue} days overdue. Total balance due: NRs. ${inv.totalDue.toLocaleString('en-IN')} covering residence base rent, KUKL water sub-meter, NEA electricity, and Ward 10 municipal sanitation. Please make an online remittance via eSewa / Khalti / Bank Transfer, or contact houseowner Rajan Shrestha via the Living Bridge if you require payment coordination.`,
      };

      generatedNotices.push(landlordNotice, tenantNotice);
    }
  });

  return {
    overdueInvoices: overdueItems,
    generatedNotices,
    scannedCount: invoices.length,
  };
}

/**
 * Merges newly generated automated notices into the existing list,
 * replacing existing system notices for the same invoice/role while preserving all other notices.
 */
export function mergeOverdueNotices(
  existingNotices: BuildingNotice[],
  newNotices: BuildingNotice[]
): BuildingNotice[] {
  const newNoticeIds = new Set(newNotices.map((n) => n.id));
  const filteredExisting = existingNotices.filter((n) => !newNoticeIds.has(n.id));
  return [...newNotices, ...filteredExisting];
}
