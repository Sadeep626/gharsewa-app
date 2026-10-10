import React, { useState } from 'react';
import {
  CreditCard,
  Building,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ConsolidatedInvoice, PropertyUnit, UserRole } from '../types';
import { formatNRS } from '../utils/currency';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: ConsolidatedInvoice | null;
  unit: PropertyUnit | undefined;
  userRole: UserRole;
  onConfirmPayment: (
    invoiceId: string,
    paymentMethod: ConsolidatedInvoice['paymentMethod'],
    reference: string
  ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  unit,
  userRole,
  onConfirmPayment,
}) => {
  if (!isOpen || !invoice || !unit) return null;

  const [paymentMethod, setPaymentMethod] = useState<ConsolidatedInvoice['paymentMethod']>('Bank Transfer');
  const [bankAccount, setBankAccount] = useState('Nabil Bank (Current A/c ···· 4820)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const ref = `TXN-${invoice.billingMonth.substring(0, 3).toUpperCase()}-${Math.floor(
        100000 + Math.random() * 900000
      )}`;
      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        onConfirmPayment(invoice.id, paymentMethod, ref);
        setIsSuccess(false);
        onClose();
      }, 1000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {userRole === 'landlord' ? 'Confirm Payment Received' : 'Pay Monthly Rent & Utilities'}
            </h3>
            <p className="text-xs text-slate-500">
              {invoice.invoiceNumber} · {unit.unitNumber} ({unit.tenantFamilyName})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-slate-900">Payment Confirmed!</h4>
            <p className="text-xs text-slate-500">
              Official payment receipt generated and synchronized with houseowner ledger.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4 text-xs">
            {/* Amount Summary */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span>Total Amount to Remit:</span>
                <span className="text-slate-900 font-semibold">{invoice.billingMonth}</span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 pt-1">
                {formatNRS(invoice.totalDue)}
              </div>
              <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                <span>Base Rent: {formatNRS(invoice.baseRent)}</span>
                <span>Utilities: {formatNRS(invoice.waterAmount + invoice.electricAmount + invoice.wasteAmount)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Select Remittance Channel (Kathmandu, Nepal)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'Bank Transfer', label: 'Nabil / ConnectIPS', icon: Building },
                  { id: 'Online Card', label: 'eSewa / Khalti / Card', icon: CreditCard },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setPaymentMethod(item.id as any)}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                        paymentMethod === item.id
                          ? 'border-slate-900 bg-slate-900 text-white font-medium'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === 'Bank Transfer' ? (
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Connected Account
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-mono focus:outline-hidden"
                />
              </div>
            ) : (
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Card on File
                </label>
                <input
                  type="text"
                  readOnly
                  value="Visa ending in •••• 4242 (Exp 12/28)"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-mono focus:outline-hidden"
                />
              </div>
            )}

            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct cryptographic receipt issuance to both landlord & tenant portal.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 rounded-md font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md transition-colors flex items-center gap-1.5"
              >
                <span>{isProcessing ? 'Processing...' : userRole === 'landlord' ? 'Confirm Receipt' : `Pay $${invoice.totalDue.toFixed(2)}`}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
