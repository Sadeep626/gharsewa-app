export type UserRole = 'landlord' | 'tenant';

export interface PropertyUnit {
  id: string;
  unitNumber: string;
  buildingName: string;
  address: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  baseRent: number;
  securityDeposit: number;
  tenantFamilyName: string;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    familyMembersCount: number;
  };
  leaseStart: string;
  leaseEnd: string;
  waterMeterId: string;
  electricMeterId: string;
  status: 'occupied' | 'vacant';
}

export interface WaterMeterReading {
  id: string;
  unitId: string;
  billingMonth: string; // e.g. "2026-10"
  previousReading: number; // m³
  currentReading: number; // m³
  consumption: number; // m³
  ratePerCubicMeter: number; // $
  baseCharge: number;
  sewerSurcharge: number;
  totalAmount: number;
  readingDate: string;
  hasLeakWarning?: boolean;
}

export interface ElectricMeterReading {
  id: string;
  unitId: string;
  billingMonth: string; // e.g. "2026-10"
  previousReading: number; // kWh
  currentReading: number; // kWh
  consumption: number; // kWh
  ratePerKwh: number; // $
  peakCharge: number;
  fuelAdjustment: number;
  totalAmount: number;
  readingDate: string;
}

export interface WasteManagementFee {
  id: string;
  unitId: string;
  billingMonth: string;
  municipalStandardFee: number;
  recyclingFee: number;
  compostGreenFee: number;
  specialBulkPickupFee: number;
  totalAmount: number;
  pickupSchedule: {
    generalTrash: string[]; // e.g. ["Tuesday", "Friday"]
    recycling: string[];    // e.g. ["Wednesday"]
    organicCompost: string[]; // e.g. ["Monday", "Thursday"]
  };
}

export interface ConsolidatedInvoice {
  id: string;
  invoiceNumber: string;
  unitId: string;
  billingMonth: string; // "October 2026"
  issueDate: string;
  dueDate: string;
  baseRent: number;
  waterAmount: number;
  electricAmount: number;
  wasteAmount: number;
  maintenanceFee: number;
  totalDue: number;
  status: 'paid' | 'pending' | 'overdue' | 'disputed';
  paidDate?: string;
  paymentMethod?: 'Bank Transfer' | 'Online Card' | 'Direct Debit' | 'Cheque';
  receiptReference?: string;
  notes?: string;
}

export interface MaintenanceTicket {
  id: string;
  unitId: string;
  title: string;
  category: 'water_plumbing' | 'electrical' | 'waste_sanitation' | 'structural_other';
  priority: 'emergency_24h' | 'urgent_48h' | 'routine';
  status: 'reported' | 'scheduled' | 'in_progress' | 'resolved';
  description: string;
  createdAt: string;
  scheduledDate?: string;
  contractorName?: string;
  cost?: number;
  landlordNotes?: string;
}

export interface BuildingNotice {
  id: string;
  title: string;
  category: 'utility_maintenance' | 'waste_collection' | 'community' | 'legal_notice' | 'overdue_payment';
  content: string;
  publishDate: string;
  effectiveDate: string;
  author: string;
  isUrgent: boolean;
  targetRole?: 'all' | 'landlord' | 'tenant';
  targetUnitId?: string;
  invoiceId?: string;
  daysOverdue?: number;
  outstandingAmount?: number;
}

export interface LegalNoticeDraft {
  id: string;
  noticeType: 'notice_of_entry' | 'repair_demand' | 'rent_increase' | 'cure_or_quit' | 'deposit_return';
  title: string;
  unitId: string;
  createdDate: string;
  senderRole: 'landlord' | 'tenant';
  recipientName: string;
  content: string;
  statutoryReference: string;
  status: 'draft' | 'served' | 'acknowledged';
}

export interface TenancyDispute {
  id: string;
  unitId: string;
  subject: string;
  category: 'utility_billing' | 'maintenance_delay' | 'noise_quiet_enjoyment' | 'lease_terms';
  raisedBy: 'landlord' | 'tenant';
  openedDate: string;
  status: 'open' | 'under_mediation' | 'settled';
  description: string;
  resolutionNotes?: string;
}

export interface LegalChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  relevantStatutes?: string[];
  actionChecklist?: string[];
}

export type GroceryCategory =
  | 'all'
  | 'daily_dairy_water'
  | 'grains_pulses'
  | 'fresh_produce'
  | 'spices_oils'
  | 'achar_fermented'
  | 'kitchen_hardware'
  | 'household_gas'
  | 'tea_snacks';

export interface GroceryItem {
  id: string;
  name: string;
  nepaliName: string;
  category: Exclude<GroceryCategory, 'all'>;
  price: number; // in NRs.
  unit: string; // e.g., '20L Jar', '1 kg', '500ml', 'Tray of 30'
  description: string;
  inStock: boolean;
  isStaple?: boolean;
  imageEmoji: string;
  badge?: string;
}

export interface CartItem {
  id: string;
  groceryItemId: string;
  name: string;
  nepaliName?: string;
  unit: string;
  price: number;
  quantity: number;
  imageEmoji: string;
  addedByMember?: string;
  notes?: string;
  isCustom?: boolean;
}

export interface FamilyGroceryOrder {
  id: string;
  unitId: string;
  orderNumber: string;
  familyHead: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered_at_door' | 'cancelled';
  orderDate: string;
  deliverySlot: 'morning_7_9_am' | 'afternoon_1_3_pm' | 'evening_6_8_pm' | 'express_45m';
  deliveryLocation: string;
  paymentMethod: 'cash_on_delivery' | 'esewa_khalti' | 'add_to_monthly_bill';
  specialInstructions?: string;
}

export interface RecipeRecommendation {
  id: string;
  title: string;
  nepaliTitle: string;
  tagline: string;
  mealCategory: 'daal_bhat' | 'khaja' | 'dinner' | 'dhindo_roti' | 'winter_jhol' | 'festive';
  prepTime: string;
  cookTime: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  cookwareRequired: string;
  matchedIngredients: string[];
  missingIngredients: {
    name: string;
    nepaliName?: string;
    suggestedGroceryItemId?: string;
    approxPrice?: number;
  }[];
  steps: string[];
  chefTip: string;
  culturalNote?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  nepaliName?: string;
  email: string;
  phone: string;
  role: UserRole;
  unitId?: string;
  unitNumber?: string;
  avatar: string;
  pin: string; // 4-digit security PIN e.g. "1234"
  accessCode: string; // Flat or building passcode e.g. "KTM-201"
  badge: string;
  lastLogin?: string;
  status: 'active' | 'suspended';
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  category: 'auth' | 'meter' | 'billing' | 'groceries' | 'maintenance' | 'legal' | 'notices' | 'system';
  action: string;
  description: string;
  actorName: string;
  actorRole: UserRole | 'system';
  unitNumber?: string;
  severity: 'info' | 'success' | 'warning' | 'alert';
  ipOrDevice?: string;
}

