import { PropertyUnit, WaterMeterReading, ElectricMeterReading } from '../types';
import { formatNRS } from './currency';

export type AnomalySeverity = 'critical_leak' | 'high_usage' | 'moderate_high' | 'efficient' | 'normal';

export interface UtilityAnomaly {
  id: string;
  unitId: string;
  unitNumber: string;
  tenantFamilyName: string;
  utilityType: 'water' | 'electricity';
  currentValue: number;
  buildingAverage: number;
  variancePercentage: number; // e.g. +63% or -28%
  severity: AnomalySeverity;
  estimatedExcessCostNRS: number;
  title: string;
  diagnosticSummary: string;
  suggestedAction: string;
  actionCategory: 'leak_check' | 'appliance_audit' | 'insulation' | 'praise';
}

export interface BuildingUtilityStats {
  billingMonth: string;
  totalWaterM3: number;
  avgWaterM3PerUnit: number;
  totalElectricKwh: number;
  avgElectricKwhPerUnit: number;
  waterRatePerM3: number;
  electricRatePerKwh: number;
  efficiencyScore: number; // 0 to 100
  flaggedAnomaliesCount: number;
  totalPotentialSavingsNRS: number;
}

export interface UnitEfficiencyProfile {
  unit: PropertyUnit;
  waterReading?: WaterMeterReading;
  electricReading?: ElectricMeterReading;
  waterVariancePct: number;
  electricVariancePct: number;
  waterStatus: AnomalySeverity;
  electricStatus: AnomalySeverity;
  totalUtilityCostNRS: number;
  anomalies: UtilityAnomaly[];
}

/**
 * Analyzes water and electricity consumption patterns across rental units
 * against building benchmarks to detect abnormal usage and generate Energy Efficiency insights.
 */
export function analyzeEnergyEfficiency(
  units: PropertyUnit[],
  waterReadings: WaterMeterReading[],
  electricReadings: ElectricMeterReading[],
  targetMonth = 'October 2026'
): {
  buildingStats: BuildingUtilityStats;
  unitProfiles: UnitEfficiencyProfile[];
  anomalies: UtilityAnomaly[];
} {
  // Filter readings for target month
  const monthWater = waterReadings.filter((w) => w.billingMonth.includes(targetMonth.split(' ')[0]));
  const monthElectric = electricReadings.filter((e) => e.billingMonth.includes(targetMonth.split(' ')[0]));

  const activeUnitsCount = units.length || 1;

  // Calculate building aggregates
  const totalWaterM3 = monthWater.reduce((acc, w) => acc + w.consumption, 0);
  const avgWaterM3PerUnit = totalWaterM3 / (monthWater.length || activeUnitsCount);

  const totalElectricKwh = monthElectric.reduce((acc, e) => acc + e.consumption, 0);
  const avgElectricKwhPerUnit = totalElectricKwh / (monthElectric.length || activeUnitsCount);

  // Standard rates in Kathmandu
  const avgWaterRate = monthWater[0]?.ratePerCubicMeter || 45; // NRs. 45/m³
  const avgElectricRate = monthElectric[0]?.ratePerKwh || 12.5; // NRs. 12.50/kWh

  const anomalies: UtilityAnomaly[] = [];

  const unitProfiles: UnitEfficiencyProfile[] = units.map((unit) => {
    const wReading = monthWater.find((w) => w.unitId === unit.id);
    const eReading = monthElectric.find((e) => e.unitId === unit.id);

    const waterConsumption = wReading ? wReading.consumption : 0;
    const electricConsumption = eReading ? eReading.consumption : 0;

    // Variance calculations: ((value - avg) / avg) * 100
    const waterVariancePct = avgWaterM3PerUnit > 0
      ? Math.round(((waterConsumption - avgWaterM3PerUnit) / avgWaterM3PerUnit) * 100)
      : 0;

    const electricVariancePct = avgElectricKwhPerUnit > 0
      ? Math.round(((electricConsumption - avgElectricKwhPerUnit) / avgElectricKwhPerUnit) * 100)
      : 0;

    const unitAnomalies: UtilityAnomaly[] = [];

    // Water Anomaly Check
    let waterStatus: AnomalySeverity = 'normal';
    if (wReading?.hasLeakWarning || waterVariancePct >= 50) {
      waterStatus = 'critical_leak';
      const excessM3 = Math.max(0, waterConsumption - avgWaterM3PerUnit);
      const excessCost = Math.round(excessM3 * avgWaterRate);
      const anomaly: UtilityAnomaly = {
        id: `anomaly-w-${unit.id}`,
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        tenantFamilyName: unit.tenantFamilyName,
        utilityType: 'water',
        currentValue: waterConsumption,
        buildingAverage: Math.round(avgWaterM3PerUnit * 10) / 10,
        variancePercentage: waterVariancePct,
        severity: 'critical_leak',
        estimatedExcessCostNRS: excessCost,
        title: `Water Surge Alert (+${waterVariancePct}% vs Building Avg)`,
        diagnosticSummary: `Recorded ${waterConsumption} m³ vs building mean ${avgWaterM3PerUnit.toFixed(1)} m³. Consumption spike indicates continuous toilet flapper seepage, concealed pipe leak, or running cistern valve.`,
        suggestedAction: 'Schedule an immediate toilet dye test & bathroom supply-line plumbing audit.',
        actionCategory: 'leak_check',
      };
      anomalies.push(anomaly);
      unitAnomalies.push(anomaly);
    } else if (waterVariancePct >= 25) {
      waterStatus = 'high_usage';
      const excessM3 = Math.max(0, waterConsumption - avgWaterM3PerUnit);
      const excessCost = Math.round(excessM3 * avgWaterRate);
      const anomaly: UtilityAnomaly = {
        id: `anomaly-w-${unit.id}`,
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        tenantFamilyName: unit.tenantFamilyName,
        utilityType: 'water',
        currentValue: waterConsumption,
        buildingAverage: Math.round(avgWaterM3PerUnit * 10) / 10,
        variancePercentage: waterVariancePct,
        severity: 'high_usage',
        estimatedExcessCostNRS: excessCost,
        title: `Elevated Water Consumption (+${waterVariancePct}%)`,
        diagnosticSummary: `Unit consumed ${waterConsumption} m³ compared to ${avgWaterM3PerUnit.toFixed(1)} m³ building average. Consider inspecting kitchen faucets and washing machine inlet valves.`,
        suggestedAction: 'Inspect tap aerators and check for minor under-basin drips.',
        actionCategory: 'leak_check',
      };
      anomalies.push(anomaly);
      unitAnomalies.push(anomaly);
    } else if (waterVariancePct <= -20 && waterConsumption > 0) {
      waterStatus = 'efficient';
    }

    // Electricity Anomaly Check
    let electricStatus: AnomalySeverity = 'normal';
    if (electricVariancePct >= 30) {
      electricStatus = 'high_usage';
      const excessKwh = Math.max(0, electricConsumption - avgElectricKwhPerUnit);
      const excessCost = Math.round(excessKwh * avgElectricRate);
      const anomaly: UtilityAnomaly = {
        id: `anomaly-e-${unit.id}`,
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        tenantFamilyName: unit.tenantFamilyName,
        utilityType: 'electricity',
        currentValue: electricConsumption,
        buildingAverage: Math.round(avgElectricKwhPerUnit),
        variancePercentage: electricVariancePct,
        severity: 'high_usage',
        estimatedExcessCostNRS: excessCost,
        title: `High Electricity Load (+${electricVariancePct}% vs Building Avg)`,
        diagnosticSummary: `Recorded ${electricConsumption} kWh vs building mean ${Math.round(avgElectricKwhPerUnit)} kWh. Likely driven by continuous immersion water geysers, space heaters, or inefficient refrigerator compressors.`,
        suggestedAction: 'Recommend geyser timer installation (cut up to 25% peak NEA billing) and seal drafty windows.',
        actionCategory: 'appliance_audit',
      };
      anomalies.push(anomaly);
      unitAnomalies.push(anomaly);
    } else if (electricVariancePct <= -20 && electricConsumption > 0) {
      electricStatus = 'efficient';
    }

    const totalUtilityCostNRS = (wReading?.totalAmount || 0) + (eReading?.totalAmount || 0);

    return {
      unit,
      waterReading: wReading,
      electricReading: eReading,
      waterVariancePct,
      electricVariancePct,
      waterStatus,
      electricStatus,
      totalUtilityCostNRS,
      anomalies: unitAnomalies,
    };
  });

  // Calculate overall building efficiency score (100 base, deductions for major variances)
  let penalty = 0;
  anomalies.forEach((a) => {
    if (a.severity === 'critical_leak') penalty += 18;
    else if (a.severity === 'high_usage') penalty += 10;
  });
  const efficiencyScore = Math.max(45, Math.min(98, 100 - penalty));

  const totalPotentialSavingsNRS = anomalies.reduce((acc, a) => acc + a.estimatedExcessCostNRS, 0);

  const buildingStats: BuildingUtilityStats = {
    billingMonth: targetMonth,
    totalWaterM3: Math.round(totalWaterM3 * 10) / 10,
    avgWaterM3PerUnit: Math.round(avgWaterM3PerUnit * 10) / 10,
    totalElectricKwh: Math.round(totalElectricKwh),
    avgElectricKwhPerUnit: Math.round(avgElectricKwhPerUnit),
    waterRatePerM3: avgWaterRate,
    electricRatePerKwh: avgElectricRate,
    efficiencyScore,
    flaggedAnomaliesCount: anomalies.length,
    totalPotentialSavingsNRS,
  };

  return {
    buildingStats,
    unitProfiles,
    anomalies,
  };
}
