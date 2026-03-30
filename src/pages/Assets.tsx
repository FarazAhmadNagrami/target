import { useState } from 'react';
import { useStore, useTotalAssets, useNetOtherMonthly } from '../store/useStore';
import { formatINR } from '../utils/format';
import { Card, MetricCard } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';
import { calcSIPFV, calcMonthsToGoal } from '../utils/emiCalc';

const TARGET = 3_00_00_000;

const ASSET_CATEGORIES = [
  { key: 'savingsAccumulated', label: 'Bank Savings', color: '#3b82f6', icon: '🏦' },
  { key: 'mutualFundsStocks', label: 'Mutual Funds & Stocks', color: '#10b981', icon: '📈' },
  { key: 'fdRdBalance', label: 'FD / RD Balance', color: '#f59e0b', icon: '📋' },
  { key: 'goldOtherAssets', label: 'Gold & Other Assets', color: '#f97316', icon: '🪙' },
  { key: 'pfPpfBalance', label: 'PF / PPF Balance', color: '#8b5cf6', icon: '🔐' },
] as const;

type AssetKey = typeof ASSET_CATEGORIES[number]['key'];

export default function Assets() {
  const { otherIncome, setOtherIncome, emi } = useStore();
  const totalAssets = useTotalAssets();
  const netOtherMonthly = useNetOtherMonthly();

  const [sipAmount, setSipAmount] = useState(10000);
  const [sipReturn, setSipReturn] = useState(12);
  const dpTarget = emi.downPayment;
  const dpGap = Math.max(0, dpTarget - totalAssets);
  const monthsToDP = dpGap > 0 && sipAmount > 0 ? calcMonthsToGoal(sipAmount, sipReturn, dpGap) : 0;
  const targetProgress = (totalAssets / TARGET) * 100;
  const dpProgress = dpTarget > 0 ? Math.min(100, (totalAssets / dpTarget) * 100) : 0;

  const grossOtherMonthly = otherIncome.monthlyFreelance + otherIncome.monthlyTrading;

  // SIP projection
  const sip12m = calcSIPFV(sipAmount, sipReturn, 12);
  const sip36m = calcSIPFV(sipAmount, sipReturn, 36);
  const sip60m = calcSIPFV(sipAmount, sipReturn, 60);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Other Income & Assets</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Track your assets and supplementary income sources
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs Left */}
        <div className="space-y-5">
          <Card title="Supplementary Income">
            <div className="space-y-4">
              <Input
                label="Monthly Freelance Income"
                prefix="₹"
                type="number"
                value={otherIncome.monthlyFreelance || ''}
                onChange={(e) => setOtherIncome({ monthlyFreelance: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
              <Input
                label="Monthly Trading Profit"
                prefix="₹"
                type="number"
                value={otherIncome.monthlyTrading || ''}
                onChange={(e) => setOtherIncome({ monthlyTrading: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
              <Input
                label="Tax Rate on Above Income"
                suffix="%"
                type="number"
                value={otherIncome.otherIncomeTaxRate || ''}
                onChange={(e) => setOtherIncome({ otherIncomeTaxRate: parseFloat(e.target.value) || 0 })}
                placeholder="30"
                hint="Applicable tax rate (e.g. 30% for short-term trading)"
              />
              {grossOtherMonthly > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Gross Other Income</span>
                    <span className="font-medium">{formatINR(grossOtherMonthly, true)}/mo</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600 dark:text-gray-400">Tax ({otherIncome.otherIncomeTaxRate}%)</span>
                    <span className="font-medium text-red-500">– {formatINR(grossOtherMonthly * otherIncome.otherIncomeTaxRate / 100, true)}/mo</span>
                  </div>
                  <div className="flex justify-between mt-1 pt-1 border-t dark:border-gray-700">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">Net Other Income</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatINR(netOtherMonthly, true)}/mo</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card title="Assets">
            <div className="space-y-4">
              {ASSET_CATEGORIES.map((cat) => (
                <Input
                  key={cat.key}
                  label={`${cat.icon} ${cat.label}`}
                  prefix="₹"
                  type="number"
                  value={otherIncome[cat.key as AssetKey] || ''}
                  onChange={(e) => setOtherIncome({ [cat.key]: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Results Right */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="Total Assets"
              value={formatINR(totalAssets, true)}
              color="green"
            />
            <MetricCard
              label="Net Other Income"
              value={formatINR(netOtherMonthly, true)}
              sub="per month after tax"
              color="blue"
            />
          </div>

          {/* Progress to ₹3 Cr */}
          <Card title="Progress to ₹3 Crore Target">
            <ProgressBar
              value={targetProgress}
              color={targetProgress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}
              height="h-3"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>Accumulated: {formatINR(totalAssets, true)}</span>
              <span>Gap: {formatINR(Math.max(0, TARGET - totalAssets), true)}</span>
            </div>
          </Card>

          {/* Down Payment Readiness */}
          <Card title="Down Payment Status">
            <div className="space-y-3">
              <ProgressBar
                value={dpProgress}
                color={dpProgress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}
                height="h-2.5"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Saved: {formatINR(totalAssets, true)}</span>
                <span>Target DP: {formatINR(dpTarget, true)}</span>
              </div>
              <div className={`text-center py-2 rounded-lg font-semibold text-sm ${
                dpProgress >= 100
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              }`}>
                {dpProgress >= 100
                  ? '✓ Down payment ready!'
                  : `₹${formatINR(dpGap, true)} more needed for down payment`}
              </div>
            </div>
          </Card>

          {/* Asset Breakdown */}
          <Card title="Asset Breakdown">
            <div className="space-y-3">
              {ASSET_CATEGORIES.filter((cat) => otherIncome[cat.key as AssetKey] > 0).map((cat) => {
                const val = otherIncome[cat.key as AssetKey];
                return (
                  <div key={cat.key} className="flex items-center gap-3">
                    <span className="text-lg">{cat.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">{cat.label}</span>
                        <span className="font-medium text-gray-800 dark:text-gray-100">{formatINR(val, true)}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${totalAssets > 0 ? (val / totalAssets) * 100 : 0}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">
                      {totalAssets > 0 ? ((val / totalAssets) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                );
              })}
              {totalAssets === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3">
                  Add asset values above to see breakdown
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* SIP Goal Planner */}
      <Card title="SIP Goal Planner">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          How long until your investments reach the down payment goal?
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              label="Monthly SIP Amount"
              prefix="₹"
              type="number"
              value={sipAmount || ''}
              onChange={(e) => setSipAmount(parseFloat(e.target.value) || 0)}
              placeholder="10000"
            />
            <Input
              label="Expected Annual Return"
              suffix="% p.a."
              type="number"
              step="0.5"
              value={sipReturn || ''}
              onChange={(e) => setSipReturn(parseFloat(e.target.value) || 0)}
              placeholder="12"
            />
          </div>
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
              {dpGap > 0 ? (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Months to reach down payment goal</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                    {monthsToDP > 0 ? `${monthsToDP}` : '—'}
                  </p>
                  {monthsToDP > 0 && (
                    <p className="text-sm text-blue-500 dark:text-blue-400 mt-1">
                      {Math.floor(monthsToDP / 12)}y {monthsToDP % 12}m
                    </p>
                  )}
                </>
              ) : (
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold py-2">
                  ✓ Down payment already covered!
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                <p className="text-gray-500 dark:text-gray-400">12 months</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{formatINR(sip12m, true)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                <p className="text-gray-500 dark:text-gray-400">3 years</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{formatINR(sip36m, true)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                <p className="text-gray-500 dark:text-gray-400">5 years</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{formatINR(sip60m, true)}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
