/**
 * Indian Income Tax Calculator
 * Supports FY 2025-26 and FY 2026-27, Old & New regime
 */

export type FiscalYear = 'FY2025-26' | 'FY2026-27';
export type TaxRegime = 'old' | 'new';
export type AgeGroup = '0-60' | '60-80' | '80+';

export interface OldRegimeDeductions {
  deduction80C: number;       // max 1.5L
  deduction80D: number;
  hraExemption: number;
  section24: number;          // max 2L
  deduction80CCD: number;     // max 50K
  otherDeductions: number;
}

export interface TaxResult {
  grossIncome: number;
  standardDeduction: number;
  totalDeductions: number;
  taxableIncome: number;
  taxBeforeCess: number;
  cess: number;
  totalTax: number;
  netAnnual: number;
  netMonthly: number;
  effectiveTaxRate: number;
}

// New regime slabs FY 2025-26
const NEW_REGIME_SLABS_2526 = [
  { from: 0, to: 3_00_000, rate: 0 },
  { from: 3_00_000, to: 7_00_000, rate: 5 },
  { from: 7_00_000, to: 10_00_000, rate: 10 },
  { from: 10_00_000, to: 12_00_000, rate: 15 },
  { from: 12_00_000, to: 15_00_000, rate: 20 },
  { from: 15_00_000, to: Infinity, rate: 30 },
];

// New regime slabs FY 2026-27 (same slabs, but ₹12L rebate applies)
const NEW_REGIME_SLABS_2627 = [
  { from: 0, to: 4_00_000, rate: 0 },
  { from: 4_00_000, to: 8_00_000, rate: 5 },
  { from: 8_00_000, to: 12_00_000, rate: 10 },
  { from: 12_00_000, to: 16_00_000, rate: 15 },
  { from: 16_00_000, to: 20_00_000, rate: 20 },
  { from: 20_00_000, to: 24_00_000, rate: 25 },
  { from: 24_00_000, to: Infinity, rate: 30 },
];

// Old regime slabs (same across years, vary by age)
function getOldRegimeSlabs(ageGroup: AgeGroup) {
  if (ageGroup === '80+') {
    return [
      { from: 0, to: 5_00_000, rate: 0 },
      { from: 5_00_000, to: 10_00_000, rate: 20 },
      { from: 10_00_000, to: Infinity, rate: 30 },
    ];
  }
  if (ageGroup === '60-80') {
    return [
      { from: 0, to: 3_00_000, rate: 0 },
      { from: 3_00_000, to: 5_00_000, rate: 5 },
      { from: 5_00_000, to: 10_00_000, rate: 20 },
      { from: 10_00_000, to: Infinity, rate: 30 },
    ];
  }
  // 0-60
  return [
    { from: 0, to: 2_50_000, rate: 0 },
    { from: 2_50_000, to: 5_00_000, rate: 5 },
    { from: 5_00_000, to: 10_00_000, rate: 20 },
    { from: 10_00_000, to: Infinity, rate: 30 },
  ];
}

function computeTaxFromSlabs(income: number, slabs: { from: number; to: number; rate: number }[]): number {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.from) break;
    const taxable = Math.min(income, slab.to) - slab.from;
    tax += (taxable * slab.rate) / 100;
  }
  return tax;
}

export function calculateTax(
  annualCTC: number,
  fy: FiscalYear,
  ageGroup: AgeGroup,
  regime: TaxRegime,
  deductions: OldRegimeDeductions
): TaxResult {
  const grossIncome = annualCTC;

  let taxableIncome: number;
  let standardDeduction: number;
  let totalDeductions: number;
  let taxBeforeCess: number;

  if (regime === 'new') {
    standardDeduction = fy === 'FY2026-27' ? 75_000 : 50_000;
    totalDeductions = standardDeduction;
    taxableIncome = Math.max(0, grossIncome - standardDeduction);

    const slabs = fy === 'FY2026-27' ? NEW_REGIME_SLABS_2627 : NEW_REGIME_SLABS_2526;
    taxBeforeCess = computeTaxFromSlabs(taxableIncome, slabs);

    // Rebate u/s 87A: zero tax if taxable income <= 12L (FY 2026-27) or 7L (FY 2025-26)
    const rebateLimit = fy === 'FY2026-27' ? 12_00_000 : 7_00_000;
    if (taxableIncome <= rebateLimit) {
      taxBeforeCess = 0;
    }

    // Marginal relief: if income just crosses rebate limit
    if (fy === 'FY2026-27' && taxableIncome > 12_00_000 && taxableIncome <= 12_75_000) {
      const excessIncome = taxableIncome - 12_00_000;
      const normalTax = computeTaxFromSlabs(taxableIncome, slabs);
      taxBeforeCess = Math.min(normalTax, excessIncome);
    }
    if (fy === 'FY2025-26' && taxableIncome > 7_00_000 && taxableIncome <= 7_27_778) {
      const excessIncome = taxableIncome - 7_00_000;
      const normalTax = computeTaxFromSlabs(taxableIncome, slabs);
      taxBeforeCess = Math.min(normalTax, excessIncome);
    }
  } else {
    // Old regime
    standardDeduction = 50_000;
    const cap80C = Math.min(deductions.deduction80C, 1_50_000);
    const cap80CCD = Math.min(deductions.deduction80CCD, 50_000);
    const capSec24 = Math.min(deductions.section24, 2_00_000);
    const oldDeductionsTotal = cap80C + deductions.deduction80D + deductions.hraExemption
      + capSec24 + cap80CCD + deductions.otherDeductions + standardDeduction;
    totalDeductions = oldDeductionsTotal;
    taxableIncome = Math.max(0, grossIncome - oldDeductionsTotal);

    const slabs = getOldRegimeSlabs(ageGroup);
    taxBeforeCess = computeTaxFromSlabs(taxableIncome, slabs);

    // Rebate u/s 87A: zero tax if taxable income <= 5L (old regime)
    if (taxableIncome <= 5_00_000) {
      taxBeforeCess = 0;
    }
  }

  const cess = taxBeforeCess * 0.04;
  const totalTax = taxBeforeCess + cess;
  const netAnnual = grossIncome - totalTax;
  const netMonthly = netAnnual / 12;
  const effectiveTaxRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

  return {
    grossIncome,
    standardDeduction,
    totalDeductions,
    taxableIncome,
    taxBeforeCess,
    cess,
    totalTax,
    netAnnual,
    netMonthly,
    effectiveTaxRate,
  };
}
