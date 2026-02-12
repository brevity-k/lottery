'use client';

import { useState, useMemo } from 'react';
import {
  stateTaxData,
  FEDERAL_WITHHOLDING_RATE,
  FEDERAL_TOP_MARGINAL_RATE,
  LUMP_SUM_FACTOR,
} from '@/data/state-tax-rates';
import Card from '../ui/Card';

function formatMoney(amount: number): string {
  if (amount >= 1_000_000_000) return '$' + (amount / 1_000_000_000).toFixed(2) + 'B';
  if (amount >= 1_000_000) return '$' + (amount / 1_000_000).toFixed(2) + 'M';
  return '$' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export default function TaxCalculator() {
  const [jackpotStr, setJackpotStr] = useState('100000000');
  const [stateAbbr, setStateAbbr] = useState('NY');
  const [payoutType, setPayoutType] = useState<'lump' | 'annuity'>('lump');
  const [localTaxCity, setLocalTaxCity] = useState<string | null>(null);

  const jackpot = Number(jackpotStr) || 0;
  const state = stateTaxData.find(s => s.abbreviation === stateAbbr)!;

  const results = useMemo(() => {
    const gross = payoutType === 'lump' ? jackpot * LUMP_SUM_FACTOR : jackpot;
    const federalWithholding = gross * FEDERAL_WITHHOLDING_RATE;
    const federalAdditional = gross * (FEDERAL_TOP_MARGINAL_RATE - FEDERAL_WITHHOLDING_RATE);
    const totalFederal = federalWithholding + federalAdditional;
    const stateTax = gross * state.taxRate;

    let localTax = 0;
    let localTaxLabel = '';
    if (localTaxCity && state.localTaxes) {
      const local = state.localTaxes.find(l => l.city === localTaxCity);
      if (local) {
        localTax = gross * local.rate;
        localTaxLabel = local.city;
      }
    }

    const totalTax = totalFederal + stateTax + localTax;
    const netTakeHome = gross - totalTax;

    return {
      gross,
      federalWithholding,
      federalAdditional,
      totalFederal,
      stateTax,
      localTax,
      localTaxLabel,
      totalTax,
      netTakeHome,
    };
  }, [jackpot, state, payoutType, localTaxCity]);

  // Comparison data
  const lumpResults = useMemo(() => {
    const gross = jackpot * LUMP_SUM_FACTOR;
    const fed = gross * FEDERAL_TOP_MARGINAL_RATE;
    const st = gross * state.taxRate;
    return { gross, totalTax: fed + st, net: gross - fed - st };
  }, [jackpot, state]);

  const annuityResults = useMemo(() => {
    const gross = jackpot;
    const fed = gross * FEDERAL_TOP_MARGINAL_RATE;
    const st = gross * state.taxRate;
    return { gross, totalTax: fed + st, net: gross - fed - st };
  }, [jackpot, state]);

  return (
    <div className="space-y-8">
      {/* Input Form */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jackpot Amount ($)</label>
            <input
              type="number"
              value={jackpotStr}
              onChange={e => setJackpotStr(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="1000000"
              placeholder="100000000"
            />
            <div className="flex gap-2 mt-2">
              {[10_000_000, 100_000_000, 500_000_000, 1_000_000_000].map(v => (
                <button
                  key={v}
                  onClick={() => setJackpotStr(v.toString())}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  {formatMoney(v)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <select
              value={stateAbbr}
              onChange={e => { setStateAbbr(e.target.value); setLocalTaxCity(null); }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {stateTaxData.map(s => (
                <option key={s.abbreviation} value={s.abbreviation}>
                  {s.name} ({s.abbreviation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payout Option</label>
            <div className="flex gap-4">
              <button
                onClick={() => setPayoutType('lump')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 text-center font-medium transition-colors ${
                  payoutType === 'lump'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Lump Sum
              </button>
              <button
                onClick={() => setPayoutType('annuity')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 text-center font-medium transition-colors ${
                  payoutType === 'annuity'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Annuity
              </button>
            </div>
          </div>

          {state.localTaxes && state.localTaxes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Local Tax (Optional)</label>
              <select
                value={localTaxCity || ''}
                onChange={e => setLocalTaxCity(e.target.value || null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No local tax</option>
                {state.localTaxes.map(l => (
                  <option key={l.city} value={l.city}>
                    {l.city} ({(l.rate * 100).toFixed(2)}%)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Results */}
      {jackpot > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {payoutType === 'lump' ? 'Lump Sum' : 'Annuity'} Breakdown
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Advertised Jackpot</span>
              <span className="font-semibold text-lg">{formatMoney(jackpot)}</span>
            </div>

            {payoutType === 'lump' && (
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Lump Sum (est. {(LUMP_SUM_FACTOR * 100).toFixed(0)}% of advertised)</span>
                <span className="font-semibold text-lg">{formatMoney(results.gross)}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Federal Tax Withholding (24%)</span>
              <span className="font-medium text-red-600">-{formatMoney(results.federalWithholding)}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Additional Federal Tax (to 37%)</span>
              <span className="font-medium text-red-600">-{formatMoney(results.federalAdditional)}</span>
            </div>

            {state.taxRate > 0 && (
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{state.name} State Tax ({(state.taxRate * 100).toFixed(2)}%)</span>
                <span className="font-medium text-red-600">-{formatMoney(results.stateTax)}</span>
              </div>
            )}

            {state.taxRate === 0 && (
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{state.name} State Tax</span>
                <span className="font-medium text-green-600">$0 {state.notes ? `(${state.notes})` : ''}</span>
              </div>
            )}

            {results.localTax > 0 && (
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{results.localTaxLabel} Local Tax</span>
                <span className="font-medium text-red-600">-{formatMoney(results.localTax)}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-4 bg-green-50 rounded-lg px-4 mt-4">
              <span className="font-bold text-lg text-gray-900">Estimated Net Take-Home</span>
              <span className="font-bold text-2xl text-green-700">{formatMoney(results.netTakeHome)}</span>
            </div>

            <div className="text-center text-sm text-gray-500 mt-2">
              Total taxes: {formatMoney(results.totalTax)} ({((results.totalTax / results.gross) * 100).toFixed(1)}% effective rate)
            </div>
          </div>
        </Card>
      )}

      {/* Comparison Table */}
      {jackpot > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Lump Sum vs Annuity Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600"></th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Lump Sum</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Annuity (30 years)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-600">Gross Payout</td>
                  <td className="py-3 px-4 text-right font-medium">{formatMoney(lumpResults.gross)}</td>
                  <td className="py-3 px-4 text-right font-medium">{formatMoney(annuityResults.gross)}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-600">Total Taxes (Fed + State)</td>
                  <td className="py-3 px-4 text-right text-red-600">{formatMoney(lumpResults.totalTax)}</td>
                  <td className="py-3 px-4 text-right text-red-600">{formatMoney(annuityResults.totalTax)}</td>
                </tr>
                <tr className="bg-green-50">
                  <td className="py-3 px-4 font-bold">Net Take-Home</td>
                  <td className="py-3 px-4 text-right font-bold text-green-700">{formatMoney(lumpResults.net)}</td>
                  <td className="py-3 px-4 text-right font-bold text-green-700">{formatMoney(annuityResults.net)}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="py-3 px-4 text-gray-500">Annual Payment (annuity)</td>
                  <td className="py-3 px-4 text-right text-gray-400">N/A</td>
                  <td className="py-3 px-4 text-right font-medium">{formatMoney(annuityResults.net / 30)}/yr</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Annuity values assume equal payments over 30 years. Actual annuity payments are graduated (increase 5% annually).
            Tax calculations are estimates based on top marginal rates. Consult a tax professional for precise figures.
          </p>
        </Card>
      )}
    </div>
  );
}
