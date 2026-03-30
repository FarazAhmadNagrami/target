/**
 * EMI and loan calculation utilities
 */

export interface EMIResult {
  loanAmount: number;
  monthlyEMI: number;
  totalInterest: number;
  totalPayment: number;
  downPaymentPercent: number;
}

export interface AmortizationRow {
  month: number;
  year: number;
  openingBalance: number;
  principal: number;
  interest: number;
  closingBalance: number;
  prepayment: number;
}

export interface YearlyAmortization {
  year: number;
  openingBalance: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

/**
 * Calculate EMI using standard formula:
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 */
export function calculateEMI(principal: number, annualRate: number, tenureYears: number): EMIResult {
  const r = annualRate / 100 / 12;
  const n = tenureYears * 12;

  let monthlyEMI: number;
  if (r === 0) {
    monthlyEMI = principal / n;
  } else {
    monthlyEMI = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  const totalPayment = monthlyEMI * n;
  const totalInterest = totalPayment - principal;

  return {
    loanAmount: principal,
    monthlyEMI,
    totalInterest,
    totalPayment,
    downPaymentPercent: 0, // set by caller
  };
}

/**
 * Generate monthly amortization schedule
 */
export function generateAmortization(
  principal: number,
  annualRate: number,
  tenureYears: number,
  lumpSumPrepayment = 0,
  prepaymentAfterMonths = 0,
  extraMonthlyEMI = 0,
  prepaymentOption: 'reduce-tenure' | 'reduce-emi' = 'reduce-tenure'
): AmortizationRow[] {
  const r = annualRate / 100 / 12;
  const n = tenureYears * 12;
  let emi = calculateEMI(principal, annualRate, tenureYears).monthlyEMI;
  let balance = principal;
  const rows: AmortizationRow[] = [];

  for (let month = 1; month <= n && balance > 0.01; month++) {
    const openingBalance = balance;
    const interestForMonth = balance * r;
    let principalForMonth = emi - interestForMonth;
    if (principalForMonth > balance) principalForMonth = balance;

    let prepayment = 0;
    if (month === prepaymentAfterMonths && lumpSumPrepayment > 0) {
      prepayment = Math.min(lumpSumPrepayment, balance - principalForMonth);
    }

    const extraPrincipal = Math.min(extraMonthlyEMI, Math.max(0, balance - principalForMonth - prepayment));
    balance = Math.max(0, openingBalance - principalForMonth - prepayment - extraPrincipal);

    rows.push({
      month,
      year: Math.ceil(month / 12),
      openingBalance,
      principal: principalForMonth + extraPrincipal,
      interest: interestForMonth,
      closingBalance: balance,
      prepayment,
    });

    // If reduce-EMI option, recalculate EMI after prepayment
    if (prepayment > 0 && prepaymentOption === 'reduce-emi' && balance > 0) {
      const remainingMonths = n - month;
      if (remainingMonths > 0) {
        emi = calculateEMI(balance, annualRate, remainingMonths / 12).monthlyEMI + extraMonthlyEMI;
      }
    }
  }

  return rows;
}

/**
 * Roll up monthly amortization to yearly
 */
export function rollupToYearly(rows: AmortizationRow[]): YearlyAmortization[] {
  const yearMap = new Map<number, YearlyAmortization>();

  for (const row of rows) {
    if (!yearMap.has(row.year)) {
      yearMap.set(row.year, {
        year: row.year,
        openingBalance: row.openingBalance,
        principalPaid: 0,
        interestPaid: 0,
        closingBalance: row.closingBalance,
      });
    }
    const yr = yearMap.get(row.year)!;
    yr.principalPaid += row.principal + row.prepayment;
    yr.interestPaid += row.interest;
    yr.closingBalance = row.closingBalance;
  }

  return Array.from(yearMap.values());
}

/**
 * Calculate loan eligibility:
 * Max loan = (50% of monthly income × 12) / monthly_rate
 * where monthly_rate = 9% p.a. / 12 = 0.75%
 */
export function calcLoanEligibility(monthlyIncome: number): number {
  const maxEMI = monthlyIncome * 0.5;
  const r = 0.0075; // 9% / 12
  const n = 240; // 20 years assumed
  return (maxEMI * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
}

/**
 * SIP future value calculator
 * FV = P × [((1+r)^n - 1) / r] × (1+r)
 */
export function calcSIPFV(monthlyInvestment: number, annualReturn: number, months: number): number {
  const r = annualReturn / 100 / 12;
  if (r === 0) return monthlyInvestment * months;
  return monthlyInvestment * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
}

/**
 * How many months to reach a target amount with SIP
 */
export function calcMonthsToGoal(monthlyInvestment: number, annualReturn: number, target: number): number {
  const r = annualReturn / 100 / 12;
  if (r === 0) return target / monthlyInvestment;
  // FV = P × [((1+r)^n - 1) / r] × (1+r) = target
  // Solve numerically
  let months = 1;
  while (months < 1200) {
    const fv = calcSIPFV(monthlyInvestment, annualReturn, months);
    if (fv >= target) return months;
    months++;
  }
  return months;
}
