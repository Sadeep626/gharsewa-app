import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Package,
  Clock,
  Truck,
  Droplets,
  Flame,
  Calendar,
  Building,
  User,
  Sparkles,
  Receipt,
  PlusCircle,
  ExternalLink,
  Flame as GasIcon,
  Check,
} from 'lucide-react';
import {
  GroceryItem,
  CartItem,
  FamilyGroceryOrder,
  PropertyUnit,
  UserRole,
  GroceryCategory,
} from '../types';
import { formatNRS } from '../utils/currency';
import { RecommendedRecipesSection } from './RecommendedRecipesSection';

interface FamilyGroceriesViewProps {
  userRole: UserRole;
  units: PropertyUnit[];
  selectedUnitId: string;
  groceryItems: GroceryItem[];
  cartItems: CartItem[];
  groceryOrders: FamilyGroceryOrder[];
  onUpdateCartQuantity: (cartItemId: string, newQty: number) => void;
  onAddToCart: (item: GroceryItem, quantity?: number, addedBy?: string) => void;
  onOpenCartModal: () => void;
  onUpdateOrderStatus: (orderId: string, newStatus: FamilyGroceryOrder['status']) => void;
}

interface KitchenBundle {
  id: string;
  title: string;
  nepaliTitle: string;
  tagline: string;
  icon: string;
  badge: string;
  itemIds: string[];
}

export const FamilyGroceriesView: React.FC<FamilyGroceriesViewProps> = ({
  userRole,
  units,
  selectedUnitId,
  groceryItems,
  cartItems,
  groceryOrders,
  onUpdateCartQuantity,
  onAddToCart,
  onOpenCartModal,
  onUpdateOrderStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'recipes' | 'orders'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<GroceryCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFamilyMember, setActiveFamilyMember] = useState('Family Member');
  const [recentlyAddedBundleId, setRecentlyAddedBundleId] = useState<string | null>(null);

  const selectedUnit = units.find((u) => u.id === selectedUnitId) || units[0];

  // Comprehensive categories configuration highlighting all Nepali kitchen domains
  const categories: { id: GroceryCategory; label: string; nepaliLabel: string; icon: string }[] = [
    { id: 'all', label: 'All Items', nepaliLabel: 'सबै सामग्री', icon: '🏪' },
    { id: 'spices_oils', label: 'Masala & Oils', nepaliLabel: 'नेपाली मसला र तेल', icon: '🫒' },
    { id: 'achar_fermented', label: 'Pickles & Gundruk', nepaliLabel: 'अचार र गुन्द्रुक', icon: '🥬' },
    { id: 'grains_pulses', label: 'Grains & Atta', nepaliLabel: 'अन्न, दाल र पीठो', icon: '🍚' },
    { id: 'fresh_produce', label: 'Vegetables & Saag', nepaliLabel: 'तरकारी र हरियो साग', icon: '🥦' },
    { id: 'daily_dairy_water', label: 'Ghee & Dairy', nepaliLabel: 'घ्यू, दूध र जार पानी', icon: '🧈' },
    { id: 'kitchen_hardware', label: 'Cookware & Tools', nepaliLabel: 'भाँडाकुँडा र सामान', icon: '⏲️' },
    { id: 'household_gas', label: 'LPG Gas & Clean', nepaliLabel: 'ग्यास र सरसफाइ', icon: '🔥' },
    { id: 'tea_snacks', label: 'Tea & Khaja', nepaliLabel: 'इलाम चिया र खाजा', icon: '☕' },
  ];

  // Curated Nepali Kitchen Bundles
  const kitchenBundles: KitchenBundle[] = [
    {
      id: 'bundle-daily-bhansa',
      title: 'Nepali Bhansa Daily Essentials Pack',
      nepaliTitle: 'नेपाली भान्सा दैनिक अनिवार्य किट',
      tagline: 'Pure DDC Ghee, Mustang Jimbu, Organic Besar, Chakki Atta, Mude Aloo & Cooker Gasket',
      icon: '🧈',
      badge: 'Most Popular for Family',
      itemIds: ['gro-ghee', 'gro-besar', 'gro-jimbu', 'gro-timur', 'gro-atta', 'gro-09', 'gro-rayo-saag', 'gro-cooker-gasket'],
    },
    {
      id: 'bundle-achar-gundruk',
      title: 'Himalayan Gundruk, Sinki & Achar Pack',
      nepaliTitle: 'गुन्द्रुक, सिन्की, तामा र अकबरे कम्बो',
      tagline: 'Organic Gundruk, Sun-dried Sinki, Tama jar, Lapsi Achar, Masyaura & Akbare pickle',
      icon: '🥬',
      badge: 'Heritage Preserves',
      itemIds: ['gro-gundruk', 'gro-sinki', 'gro-tama', 'gro-lapsi-achar', 'gro-akbare-achar', 'gro-masyaura'],
    },
    {
      id: 'bundle-cookware-fix',
      title: 'Bhansa Cookware & Hardware Fix Set',
      nepaliTitle: 'भाँडाकुँडा र कुकर मर्मत सेट',
      tagline: 'Cooker Gasket & Whistle, Wooden Belna-Chauki, Steel Masala Danni, Gas Lighter & Steel Juna',
      icon: '⏲️',
      badge: 'Kitchen Hardware',
      itemIds: ['gro-cooker-gasket', 'gro-belna-chauki', 'gro-masala-danni', 'gro-lighter-matches', 'gro-steel-juna'],
    },
  ];

  // Quick tag search suggestions
  const quickSearchTags = [
    { label: 'शुद्ध गाईको घ्यू', query: 'Ghyu' },
    { label: 'मुस्ताङ जिम्मु', query: 'Jimbu' },
    { label: 'मुस्ताङ टिमुर', query: 'Timur' },
    { label: 'अर्गानिक बेसार', query: 'Besar' },
    { label: 'साखिने गुन्द्रुक', query: 'Gundruk' },
    { label: 'सिन्की र तामा', query: 'Tama' },
    { label: 'चक्की आँटा (Roti)', query: 'Atta' },
    { label: 'कुकर ग्यास्केट', query: 'Gasket' },
    { label: 'काठको बेल्ना चौका', query: 'Belna' },
    { label: 'मुडे आलु', query: 'Mude Aloo' },
    { label: 'खोपासी तोरीको तेल', query: 'Mustard Oil' },
    { label: 'तोक्ला चिया', query: 'Tokla' },
    { label: 'नेपाल ग्यास', query: 'Gas' },
  ];

  // Filter items
  const filteredItems = useMemo(() => {
    return groceryItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.nepaliName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [groceryItems, selectedCategory, searchQuery]);

  // Cart calculations
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Relevant orders for current role & unit
  const visibleOrders = useMemo(() => {
    if (userRole === 'landlord') {
      return groceryOrders;
    }
    return groceryOrders.filter((o) => o.unitId === selectedUnitId);
  }, [groceryOrders, userRole, selectedUnitId]);

  // Houseowner summary KPIs
  const totalBuildingOrdersCount = groceryOrders.length;
  const pendingDeliveriesCount = groceryOrders.filter(
    (o) => o.status === 'pending' || o.status === 'out_for_delivery' || o.status === 'confirmed'
  ).length;
  const totalWaterJarsRequested = groceryOrders
    .filter((o) => o.status !== 'cancelled')
    .flatMap((o) => o.items)
    .filter((i) => i.groceryItemId === 'gro-01')
    .reduce((sum, i) => sum + i.quantity, 0);

  const handleAddBundleToCart = (bundle: KitchenBundle) => {
    const itemsToAdd = groceryItems.filter((item) => bundle.itemIds.includes(item.id));
    itemsToAdd.forEach((item) => {
      onAddToCart(item, 1, `${activeFamilyMember} (via ${bundle.nepaliTitle})`);
    });
    setRecentlyAddedBundleId(bundle.id);
    setTimeout(() => {
      setRecentlyAddedBundleId(null);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Perspective Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {userRole === 'landlord'
                    ? 'Building Grocery & Delivery Coordination'
                    : 'Family Groceries & Nepali Bhansa Pantry'}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  New Baneshwor Mart & Local Pantry
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                {userRole === 'landlord'
                  ? 'Coordinate bulk deliveries across Himalayan Heights (20L mineral water jars, LPG cylinders, daily DDC milk), manage doorstep drops, and reconcile grocery items added to monthly rent invoices.'
                  : `Shared family basket for ${selectedUnit.tenantFamilyName} (${selectedUnit.unitNumber}). Stock all authentic Nepali kitchen items — DDC pure cow ghee, Mustang Jimbu & Timur, fresh Chakki Atta, Kalimati vegetables, pressure cooker gaskets, and 20L water jars with doorstep flat delivery.`}
              </p>
            </div>
          </div>

          {/* Quick Cart Trigger & Status */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {userRole === 'tenant' && (
              <button
                onClick={onOpenCartModal}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>View Family Cart</span>
                {totalCartCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-white text-emerald-800 rounded-full font-mono text-[11px] font-bold">
                    {totalCartCount}
                  </span>
                )}
              </button>
            )}

            {userRole === 'landlord' && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs">
                <Building className="w-4 h-4 text-indigo-600" />
                <span className="text-slate-600 font-medium">
                  {pendingDeliveriesCount} Pending Building Drops
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Landlord Building Delivery Summary KPI Strip */}
        {userRole === 'landlord' && (
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-blue-700 font-medium flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>20L Water Jars Active Drops</span>
                </span>
                <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">
                  {totalWaterJarsRequested} Jars Ordered
                </span>
              </div>
              <span className="text-[11px] text-blue-600 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                Swapped at Door
              </span>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-amber-800 font-medium flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Pending Doorstep Drops</span>
                </span>
                <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">
                  {pendingDeliveriesCount} Active
                </span>
              </div>
              <span className="text-[11px] text-amber-700 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                Kathmandu Local Mart
              </span>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-emerald-800 font-medium flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Billed to Monthly Ledger</span>
                </span>
                <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">
                  {formatNRS(
                    groceryOrders
                      .filter((o) => o.paymentMethod === 'add_to_monthly_bill')
                      .reduce((s, o) => s + o.totalAmount, 0)
                  )}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                Rolled in Rent Bill
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main View Tabs: Catalog vs Recommended Recipes vs Delivery History */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'catalog'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Nepali Bhansa & Groceries Catalog</span>
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'recipes'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Recommended Recipes</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'recipes' ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-900'
            }`}>
              AI Chef
            </span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'orders'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>
              {userRole === 'landlord' ? 'Building Orders Tracker' : 'Family Orders & Status'}
            </span>
            {visibleOrders.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-800">
                {visibleOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Member selector for tenant */}
        {userRole === 'tenant' && (
          <div className="hidden sm:flex items-center gap-2 text-xs shrink-0">
            <span className="text-slate-500">Active member:</span>
            <select
              value={activeFamilyMember}
              onChange={(e) => setActiveFamilyMember(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-800 font-medium focus:outline-hidden"
            >
              <option value="Sita Sharma (Mom)">Sita (Mom)</option>
              <option value="Ramesh Sharma (Dad)">Ramesh (Dad)</option>
              <option value="Aayush Sharma (Son)">Aayush (Son)</option>
              <option value="Family Member">Family Member</option>
            </select>
          </div>
        )}
      </div>

      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* AI Recipe Recommender Discovery Callout */}
          <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white rounded-2xl p-4 shadow-sm border border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>Wondering What to Cook with Your Nepali Pantry?</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 font-bold">
                    Gemini AI
                  </span>
                </h4>
                <p className="text-xs text-stone-300 mt-0.5">
                  Let AI Chef inspect your available Jimbu, Ghee, Atta, and Mude Aloo to recommend recipes and missing ingredients.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('recipes')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all shrink-0 self-start sm:self-auto flex items-center gap-1.5 shadow-xs"
            >
              <span>Explore AI Recipes</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Quick Nepali Kitchen Starter Bundles */}
          <div className="bg-gradient-to-r from-amber-50/70 via-emerald-50/60 to-slate-50 border border-amber-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥟</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Authentic Nepali Kitchen Starter Bundles</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold border border-amber-200">
                      नेपाली भान्सा कम्बो
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600">
                    Add standard kitchen essentials to your family cart with a single click.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {kitchenBundles.map((bundle) => {
                const bundleItems = groceryItems.filter((i) => bundle.itemIds.includes(i.id));
                const bundleTotal = bundleItems.reduce((acc, i) => acc + i.price, 0);
                const isRecentlyAdded = recentlyAddedBundleId === bundle.id;

                return (
                  <div
                    key={bundle.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-2xl">{bundle.icon}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                          {bundle.badge}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-2">{bundle.title}</h4>
                      <p className="text-[11px] font-medium text-amber-700">{bundle.nepaliTitle}</p>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-2">
                        {bundle.tagline}
                      </p>
                      <div className="mt-2.5 text-[11px] text-slate-500 font-mono">
                        Contains {bundleItems.length} essential items · Total: {formatNRS(bundleTotal)}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100">
                      {userRole === 'tenant' ? (
                        <button
                          type="button"
                          onClick={() => handleAddBundleToCart(bundle)}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
                            isRecentlyAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {isRecentlyAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added to Family Basket!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Pack to Family Basket</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="text-center text-[11px] text-slate-400 font-medium py-1">
                          Tenant Starter Pack
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search, Tag Suggestions & Category Filter Strip */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Nepali kitchen items: DDC Ghyu, Jimbu, Timur, Besar, Gundruk, Sinki, Chakki Atta, Cooker Gasket, Belna, Mude Aloo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Nepali Tag Suggestions */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <span className="text-slate-400 font-medium whitespace-nowrap mr-1">Quick Picks:</span>
              {quickSearchTags.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => setSearchQuery(tag.query)}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 whitespace-nowrap transition-colors border border-slate-200"
                >
                  {tag.label}
                </button>
              ))}
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs pt-1 border-t border-slate-100">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className="text-[10px] opacity-80">({cat.nepaliLabel})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Items Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const inCart = cartItems.find((ci) => ci.groceryItemId === item.id);
              const qtyInCart = inCart?.quantity || 0;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group"
                >
                  <div>
                    {/* Top Row: Emoji & Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {item.imageEmoji}
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Title and Nepali Title */}
                    <div className="mt-3">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {item.nepaliName} · <span className="text-slate-400 font-mono">{item.unit}</span>
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Price & Cart Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold font-mono text-slate-900">
                        {formatNRS(item.price)}
                      </div>
                      <div className="text-[10px] text-slate-400">per {item.unit}</div>
                    </div>

                    {userRole === 'tenant' ? (
                      qtyInCart > 0 ? (
                        <div className="flex items-center border border-emerald-300 rounded-lg bg-emerald-50">
                          <button
                            type="button"
                            onClick={() => onUpdateCartQuantity(inCart!.id, qtyInCart - 1)}
                            className="p-1.5 text-emerald-800 hover:bg-emerald-100 rounded-l-md transition-colors"
                            title="Decrease"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 font-mono font-bold text-emerald-900 text-xs">
                            {qtyInCart}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQuantity(inCart!.id, qtyInCart + 1)}
                            className="p-1.5 text-emerald-800 hover:bg-emerald-100 rounded-r-md transition-colors"
                            title="Increase"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAddToCart(item, 1, activeFamilyMember)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Basket</span>
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded">
                        Catalog Price
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No kitchen items found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for something else or open your family basket to request a custom item.
              </p>
            </div>
          )}

          {/* Sticky Bottom Cart Bar for Tenant */}
          {userRole === 'tenant' && cartItems.length > 0 && (
            <div className="sticky bottom-4 z-30 bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <span>Family Grocery Basket ({totalCartCount} items)</span>
                    <span className="text-[10px] px-2 py-0.2 bg-emerald-950 text-emerald-300 rounded font-medium border border-emerald-800">
                      Doorstep Delivery Ready
                    </span>
                  </div>
                  <div className="text-sm font-mono font-bold text-white mt-0.5">
                    {formatNRS(cartSubtotal)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenCartModal}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <span>Review Basket & Checkout</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Recommended Recipes Tab */}
      {activeTab === 'recipes' && (
        <RecommendedRecipesSection
          groceryItems={groceryItems}
          cartItems={cartItems}
          userRole={userRole}
          onAddToCart={onAddToCart}
          onOpenCartModal={onOpenCartModal}
        />
      )}

      {/* Orders & Delivery History Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {userRole === 'landlord'
                  ? 'All Building Grocery & Pantry Orders'
                  : 'Family Orders & Delivery Status'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track doorstep delivery slots, water jar handovers, and monthly ledger entries.
              </p>
            </div>
          </div>

          {visibleOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No grocery orders placed yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Switch to the catalog tab to add water jars, rice, milk, vegetables, and kitchen items.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {visibleOrders.map((order) => {
                const targetUnit = units.find((u) => u.id === order.unitId);

                return (
                  <div key={order.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              order.status === 'delivered_at_door'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'out_for_delivery'
                                ? 'bg-blue-100 text-blue-800 animate-pulse'
                                : order.status === 'confirmed'
                                ? 'bg-indigo-100 text-indigo-800'
                                : order.status === 'cancelled'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.status.replace(/_/g, ' ')}
                          </span>
                          {order.paymentMethod === 'add_to_monthly_bill' && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-800 flex items-center gap-1">
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Billed in Rent Invoice</span>
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                          <span>Date: {order.orderDate}</span>
                          <span>·</span>
                          <span>
                            {targetUnit?.unitNumber} ({order.familyHead})
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-slate-700">
                            <Clock className="w-3 h-3 text-indigo-500" />
                            {order.deliverySlot === 'morning_7_9_am' && 'Morning 7-9 AM'}
                            {order.deliverySlot === 'afternoon_1_3_pm' && 'Afternoon 1-3 PM'}
                            {order.deliverySlot === 'evening_6_8_pm' && 'Evening 6-8 PM'}
                            {order.deliverySlot === 'express_45m' && 'Express 45m'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-start sm:self-auto">
                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-slate-900">
                            {formatNRS(order.totalAmount)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {order.paymentMethod === 'cash_on_delivery' && 'Cash on Delivery'}
                            {order.paymentMethod === 'esewa_khalti' && 'eSewa / Khalti QR'}
                            {order.paymentMethod === 'add_to_monthly_bill' && 'Monthly Ledger'}
                          </div>
                        </div>

                        {/* Landlord status updater */}
                        {userRole === 'landlord' && (
                          <select
                            value={order.status}
                            onChange={(e) =>
                              onUpdateOrderStatus(
                                order.id,
                                e.target.value as FamilyGroceryOrder['status']
                              )
                            }
                            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-hidden"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered_at_door">Delivered at Door</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Items pills */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
                      {order.items.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px]"
                        >
                          <span>{item.imageEmoji}</span>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-slate-500 font-mono font-semibold">
                            x{item.quantity}
                          </span>
                        </span>
                      ))}
                    </div>

                    {order.specialInstructions && (
                      <div className="mt-2 text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-md">
                        Note: "{order.specialInstructions}" · Deliver to: {order.deliveryLocation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
