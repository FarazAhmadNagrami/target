import { useState } from 'react';
import { useStore, useTotalFamilyMonthly } from '../store/useStore';
import { calculateEMI, generateAmortization, rollupToYearly } from '../utils/emiCalc';
import { formatINR } from '../utils/format';
import { Card, MetricCard } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// ─── Amortization chart + table ───────────────────────────────────────────────

function AmortizationSection({
  loanAmount,
  interestRate,
  tenure,
}: {
  loanAmount: number;
  interestRate: number;
  tenure: number;
}) {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());

  const allRows = generateAmortization(loanAmount, interestRate, tenure);
  const yearlyRows = rollupToYearly(allRows);

  const chartData = yearlyRows.map((y) => ({
    year: y.year.toString(),
    principal: Math.round(y.principalPaid),
    interest: Math.round(y.interestPaid),
    balance: Math.round(y.closingBalance),
  }));

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      next.has(year) ? next.delete(year) : next.add(year);
      return next;
    });
  };

  // Group monthly rows by year for expansion
  const monthsByYear = new Map<number, typeof allRows>();
  for (const row of allRows) {
    if (!monthsByYear.has(row.year)) monthsByYear.set(row.year, []);
    monthsByYear.get(row.year)!.push(row);
  }

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // Start from current month (March 2026 = index 2)
  const startMonthIdx = 2; // March

  const getMonthName = (monthInLoan: number): string => {
    const idx = (startMonthIdx + monthInLoan - 1) % 12;
    return MONTH_NAMES[idx];
  };

  return (
    <div className="space-y-6">
      {/* ── Chart ── */}
      <Card title="Year-wise Amortization Chart">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex flex-wrap gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#4ade80]" /> Principal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#fb923c]" /> Interest
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-1 bg-[#be123c]" style={{ borderRadius: 2 }} /> Balance
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 40, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={(v) => `${2025 + Number(v) - 1}`}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickFormatter={(v) => `₹${(v / 1_00_00_000).toFixed(1)}Cr`}
              width={55}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickFormatter={(v) => `₹${(v / 1_00_000).toFixed(0)}L`}
              width={50}
            />
            <Tooltip
              formatter={(value, name) => [
                formatINR(Number(value), true),
                name === 'principal' ? 'Principal' : name === 'interest' ? 'Interest' : 'Balance',
              ]}
              labelFormatter={(label) => `Year ${label} (${2025 + Number(label) - 1})`}
              contentStyle={{
                fontSize: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                backgroundColor: 'rgba(255,255,255,0.97)',
              }}
            />
            <Bar yAxisId="left" dataKey="principal" stackId="a" fill="#4ade80" radius={[0, 0, 0, 0]} />
            <Bar yAxisId="left" dataKey="interest" stackId="a" fill="#fb923c" radius={[3, 3, 0, 0]} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="balance"
              stroke="#be123c"
              strokeWidth={2}
              dot={{ r: 3, fill: '#be123c' }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Expandable Table ── */}
      <Card title="Amortization Schedule">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-3 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-200 w-20">Year</th>
                <th className="px-3 py-2.5 text-right font-semibold text-[#16a34a]">Principal (A)</th>
                <th className="px-3 py-2.5 text-right font-semibold text-[#ea580c]">Interest (B)</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-300">Total (A+B)</th>
                <th className="px-3 py-2.5 text-right font-semibold text-[#9f1239] dark:text-red-400">Balance</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-300">Paid %</th>
              </tr>
            </thead>
            <tbody>
              {yearlyRows.map((yr) => {
                const isOpen = expandedYears.has(yr.year);
                const paidSoFar = loanAmount - yr.closingBalance;
                const paidPct = loanAmount > 0 ? (paidSoFar / loanAmount) * 100 : 0;
                const months = monthsByYear.get(yr.year) || [];

                return (
                  <>
                    {/* Year row */}
                    <tr
                      key={`year-${yr.year}`}
                      className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 font-medium"
                      onClick={() => toggleYear(yr.year)}
                    >
                      <td className="px-3 py-2.5 text-gray-800 dark:text-gray-100">
                        <span className="mr-2 text-gray-400">{isOpen ? '⊟' : '⊞'}</span>
                        {2025 + yr.year - 1}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[#16a34a]">{formatINR(yr.principalPaid)}</td>
                      <td className="px-3 py-2.5 text-right text-[#ea580c]">{formatINR(yr.interestPaid)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-700 dark:text-gray-200">
                        {formatINR(yr.principalPaid + yr.interestPaid)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[#9f1239] dark:text-red-400 font-semibold">
                        {formatINR(yr.closingBalance)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300">
                        {paidPct.toFixed(2)}%
                      </td>
                    </tr>

                    {/* Monthly rows (expanded) */}
                    {isOpen && months.map((m) => {
                      const mPaidSoFar = loanAmount - m.closingBalance;
                      const mPaidPct = loanAmount > 0 ? (mPaidSoFar / loanAmount) * 100 : 0;
                      return (
                        <tr
                          key={`month-${m.month}`}
                          className="border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50"
                        >
                          <td className="pl-8 pr-3 py-1.5 text-gray-500 dark:text-gray-400 font-normal">
                            {getMonthName(m.month)}
                          </td>
                          <td className="px-3 py-1.5 text-right text-[#16a34a]/80">{formatINR(m.principal)}</td>
                          <td className="px-3 py-1.5 text-right text-[#ea580c]/80">{formatINR(m.interest)}</td>
                          <td className="px-3 py-1.5 text-right text-gray-600 dark:text-gray-400">
                            {formatINR(m.principal + m.interest)}
                          </td>
                          <td className="px-3 py-1.5 text-right text-[#9f1239]/80 dark:text-red-400/80">
                            {formatINR(m.closingBalance)}
                          </td>
                          <td className="px-3 py-1.5 text-right text-gray-500 dark:text-gray-400">
                            {mPaidPct.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EMICalculator() {
  const { emi, setEmi } = useStore();
  const totalFamilyMonthly = useTotalFamilyMonthly();

  const loanAmount = emi.housePrice - emi.downPayment;
  const downPaymentPct = emi.housePrice > 0 ? (emi.downPayment / emi.housePrice) * 100 : 0;
  const result = calculateEMI(loanAmount, emi.interestRate, emi.tenure);
  const emiToIncome = totalFamilyMonthly > 0 ? (result.monthlyEMI / totalFamilyMonthly) * 100 : 0;
  const isEMIHigh = emiToIncome > 50;

  const pieData = [
    { name: 'Principal', value: loanAmount, color: '#4ade80' },
    { name: 'Total Interest', value: result.totalInterest, color: '#fb923c' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">EMI Calculator</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Calculate your monthly EMI for the ₹3 Cr home loan
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card title="Loan Parameters">
          <div className="space-y-4">
            <Input
              label="House Price"
              prefix="₹"
              type="number"
              value={emi.housePrice || ''}
              onChange={(e) => setEmi({ housePrice: parseFloat(e.target.value) || 0 })}
              placeholder="30000000"
              hint={formatINR(emi.housePrice, true)}
            />
            <Input
              label="Down Payment"
              prefix="₹"
              type="number"
              value={emi.downPayment || ''}
              onChange={(e) => setEmi({ downPayment: parseFloat(e.target.value) || 0 })}
              placeholder="6000000"
              hint={`${downPaymentPct.toFixed(1)}% of house price = ${formatINR(emi.downPayment, true)}`}
            />
            <Input
              label="Interest Rate"
              suffix="% p.a."
              type="number"
              step="0.1"
              value={emi.interestRate || ''}
              onChange={(e) => setEmi({ interestRate: parseFloat(e.target.value) || 0 })}
              placeholder="7.2"
            />
            <Input
              label="Loan Tenure"
              suffix="years"
              type="number"
              value={emi.tenure || ''}
              onChange={(e) => setEmi({ tenure: parseInt(e.target.value) || 0 })}
              placeholder="20"
            />

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Loan Amount</span>
                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatINR(loanAmount, true)}</span>
              </div>
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                {formatINR(emi.housePrice, true)} – {formatINR(emi.downPayment, true)}
              </p>
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-5">
          {isEMIHigh && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
              ⚠️ <strong>Warning:</strong> EMI of {formatINR(result.monthlyEMI, true)} is{' '}
              <strong>{emiToIncome.toFixed(1)}%</strong> of your family income (recommended: &lt;50%)
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="Monthly EMI"
              value={formatINR(result.monthlyEMI, true)}
              sub={`${emiToIncome.toFixed(1)}% of income`}
              color={isEMIHigh ? 'red' : 'blue'}
            />
            <MetricCard label="Total Interest" value={formatINR(result.totalInterest, true)} color="red" />
            <MetricCard label="Total Payment" value={formatINR(result.totalPayment, true)} color="default" />
            <MetricCard
              label="Down Payment %"
              value={`${downPaymentPct.toFixed(1)}%`}
              sub={downPaymentPct < 20 ? '⚠️ Below 20%' : '✓ Adequate'}
              color={downPaymentPct < 20 ? 'red' : 'green'}
            />
          </div>

          {/* Doughnut */}
          <Card title="Principal vs Interest">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatINR(Number(value), true), '']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Legend formatter={(v) => <span className="text-xs text-gray-600 dark:text-gray-400">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-around text-center mt-1">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Principal</p>
                <p className="font-semibold text-[#16a34a]">{formatINR(loanAmount, true)}</p>
                <p className="text-xs text-gray-400">
                  {result.totalPayment > 0 ? ((loanAmount / result.totalPayment) * 100).toFixed(0) : 0}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Interest</p>
                <p className="font-semibold text-[#ea580c]">{formatINR(result.totalInterest, true)}</p>
                <p className="text-xs text-gray-400">
                  {result.totalPayment > 0 ? ((result.totalInterest / result.totalPayment) * 100).toFixed(0) : 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Chart + expandable table */}
      {loanAmount > 0 && emi.tenure > 0 && emi.interestRate > 0 && (
        <AmortizationSection
          loanAmount={loanAmount}
          interestRate={emi.interestRate}
          tenure={emi.tenure}
        />
      )}
    </div>
  );
}
