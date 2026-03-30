import { useStore, useNetMonthlySalary, useTotalFamilyMonthly, useTotalExpenses, useMonthlySurplus, useLoanEligibility, useTotalAssets } from '../store/useStore';
import { MetricCard } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { formatINR } from '../utils/format';
import { calculateEMI } from '../utils/emiCalc';

const TARGET = 3_00_00_000;

export default function Overview() {
  const { emi } = useStore();
  const netMonthlySalary = useNetMonthlySalary();
  const totalFamilyMonthly = useTotalFamilyMonthly();
  const totalExpenses = useTotalExpenses();
  const surplus = useMonthlySurplus();
  const loanEligibility = useLoanEligibility();
  const totalAssets = useTotalAssets();

  const loanAmount = emi.housePrice - emi.downPayment;
  const emiCalc = calculateEMI(loanAmount, emi.interestRate, emi.tenure);
  const emiToIncome = totalFamilyMonthly > 0 ? (emiCalc.monthlyEMI / totalFamilyMonthly) * 100 : 0;
  const assetsProgress = (totalAssets / TARGET) * 100;
  const dpProgress = emi.downPayment > 0 ? Math.min(100, (totalAssets / emi.downPayment) * 100) : 0;
  const loanEligibilityOk = loanEligibility >= loanAmount;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Overview Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Real-time summary of your ₹3 Crore house purchase journey
        </p>
      </div>

      {/* Target Progress */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Assets Accumulated</p>
            <p className="text-3xl font-bold mt-1">{formatINR(totalAssets, true)}</p>
            <p className="text-blue-200 text-sm mt-0.5">of {formatINR(TARGET, true)} target</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Gap to Target</p>
            <p className="text-xl font-semibold text-red-300">{formatINR(Math.max(0, TARGET - totalAssets), true)}</p>
          </div>
        </div>
        <ProgressBar
          value={assetsProgress}
          color="bg-white"
          height="h-3"
          showLabel={false}
        />
        <div className="flex justify-between mt-2 text-xs text-blue-200">
          <span>{assetsProgress.toFixed(1)}% of ₹3 Cr</span>
          <span>Target: {formatINR(TARGET, true)}</span>
        </div>
      </div>

      {/* Down Payment Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Down Payment Readiness</h3>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            dpProgress >= 100
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          }`}>
            {dpProgress >= 100 ? '✓ Ready' : 'In Progress'}
          </span>
        </div>
        <ProgressBar
          value={dpProgress}
          color={dpProgress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}
          height="h-2.5"
        />
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Saved: {formatINR(totalAssets, true)}</span>
          <span>Target DP: {formatINR(emi.downPayment, true)}</span>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Monthly Income"
          value={formatINR(totalFamilyMonthly, true)}
          sub={`Self: ${formatINR(netMonthlySalary, true)}`}
          color="blue"
        />
        <MetricCard
          label="Monthly Expenses"
          value={formatINR(totalExpenses, true)}
          sub={`${totalFamilyMonthly > 0 ? ((totalExpenses / totalFamilyMonthly) * 100).toFixed(0) : 0}% of income`}
          color="red"
        />
        <MetricCard
          label="Monthly EMI"
          value={formatINR(emiCalc.monthlyEMI, true)}
          sub={`${emiToIncome.toFixed(1)}% of income`}
          color={emiToIncome > 50 ? 'red' : 'yellow'}
        />
        <MetricCard
          label="Monthly Surplus"
          value={formatINR(surplus, true)}
          sub="After expenses"
          color={surplus >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Loan Eligibility */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Loan Eligibility Check</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Required Loan</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{formatINR(loanAmount, true)}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Max Eligible Loan</p>
            <p className={`text-lg font-bold ${loanEligibilityOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {formatINR(loanEligibility, true)}
            </p>
          </div>
          <div className={`text-center p-4 rounded-xl ${loanEligibilityOk ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
            <p className={`text-lg font-bold ${loanEligibilityOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {loanEligibilityOk ? '✓ Eligible' : '✗ Not Eligible'}
            </p>
          </div>
        </div>
        {!loanEligibilityOk && (
          <p className="text-sm text-red-500 dark:text-red-400 mt-3 text-center">
            Gap: {formatINR(loanAmount - loanEligibility, true)} — reduce loan amount or increase income
          </p>
        )}
        {emiToIncome > 50 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 text-center">
            ⚠️ EMI is {emiToIncome.toFixed(1)}% of family income (recommended: &lt;50%)
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Annual Savings"
          value={formatINR(surplus * 12, true)}
          color="green"
        />
        <MetricCard
          label="Loan Amount"
          value={formatINR(loanAmount, true)}
          color="blue"
        />
        <MetricCard
          label="Total Interest"
          value={formatINR(emiCalc.totalInterest, true)}
          color="red"
        />
        <MetricCard
          label="Total Payment"
          value={formatINR(emiCalc.totalPayment, true)}
          color="default"
        />
      </div>
    </div>
  );
}
