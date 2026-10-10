import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Receipt,
  User,
} from 'lucide-react';
import { CartItem, FamilyGroceryOrder, PropertyUnit, UserRole } from '../types';
import { formatNRS } from '../utils/currency';

interface FamilyCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  selectedUnit: PropertyUnit;
  userRole: UserRole;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onAddCustomItem: (customItem: Omit<CartItem, 'id'>) => void;
  onClearCart: () => void;
  onPlaceOrder: (order: FamilyGroceryOrder) => void;
}

export const FamilyCartModal: React.FC<FamilyCartModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  selectedUnit,
  userRole,
  onUpdateQuantity,
  onRemoveItem,
  onAddCustomItem,
  onClearCart,
  onPlaceOrder,
}) => {
  const [deliverySlot, setDeliverySlot] = useState<FamilyGroceryOrder['deliverySlot']>('morning_7_9_am');
  const [paymentMethod, setPaymentMethod] = useState<FamilyGroceryOrder['paymentMethod']>('cash_on_delivery');
  const [deliveryLocation, setDeliveryLocation] = useState<string>(
    `${selectedUnit.unitNumber} Doorstep (Floor ${selectedUnit.floor}), Himalayan Heights Residency`
  );
  const [specialInstructions, setSpecialInstructions] = useState<string>('Please ring the bell and leave safely at door.');
  const [familyHeadName, setFamilyHeadName] = useState<string>(selectedUnit.tenantFamilyName.replace('The ', '').replace(' Family', ''));

  // Custom Item Drawer state
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customUnit, setCustomUnit] = useState('1 kg');
  const [customPrice, setCustomPrice] = useState<number>(150);
  const [customMember, setCustomMember] = useState('Family Member');
  const [customNotes, setCustomNotes] = useState('');

  // Order Placement Success state
  const [placedOrder, setPlacedOrder] = useState<FamilyGroceryOrder | null>(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  // Free delivery for orders over NRs. 500 or Building Community drop
  const deliveryFee = subtotal >= 500 || cartItems.length === 0 ? 0 : 45;
  const grandTotal = subtotal + deliveryFee;

  const handleCreateCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onAddCustomItem({
      groceryItemId: `custom-${Date.now()}`,
      name: customName.trim(),
      unit: customUnit.trim() || '1 item',
      price: Number(customPrice) || 100,
      quantity: 1,
      imageEmoji: '🛒',
      addedByMember: customMember.trim() || 'Family Member',
      notes: customNotes.trim() || undefined,
      isCustom: true,
    });

    setCustomName('');
    setCustomNotes('');
    setIsAddingCustom(false);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    const newOrder: FamilyGroceryOrder = {
      id: `ord-${Date.now()}`,
      unitId: selectedUnit.id,
      orderNumber: `GRO-KTM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      familyHead: familyHeadName || selectedUnit.tenantFamilyName,
      items: [...cartItems],
      subtotal,
      deliveryFee,
      totalAmount: grandTotal,
      status: 'pending',
      orderDate: new Date().toISOString().substring(0, 10),
      deliverySlot,
      deliveryLocation,
      paymentMethod,
      specialInstructions,
    };

    onPlaceOrder(newOrder);
    setPlacedOrder(newOrder);
  };

  const handleCloseAndReset = () => {
    setPlacedOrder(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span>Family Grocery Basket</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-normal">
                  {selectedUnit.unitNumber} · {selectedUnit.tenantFamilyName}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Shared family cart for authentic Nepali kitchen staples, pure DDC ghee, spices, vegetables, cooker parts, and 20L water jars.
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseAndReset}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen if Order was just placed */}
        {placedOrder ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Family Grocery Order Placed!
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Order <span className="font-mono font-semibold text-slate-900">{placedOrder.orderNumber}</span> has been confirmed for {selectedUnit.unitNumber}.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Total Items:</span>
                <span className="font-semibold text-slate-900">
                  {placedOrder.items.reduce((s, i) => s + i.quantity, 0)} items ({placedOrder.items.length} varieties)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Grand Total:</span>
                <span className="font-bold font-mono text-emerald-700 text-sm">
                  {formatNRS(placedOrder.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Delivery Slot:</span>
                <span className="font-semibold text-slate-900">
                  {placedOrder.deliverySlot === 'morning_7_9_am' && 'Morning (7:00 AM - 9:00 AM)'}
                  {placedOrder.deliverySlot === 'afternoon_1_3_pm' && 'Afternoon (1:00 PM - 3:00 PM)'}
                  {placedOrder.deliverySlot === 'evening_6_8_pm' && 'Evening (6:00 PM - 8:00 PM)'}
                  {placedOrder.deliverySlot === 'express_45m' && 'Express Delivery (Within 45m)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Destination:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[220px]">
                  {placedOrder.deliveryLocation}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Payment:</span>
                <span className="font-semibold text-slate-900">
                  {placedOrder.paymentMethod === 'cash_on_delivery' && 'Cash on Doorstep Delivery'}
                  {placedOrder.paymentMethod === 'esewa_khalti' && 'eSewa / Khalti QR'}
                  {placedOrder.paymentMethod === 'add_to_monthly_bill' && 'Added to Monthly Rent & Utility Bill'}
                </span>
              </div>
            </div>

            {placedOrder.paymentMethod === 'add_to_monthly_bill' && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-900 text-left max-w-md mx-auto flex items-start gap-2">
                <Receipt className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Monthly Utility Ledger:</strong> This total of {formatNRS(placedOrder.totalAmount)} is recorded and will be consolidated into your unit’s next monthly statement alongside KUKL water, NEA electricity, and sanitation fees.
                </span>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleCloseAndReset}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                Done & Return to App
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Cart Items List */}
            {cartItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">Your family grocery basket is empty.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Browse Kathmandu mart essentials, 20L mineral water jars, or add custom family items.
                </p>
                <button
                  onClick={() => setIsAddingCustom(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Custom Family Grocery Item</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pb-1 border-b border-slate-100">
                  <span>Items in Family Cart ({cartItems.length})</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsAddingCustom(!isAddingCustom)}
                      className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Special Item</span>
                    </button>
                    <button
                      onClick={onClearCart}
                      className="text-rose-600 hover:text-rose-800 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Form to add custom grocery item */}
                {isAddingCustom && (
                  <form
                    onSubmit={handleCreateCustomItem}
                    className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-emerald-900">
                      <span>Add Custom Family Request (e.g. Masala, specific vegetables)</span>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustom(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-600 mb-0.5">Item Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Fresh Dhaniya & Pudina, Organic Timur"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-hidden text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-0.5">Unit / Quantity</label>
                        <input
                          type="text"
                          placeholder="e.g. 2 mutha, 250g, 1 packet"
                          value={customUnit}
                          onChange={(e) => setCustomUnit(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-hidden text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 mb-0.5">Est. Price (NRs.)</label>
                        <input
                          type="number"
                          min="10"
                          step="10"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-hidden font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-0.5">Requested By (Member)</label>
                        <input
                          type="text"
                          placeholder="e.g. Mom, Dad, Roommate"
                          value={customMember}
                          onChange={(e) => setCustomMember(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-hidden text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-0.5">Note for delivery / vendor (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Fresh green leaves, not wilted"
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-hidden text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingCustom(false)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-emerald-700 text-white rounded-md font-semibold hover:bg-emerald-800"
                      >
                        Add to Family Basket
                      </button>
                    </div>
                  </form>
                )}

                {/* List of Cart Items */}
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-start justify-between gap-3 text-xs hover:bg-slate-50/70 p-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-xl p-1 bg-slate-100 rounded-md shrink-0">
                          {item.imageEmoji}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.isCustom && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-medium">
                                Custom
                              </span>
                            )}
                          </div>
                          {item.nepaliName && (
                            <div className="text-[11px] text-slate-500 font-normal">
                              {item.nepaliName} · {item.unit}
                            </div>
                          )}
                          {item.addedByMember && (
                            <div className="mt-0.5 text-[11px] text-emerald-700 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>Added by {item.addedByMember}</span>
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-[11px] text-slate-400 italic">
                              "{item.notes}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-l-md transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 font-mono font-semibold text-slate-800 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-r-md transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="w-20 text-right font-mono font-semibold text-slate-900">
                          {formatNRS(item.price * item.quantity)}
                        </div>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery & Checkout Details (Only when items exist) */}
            {cartItems.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Apartment Delivery & Billing Preference
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Delivery Slot */}
                  <div>
                    <label className="block text-slate-700 font-medium mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Preferred Delivery Time Window</span>
                    </label>
                    <select
                      value={deliverySlot}
                      onChange={(e) => setDeliverySlot(e.target.value as FamilyGroceryOrder['deliverySlot'])}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                    >
                      <option value="morning_7_9_am">Morning (7:00 AM - 9:00 AM) [Fresh Dairy & Veg]</option>
                      <option value="afternoon_1_3_pm">Afternoon (1:00 PM - 3:00 PM)</option>
                      <option value="evening_6_8_pm">Evening (6:00 PM - 8:00 PM) [Post-Work]</option>
                      <option value="express_45m">⚡ Express Mart Delivery (Within 45 mins)</option>
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-slate-700 font-medium mb-1 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Payment Method</span>
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as FamilyGroceryOrder['paymentMethod'])}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden font-medium"
                    >
                      <option value="cash_on_delivery">Cash on Doorstep Delivery (COD)</option>
                      <option value="esewa_khalti">eSewa / Khalti QR (Scan upon Handover)</option>
                      <option value="add_to_monthly_bill">
                        ★ Add to Next Monthly Utility & Rent Invoice (Building Ledger)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Delivery Location & Instructions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>Flat Doorstep Address</span>
                    </label>
                    <input
                      type="text"
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Doorstep Instructions</span>
                    </label>
                    <input
                      type="text"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="e.g. Ring bell, swap empty 20L water jar"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Bill Summary Breakdown */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Groceries Subtotal ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items):</span>
                    <span className="font-mono font-medium text-slate-800">{formatNRS(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <span>Building Delivery Fee:</span>
                      {deliveryFee === 0 && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded font-semibold">
                          FREE
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-medium text-slate-800">
                      {deliveryFee === 0 ? 'NRs. 0 (Free above NRs. 500)' : formatNRS(deliveryFee)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-emerald-700 text-base">{formatNRS(grandTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCloseAndReset}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg"
              >
                Continue Browsing
              </button>

              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  <span>Place Family Grocery Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
