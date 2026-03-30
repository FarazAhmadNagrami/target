import { useStore, useTotalExpenses, useTotalFamilyMonthly } from '../store/useStore';
import { formatINR } from '../utils/format';
import { Card, MetricCard } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EXPENSE_CATEGORIES = [
  { key: 'rent',             label: 'Rent',                  color: '#3b82f6', group: 'Housing' },
  { key: 'electricity',      label: 'Electricity',           color: '#f59e0b', group: 'Housing' },
  { key: 'wifi',             label: 'Wifi / Internet',       color: '#06b6d4', group: 'Housing' },
  { key: 'mummyAllowance',   label: 'Mummy',                 color: '#10b981', group: 'Family' },
  { key: 'papaAllowance',    label: 'Papa',                  color: '#6366f1', group: 'Family' },
  { key: 'parentsMedicine',  label: 'Mummy Papa Medicine',   color: '#ec4899', group: 'Family' },
  { key: 'gharKharch',       label: 'Ghar Kharch',           color: '#84cc16', group: 'Household' },
  { key: 'milk',             label: 'Milk',                  color: '#a78bfa', group: 'Household' },
  { key: 'existingEMIs',     label: 'Existing EMIs',         color: '#ef4444', group: 'Finance' },
  { key: 'sips',             label: 'SIPs / Investments',    color: '#14b8a6', group: 'Finance' },
  { key: 'transport',        label: 'Transport',             color: '#f97316', group: 'Personal' },
  { key: 'insurance',        label: 'Insurance',             color: '#0ea5e9', group: 'Personal' },
  { key: 'extras',           label: 'Extras / Misc',         color: '#94a3b8', group: 'Personal' },
] as const;

type ExpenseKey = typeof EXPENSE_CATEGORIES[number]['key'];

const GROUPS = ['Housing', 'Family', 'Household', 'Finance', 'Personal'] as const;
const GROUP_COLORS: Record<string, string> = {
  Housing:   'text-blue-600 dark:text-blue-400',
  Family:    'text-emerald-600 dark:text-emerald-400',
  Household: 'text-lime-600 dark:text-lime-400',
  Finance:   'text-red-500 dark:text-red-400',
  Personal:  'text-orange-500 dark:text-orange-400',
};

export default function Expenses() {
  const { expenses, setExpenses } = useStore();
  const totalExpenses = useTotalExpenses();
  const totalIncome = useTotalFamilyMonthly();
  const expensePercent = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const monthlySavings = totalIncome - totalExpenses;

  const chartData = EXPENSE_CATEGORIES
    .map((cat) => ({ name: cat.label, value: expenses[cat.key as ExpenseKey], color: cat.color }))
    .filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly Expenses</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track where your money goes each month</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Inputs ── */}
        <div className="space-y-4">
          {GROUPS.map((group) => {
            const cats = EXPENSE_CATEGORIES.filter((c) => c.group === group);
            const groupTotal = cats.reduce((s, c) => s + expenses[c.key as ExpenseKey], 0);
            return (
              <Card key={group}>
                <div className="flex justify-between items-center mb-3">
                  <h4 className={`text-sm font-semibold ${GROUP_COLORS[group]}`}>{group}</h4>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {formatINR(groupTotal, true)}/mo
                  </span>
                </div>
                <div className="space-y-3">
                  {cats.map((cat) => (
                    <div key={cat.key} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <div className="flex-1">
                        <Input
                          label={cat.label}
                          prefix="₹"
                          type="number"
                          value={expenses[cat.key as ExpenseKey] || ''}
                          onChange={(e) => setExpenses({ [cat.key]: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* ── Results ── */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="Total Expenses"
              value={formatINR(totalExpenses, true)}
              sub={`${expensePercent.toFixed(0)}% of income`}
              color="red"
            />
            <MetricCard
              label="Monthly Savings"
              value={formatINR(monthlySavings, true)}
              color={monthlySavings >= 0 ? 'green' : 'red'}
            />
            <MetricCard
              label="Annual Savings"
              value={formatINR(monthlySavings * 12, true)}
              color={monthlySavings >= 0 ? 'green' : 'red'}
            />
            <MetricCard
              label="Expense Ratio"
              value={`${expensePercent.toFixed(1)}%`}
              sub={expensePercent > 80 ? '⚠️ High' : expensePercent > 60 ? 'Moderate' : '✓ Good'}
              color={expensePercent > 80 ? 'red' : expensePercent > 60 ? 'yellow' : 'green'}
            />
          </div>

          {/* Doughnut chart */}
          {chartData.length > 0 ? (
            <Card title="Expense Breakdown">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="value">
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatINR(Number(value), true), '']}
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend formatter={(v) => <span className="text-xs text-gray-600 dark:text-gray-400">{v}</span>} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          ) : (
            <Card title="Expense Breakdown">
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Add expenses to see chart</div>
            </Card>
          )}

          {/* Category breakdown with group subtotals */}
          <Card title="Category Details">
            <div className="space-y-4">
              {GROUPS.map((group) => {
                const cats = EXPENSE_CATEGORIES.filter((c) => c.group === group && expenses[c.key as ExpenseKey] > 0);
                if (cats.length === 0) return null;
                const groupTotal = cats.reduce((s, c) => s + expenses[c.key as ExpenseKey], 0);
                return (
                  <div key={group}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${GROUP_COLORS[group]}`}>{group}</span>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{formatINR(groupTotal, true)}</span>
                    </div>
                    <div className="space-y-1.5 pl-2">
                      {cats.map((cat) => (
                        <div key={cat.key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{cat.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">
                              {totalExpenses > 0 ? ((expenses[cat.key as ExpenseKey] / totalExpenses) * 100).toFixed(1) : 0}%
                            </span>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-100 w-20 text-right">
                              {formatINR(expenses[cat.key as ExpenseKey], true)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
