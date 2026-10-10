import React, { useState, useMemo } from 'react';
import {
  Layers,
  Wrench,
  Droplets,
  Zap,
  Trash2,
  Home,
  AlertTriangle,
  CheckCircle2,
  Building,
  Flame,
  Info,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { MaintenanceTicket, PropertyUnit, UserRole } from '../types';

interface MaintenanceHeatmapProps {
  tickets: MaintenanceTicket[];
  units: PropertyUnit[];
  userRole: UserRole;
  selectedUnitId: string;
  onSelectUnitFilter?: (unitId: string | 'all') => void;
}

interface FloorGridCell {
  unitId: string;
  unitNumber: string;
  floor: number;
  tenantFamilyName: string;
  tickets: MaintenanceTicket[];
  activeTicketsCount: number;
  criticalCount: number;
  categoriesCount: {
    water_plumbing: number;
    electrical: number;
    waste_sanitation: number;
    structural_other: number;
  };
}

export const MaintenanceHeatmap: React.FC<MaintenanceHeatmapProps> = ({
  tickets,
  units,
  userRole,
  selectedUnitId,
  onSelectUnitFilter,
}) => {
  const [selectedCellUnitId, setSelectedCellUnitId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Filter tickets by category if selected
  const filteredTickets = useMemo(() => {
    if (filterCategory === 'all') return tickets;
    return tickets.filter((t) => t.category === filterCategory);
  }, [tickets, filterCategory]);

  // Aggregate by floor & unit
  const floorData = useMemo(() => {
    // Sort units by floor descending (top floor 3 first, down to floor 1)
    const sortedUnits = [...units].sort((a, b) => b.floor - a.floor);

    return sortedUnits.map((u): FloorGridCell => {
      const unitTickets = filteredTickets.filter((t) => t.unitId === u.id);
      const active = unitTickets.filter((t) => t.status !== 'resolved');
      const critical = unitTickets.filter((t) => t.priority === 'emergency_24h' || t.priority === 'urgent_48h');

      const cats = {
        water_plumbing: unitTickets.filter((t) => t.category === 'water_plumbing').length,
        electrical: unitTickets.filter((t) => t.category === 'electrical').length,
        waste_sanitation: unitTickets.filter((t) => t.category === 'waste_sanitation').length,
        structural_other: unitTickets.filter((t) => t.category === 'structural_other').length,
      };

      return {
        unitId: u.id,
        unitNumber: u.unitNumber,
        floor: u.floor,
        tenantFamilyName: u.tenantFamilyName,
        tickets: unitTickets,
        activeTicketsCount: active.length,
        criticalCount: critical.length,
        categoriesCount: cats,
      };
    });
  }, [filteredTickets, units]);

  // Structural insights
  const chronicInsight = useMemo(() => {
    // Count issues across floors
    const plumbingCount = tickets.filter((t) => t.category === 'water_plumbing').length;
    const electricalCount = tickets.filter((t) => t.category === 'electrical').length;

    // Unit with highest issues
    let maxUnit = floorData[0];
    floorData.forEach((f) => {
      if (f.tickets.length > (maxUnit?.tickets.length || 0)) {
        maxUnit = f;
      }
    });

    return {
      highestUnit: maxUnit,
      primaryCategory: plumbingCount >= electricalCount ? 'Plumbing & Drainage' : 'Electrical System',
      hotspotAnalysis:
        'Floor 1 (Apt 104) and Floor 2 (Apt 201) vertical plumbing core accounts for 65% of recorded leak maintenance. Recommend scheduled stack inspection during municipal deep-bore pumping cycle.',
    };
  }, [tickets, floorData]);

  const activeSelectedCell = floorData.find((f) => f.unitId === selectedCellUnitId) || null;

  // Heatmap intensity color generator
  const getHeatmapColor = (activeCount: number, criticalCount: number) => {
    if (criticalCount > 0) {
      return {
        bg: 'bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-950',
        badge: 'bg-rose-600 text-white',
        pulse: true,
      };
    }
    if (activeCount >= 2) {
      return {
        bg: 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-950',
        badge: 'bg-amber-600 text-white',
        pulse: false,
      };
    }
    if (activeCount === 1) {
      return {
        bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-950',
        badge: 'bg-blue-600 text-white',
        pulse: false,
      };
    }
    return {
      bg: 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200 text-emerald-950',
      badge: 'bg-emerald-600 text-white',
      pulse: false,
    };
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <Building className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Building Structural & Maintenance Heatmap
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                Floor Elevation Analysis
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live floor-by-floor defect cluster matrix. Identify recurring plumbing leaks, wiring wear, and habitability hotspots.
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs border border-slate-200/80 self-start md:self-auto">
          {[
            { id: 'all', label: 'All Defects' },
            { id: 'water_plumbing', label: 'Plumbing' },
            { id: 'electrical', label: 'Electrical' },
            { id: 'waste_sanitation', label: 'Waste' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterCategory === cat.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Heatmap Visual & Diagnostic Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Architectural Cross Section Heatmap */}
        <div className="lg:col-span-2 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Himalayan Heights Residency — Floor Elevation Matrix</span>
            <span>Click any unit to inspect defects</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 p-4 space-y-3">
            {/* Rooftop / Tank Level */}
            <div className="p-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-100/70 text-xs flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">ROOF</span>
                <span className="text-[11px] text-slate-500">KUKL Overhead Storage Tanks & Solar Water Heaters</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Tank Level: 92% · Clean
              </span>
            </div>

            {/* Units Stack (Floor 3 down to Floor 1) */}
            <div className="space-y-2.5">
              {floorData.map((cell) => {
                const style = getHeatmapColor(cell.activeTicketsCount, cell.criticalCount);
                const isSelected = selectedCellUnitId === cell.unitId;

                return (
                  <div
                    key={cell.unitId}
                    onClick={() => {
                      setSelectedCellUnitId(isSelected ? null : cell.unitId);
                      onSelectUnitFilter?.(isSelected ? 'all' : cell.unitId);
                    }}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${style.bg} ${
                      isSelected ? 'ring-2 ring-slate-900 shadow-sm' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/90 border border-slate-200 flex flex-col items-center justify-center font-mono shrink-0 shadow-xs">
                          <span className="text-[10px] uppercase text-slate-400 font-bold">FLR</span>
                          <span className="text-sm font-bold text-slate-900">{cell.floor}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {cell.unitNumber}
                            </span>
                            <span className="text-xs text-slate-600">
                              · {cell.tenantFamilyName}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1 text-blue-800">
                              <Droplets className="w-3 h-3" />
                              {cell.categoriesCount.water_plumbing} plumbing
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1 text-amber-800">
                              <Zap className="w-3 h-3" />
                              {cell.categoriesCount.electrical} electrical
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1 text-slate-700">
                              <Wrench className="w-3 h-3" />
                              {cell.tickets.length} total logged
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right status badge */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold ${style.badge}`}>
                          {cell.activeTicketsCount} Active Issues
                        </span>
                        {cell.criticalCount > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-700 text-white animate-pulse">
                            {cell.criticalCount} Critical
                          </span>
                        )}
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ground / Basement Level */}
            <div className="p-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-100/70 text-xs flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">GND</span>
                <span className="text-[11px] text-slate-500">Deep Borewell Motor, NEA Main Sub-station, Waste Corral</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Water Pressure: Normal
              </span>
            </div>
          </div>

          {/* Heatmap Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
            <span className="font-medium text-slate-700">Heatmap Severity Legend:</span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span>Zero Defect (Optimal)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                <span>1 Routine Issue</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span>2+ Issues (Watchlist)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" />
                <span>Critical / Active Leak</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Chronic Hotspot Analysis & Selected Unit Detail */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Flame className="w-4 h-4" />
              <span>Structural Anomaly Diagnosis</span>
            </div>

            <h3 className="text-sm font-bold text-white">
              Recurring Hotspot: {chronicInsight.primaryCategory}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              {chronicInsight.hotspotAnalysis}
            </p>

            <div className="p-3 rounded-lg bg-slate-800 border border-slate-700/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>Most Impacted Dwelling:</span>
                <span className="font-bold text-white">
                  {chronicInsight.highestUnit?.unitNumber} ({chronicInsight.highestUnit?.tenantFamilyName})
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Active Open Tickets:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {tickets.filter((t) => t.status !== 'resolved').length} across building
                </span>
              </div>
            </div>
          </div>

          {/* Unit Inspection Card if clicked */}
          {activeSelectedCell ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900">
                  {activeSelectedCell.unitNumber} Defect Breakdown
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Floor {activeSelectedCell.floor}
                </span>
              </div>

              {activeSelectedCell.tickets.length === 0 ? (
                <p className="text-slate-500 py-2">No tickets logged for this unit.</p>
              ) : (
                <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                  {activeSelectedCell.tickets.map((t) => (
                    <div key={t.id} className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 line-clamp-1">{t.title}</span>
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-600">
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{t.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-xs text-slate-500 text-center">
              Click any floor cell to filter tickets and review individual unit diagnostic logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
