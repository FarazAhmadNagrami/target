import { useStore, useNetMonthlySalary } from '../store/useStore';
import { calculateTax } from '../utils/taxCalc';
import { formatINR, formatPercent } from '../utils/format';
import { Card, MetricCard } from '../components/ui/Card';
import { Input, Select, RadioGroup } from '../components/ui/Input';

export default function SalaryTax() {
  const { salary, setSalary, setSalaryDeductions } = useStore();
  const netMonthlyActual = useNetMonthlySalary(); // after EPF + PT

  const result = calculateTax(
    salary.annualCTC,
    salary.fy,
    salary.ageGroup,
    salary.regime,
    salary.deductions
  );

  const totalMonthlyDeductions = result.totalTax / 12 + salary.monthlyEPF + salary.monthlyProfessionalTax;
  const grossMonthly = salary.annualCTC / 12;

  const fyOptions = [
    { value: 'FY2025-26', label: 'FY 2025-26' },
    { value: 'FY2026-27', label: 'FY 2026-27' },
  ];
  const ageOptions = [
    { value: '0-60', label: 'Below 60' },
    { value: '60-80', label: '60 – 80' },
    { value: '80+', label: 'Above 80' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Salary & Tax Calculator</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Calculate your net take-home pay after taxes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Inputs ── */}
        <div className="space-y-5">
          <Card title="Income Details">
            <div className="space-y-4">
              <Input
                label="Annual Gross Salary"
                prefix="₹"
                type="number"
                value={salary.annualCTC || ''}
                onChange={(e) => setSalary({ annualCTC: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 2578404"
                hint={`Monthly gross: ${formatINR(grossMonthly, true)}`}
              />
              <Select
                label="Financial Year"
                value={salary.fy}
                onChange={(e) => setSalary({ fy: e.target.value as typeof salary.fy })}
                options={fyOptions}
              />
              <RadioGroup
                label="Age Group"
                value={salary.ageGroup}
                onChange={(v) => setSalary({ ageGroup: v as typeof salary.ageGroup })}
                options={ageOptions}
              />
              <RadioGroup
                label="Tax Regime"
                value={salary.regime}
                onChange={(v) => setSalary({ regime: v as typeof salary.regime })}
                options={[
                  { value: 'new', label: 'New Regime' },
                  { value: 'old', label: 'Old Regime' },
                ]}
              />
            </div>
          </Card>

          {/* Payroll deductions (non-tax) */}
          <Card title="Payroll Deductions (non-tax)">
            <div className="space-y-4">
              <Input
                label="Monthly EPF Contribution (Employee)"
                prefix="₹"
                type="number"
                value={salary.monthlyEPF || ''}
                onChange={(e) => setSalary({ monthlyEPF: parseFloat(e.target.value) || 0 })}
                placeholder="1800"
                hint="Capped at 12% × ₹15,000 = ₹1,800 for statutory EPF"
              />
              <Input
                label="Monthly Professional Tax"
                prefix="₹"
                type="number"
                value={salary.monthlyProfessionalTax || ''}
                onChange={(e) => setSalary({ monthlyProfessionalTax: parseFloat(e.target.value) || 0 })}
                placeholder="200"
                hint="State-level tax; max ₹2,400/year in most states"
              />
            </div>
          </Card>

          {salary.regime === 'old' && (
            <Card title="Old Regime Deductions">
              <div className="space-y-4">
                <Input
                  label="Section 80C (max ₹1.5L)"
                  prefix="₹"
                  type="number"
                  value={salary.deductions.deduction80C || ''}
                  onChange={(e) => setSalaryDeductions({ deduction80C: parseFloat(e.target.value) || 0 })}
                  placeholder="150000"
                  hint="EPF ₹21,600 + ELSS/PPF/LIC top-up"
                />
                <Input
                  label="HRA Exemption"
                  prefix="₹"
                  type="number"
                  value={salary.deductions.hraExemption || ''}
                  onChange={(e) => setSalaryDeductions({ hraExemption: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  hint="min(HRA received, 40% basic for non-metro, rent paid − 10% basic)"
                />
                <Input
                  label="Section 80D – Medical Insurance"
                  prefix="₹"
                  type="number"
                  value={salary.deductions.deduction80D || ''}
                  onChange={(e) => setSalaryDeductions({ deduction80D: parseFloat(e.target.value) || 0 })}
                  placeholder="25000"
                />
                <Input
                  label="Section 24 – Home Loan Interest (max ₹2L)"
                  prefix="₹"
                  type="number"
                  value={salary.deductions.section24 || ''}
                  onChange={(e) => setSalaryDeductions({ section24: parseFloat(e.target.value) || 0 })}
                  placeholder="200000"
                />
                <Input
                  label="Section 80CCD(1B) – NPS (max ₹50K)"
                  prefix="₹"
                  type="number"
                  value={salary.deductions.deduction80CCD || ''}
                  onChange={(e) => setSalaryDeductions({ deduction80CCD: parseFloat(e.target.value) || 0 })}
                  placeholder="50000"
                />
                <Input
                  label="Other Deductions"
                  prefix="₹"
                  type="number"
                  value={salary.deductions.otherDeductions || ''}
                  onChange={(e) => setSalaryDeductions({ otherDeductions: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </Card>
          )}

          {salary.regime === 'new' && (
            <Card>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300 space-y-1.5">
                <p className="font-semibold">New Regime Benefits</p>
                <p>• Standard deduction: {salary.fy === 'FY2026-27' ? '₹75,000' : '₹50,000'}</p>
                {salary.fy === 'FY2026-27' && <p>• Zero tax up to ₹12 Lakh (Section 87A rebate)</p>}
                {salary.fy === 'FY2025-26' && <p>• Zero tax up to ₹7 Lakh (Section 87A rebate)</p>}
                <p>• Lower slab rates vs old regime</p>
                <p>• No need to track individual deductions</p>
              </div>
            </Card>
          )}
        </div>

        {/* ── Right: Results ── */}
        <div className="space-y-5">
          {/* Tax Computation */}
          <Card title="Tax Computation">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Gross Salary</span>
                <span className="font-medium text-gray-800 dark:text-gray-100">{formatINR(result.grossIncome)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Standard Deduction</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">– {formatINR(result.standardDeduction)}</span>
              </div>
              {salary.regime === 'old' && (
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Other Deductions (80C + HRA + 80D…)
                  </span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    – {formatINR(result.totalDeductions - result.standardDeduction)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Taxable Income</span>
                <span className="font-bold text-gray-800 dark:text-gray-100">{formatINR(result.taxableIncome)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Income Tax</span>
                <span className="font-medium text-red-500">{formatINR(result.taxBeforeCess)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Health & Education Cess (4%)</span>
                <span className="font-medium text-red-500">{formatINR(result.cess)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 px-3 rounded-lg">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Total Income Tax</span>
                <span className="font-bold text-red-600 dark:text-red-400">{formatINR(result.totalTax)}</span>
              </div>
            </div>
          </Card>

          {/* Monthly Payslip Breakdown */}
          <Card title="Monthly Payslip Breakdown">
            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Gross Monthly</span>
                <span className="font-medium text-gray-800 dark:text-gray-100">{formatINR(grossMonthly)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Income Tax (TDS)</span>
                <span className="text-red-500">– {formatINR(result.totalTax / 12)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">EPF Contribution</span>
                <span className="text-red-500">– {formatINR(salary.monthlyEPF)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Professional Tax</span>
                <span className="text-red-500">– {formatINR(salary.monthlyProfessionalTax)}</span>
              </div>
              <div className="flex justify-between py-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 rounded-lg mt-1">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Net Take-Home</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                  {formatINR(netMonthlyActual)}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-1">
                Total deductions: {formatINR(totalMonthlyDeductions)}/month
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="Net Annual"
              value={formatINR(netMonthlyActual * 12, true)}
              color="green"
            />
            <MetricCard
              label="Net Monthly"
              value={formatINR(netMonthlyActual, true)}
              sub="Auto-fed to Family Income"
              color="green"
            />
            <MetricCard
              label="Total Tax"
              value={formatINR(result.totalTax, true)}
              color="red"
            />
            <MetricCard
              label="Effective Tax Rate"
              value={formatPercent(result.effectiveTaxRate)}
              color="yellow"
            />
          </div>

          {/* Slab reference */}
          <Card title={`${salary.fy} – ${salary.regime === 'new' ? 'New' : 'Old'} Regime Slabs`}>
            {salary.regime === 'new' ? (
              <div className="space-y-2 text-sm">
                {salary.fy === 'FY2026-27' ? (
                  <>
                    <SlabRow label="Up to ₹4L" rate="0%" />
                    <SlabRow label="₹4L – ₹8L" rate="5%" />
                    <SlabRow label="₹8L – ₹12L" rate="10%" />
                    <SlabRow label="₹12L – ₹16L" rate="15%" />
                    <SlabRow label="₹16L – ₹20L" rate="20%" />
                    <SlabRow label="₹20L – ₹24L" rate="25%" />
                    <SlabRow label="Above ₹24L" rate="30%" />
                    <p className="text-blue-600 dark:text-blue-400 text-xs pt-2 border-t dark:border-gray-700">
                      + Rebate u/s 87A: Zero tax if taxable income ≤ ₹12L
                    </p>
                  </>
                ) : (
                  <>
                    <SlabRow label="Up to ₹3L" rate="0%" />
                    <SlabRow label="₹3L – ₹7L" rate="5%" />
                    <SlabRow label="₹7L – ₹10L" rate="10%" />
                    <SlabRow label="₹10L – ₹12L" rate="15%" />
                    <SlabRow label="₹12L – ₹15L" rate="20%" />
                    <SlabRow label="Above ₹15L" rate="30%" />
                    <p className="text-blue-600 dark:text-blue-400 text-xs pt-2 border-t dark:border-gray-700">
                      + Rebate u/s 87A: Zero tax if taxable income ≤ ₹7L
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <SlabRow label={`Up to ₹${salary.ageGroup === '80+' ? '5L' : salary.ageGroup === '60-80' ? '3L' : '2.5L'}`} rate="0%" />
                {salary.ageGroup !== '80+' && (
                  <SlabRow label={salary.ageGroup === '60-80' ? '₹3L – ₹5L' : '₹2.5L – ₹5L'} rate="5%" />
                )}
                <SlabRow label="₹5L – ₹10L" rate="20%" />
                <SlabRow label="Above ₹10L" rate="30%" />
                <p className="text-blue-600 dark:text-blue-400 text-xs pt-2 border-t dark:border-gray-700">
                  + Rebate u/s 87A: Zero tax if taxable income ≤ ₹5L
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function SlabRow({ label, rate }: { label: string; rate: string }) {
  return (
    <div className="flex justify-between text-gray-600 dark:text-gray-400">
      <span>{label}</span>
      <span>{rate}</span>
    </div>
  );
}
