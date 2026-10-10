import React, { useMemo } from 'react';
import {
  Zap,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Info,
  Wrench,
  ShieldAlert,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { PropertyUnit, WaterMeterReading, ElectricMeterReading, UserRole } from '../types';
import { analyzeEnergyEfficiency, UtilityAnomaly } from '../utils/energyEfficiency';
import { formatNRS } from '../utils/currency';

interface EnergyEfficiencyInsightsProps {
  units: PropertyUnit[];
  waterReadings: WaterMeterReading[];
  electricReadings: ElectricMeterReading[];
  userRole: UserRole;
  selectedUnitId: string;
  onNavigateTab: (tab: string) => void;
  onOpenNewTicketModal: () => void;
}

export const EnergyEfficiencyInsights: React.FC<EnergyEfficiencyInsightsProps> = ({
  units,
  waterReadings,
  electricReadings,
  userRole,
  selectedUnitId,
  onNavigateTab,
  onOpenNewTicketModal,
}) => {
  const analysis = useMemo(() => {
    return analyzeEnergyEfficiency(units, waterReadings, electricReadings, 'October 2026');
  }, [units, waterReadings, electricReadings]);

  const { buildingStats, unitProfiles, anomalies } = analysis;

  const selectedUnitProfile = useMemo(() => {
    return unitProfiles.find((p) => p.unit.id === selectedUnitId) || unitProfiles[0];
  }, [unitProfiles, selectedUnitId]);

  // For tenant, show their specific unit anomalies and comparisons
  const displayedAnomalies = userRole === 'landlord'
    ? anomalies
    : anomalies.filter((a) => a.unitId === selectedUnitId);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Energy & Water Efficiency Insights
              </h2>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                Live Anomaly Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {userRole === 'landlord'
                ? 'Automated pattern auditor comparing individual unit sub-meters against building-wide averages in Kathmandu.'
                : `Resource efficiency diagnostics for ${selectedUnitProfile?.unit.unitNumber || 'Residence'} vs building average.`}
            </p>
          </div>
        </div>

        {/* Efficiency Score Badge */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 self-start sm:self-auto">
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Building Eco Rating
            </div>
            <div className="text-base font-bold font-mono tabular-nums text-slate-900">
              {buildingStats.efficiencyScore}/100
            </div>
          </div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono border ${
            buildingStats.efficiencyScore >= 80
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : buildingStats.efficiencyScore >= 60
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-rose-100 text-rose-900 border-rose-300'
          }`}>
            {buildingStats.efficiencyScore >= 80 ? 'A' : buildingStats.efficiencyScore >= 60 ? 'B-' : 'C'}
          </div>
        </div>
      </div>

      {/* Flagged Anomaly Alerts Strip */}
      {displayedAnomalies.length > 0 ? (
        <div className="space-y-3">
          {displayedAnomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                anomaly.severity === 'critical_leak'
                  ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                  anomaly.severity === 'critical_leak'
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-amber-100 text-amber-700 border-amber-300'
                }`}>
                  {anomaly.utilityType === 'water' ? (
                    <Droplets className="w-5 h-5" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {anomaly.title}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.2 rounded bg-white border border-slate-200 text-slate-800">
                      {anomaly.unitNumber} ({anomaly.tenantFamilyName})
                    </span>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.2 rounded ${
                      anomaly.severity === 'critical_leak'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}>
                      {anomaly.severity === 'critical_leak' ? 'Urgent Alert' : 'Efficiency Notice'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                    {anomaly.diagnosticSummary}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">
                      Recommended Action:
                    </span>
                    <span>{anomaly.suggestedAction}</span>
                    <span aria-hidden="true" className="text-slate-400">·</span>
                    <span className="font-medium text-rose-700">
                      Est. Monthly Surcharge: {formatNRS(anomaly.estimatedExcessCostNRS)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <button
                  onClick={onOpenNewTicketModal}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
                    anomaly.severity === 'critical_leak'
                      ? 'bg-rose-700 hover:bg-rose-800 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>
                    {userRole === 'landlord' ? 'Dispatch Plumber/Tech' : 'Request Free Inspection'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {userRole === 'landlord'
                ? 'All building water & electricity sub-meters are operating within normal baseline parameters.'
                : 'Your residence is operating efficiently with no water leaks or abnormal electrical loads.'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 font-semibold">
            Optimal Efficiency
          </span>
        </div>
      )}

      {/* Comparative Benchmark Grid (Unit vs Building Mean) */}
      <div className="pt-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
          <span>
            {userRole === 'landlord'
              ? 'Unit-by-Unit Consumption Variance vs Building Mean'
              : `Your Flat (${selectedUnitProfile.unit.unitNumber}) vs Building Mean (Himalayan Heights)`}
          </span>
          <span className="font-mono lowercase text-slate-400">
            building mean: {buildingStats.avgWaterM3PerUnit} m³ water · {buildingStats.avgElectricKwhPerUnit} kWh power
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(userRole === 'landlord' ? unitProfiles : [selectedUnitProfile]).map((profile) => {
            const w = profile.waterReading?.consumption || 0;
            const e = profile.electricReading?.consumption || 0;
            const wAvg = buildingStats.avgWaterM3PerUnit || 1;
            const eAvg = buildingStats.avgElectricKwhPerUnit || 1;

            const wRatio = Math.min(200, Math.round((w / wAvg) * 100));
            const eRatio = Math.min(200, Math.round((e / eAvg) * 100));

            return (
              <div
                key={profile.unit.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">
                      {profile.unit.unitNumber}
                    </span>
                    <span className="text-slate-500 ml-1.5">
                      ({profile.unit.tenantFamilyName.split(' ')[1] || profile.unit.tenantFamilyName})
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {profile.unit.primaryContact.familyMembersCount} residents
                  </span>
                </div>

                {/* Water Meter Comparison */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-blue-700 font-medium">
                      <Droplets className="w-3.5 h-3.5" />
                      <span>Water Consumption</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {w} m³{' '}
                      <span className={`text-[10px] font-semibold ${
                        profile.waterVariancePct > 20
                          ? 'text-rose-600'
                          : profile.waterVariancePct < -10
                          ? 'text-emerald-600'
                          : 'text-slate-500'
                      }`}>
                        ({profile.waterVariancePct >= 0 ? `+${profile.waterVariancePct}%` : `${profile.waterVariancePct}%`})
                      </span>
                    </span>
                  </div>

                  {/* Progress gauge vs 100% avg */}
                  <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        profile.waterVariancePct >= 50
                          ? 'bg-rose-500'
                          : profile.waterVariancePct >= 20
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, (wRatio / 180) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>0 m³</span>
                    <span>Building Avg: {buildingStats.avgWaterM3PerUnit} m³</span>
                  </div>
                </div>

                {/* Electricity Meter Comparison */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-amber-700 font-medium">
                      <Zap className="w-3.5 h-3.5" />
                      <span>NEA Electricity</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {e} kWh{' '}
                      <span className={`text-[10px] font-semibold ${
                        profile.electricVariancePct > 20
                          ? 'text-rose-600'
                          : profile.electricVariancePct < -10
                          ? 'text-emerald-600'
                          : 'text-slate-500'
                      }`}>
                        ({profile.electricVariancePct >= 0 ? `+${profile.electricVariancePct}%` : `${profile.electricVariancePct}%`})
                      </span>
                    </span>
                  </div>

                  <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        profile.electricVariancePct >= 30
                          ? 'bg-rose-500'
                          : profile.electricVariancePct >= 15
                          ? 'bg-amber-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, (eRatio / 180) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>0 kWh</span>
                    <span>Building Avg: {buildingStats.avgElectricKwhPerUnit} kWh</span>
                  </div>
                </div>

                {/* Footer Insight */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Combined Utility Total:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatNRS(profile.totalUtilityCostNRS)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
