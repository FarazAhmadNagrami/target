import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateTax, type FiscalYear, type TaxRegime, type AgeGroup, type OldRegimeDeductions } from '../utils/taxCalc';
import { calcLoanEligibility } from '../utils/emiCalc';

// ─── Salary Module ────────────────────────────────────────────────────────────
export interface SalaryState {
  annualCTC: number;
  fy: FiscalYear;
  ageGroup: AgeGroup;
  regime: TaxRegime;
  deductions: OldRegimeDeductions;
  monthlyEPF: number;          // Employee EPF deduction (non-tax)
  monthlyProfessionalTax: number; // Professional Tax deduction (non-tax)
}

// ─── Family Income Module ─────────────────────────────────────────────────────
export interface FamilyIncomeState {
  motherMonthly: number;
  fatherMonthly: number;
}

// ─── Expenses Module ──────────────────────────────────────────────────────────
export interface ExpensesState {
  rent: number;
  mummyAllowance: number;
  papaAllowance: number;
  parentsMedicine: number;
  gharKharch: number;
  electricity: number;
  wifi: number;
  milk: number;
  existingEMIs: number;
  transport: number;
  insurance: number;
  sips: number;
  extras: number;
}

// ─── EMI Module ───────────────────────────────────────────────────────────────
export interface EMIState {
  housePrice: number;
  downPayment: number;
  interestRate: number;
  tenure: number;
}

// ─── Prepayment Module ────────────────────────────────────────────────────────
export interface PrepaymentState {
  lumpSum: number;
  afterMonths: number;
  extraMonthlyEMI: number;
  option: 'reduce-tenure' | 'reduce-emi';
}

// ─── Other Income & Assets ────────────────────────────────────────────────────
export interface OtherIncomeState {
  monthlyFreelance: number;
  monthlyTrading: number;
  otherIncomeTaxRate: number;
  savingsAccumulated: number;
  mutualFundsStocks: number;
  fdRdBalance: number;
  goldOtherAssets: number;
  pfPpfBalance: number;
}

// ─── Dark Mode ────────────────────────────────────────────────────────────────
interface DarkModeState {
  darkMode: boolean;
}

// ─── Full Store ───────────────────────────────────────────────────────────────
interface AppState extends DarkModeState {
  salary: SalaryState;
  family: FamilyIncomeState;
  expenses: ExpensesState;
  emi: EMIState;
  prepayment: PrepaymentState;
  otherIncome: OtherIncomeState;

  // Setters
  setSalary: (s: Partial<SalaryState>) => void;
  setSalaryDeductions: (d: Partial<OldRegimeDeductions>) => void;
  setFamily: (f: Partial<FamilyIncomeState>) => void;
  setExpenses: (e: Partial<ExpensesState>) => void;
  setEmi: (e: Partial<EMIState>) => void;
  setPrepayment: (p: Partial<PrepaymentState>) => void;
  setOtherIncome: (o: Partial<OtherIncomeState>) => void;
  toggleDarkMode: () => void;

  // Derived values (computed getters via selectors)
}

const DEFAULT_SALARY: SalaryState = {
  annualCTC: 25_78_404,        // Actual gross earnings from payslip (₹2,14,867 × 12)
  fy: 'FY2025-26',             // Payslip is April 2025
  ageGroup: '0-60',
  regime: 'old',               // HRA + EPF deductions → old regime is beneficial
  deductions: {
    deduction80C: 1_50_000,    // Max out: EPF ₹21.6K + ELSS/PPF/LIC top-up
    deduction80D: 25_000,      // Medical insurance premium
    hraExemption: 6_50_004,    // Full HRA (₹54,167 × 12) — matches your actual TDS
    section24: 0,
    deduction80CCD: 0,
    otherDeductions: 0,
  },
  monthlyEPF: 1_800,           // From payslip: EPF contribution
  monthlyProfessionalTax: 200, // From payslip: Professional Tax
};

const DEFAULT_FAMILY: FamilyIncomeState = {
  motherMonthly: 0,
  fatherMonthly: 0,
};

const DEFAULT_EXPENSES: ExpensesState = {
  rent: 0,
  mummyAllowance: 2_500,
  papaAllowance: 8_000,
  parentsMedicine: 8_000,
  gharKharch: 12_000,
  electricity: 5_000,
  wifi: 1_200,
  milk: 3_150,
  existingEMIs: 0,
  transport: 0,
  insurance: 0,
  sips: 10_000,
  extras: 15_000,
};

const DEFAULT_EMI: EMIState = {
  housePrice: 3_00_00_000,
  downPayment: 60_00_000,
  interestRate: 7.2,
  tenure: 20,
};

const DEFAULT_PREPAYMENT: PrepaymentState = {
  lumpSum: 0,
  afterMonths: 12,
  extraMonthlyEMI: 0,
  option: 'reduce-tenure',
};

const DEFAULT_OTHER: OtherIncomeState = {
  monthlyFreelance: 0,
  monthlyTrading: 0,
  otherIncomeTaxRate: 30,
  savingsAccumulated: 0,
  mutualFundsStocks: 0,
  fdRdBalance: 0,
  goldOtherAssets: 0,
  pfPpfBalance: 0,
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      darkMode: false,
      salary: DEFAULT_SALARY,
      family: DEFAULT_FAMILY,
      expenses: DEFAULT_EXPENSES,
      emi: DEFAULT_EMI,
      prepayment: DEFAULT_PREPAYMENT,
      otherIncome: DEFAULT_OTHER,

      setSalary: (s) => set((state) => ({ salary: { ...state.salary, ...s } })),
      setSalaryDeductions: (d) =>
        set((state) => ({
          salary: {
            ...state.salary,
            deductions: { ...state.salary.deductions, ...d },
          },
        })),
      setFamily: (f) => set((state) => ({ family: { ...state.family, ...f } })),
      setExpenses: (e) => set((state) => ({ expenses: { ...state.expenses, ...e } })),
      setEmi: (e) => set((state) => ({ emi: { ...state.emi, ...e } })),
      setPrepayment: (p) => set((state) => ({ prepayment: { ...state.prepayment, ...p } })),
      setOtherIncome: (o) => set((state) => ({ otherIncome: { ...state.otherIncome, ...o } })),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    { name: 'target-house-tracker' }
  )
);

// ─── Derived selectors ────────────────────────────────────────────────────────

export function useNetMonthlySalary(): number {
  const { salary } = useStore();
  const result = calculateTax(
    salary.annualCTC,
    salary.fy,
    salary.ageGroup,
    salary.regime,
    salary.deductions
  );
  // Subtract non-tax payroll deductions (EPF + Professional Tax)
  return result.netMonthly - salary.monthlyEPF - salary.monthlyProfessionalTax;
}

export function useTotalFamilyMonthly(): number {
  const { family, otherIncome } = useStore();
  const netSelf = useNetMonthlySalary();
  const grossOther = otherIncome.monthlyFreelance + otherIncome.monthlyTrading;
  const netOther = grossOther - grossOther * (otherIncome.otherIncomeTaxRate / 100);
  return netSelf + family.motherMonthly + family.fatherMonthly + netOther;
}

export function useTotalExpenses(): number {
  const { expenses } = useStore();
  return Object.values(expenses).reduce((sum, v) => sum + v, 0);
}

export function useMonthlySurplus(): number {
  const total = useTotalFamilyMonthly();
  const expenses = useTotalExpenses();
  return total - expenses;
}

export function useLoanEligibility(): number {
  const totalMonthly = useTotalFamilyMonthly();
  return calcLoanEligibility(totalMonthly);
}

export function useTotalAssets(): number {
  const { otherIncome } = useStore();
  return (
    otherIncome.savingsAccumulated +
    otherIncome.mutualFundsStocks +
    otherIncome.fdRdBalance +
    otherIncome.goldOtherAssets +
    otherIncome.pfPpfBalance
  );
}

export function useNetOtherMonthly(): number {
  const { otherIncome } = useStore();
  const gross = otherIncome.monthlyFreelance + otherIncome.monthlyTrading;
  const tax = gross * (otherIncome.otherIncomeTaxRate / 100);
  return gross - tax;
}
