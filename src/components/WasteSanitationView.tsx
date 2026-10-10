import React, { useState } from 'react';
import {
  Trash2,
  Recycle,
  Apple,
  Truck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  PlusCircle,
  Search,
} from 'lucide-react';
import { PropertyUnit, WasteManagementFee, UserRole } from '../types';

interface WasteSanitationViewProps {
  userRole: UserRole;
  units: PropertyUnit[];
  selectedUnitId: string;
  wasteFees: WasteManagementFee[];
}

interface BulkyPickupRequest {
  id: string;
  unitId: string;
  itemDescription: string;
  category: 'furniture' | 'appliance' | 'mattress' | 'electronics';
  requestedDate: string;
  fee: number;
  status: 'scheduled' | 'collected';
}

const INITIAL_BULKY_REQUESTS: BulkyPickupRequest[] = [
  {
    id: 'blk-01',
    unitId: 'unit-104',
    itemDescription: 'Disassembled sectional sofa & packing cartons',
    category: 'furniture',
    requestedDate: '2026-10-15',
    fee: 15.0,
    status: 'scheduled',
  },
  {
    id: 'blk-02',
    unitId: 'unit-201',
    itemDescription: 'Old micro-refrigerator (freon emptied certification provided)',
    category: 'appliance',
    requestedDate: '2026-09-18',
    fee: 25.0,
    status: 'collected',
  },
];

const WASTE_SORTING_DATABASE = [
  { item: 'Greasy Pizza Box', bin: 'Compost (Green Bin)', tip: 'Grease and food oils contaminate paper recycling streams. Place soiled cardboard in organic compost.' },
  { item: 'Plastic Water Bottles (PET 1)', bin: 'Recycling (Blue Bin)', tip: 'Empty and rinse. Replace cap on bottle before binning.' },
  { item: 'Alkaline AA / AAA Batteries', bin: 'Hazardous Waste Depot', tip: 'Do not place in general trash or recycling. Drop at local municipal e-waste depot.' },
  { item: 'Polystyrene Foam (Styrofoam)', bin: 'General Trash (Black Bin)', tip: 'Polystyrene is non-recyclable in standard curbside pickup.' },
  { item: 'Food Scraps & Coffee Grounds', bin: 'Compost (Green Bin)', tip: 'Wrap in newspaper or certified compostable bags.' },
  { item: 'Glass Jars & Wine Bottles', bin: 'Recycling (Blue Bin)', tip: 'Rinse cleanly. Metal caps can be recycled separately.' },
  { item: 'Fluorescent Light Bulbs (CFL)', bin: 'Hazardous Waste Depot', tip: 'Contains trace mercury vapor. Must be taken to building hazardous box or city depot.' },
];

export const WasteSanitationView: React.FC<WasteSanitationViewProps> = ({
  userRole,
  units,
  selectedUnitId,
  wasteFees,
}) => {
  const [bulkyRequests, setBulkyRequests] = useState<BulkyPickupRequest[]>(INITIAL_BULKY_REQUESTS);
  const [searchItem, setSearchItem] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Form states
  const [formUnitId, setFormUnitId] = useState(userRole === 'tenant' ? selectedUnitId : 'unit-201');
  const [formItem, setFormItem] = useState('');
  const [formCategory, setFormCategory] = useState<'furniture' | 'appliance' | 'mattress' | 'electronics'>('furniture');
  const [formDate, setFormDate] = useState('2026-10-22');

  const filteredSortingItems = WASTE_SORTING_DATABASE.filter((entry) =>
    entry.item.toLowerCase().includes(searchItem.toLowerCase()) ||
    entry.bin.toLowerCase().includes(searchItem.toLowerCase())
  );

  const handleCreateBulkyRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItem.trim()) return;

    const newRequest: BulkyPickupRequest = {
      id: `blk-${Date.now()}`,
      unitId: formUnitId,
      itemDescription: formItem,
      category: formCategory,
      requestedDate: formDate,
      fee: formCategory === 'appliance' ? 25.0 : 15.0,
      status: 'scheduled',
    };

    setBulkyRequests([newRequest, ...bulkyRequests]);
    setFormItem('');
    setShowBookingForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Waste Management & Sanitation Bridge
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Municipal collection schedules, bulky item disposals, and building waste sorting compliance.
            </p>
          </div>

          <button
            onClick={() => setShowBookingForm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Book Bulky Waste Pickup</span>
          </button>
        </div>
      </div>

      {/* 3-Stream Collection Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stream 1: General Trash */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Landfill Stream
              </span>
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-2">
              General Trash (Black Bin)
            </h3>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-medium text-slate-900">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Tuesday & Friday (07:00 AM)</span>
              </div>
              <p className="text-slate-500 text-[11px] pt-1">
                Curbside corral bin must be rolled out by 06:30 AM. Non-recyclable wrappers, sanitary waste, broken ceramic.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Monthly Unit Base:</span>
            <span className="font-mono font-semibold text-slate-900">$22.00 / mo</span>
          </div>
        </div>

        {/* Stream 2: Recyclables */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Curbside Recyclables
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Recycle className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-2">
              Clean Recycling (Blue Bin)
            </h3>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-medium text-slate-900">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Wednesday (08:00 AM)</span>
              </div>
              <p className="text-slate-500 text-[11px] pt-1">
                Aluminum cans, clean glass bottles, clean paper, plastic jugs #1–#5. Flatten cardboard boxes.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Recycling Levy:</span>
            <span className="font-mono font-semibold text-slate-900">$8.50 / mo</span>
          </div>
        </div>

        {/* Stream 3: Compost / Organics */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Organics & Compost
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <Apple className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-2">
              Organics & Food Scraps (Green Bin)
            </h3>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-medium text-slate-900">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>Monday & Thursday (07:30 AM)</span>
              </div>
              <p className="text-slate-500 text-[11px] pt-1">
                Fruit peels, coffee grounds, greasy paper towels, plant trimmings. Do NOT include plastic bags.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Green Diversion Levy:</span>
            <span className="font-mono font-semibold text-slate-900">$4.50 / mo</span>
          </div>
        </div>
      </div>

      {/* Bulky Waste Request Management */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Bulky Waste Collection Requests
            </h2>
            <p className="text-xs text-slate-500">
              Scheduled municipal pickups for mattresses, furniture, and large appliances.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {bulkyRequests.length} Scheduled / Archived
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {bulkyRequests.map((req) => {
            const unit = units.find((u) => u.id === req.unitId);
            return (
              <div key={req.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {req.itemDescription}
                    </div>
                    <div className="text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-700">{unit?.unitNumber} ({unit?.tenantFamilyName})</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{req.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>Target Pickup: {req.requestedDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900">${req.fee.toFixed(2)}</div>
                    <div className="text-[11px] text-slate-500">Billed on invoice</div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                      req.status === 'scheduled'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Sorting Guide & City Ordinance */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Interactive Waste Sorting & Municipal Ordinance Guide
            </h3>
            <p className="text-xs text-slate-500">
              Check an item before disposal to ensure compliance and avoid municipal contamination fines.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search item (e.g. pizza box, batteries)..."
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {filteredSortingItems.map((guide, idx) => (
            <div key={idx} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50 text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span>{guide.item}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    guide.bin.includes('Compost')
                      ? 'bg-emerald-100 text-emerald-800'
                      : guide.bin.includes('Recycling')
                      ? 'bg-blue-100 text-blue-800'
                      : guide.bin.includes('Hazardous')
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {guide.bin}
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">{guide.tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bulky Item Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Book Municipal Bulky Waste Pickup
              </h3>
              <button
                onClick={() => setShowBookingForm(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBulkyRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Apartment Unit
                </label>
                <select
                  value={formUnitId}
                  onChange={(e) => setFormUnitId(e.target.value)}
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
                  Item Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                >
                  <option value="furniture">Furniture (Sofa, Desk, Chair) - $15.00</option>
                  <option value="mattress">Mattress or Box Spring - $20.00</option>
                  <option value="appliance">Appliance (Washer, Fridge) - $25.00</option>
                  <option value="electronics">Large Electronics / TV - $15.00</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Item Description & Approximate Dimensions
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Queen sized spring mattress and wooden side table"
                  value={formItem}
                  onChange={(e) => setFormItem(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Requested Municipal Pickup Date
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-slate-600 text-[11px]">
                Note: Municipal sanitation requires items to be tagged and placed in the building waste corral by 7:00 AM on the scheduled morning. Fee will be itemized on the next consolidated monthly invoice.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md transition-colors"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
