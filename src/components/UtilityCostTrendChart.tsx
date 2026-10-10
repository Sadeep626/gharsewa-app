import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Droplets,
  Zap,
  Trash2,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
} from 'lucide-react';
import { ConsolidatedInvoice, PropertyUnit, UserRole } from '../types';
import { formatNRS, formatCompactNRS } from '../utils/currency';

interface UtilityCostTrendChartProps {
  invoices: ConsolidatedInvoice[];
  userRole: UserRole;
  selectedUnitId: string;
  units: PropertyUnit[];
}

type StreamMode = 'combined' | 'all_streams' | 'water' | 'electric' | 'waste';

interface MonthlyDataPoint {
  monthKey: string;
  monthLabel: string;
  water: number;
  electric: number;
  waste: number;
  totalUtilities: number;
  baseRent: number;
  totalInvoice: number;
}

const MONTH_ORDER = [
  'May 2026',
  'June 2026',
  'July 2026',
  'August 2026',
  'September 2026',
  'October 2026',
  'November 2026',
  'December 2026',
];

export const UtilityCostTrendChart: React.FC<UtilityCostTrendChartProps> = ({
  invoices,
  userRole,
  selectedUnitId,
  units,
}) => {
  const [streamMode, setStreamMode] = useState<StreamMode>('combined');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter invoices based on role and unit
  const relevantInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (userRole === 'tenant') {
        return inv.unitId === selectedUnitId;
      }
      if (unitFilter !== 'all') {
        return inv.unitId === unitFilter;
      }
      return true;
    });
  }, [invoices, userRole, selectedUnitId, unitFilter]);

  // Aggregate by month in chronological order
  const monthlyData: MonthlyDataPoint[] = useMemo(() => {
    const monthMap: Record<string, MonthlyDataPoint> = {};

    relevantInvoices.forEach((inv) => {
      const m = inv.billingMonth;
      if (!monthMap[m]) {
        monthMap[m] = {
          monthKey: m,
          monthLabel: m.split(' ')[0].substring(0, 3), // e.g. "May", "Jun", "Jul"
          water: 0,
          electric: 0,
          waste: 0,
          totalUtilities: 0,
          baseRent: 0,
          totalInvoice: 0,
        };
      }
      monthMap[m].water += inv.waterAmount;
      monthMap[m].electric += inv.electricAmount;
      monthMap[m].waste += inv.wasteAmount;
      monthMap[m].totalUtilities += inv.waterAmount + inv.electricAmount + inv.wasteAmount;
      monthMap[m].baseRent += inv.baseRent;
      monthMap[m].totalInvoice += inv.totalDue;
    });

    // Sort by known chronological month order
    return Object.values(monthMap).sort((a, b) => {
      const idxA = MONTH_ORDER.indexOf(a.monthKey);
      const idxB = MONTH_ORDER.indexOf(b.monthKey);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.monthKey.localeCompare(b.monthKey);
    });
  }, [relevantInvoices]);

  // Metrics calculation
  const totalMonths = monthlyData.length;
  const currentMonthData = monthlyData[totalMonths - 1] || null;
  const previousMonthData = monthlyData[totalMonths - 2] || null;

  const averageUtility = useMemo(() => {
    if (!totalMonths) return 0;
    const sum = monthlyData.reduce((acc, d) => acc + d.totalUtilities, 0);
    return sum / totalMonths;
  }, [monthlyData, totalMonths]);

  const momChange = useMemo(() => {
    if (!currentMonthData || !previousMonthData || previousMonthData.totalUtilities === 0) return null;
    const diff = currentMonthData.totalUtilities - previousMonthData.totalUtilities;
    const pct = (diff / previousMonthData.totalUtilities) * 100;
    return { diff, pct };
  }, [currentMonthData, previousMonthData]);

  const peakMonth = useMemo(() => {
    if (!monthlyData.length) return null;
    return [...monthlyData].sort((a, b) => b.totalUtilities - a.totalUtilities)[0];
  }, [monthlyData]);

  // Chart Geometry & Path Builder
  const chartWidth = 720;
  const chartHeight = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 55 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Compute Max Value for Y Axis Scale
  const maxY = useMemo(() => {
    if (!monthlyData.length) return 100;
    let max = 0;
    monthlyData.forEach((d) => {
      if (streamMode === 'combined') max = Math.max(max, d.totalUtilities);
      else if (streamMode === 'water') max = Math.max(max, d.water);
      else if (streamMode === 'electric') max = Math.max(max, d.electric);
      else if (streamMode === 'waste') max = Math.max(max, d.waste);
      else max = Math.max(max, d.water, d.electric, d.waste, d.totalUtilities);
    });
    // Add 15% headroom
    return Math.ceil((max * 1.15) / 10) * 10 || 100;
  }, [monthlyData, streamMode]);

  const getX = (index: number) => {
    if (totalMonths <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (totalMonths - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    if (maxY === 0) return padding.top + innerHeight;
    const ratio = val / maxY;
    return padding.top + innerHeight - ratio * innerHeight;
  };

  // Build SVG path string with smooth bezier curves
  const buildSmoothPath = (values: number[]) => {
    if (values.length === 0) return '';
    const points = values.map((val, i) => ({ x: getX(i), y: getY(val) }));

    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const buildAreaPath = (values: number[]) => {
    const linePath = buildSmoothPath(values);
    if (!linePath) return '';
    const lastX = getX(values.length - 1);
    const firstX = getX(0);
    const bottomY = padding.top + innerHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Grid steps (4 horizontal ticks)
  const yTicks = [0, maxY * 0.33, maxY * 0.66, maxY];

  // Active hover point data
  const activeHoverData = hoveredIndex !== null && monthlyData[hoveredIndex] ? monthlyData[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
      {/* Chart Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Monthly Utility Cost Trends
              </h2>
              <p className="text-xs text-slate-500">
                {userRole === 'landlord'
                  ? 'Historical water, electricity, and sanitation costs across billing cycles.'
                  : `6-month utility cost trajectory for ${units.find((u) => u.id === selectedUnitId)?.unitNumber || 'Residence'}.`}
              </p>
            </div>
          </div>
        </div>

        {/* Stream Filter & Unit Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stream Mode Segmented Buttons */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 text-xs">
            <button
              onClick={() => setStreamMode('combined')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                streamMode === 'combined'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Combined total water, power, and waste"
            >
              Total Utilities
            </button>
            <button
              onClick={() => setStreamMode('all_streams')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                streamMode === 'all_streams'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Compare all 3 utilities side-by-side"
            >
              All 3 Streams
            </button>
            <button
              onClick={() => setStreamMode('water')}
              className={`px-2 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                streamMode === 'water'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Droplets className="w-3 h-3 text-blue-500" />
              <span className="hidden sm:inline">Water</span>
            </button>
            <button
              onClick={() => setStreamMode('electric')}
              className={`px-2 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                streamMode === 'electric'
                  ? 'bg-white text-amber-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span className="hidden sm:inline">Power</span>
            </button>
            <button
              onClick={() => setStreamMode('waste')}
              className={`px-2 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                streamMode === 'waste'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trash2 className="w-3 h-3 text-emerald-500" />
              <span className="hidden sm:inline">Waste</span>
            </button>
          </div>

          {/* Unit selector for Landlord */}
          {userRole === 'landlord' && (
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-800 font-medium focus:outline-hidden focus:border-slate-400"
            >
              <option value="all">Entire Building (All Units)</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unitNumber} ({u.tenantFamilyName.split(' ')[1] || u.tenantFamilyName})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-500 block">6-Month Average</span>
          <div className="font-mono tabular-nums text-base font-bold text-slate-900 mt-0.5">
            {formatNRS(averageUtility)}
            <span className="text-slate-400 text-xs font-normal"> / mo</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-500 block">October 2026 Utilities</span>
          <div className="font-mono tabular-nums text-base font-bold text-slate-900 mt-0.5">
            {formatNRS(currentMonthData?.totalUtilities || 0)}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-500 block">Month-over-Month Delta</span>
          <div className="mt-0.5 flex items-center gap-1 font-mono tabular-nums text-sm font-semibold">
            {momChange ? (
              momChange.diff >= 0 ? (
                <span className="text-amber-700 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{formatNRS(momChange.diff)} (+{momChange.pct.toFixed(1)}%)
                </span>
              ) : (
                <span className="text-emerald-700 flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  -{formatNRS(Math.abs(momChange.diff))} ({momChange.pct.toFixed(1)}%)
                </span>
              )
            ) : (
              <span className="text-slate-500">Baseline</span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-500 block">Peak Utility Month</span>
          <div className="font-mono tabular-nums text-sm font-bold text-slate-900 mt-0.5">
            {peakMonth ? `${peakMonth.monthLabel} (${formatNRS(peakMonth.totalUtilities)})` : 'N/A'}
          </div>
        </div>
      </div>

      {/* SVG Responsive Line Chart Canvas */}
      <div className="relative w-full overflow-hidden pt-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {/* Total Utilities gradient fill */}
            <linearGradient id="totalUtilitiesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.00" />
            </linearGradient>

            {/* Water gradient */}
            <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00" />
            </linearGradient>

            {/* Electric gradient */}
            <linearGradient id="electricGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.00" />
            </linearGradient>

            {/* Waste gradient */}
            <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines and Y Labels */}
          {yTicks.map((tickVal, i) => {
            const yPos = getY(tickVal);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={chartWidth - padding.right}
                  y2={yPos}
                  stroke="#e2e8f0"
                  strokeDasharray={i === 0 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={yPos + 3.5}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {formatCompactNRS(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Area Fills under active curves */}
          {streamMode === 'combined' && (
            <path
              d={buildAreaPath(monthlyData.map((d) => d.totalUtilities))}
              fill="url(#totalUtilitiesGradient)"
            />
          )}

          {streamMode === 'water' && (
            <path
              d={buildAreaPath(monthlyData.map((d) => d.water))}
              fill="url(#waterGradient)"
            />
          )}

          {streamMode === 'electric' && (
            <path
              d={buildAreaPath(monthlyData.map((d) => d.electric))}
              fill="url(#electricGradient)"
            />
          )}

          {streamMode === 'waste' && (
            <path
              d={buildAreaPath(monthlyData.map((d) => d.waste))}
              fill="url(#wasteGradient)"
            />
          )}

          {/* Curves & Lines */}
          {/* 1. Combined Line */}
          {(streamMode === 'combined' || streamMode === 'all_streams') && (
            <path
              d={buildSmoothPath(monthlyData.map((d) => d.totalUtilities))}
              fill="none"
              stroke="#0f172a"
              strokeWidth={streamMode === 'combined' ? '2.5' : '1.75'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 2. Water Line (Blue) */}
          {(streamMode === 'water' || streamMode === 'all_streams') && (
            <path
              d={buildSmoothPath(monthlyData.map((d) => d.water))}
              fill="none"
              stroke="#2563eb"
              strokeWidth={streamMode === 'water' ? '2.5' : '1.75'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 3. Electric Line (Amber) */}
          {(streamMode === 'electric' || streamMode === 'all_streams') && (
            <path
              d={buildSmoothPath(monthlyData.map((d) => d.electric))}
              fill="none"
              stroke="#d97706"
              strokeWidth={streamMode === 'electric' ? '2.5' : '1.75'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 4. Waste Line (Emerald) */}
          {(streamMode === 'waste' || streamMode === 'all_streams') && (
            <path
              d={buildSmoothPath(monthlyData.map((d) => d.waste))}
              fill="none"
              stroke="#059669"
              strokeWidth={streamMode === 'waste' ? '2.5' : '1.75'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X Axis Month Labels */}
          {monthlyData.map((d, i) => {
            const x = getX(i);
            const isHovered = hoveredIndex === i;
            return (
              <g key={i}>
                <text
                  x={x}
                  y={padding.top + innerHeight + 20}
                  textAnchor="middle"
                  className={`text-[11px] font-mono transition-colors ${
                    isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-500'
                  }`}
                >
                  {d.monthLabel}
                </text>
              </g>
            );
          })}

          {/* Data Points on Curves */}
          {monthlyData.map((d, i) => {
            const x = getX(i);
            const isHovered = hoveredIndex === i;

            return (
              <g key={i}>
                {/* Total point */}
                {(streamMode === 'combined' || streamMode === 'all_streams') && (
                  <circle
                    cx={x}
                    cy={getY(d.totalUtilities)}
                    r={isHovered ? 5 : 3.5}
                    fill="#0f172a"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                )}

                {/* Water point */}
                {(streamMode === 'water' || streamMode === 'all_streams') && (
                  <circle
                    cx={x}
                    cy={getY(d.water)}
                    r={isHovered ? 5 : 3.5}
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                )}

                {/* Electric point */}
                {(streamMode === 'electric' || streamMode === 'all_streams') && (
                  <circle
                    cx={x}
                    cy={getY(d.electric)}
                    r={isHovered ? 5 : 3.5}
                    fill="#d97706"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                )}

                {/* Waste point */}
                {(streamMode === 'waste' || streamMode === 'all_streams') && (
                  <circle
                    cx={x}
                    cy={getY(d.waste)}
                    r={isHovered ? 5 : 3.5}
                    fill="#059669"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                )}
              </g>
            );
          })}

          {/* Vertical Crosshair Line when Hovered */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={padding.top}
              x2={getX(hoveredIndex)}
              y2={padding.top + innerHeight}
              stroke="#64748b"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
          )}

          {/* Interactive Hover Columns */}
          {monthlyData.map((_, i) => {
            const colWidth = innerWidth / Math.max(1, totalMonths - 1);
            const x = getX(i) - colWidth / 2;
            return (
              <rect
                key={i}
                x={Math.max(padding.left, x)}
                y={padding.top}
                width={colWidth}
                height={innerHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Hover Floating Card Tooltip */}
        {activeHoverData && (
          <div
            className="absolute top-2 right-4 bg-slate-900 text-white rounded-lg p-3 text-xs shadow-lg border border-slate-700 pointer-events-none z-10 transition-opacity"
            style={{ minWidth: '190px' }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-white">{activeHoverData.monthKey}</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {formatNRS(activeHoverData.totalUtilities)}
              </span>
            </div>

            <div className="mt-2 space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between text-blue-300">
                <span className="flex items-center gap-1 font-sans">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  KUKL Water:
                </span>
                <span>{formatNRS(activeHoverData.water)}</span>
              </div>

              <div className="flex items-center justify-between text-amber-300">
                <span className="flex items-center gap-1 font-sans">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  NEA Electricity:
                </span>
                <span>{formatNRS(activeHoverData.electric)}</span>
              </div>

              <div className="flex items-center justify-between text-emerald-300">
                <span className="flex items-center gap-1 font-sans">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Waste & Sanitation:
                </span>
                <span>{formatNRS(activeHoverData.waste)}</span>
              </div>

              <div className="pt-1.5 mt-1 border-t border-slate-800 flex items-center justify-between text-slate-400">
                <span className="font-sans">Rent + Utilities:</span>
                <span className="text-white font-semibold">{formatNRS(activeHoverData.totalInvoice)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Legend & Insights */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-900 rounded-full inline-block" />
            <span className="font-medium text-slate-800">Total Utilities</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-600 rounded-full inline-block" />
            <span>Water (m³)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-600 rounded-full inline-block" />
            <span>Electricity (kWh)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-600 rounded-full inline-block" />
            <span>Waste Sanitation</span>
          </div>
        </div>

        <div className="text-slate-500 text-[11px]">
          Hover any month to inspect itemized utility cost splits.
        </div>
      </div>
    </div>
  );
};
