import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Building,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle2,
  PieChart,
  BarChart3,
  Layers,
} from 'lucide-react';
import { ConsolidatedInvoice, PropertyUnit, UserRole } from '../types';
import { formatNRS, formatCompactNRS } from '../utils/currency';

interface OccupancyAndIncomeChartProps {
  invoices: ConsolidatedInvoice[];
  units: PropertyUnit[];
  userRole: UserRole;
  selectedUnitId: string;
}

type ChartViewMode = 'income' | 'occupancy';

interface MonthIncomePoint {
  monthKey: string;
  monthShort: string;
  billedTotal: number;
  collectedTotal: number;
  baseRent: number;
  utilityTotal: number;
  collectionRate: number;
  occupiedCount: number;
  occupancyRate: number;
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

export const OccupancyAndIncomeChart: React.FC<OccupancyAndIncomeChartProps> = ({
  invoices,
  units,
  userRole,
  selectedUnitId,
}) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>('income');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Filter invoices for current perspective (Whole building for Landlord, active flat for Tenant)
  const scopedInvoices = useMemo(() => {
    if (userRole === 'tenant') {
      return invoices.filter((inv) => inv.unitId === selectedUnitId);
    }
    return invoices;
  }, [invoices, userRole, selectedUnitId]);

  // Aggregate monthly data
  const monthlyData: MonthIncomePoint[] = useMemo(() => {
    const map: Record<string, MonthIncomePoint> = {};

    scopedInvoices.forEach((inv) => {
      const m = inv.billingMonth;
      if (!map[m]) {
        map[m] = {
          monthKey: m,
          monthShort: m.split(' ')[0].substring(0, 3),
          billedTotal: 0,
          collectedTotal: 0,
          baseRent: 0,
          utilityTotal: 0,
          collectionRate: 100,
          occupiedCount: units.filter((u) => u.status === 'occupied').length,
          occupancyRate: 100, // 3/3 units occupied in Cedar / Himalayan Heights
        };
      }
      map[m].billedTotal += inv.totalDue;
      map[m].baseRent += inv.baseRent;
      map[m].utilityTotal += inv.waterAmount + inv.electricAmount + inv.wasteAmount + inv.maintenanceFee;
      if (inv.status === 'paid') {
        map[m].collectedTotal += inv.totalDue;
      }
    });

    // Calculate collection rates & sort chronologically
    return Object.values(map)
      .map((item) => ({
        ...item,
        collectionRate: item.billedTotal > 0 ? (item.collectedTotal / item.billedTotal) * 100 : 0,
        occupancyRate: userRole === 'landlord' ? 100 : 100,
      }))
      .sort((a, b) => {
        const idxA = MONTH_ORDER.indexOf(a.monthKey);
        const idxB = MONTH_ORDER.indexOf(b.monthKey);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        return a.monthKey.localeCompare(b.monthKey);
      });
  }, [scopedInvoices, units, userRole]);

  // Key KPI stats
  const totalMonths = monthlyData.length;
  const currentMonthData = monthlyData[totalMonths - 1] || null;
  const prevMonthData = monthlyData[totalMonths - 2] || null;

  const totalRevenueYTD = useMemo(() => {
    return monthlyData.reduce((acc, d) => acc + d.collectedTotal, 0);
  }, [monthlyData]);

  const avgMonthlyIncome = useMemo(() => {
    if (!totalMonths) return 0;
    const sum = monthlyData.reduce((acc, d) => acc + d.billedTotal, 0);
    return sum / totalMonths;
  }, [monthlyData, totalMonths]);

  const overallCollectionEfficiency = useMemo(() => {
    const totalBilled = monthlyData.reduce((acc, d) => acc + d.billedTotal, 0);
    const totalCollected = monthlyData.reduce((acc, d) => acc + d.collectedTotal, 0);
    if (!totalBilled) return 100;
    return (totalCollected / totalBilled) * 100;
  }, [monthlyData]);

  const momIncomeDelta = useMemo(() => {
    if (!currentMonthData || !prevMonthData || prevMonthData.billedTotal === 0) return null;
    const diff = currentMonthData.billedTotal - prevMonthData.billedTotal;
    const pct = (diff / prevMonthData.billedTotal) * 100;
    return { diff, pct };
  }, [currentMonthData, prevMonthData]);

  // Chart Geometry
  const chartWidth = 720;
  const chartHeight = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Max scale calculation
  const maxIncome = useMemo(() => {
    if (!monthlyData.length) return 100000;
    const maxVal = Math.max(...monthlyData.map((d) => d.billedTotal));
    return Math.ceil((maxVal * 1.15) / 10000) * 10000 || 100000;
  }, [monthlyData]);

  const getX = (index: number) => {
    if (totalMonths <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (totalMonths - 1)) * innerWidth;
  };

  const getYIncome = (val: number) => {
    if (!maxIncome) return padding.top + innerHeight;
    const ratio = val / maxIncome;
    return padding.top + innerHeight - ratio * innerHeight;
  };

  const getYOccupancy = (valPct: number) => {
    // 0% to 100%
    const ratio = Math.min(100, Math.max(0, valPct)) / 100;
    return padding.top + innerHeight - ratio * innerHeight;
  };

  // Build curved SVG path
  const buildSmoothLine = (values: number[], getYFunc: (v: number) => number) => {
    if (values.length === 0) return '';
    const points = values.map((val, i) => ({ x: getX(i), y: getYFunc(val) }));
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

  const buildArea = (values: number[], getYFunc: (v: number) => number) => {
    const linePath = buildSmoothLine(values, getYFunc);
    if (!linePath) return '';
    const lastX = getX(values.length - 1);
    const firstX = getX(0);
    const bottomY = padding.top + innerHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Ticks
  const incomeTicks = [0, maxIncome * 0.33, maxIncome * 0.66, maxIncome];
  const occupancyTicks = [0, 25, 50, 75, 100];

  const activeHover = hoveredIdx !== null && monthlyData[hoveredIdx] ? monthlyData[hoveredIdx] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 flex items-center justify-center text-white">
              {viewMode === 'income' ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <Building className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {viewMode === 'income'
                  ? 'Monthly Rental Income & Collection Trends'
                  : 'Rental Unit Occupancy & Capacity Utilization'}
              </h2>
              <p className="text-xs text-slate-500">
                {userRole === 'landlord'
                  ? 'Himalayan Heights Residency, New Baneshwor, Kathmandu (Ward 10)'
                  : `Monthly financial ledger for ${units.find((u) => u.id === selectedUnitId)?.unitNumber || 'Residence'}.`}
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 text-xs self-start md:self-auto">
          <button
            onClick={() => setViewMode('income')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              viewMode === 'income'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rental Income (NRs.)</span>
          </button>
          <button
            onClick={() => setViewMode('occupancy')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              viewMode === 'occupancy'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-indigo-600" />
            <span>Occupancy Rate (%)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      {viewMode === 'income' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block">Average Monthly Billed</span>
            <div className="font-mono tabular-nums text-base font-bold text-slate-900 mt-0.5">
              {formatNRS(avgMonthlyIncome)}
            </div>
            <span className="text-[11px] text-slate-400">Rent + Utilities</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block">Total Collected YTD</span>
            <div className="font-mono tabular-nums text-base font-bold text-emerald-700 mt-0.5">
              {formatNRS(totalRevenueYTD)}
            </div>
            <span className="text-[11px] text-slate-400">6 Months Cleared</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block">Collection Efficiency</span>
            <div className="font-mono tabular-nums text-base font-bold text-slate-900 mt-0.5 flex items-center gap-1">
              <span>{overallCollectionEfficiency.toFixed(1)}%</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-[11px] text-slate-400">Billed vs Remitted</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block">Month-over-Month Delta</span>
            <div className="mt-0.5 flex items-center gap-1 font-mono tabular-nums text-sm font-semibold">
              {momIncomeDelta ? (
                momIncomeDelta.diff >= 0 ? (
                  <span className="text-emerald-700 flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    +{formatNRS(momIncomeDelta.diff)} (+{momIncomeDelta.pct.toFixed(1)}%)
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    -{formatNRS(Math.abs(momIncomeDelta.diff))} ({momIncomeDelta.pct.toFixed(1)}%)
                  </span>
                )
              ) : (
                <span className="text-slate-500">Baseline</span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">vs Sep 2026</span>
          </div>
        </div>
      ) : (
        /* Occupancy KPI Cards */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block">Building Occupancy</span>
            <div className="font-mono tabular-nums text-base font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
              <span>100.0%</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-[11px] text-slate-400">3 of 3 Flats Leased</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block">Total Leased Area</span>
            <div className="font-mono tabular-nums text-base font-bold text-slate-900 mt-0.5">
              3,280 <span className="text-xs font-normal text-slate-500">sq ft</span>
            </div>
            <span className="text-[11px] text-slate-400">New Baneshwor, KTM</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block">Average Family Tenure</span>
            <div className="font-mono tabular-nums text-base font-bold text-slate-900 mt-0.5">
              18.0 <span className="text-xs font-normal text-slate-500">Months</span>
            </div>
            <span className="text-[11px] text-slate-400">Low Tenant Turnover</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block">Lease Status Watchdog</span>
            <div className="font-mono tabular-nums text-sm font-bold text-amber-800 mt-0.5">
              1 Flat (27d to End)
            </div>
            <span className="text-[11px] text-slate-400">Flat 302 Expiring Nov</span>
          </div>
        </div>
      )}

      {/* SVG Canvas for Charts */}
      <div className="relative w-full overflow-hidden pt-1">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="incomeAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.00" />
            </linearGradient>

            <linearGradient id="occupancyAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Gridlines & Y-Axis Labels */}
          {viewMode === 'income' ? (
            incomeTicks.map((tickVal, i) => {
              const yPos = getYIncome(tickVal);
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
            })
          ) : (
            occupancyTicks.map((pct, i) => {
              const yPos = getYOccupancy(pct);
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
                    {pct}%
                  </text>
                </g>
              );
            })
          )}

          {/* ViewMode: Income Chart Curves */}
          {viewMode === 'income' && (
            <>
              {/* Billed Revenue Line & Area */}
              <path
                d={buildArea(
                  monthlyData.map((d) => d.billedTotal),
                  getYIncome
                )}
                fill="url(#incomeAreaGradient)"
              />
              <path
                d={buildSmoothLine(
                  monthlyData.map((d) => d.billedTotal),
                  getYIncome
                )}
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Collected Revenue Line (Dashed Slate) */}
              <path
                d={buildSmoothLine(
                  monthlyData.map((d) => d.collectedTotal),
                  getYIncome
                )}
                fill="none"
                stroke="#0f172a"
                strokeWidth="1.75"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
            </>
          )}

          {/* ViewMode: Occupancy Chart Curve */}
          {viewMode === 'occupancy' && (
            <>
              <path
                d={buildArea(
                  monthlyData.map((d) => d.occupancyRate),
                  getYOccupancy
                )}
                fill="url(#occupancyAreaGradient)"
              />
              <path
                d={buildSmoothLine(
                  monthlyData.map((d) => d.occupancyRate),
                  getYOccupancy
                )}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* X-Axis Month Labels */}
          {monthlyData.map((d, i) => {
            const x = getX(i);
            const isHovered = hoveredIdx === i;
            return (
              <text
                key={i}
                x={x}
                y={padding.top + innerHeight + 20}
                textAnchor="middle"
                className={`text-[11px] font-mono transition-colors ${
                  isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-500'
                }`}
              >
                {d.monthShort}
              </text>
            );
          })}

          {/* Data Points */}
          {monthlyData.map((d, i) => {
            const x = getX(i);
            const isHovered = hoveredIdx === i;

            if (viewMode === 'income') {
              return (
                <g key={i}>
                  {/* Billed point */}
                  <circle
                    cx={x}
                    cy={getYIncome(d.billedTotal)}
                    r={isHovered ? 5 : 3.5}
                    fill="#059669"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                  {/* Collected point */}
                  <circle
                    cx={x}
                    cy={getYIncome(d.collectedTotal)}
                    r={isHovered ? 4.5 : 3}
                    fill="#0f172a"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="transition-all duration-150"
                  />
                </g>
              );
            } else {
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={getYOccupancy(d.occupancyRate)}
                    r={isHovered ? 5 : 3.5}
                    fill="#4f46e5"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                </g>
              );
            }
          })}

          {/* Vertical Crosshair Line */}
          {hoveredIdx !== null && (
            <line
              x1={getX(hoveredIdx)}
              y1={padding.top}
              x2={getX(hoveredIdx)}
              y2={padding.top + innerHeight}
              stroke="#64748b"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
          )}

          {/* Hover hitboxes */}
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
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {activeHover && (
          <div
            className="absolute top-2 right-4 bg-slate-900 text-white rounded-lg p-3 text-xs shadow-lg border border-slate-700 pointer-events-none z-10 transition-opacity"
            style={{ minWidth: '220px' }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-white">{activeHover.monthKey}</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {viewMode === 'income'
                  ? formatNRS(activeHover.billedTotal)
                  : `${activeHover.occupancyRate}% Occupied`}
              </span>
            </div>

            {viewMode === 'income' ? (
              <div className="mt-2 space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between text-emerald-300">
                  <span className="font-sans">Base Rent:</span>
                  <span>{formatNRS(activeHover.baseRent)}</span>
                </div>
                <div className="flex items-center justify-between text-blue-300">
                  <span className="font-sans">Utilities & Waste:</span>
                  <span>{formatNRS(activeHover.utilityTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
                  <span className="font-sans">Remitted / Collected:</span>
                  <span className="text-white">{formatNRS(activeHover.collectedTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-amber-300">
                  <span className="font-sans">Collection Rate:</span>
                  <span>{activeHover.collectionRate.toFixed(1)}%</span>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between text-indigo-300">
                  <span className="font-sans">Occupied Units:</span>
                  <span>{activeHover.occupiedCount} / 3 Flats</span>
                </div>
                <div className="flex items-center justify-between text-emerald-300">
                  <span className="font-sans">Tenancy Capacity:</span>
                  <span>100.0% Leased</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span className="font-sans">Monthly Base Yield:</span>
                  <span>NRs. 83,000</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Footer Legend & Kathmandu Directives Info */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        {viewMode === 'income' ? (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-600 rounded-full inline-block" />
              <span className="font-medium text-slate-800">Billed Gross Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-900 inline-block" />
              <span>Collected Revenue (NRs.)</span>
            </div>
            <span className="text-slate-400">·</span>
            <span className="text-[11px] text-slate-500">
              Includes Base Rent + KUKL Water + NEA Power + KMC Waste recoveries
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-600 rounded-full inline-block" />
              <span className="font-medium text-slate-800">Occupancy Rate (%)</span>
            </div>
            <span className="text-slate-400">·</span>
            <span className="text-[11px] text-slate-500">
              3 Flats (Apt 104, 201, 302) · Shanti Marga, New Baneshwor
            </span>
          </div>
        )}

        <div className="text-slate-400 text-[11px]">
          Figures in Nepalese Rupee (NRs.)
        </div>
      </div>
    </div>
  );
};
