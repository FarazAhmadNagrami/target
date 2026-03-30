import { useStore, useNetMonthlySalary, useTotalFamilyMonthly, useNetOtherMonthly } from '../store/useStore';
import { formatINR } from '../utils/format';
import { Card, MetricCard } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { calcLoanEligibility } from '../utils/emiCalc';

export default function FamilyIncome() {
  const { family, setFamily, otherIncome } = useStore();
  const netMonthlySalary = useNetMonthlySalary();
  const netOtherMonthly = useNetOtherMonthly();
  const totalMonthly = useTotalFamilyMonthly();
  const totalAnnual = totalMonthly * 12;
  const loanEligibility = calcLoanEligibility(totalMonthly);

  const sources = [
    { label: 'You (Salary)', amount: netMonthlySalary, color: '#3b82f6', auto: true },
    { label: 'Mother', amount: family.motherMonthly, color: '#10b981', auto: false },
    { label: 'Father', amount: family.fatherMonthly, color: '#f59e0b', auto: false },
    { label: 'Freelancing & Trading (net)', amount: netOtherMonthly, color: '#8b5cf6', auto: true },
  ].filter((s) => s.amount > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Family Income</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Combined income from you, your parents, and your business income
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card title="Income Sources">
          <div className="space-y-4">
            {/* Self — read-only from Salary module */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">You (auto from Salary & Tax)</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">{formatINR(netMonthlySalary, true)}/mo</span>
              </div>
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">Net take-home after all taxes</p>
            </div>

            <Input
              label="Mother's Monthly Income"
              prefix="₹"
              type="number"
              value={family.motherMonthly || ''}
              onChange={(e) => setFamily({ motherMonthly: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              hint="Net take-home after taxes"
            />

            <Input
              label="Father's Monthly Income"
              prefix="₹"
              type="number"
              value={family.fatherMonthly || ''}
              onChange={(e) => setFamily({ fatherMonthly: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              hint="Net take-home after taxes"
            />

            {/* Freelancing & Trading — read-only from Other Income module */}
            <div className={`p-3 rounded-lg ${
              netOtherMonthly > 0
                ? 'bg-purple-50 dark:bg-purple-900/20'
                : 'bg-gray-50 dark:bg-gray-700'
            }`}>
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${
                  netOtherMonthly > 0
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  Freelancing & Trading (auto from Assets tab)
                </span>
                <span className={`font-bold ${
                  netOtherMonthly > 0
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {formatINR(netOtherMonthly, true)}/mo
                </span>
              </div>
              {netOtherMonthly > 0 ? (
                <p className="text-xs text-purple-500 dark:text-purple-400 mt-0.5">
                  ₹{formatINR(otherIncome.monthlyFreelance + otherIncome.monthlyTrading, true)} gross
                  – {otherIncome.otherIncomeTaxRate}% tax = {formatINR(netOtherMonthly, true)} net
                </p>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Enter freelance/trading income in the Income & Assets tab
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Total Monthly" value={formatINR(totalMonthly, true)} color="green" />
            <MetricCard label="Total Annual" value={formatINR(totalAnnual, true)} color="green" />
          </div>

          {/* Income breakdown bars */}
          {sources.length > 0 && (
            <Card title="Income Breakdown">
              <div className="space-y-3">
                {sources.map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          {s.label}
                          {s.auto && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-400 px-1.5 py-0.5 rounded">auto</span>
                          )}
                        </span>
                        <span className="font-medium text-gray-800 dark:text-gray-100">{formatINR(s.amount, true)}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${totalMonthly > 0 ? (s.amount / totalMonthly) * 100 : 0}%`,
                            backgroundColor: s.color,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-9 text-right">
                      {totalMonthly > 0 ? ((s.amount / totalMonthly) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Loan Eligibility */}
          <Card title="Combined Loan Eligibility">
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Maximum Eligible Loan</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatINR(loanEligibility, true)}</p>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="font-medium text-gray-700 dark:text-gray-300">How it's calculated:</p>
                <p>Max EMI = 50% × {formatINR(totalMonthly, true)} = {formatINR(totalMonthly * 0.5, true)}</p>
                <p>Assumes 9% p.a. interest, 20-year tenure</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
