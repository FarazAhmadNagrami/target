import { useStore } from '../store/useStore';
import { calculateEMI, generateAmortization } from '../utils/emiCalc';
import { formatINR } from '../utils/format';
import { Card, MetricCard } from '../components/ui/Card';
import { Input, RadioGroup } from '../components/ui/Input';

export default function Prepayment() {
  const { emi, prepayment, setPrepayment } = useStore();

  const loanAmount = emi.housePrice - emi.downPayment;
  const originalResult = calculateEMI(loanAmount, emi.interestRate, emi.tenure);

  // Original schedule
  const originalRows = generateAmortization(loanAmount, emi.interestRate, emi.tenure);
  const originalInterest = originalRows.reduce((s, r) => s + r.interest, 0);
  const originalMonths = originalRows.length;

  // With prepayment
  const prepRows = generateAmortization(
    loanAmount,
    emi.interestRate,
    emi.tenure,
    prepayment.lumpSum,
    prepayment.afterMonths,
    prepayment.extraMonthlyEMI,
    prepayment.option
  );
  const prepInterest = prepRows.reduce((s, r) => s + r.interest, 0);
  const prepMonths = prepRows.length;

  const monthsSaved = originalMonths - prepMonths;
  const interestSaved = originalInterest - prepInterest;
  const yearsSaved = Math.floor(monthsSaved / 12);
  const remMonthsSaved = monthsSaved % 12;

  // If reduce-emi: show last row's EMI calculation
  const newMonthlyEMI =
    prepayment.option === 'reduce-emi' && prepRows.length > 0
      ? prepRows[Math.min(prepayment.afterMonths, prepRows.length - 1)]?.interest +
        prepRows[Math.min(prepayment.afterMonths, prepRows.length - 1)]?.principal
      : originalResult.monthlyEMI;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Prepayment Simulator</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Simulate the impact of prepayments on your loan tenure and interest
        </p>
      </div>

      {/* Base loan info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex flex-wrap gap-4">
        <div className="text-center">
          <p className="text-xs text-blue-600 dark:text-blue-400">Loan Amount</p>
          <p className="font-bold text-blue-800 dark:text-blue-200">{formatINR(loanAmount, true)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-blue-600 dark:text-blue-400">Interest Rate</p>
          <p className="font-bold text-blue-800 dark:text-blue-200">{emi.interestRate}% p.a.</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-blue-600 dark:text-blue-400">Tenure</p>
          <p className="font-bold text-blue-800 dark:text-blue-200">{emi.tenure} years</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-blue-600 dark:text-blue-400">Original EMI</p>
          <p className="font-bold text-blue-800 dark:text-blue-200">{formatINR(originalResult.monthlyEMI, true)}</p>
        </div>
        <p className="w-full text-xs text-blue-500 dark:text-blue-400">
          Configure loan details in the EMI Calculator tab
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card title="Prepayment Details">
          <div className="space-y-4">
            <Input
              label="Lump-Sum Prepayment Amount"
              prefix="₹"
              type="number"
              value={prepayment.lumpSum || ''}
              onChange={(e) => setPrepayment({ lumpSum: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              hint="One-time additional payment"
            />
            <Input
              label="Apply Prepayment After Month"
              type="number"
              value={prepayment.afterMonths || ''}
              onChange={(e) => setPrepayment({ afterMonths: parseInt(e.target.value) || 0 })}
              placeholder="12"
              hint={`After month ${prepayment.afterMonths} (Year ${Math.ceil(prepayment.afterMonths / 12)})`}
            />
            <Input
              label="Extra Monthly EMI Amount"
              prefix="₹"
              type="number"
              value={prepayment.extraMonthlyEMI || ''}
              onChange={(e) => setPrepayment({ extraMonthlyEMI: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              hint="Pay this extra every month on top of regular EMI"
            />
            <RadioGroup
              label="Prepayment Benefit"
              value={prepayment.option}
              onChange={(v) => setPrepayment({ option: v as typeof prepayment.option })}
              options={[
                { value: 'reduce-tenure', label: 'Reduce Tenure' },
                { value: 'reduce-emi', label: 'Reduce EMI' },
              ]}
            />
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-5">
          {/* Comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wide">Original</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tenure</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {Math.floor(originalMonths / 12)}y {originalMonths % 12}m
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Total Interest</p>
              <p className="font-semibold text-red-500">{formatINR(originalInterest, true)}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2 font-medium uppercase tracking-wide">With Prepayment</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tenure</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                {Math.floor(prepMonths / 12)}y {prepMonths % 12}m
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Total Interest</p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatINR(prepInterest, true)}</p>
            </div>
          </div>

          {/* Savings */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="Months Saved"
              value={`${monthsSaved}`}
              sub={`${yearsSaved}y ${remMonthsSaved}m`}
              color="green"
            />
            <MetricCard
              label="Interest Saved"
              value={formatINR(interestSaved, true)}
              color="green"
            />
          </div>

          {prepayment.option === 'reduce-emi' && (prepayment.lumpSum > 0 || prepayment.extraMonthlyEMI > 0) && (
            <Card>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">New Monthly EMI (after prepayment)</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatINR(newMonthlyEMI, true)}</span>
              </div>
            </Card>
          )}

          {/* Summary */}
          {(prepayment.lumpSum > 0 || prepayment.extraMonthlyEMI > 0) && (
            <Card>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-700 dark:text-gray-200">Prepayment Summary</p>
                {prepayment.lumpSum > 0 && (
                  <p className="text-gray-600 dark:text-gray-400">
                    • Lump-sum of {formatINR(prepayment.lumpSum, true)} applied in month {prepayment.afterMonths}
                  </p>
                )}
                {prepayment.extraMonthlyEMI > 0 && (
                  <p className="text-gray-600 dark:text-gray-400">
                    • Extra {formatINR(prepayment.extraMonthlyEMI, true)}/month added to EMI
                  </p>
                )}
                {interestSaved > 0 && (
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Saving {formatINR(interestSaved, true)} in interest!
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Monthly amortization comparison (first 24 months) */}
      {(prepayment.lumpSum > 0 || prepayment.extraMonthlyEMI > 0) && (
        <Card title="Amortization Detail – First 24 Months">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <th className="px-2 py-2 text-left">Month</th>
                  <th className="px-2 py-2 text-right">Opening Balance</th>
                  <th className="px-2 py-2 text-right">Principal</th>
                  <th className="px-2 py-2 text-right">Interest</th>
                  <th className="px-2 py-2 text-right">Prepayment</th>
                  <th className="px-2 py-2 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {prepRows.slice(0, 24).map((row) => (
                  <tr
                    key={row.month}
                    className={`border-t border-gray-100 dark:border-gray-700 ${
                      row.prepayment > 0 ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''
                    }`}
                  >
                    <td className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">{row.month}</td>
                    <td className="px-2 py-1.5 text-right text-gray-600 dark:text-gray-400">{formatINR(row.openingBalance, true)}</td>
                    <td className="px-2 py-1.5 text-right text-blue-600 dark:text-blue-400">{formatINR(row.principal, true)}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{formatINR(row.interest, true)}</td>
                    <td className="px-2 py-1.5 text-right text-emerald-600 dark:text-emerald-400">
                      {row.prepayment > 0 ? formatINR(row.prepayment, true) : '–'}
                    </td>
                    <td className="px-2 py-1.5 text-right font-medium text-gray-800 dark:text-gray-100">{formatINR(row.closingBalance, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
