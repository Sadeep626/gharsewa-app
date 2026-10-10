import React, { useState } from 'react';
import {
  Droplets,
  Zap,
  Trash2,
  Receipt,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  PropertyUnit,
  WaterMeterReading,
  ElectricMeterReading,
  ConsolidatedInvoice,
} from '../types';
import { formatNRS } from '../utils/currency';

interface LogMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: PropertyUnit[];
  waterReadings: WaterMeterReading[];
  electricReadings: ElectricMeterReading[];
  onSaveReadings: (
    waterReading: WaterMeterReading,
    electricReading: ElectricMeterReading,
    newInvoice: ConsolidatedInvoice
  ) => void;
}

export const LogMeterModal: React.FC<LogMeterModalProps> = ({
  isOpen,
  onClose,
  units,
  waterReadings,
  electricReadings,
  onSaveReadings,
}) => {
  if (!isOpen) return null;

  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id || 'unit-201');
  const [billingMonth, setBillingMonth] = useState('November 2026');

  // Find latest readings for unit to populate previous reading
  const latestWater = waterReadings.find((w) => w.unitId === selectedUnitId) || {
    currentReading: 426.8,
  };
  const latestElectric = electricReadings.find((e) => e.unitId === selectedUnitId) || {
    currentReading: 8740,
  };

  const [currentWater, setCurrentWater] = useState(Number((latestWater.currentReading + 14.2).toFixed(1)));
  const [currentElectric, setCurrentElectric] = useState(latestElectric.currentReading + 310);

  const unit = units.find((u) => u.id === selectedUnitId) || units[0];

  // Calculations (Kathmandu Standards: KUKL water NRs. 45/m³, NEA electric NRs. 12.5/kWh)
  const waterConsumption = Math.max(0, Number((currentWater - latestWater.currentReading).toFixed(1)));
  const waterRate = 45; // NRs. per m³
  const waterBase = 250; // NRs. base meter
  const sewer = 350; // NRs. sewer surcharge
  const waterTotal = Math.round(waterConsumption * waterRate + waterBase + sewer);

  const electricConsumption = Math.max(0, currentElectric - latestElectric.currentReading);
  const electricRate = 12.5; // NRs. per kWh
  const peakCharge = 150; // NRs. demand factor
  const fuelAdj = 75; // NRs. fuel adjustment / tax
  const electricTotal = Math.round(electricConsumption * electricRate + peakCharge + fuelAdj);

  const wasteFee = 450; // NRs. Ward 10 municipal waste fee
  const maintenanceFee = 500; // NRs. common area maintenance
  const grandTotal = unit.baseRent + waterTotal + electricTotal + wasteFee + maintenanceFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newWaterReading: WaterMeterReading = {
      id: `wm-${Date.now()}`,
      unitId: selectedUnitId,
      billingMonth,
      previousReading: latestWater.currentReading,
      currentReading: currentWater,
      consumption: waterConsumption,
      ratePerCubicMeter: waterRate,
      baseCharge: waterBase,
      sewerSurcharge: sewer,
      totalAmount: waterTotal,
      readingDate: new Date().toISOString().substring(0, 10),
      hasLeakWarning: waterConsumption > 22.0,
    };

    const newElectricReading: ElectricMeterReading = {
      id: `em-${Date.now()}`,
      unitId: selectedUnitId,
      billingMonth,
      previousReading: latestElectric.currentReading,
      currentReading: currentElectric,
      consumption: electricConsumption,
      ratePerKwh: electricRate,
      peakCharge,
      fuelAdjustment: fuelAdj,
      totalAmount: electricTotal,
      readingDate: new Date().toISOString().substring(0, 10),
    };

    const newInvoice: ConsolidatedInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}-${unit.unitNumber.replace(/\D/g, '')}`,
      unitId: selectedUnitId,
      billingMonth,
      issueDate: new Date().toISOString().substring(0, 10),
      dueDate: new Date(Date.now() + 86400000 * 9).toISOString().substring(0, 10),
      baseRent: unit.baseRent,
      waterAmount: waterTotal,
      electricAmount: electricTotal,
      wasteAmount: wasteFee,
      maintenanceFee,
      totalDue: grandTotal,
      status: 'pending',
      notes: `Consolidated bill generated with meter readings on ${new Date().toLocaleDateString()}.`,
    };

    onSaveReadings(newWaterReading, newElectricReading, newInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Log Utility Meter Readings & Generate Consolidated Bill
            </h3>
            <p className="text-xs text-slate-500">
              Input monthly sub-meter indices to generate verified water, power, and waste invoice.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Apartment Unit
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
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
                Billing Cycle
              </label>
              <input
                type="text"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Water Reading Card */}
          <div className="p-3.5 rounded-lg border border-blue-100 bg-blue-50/40 space-y-2">
            <div className="flex items-center justify-between font-semibold text-blue-900">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-600" />
                Water Meter (m³)
              </span>
              <span className="font-mono text-xs">Prev: {latestWater.currentReading} m³</span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-slate-600 text-[11px] mb-1">
                  Current Water Meter Reading (m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={currentWater}
                  onChange={(e) => setCurrentWater(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 bg-white border border-blue-200 rounded text-slate-900 font-mono focus:outline-hidden"
                />
              </div>

              <div className="text-right">
                <div className="text-[11px] text-slate-500">Net Consumption:</div>
                <div className="font-mono font-bold text-slate-900 text-sm">
                  {waterConsumption} m³ → {formatNRS(waterTotal)}
                </div>
              </div>
            </div>
          </div>

          {/* Electric Reading Card */}
          <div className="p-3.5 rounded-lg border border-amber-100 bg-amber-50/40 space-y-2">
            <div className="flex items-center justify-between font-semibold text-amber-900">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600" />
                NEA Electricity Meter (kWh)
              </span>
              <span className="font-mono text-xs">Prev: {latestElectric.currentReading} kWh</span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-slate-600 text-[11px] mb-1">
                  Current Electric Meter Reading (kWh)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={currentElectric}
                  onChange={(e) => setCurrentElectric(parseInt(e.target.value) || 0)}
                  className="w-full p-1.5 bg-white border border-amber-200 rounded text-slate-900 font-mono focus:outline-hidden"
                />
              </div>

              <div className="text-right">
                <div className="text-[11px] text-slate-500">Net Usage:</div>
                <div className="font-mono font-bold text-slate-900 text-sm">
                  {electricConsumption} kWh → {formatNRS(electricTotal)}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Calculation breakdown */}
          <div className="p-3 bg-slate-50 rounded-lg space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Base Rent:</span>
              <span className="font-mono">{formatNRS(unit.baseRent)}</span>
            </div>
            <div className="flex justify-between text-blue-700">
              <span>KUKL Water ({waterConsumption} m³):</span>
              <span className="font-mono">{formatNRS(waterTotal)}</span>
            </div>
            <div className="flex justify-between text-amber-700">
              <span>NEA Electricity ({electricConsumption} kWh):</span>
              <span className="font-mono">{formatNRS(electricTotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Ward 10 Waste Management:</span>
              <span className="font-mono">{formatNRS(wasteFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Common Area Maintenance:</span>
              <span className="font-mono">{formatNRS(maintenanceFee)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
              <span>Total Consolidated Due:</span>
              <span className="font-mono text-base">{formatNRS(grandTotal)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-900 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md transition-colors"
            >
              Save Readings & Issue Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
