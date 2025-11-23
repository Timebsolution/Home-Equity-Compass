
import React, { useState } from 'react';
import { Trash2, Lock, Unlock, Percent, Calendar, Settings2, DollarSign, Home, Copy, Table2, Globe, Trophy, TrendingUp, Link } from 'lucide-react';
import { LoanScenario, CalculatedLoan } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Theme } from '../App';

interface LoanCardProps {
  scenario: LoanScenario;
  calculated: CalculatedLoan;
  onUpdate: (id: string, updates: Partial<LoanScenario>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onViewSchedule: (id: string) => void;
  onOpenImport: (id: string) => void;
  canRemove: boolean;
  theme: Theme;
  projectionYears: number;
  isWinner: boolean;
}

const SliderInput = ({ 
    label, 
    value, 
    onChange, 
    min, 
    max, 
    step, 
    unit, 
    theme 
}: { 
    label: string, 
    value: number, 
    onChange: (val: number) => void, 
    min: number, 
    max: number, 
    step: number, 
    unit?: string, 
    theme: Theme 
}) => {
    const inputClass = theme === 'light' ? 'bg-white border-gray-300' : 'bg-black/20 border-gray-600 text-white';
    const labelColor = theme === 'light' ? 'text-gray-500' : 'text-gray-400';

    return (
        <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
                <label className={`text-[10px] font-semibold ${labelColor}`}>{label}</label>
                <div className="relative w-20">
                    <input 
                        type="number" 
                        value={value} 
                        onChange={e => onChange(parseFloat(e.target.value))} 
                        className={`w-full text-xs p-0.5 text-right border rounded ${inputClass}`}
                    />
                    {unit && <span className="absolute right-6 top-0.5 text-[10px] text-gray-400 opacity-0">{unit}</span>}
                </div>
            </div>
            <input 
                type="range" 
                min={min} 
                max={max} 
                step={step} 
                value={value} 
                onChange={e => onChange(parseFloat(e.target.value))} 
                className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-600 dark:bg-gray-600" 
            />
        </div>
    );
};

export const LoanCard: React.FC<LoanCardProps> = ({ 
  scenario, 
  calculated, 
  onUpdate, 
  onRemove,
  onDuplicate,
  onViewSchedule,
  onOpenImport,
  canRemove,
  theme,
  projectionYears,
  isWinner
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (field: keyof LoanScenario, value: any) => {
    const numValue = parseFloat(value);
    onUpdate(scenario.id, { [field]: isNaN(numValue) ? value : numValue });
  };

  const toggleLock = (field: 'lockFMV' | 'lockLoan' | 'lockRent') => {
    onUpdate(scenario.id, { [field]: !scenario[field] });
  };

  const cycleMode = () => {
    if (scenario.isInvestmentOnly) {
        onUpdate(scenario.id, { isInvestmentOnly: false, isRentOnly: false }); // Back to Buy
    } else if (scenario.isRentOnly) {
        onUpdate(scenario.id, { isRentOnly: false, isInvestmentOnly: true }); // Rent -> Invest
    } else {
        onUpdate(scenario.id, { isRentOnly: true }); // Buy -> Rent
    }
  };

  // --- Style Helpers based on Theme ---
  const cardBg = theme === 'light' ? 'bg-white' : theme === 'night' ? 'bg-slate-800' : 'bg-neutral-800';
  const labelColor = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
  const textColor = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
  const advancedBg = theme === 'light' ? 'bg-gray-50' : 'bg-black/30';
  const badgeGlobal = "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
  const badgeManual = "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300";

  return (
    <div 
      className={`${cardBg} rounded-xl shadow-lg border-t-4 p-5 flex flex-col gap-4 relative transition-all duration-300 hover:shadow-xl group`}
      style={{ borderColor: isWinner ? '#10b981' : scenario.color }}
    >
      {/* WINNER BADGE */}
      {isWinner && (
          <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Trophy size={10} /> WINNER
          </div>
      )}

      {/* Header */}
      <div className={`flex justify-between items-center pb-2 border-b ${theme === 'light' ? 'border-gray-100' : 'border-gray-700'}`}>
        <input 
          type="text" 
          value={scenario.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={`font-bold text-lg bg-transparent border-b border-dashed ${theme === 'light' ? 'text-gray-800 border-gray-300 focus:border-brand-500' : 'text-gray-100 border-gray-600 focus:border-brand-400'} focus:outline-none w-2/3`}
        />
        <div className="flex gap-1">
            <button onClick={() => onOpenImport(scenario.id)} className="text-gray-400 hover:text-purple-500 p-1" title="Update from Zillow/Propwire">
                <Link size={16} />
            </button>
            <button onClick={() => onDuplicate(scenario.id)} className="text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 p-1" title="Duplicate">
                <Copy size={16} />
            </button>
            {canRemove && (
            <button onClick={() => onRemove(scenario.id)} className="text-gray-400 hover:text-red-500 p-1" title="Remove">
                <Trash2 size={16} />
            </button>
            )}
        </div>
      </div>

      {/* Sub Header Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-0.5">
          {!scenario.isInvestmentOnly && (
            <div>{scenario.isRentOnly ? 'Rent Growth' : `${scenario.interestRate}% · ${formatCurrency(scenario.loanAmount)}`} · after {projectionYears.toFixed(1)} years</div>
          )}
          {scenario.isInvestmentOnly && (
             <div>Investment Strategy · {projectionYears.toFixed(1)} years</div>
          )}
          <div className="font-semibold text-brand-600 dark:text-brand-400">Net Worth after {projectionYears.toFixed(1)} years: {formatCurrency(calculated.netWorth)}</div>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center mb-1">
        <button 
            onClick={cycleMode}
            className={`text-[10px] px-3 py-1 rounded-full border transition-colors flex items-center gap-2 font-medium ${
                scenario.isInvestmentOnly 
                ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                : scenario.isRentOnly 
                    ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' 
                    : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
            }`}
        >
            {scenario.isInvestmentOnly ? <TrendingUp size={12} /> : scenario.isRentOnly ? <Home size={12} /> : <DollarSign size={12} />}
            {scenario.isInvestmentOnly ? "Investment Only" : scenario.isRentOnly ? "Rent Mode" : "Buy Mode"}
        </button>
      </div>

      {/* --- INVESTMENT ONLY CARD VIEW --- */}
      {scenario.isInvestmentOnly ? (
        <div className="space-y-4">
             <div className={`p-4 rounded-lg ${advancedBg} border ${theme==='light'?'border-gray-200':'border-gray-700'} space-y-4`}>
                 <SliderInput label="Starting Capital ($)" value={scenario.investmentCapital ?? 100000} onChange={v => onUpdate(scenario.id, {investmentCapital: v})} min={0} max={1000000} step={5000} theme={theme} />
                 <SliderInput label="Monthly Contribution ($)" value={scenario.investmentMonthly ?? 0} onChange={v => onUpdate(scenario.id, {investmentMonthly: v})} min={0} max={10000} step={100} theme={theme} />
                 <SliderInput label="Return Rate (%)" value={scenario.investmentRate ?? 5} onChange={v => onUpdate(scenario.id, {investmentRate: v})} min={0} max={15} step={0.1} theme={theme} />
                 
                 <div className="text-[10px] text-gray-500 italic mt-2">
                     * Overrides global investment settings for this card only.
                 </div>
             </div>
        </div>
      ) : (
        /* --- BUY / RENT MODES --- */
        <>
        {/* Toggle Edit / Advanced */}
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1 text-xs font-semibold ${theme === 'light' ? 'text-gray-500 hover:text-brand-600 bg-gray-100' : 'text-gray-400 hover:text-brand-400 bg-white/10'} mb-2 w-full justify-center py-2 rounded transition-colors`}
        >
          <Settings2 size={12} />
          {showAdvanced ? 'Hide Details' : 'Edit Details'}
        </button>

        {showAdvanced && (
          <div className={`${advancedBg} border ${theme==='light'?'border-gray-200':'border-gray-700'} p-4 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2`}>
             
             {/* LOAN DETAILS (Buy Only) */}
             {!scenario.isRentOnly && (
             <div className="space-y-3 pb-3 border-b border-gray-300 dark:border-gray-600">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Loan Details</span>
                    <button onClick={() => toggleLock('lockLoan')} className={`text-[9px] px-1.5 py-0.5 rounded border ${scenario.lockLoan ? badgeManual : badgeGlobal}`}>
                        {scenario.lockLoan ? "Manual" : "Global"}
                    </button>
                </div>
                <SliderInput label="Loan Amount ($)" value={scenario.loanAmount} onChange={v => handleChange('loanAmount', v)} min={50000} max={2000000} step={5000} theme={theme} />
                <SliderInput label="Interest Rate (%)" value={scenario.interestRate} onChange={v => handleChange('interestRate', v)} min={0} max={15} step={0.125} theme={theme} />
                <div className="grid grid-cols-2 gap-4">
                    <SliderInput label="Years Remaining" value={scenario.yearsRemaining} onChange={v => handleChange('yearsRemaining', v)} min={0} max={40} step={1} theme={theme} />
                    <SliderInput label="Months Remaining" value={scenario.monthsRemaining} onChange={v => handleChange('monthsRemaining', v)} min={0} max={11} step={1} theme={theme} />
                </div>
             </div>
             )}

             {/* RENT DETAILS (Rent Only) */}
             {scenario.isRentOnly && (
             <div className="space-y-3 pb-3 border-b border-gray-300 dark:border-gray-600">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Rent Settings</span>
                <SliderInput label="Monthly Rent ($)" value={scenario.rentMonthly} onChange={v => handleChange('rentMonthly', v)} min={500} max={10000} step={50} theme={theme} />
                <SliderInput label="Annual Increase (%)" value={scenario.rentIncreasePerYear} onChange={v => handleChange('rentIncreasePerYear', v)} min={0} max={10} step={0.1} theme={theme} />
                <div className="flex items-center justify-between text-xs">
                    <span className={labelColor}>Include Tax/Exp?</span>
                    <input type="checkbox" checked={scenario.rentIncludeTax} onChange={e => onUpdate(scenario.id, {rentIncludeTax: e.target.checked})} />
                </div>
                {scenario.rentIncludeTax && (
                    <SliderInput label="Expense Rate (%)" value={scenario.rentTaxRate} onChange={v => handleChange('rentTaxRate', v)} min={0} max={50} step={1} theme={theme} />
                )}
             </div>
             )}

             {/* EXPENSES (Buy Only) */}
             {!scenario.isRentOnly && (
             <div className="space-y-3 pb-3 border-b border-gray-300 dark:border-gray-600">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Annual Expenses</span>
                    <button onClick={() => toggleLock('lockFMV')} className={`text-[9px] px-1.5 py-0.5 rounded border ${scenario.lockFMV ? badgeManual : badgeGlobal}`}>
                        {scenario.lockFMV ? "Manual FMV" : "Global FMV"}
                    </button>
                </div>
                <SliderInput label="Property Tax ($/yr)" value={scenario.propertyTax} onChange={v => handleChange('propertyTax', v)} min={0} max={50000} step={100} theme={theme} />
                <SliderInput label="Home Insurance ($/yr)" value={scenario.homeInsurance} onChange={v => handleChange('homeInsurance', v)} min={0} max={10000} step={50} theme={theme} />
                <SliderInput label="HOA Fees ($/yr)" value={scenario.hoa} onChange={v => handleChange('hoa', v)} min={0} max={24000} step={50} theme={theme} />
                <SliderInput label="PMI ($/yr)" value={scenario.pmi} onChange={v => handleChange('pmi', v)} min={0} max={10000} step={50} theme={theme} />
                <SliderInput label="Tax Refund Rate (%)" value={scenario.taxRefundRate} onChange={v => handleChange('taxRefundRate', v)} min={0} max={50} step={1} theme={theme} />
                <SliderInput label="Current FMV ($)" value={scenario.homeValue} onChange={v => handleChange('homeValue', v)} min={100000} max={3000000} step={5000} theme={theme} />
             </div>
             )}

             {/* RENTAL INCOME (Buy Only - House Hacking) */}
             {!scenario.isRentOnly && (
             <div className="space-y-3 pb-3 border-b border-gray-300 dark:border-gray-600">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Rental Income</span>
                    <button onClick={() => toggleLock('lockRent')} className={`text-[9px] px-1.5 py-0.5 rounded border ${scenario.lockRent ? badgeManual : badgeGlobal}`}>
                        {scenario.lockRent ? "Manual" : "Global"}
                    </button>
                </div>
                <SliderInput label="Rental Income ($/mo)" value={scenario.rentMonthly} onChange={v => handleChange('rentMonthly', v)} min={0} max={10000} step={50} theme={theme} />
                <div className="flex items-center justify-between text-xs">
                    <span className={labelColor}>Include Tax/Exp?</span>
                    <input type="checkbox" checked={scenario.rentIncludeTax} onChange={e => onUpdate(scenario.id, {rentIncludeTax: e.target.checked})} />
                </div>
                {scenario.rentIncludeTax && (
                    <SliderInput label="Expense Rate (%)" value={scenario.rentTaxRate} onChange={v => handleChange('rentTaxRate', v)} min={0} max={50} step={1} theme={theme} />
                )}
             </div>
             )}

             {/* CASH / PAYMENTS */}
             {!scenario.isRentOnly && (
             <div className="space-y-3">
                 <span className="text-[10px] font-bold text-gray-400 uppercase">Cash & Payments</span>
                 <SliderInput label="Down Payment ($)" value={scenario.downPayment} onChange={v => handleChange('downPayment', v)} min={0} max={1000000} step={5000} theme={theme} />
                 <SliderInput label="One-Time Extra ($)" value={scenario.oneTimeExtraPayment} onChange={v => handleChange('oneTimeExtraPayment', v)} min={0} max={500000} step={1000} theme={theme} />
                 <SliderInput label="At Month #" value={scenario.oneTimeExtraPaymentMonth} onChange={v => handleChange('oneTimeExtraPaymentMonth', v)} min={1} max={360} step={1} theme={theme} />
             </div>
             )}
          </div>
        )}
        </>
      )}

      {/* METRICS & BREAKDOWN */}
      <div className={`mt-2 rounded-lg text-sm space-y-3`}>
         
         {/* Monthly Payment Section */}
         {!scenario.isInvestmentOnly && (
             !scenario.isRentOnly ? (
                 <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-blue-50/50' : 'bg-blue-900/10'}`}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase">Monthly PITI Payment</span>
                        <span className={`font-bold text-lg ${textColor}`}>{formatCurrency(calculated.totalMonthlyPayment)}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 flex justify-between gap-1">
                        <span>P&I: {formatCurrency(calculated.monthlyPrincipalAndInterest)}</span>
                        <span>Taxes: {formatCurrency(calculated.monthlyTax)}</span>
                        <span>Ins: {formatCurrency(calculated.monthlyInsurance)}</span>
                    </div>
                 </div>
             ) : (
                 <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-orange-50/50' : 'bg-orange-900/10'}`}>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase">Monthly Rent (Net)</span>
                        <span className={`font-bold text-lg ${textColor}`}>{formatCurrency(calculated.totalMonthlyPayment)}</span>
                    </div>
                 </div>
             )
         )}

         {/* Detailed Metrics List */}
         <div className="space-y-2 text-xs">
             <div className="flex justify-between">
                 <span className={`${labelColor}`}>
                    {scenario.isInvestmentOnly ? '💸 Total Cash Invested' : `💸 Total Paid (after ${projectionYears.toFixed(1)} years)`}
                 </span>
                 <span className="text-red-500 font-medium">{formatCurrency(calculated.totalPaid)}</span>
             </div>
             
             {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                 <>
                    <div className="flex justify-between">
                        <span className={`${labelColor}`}>💰 Total Equity Built (after {projectionYears.toFixed(1)} years)</span>
                        <span className="text-green-500 font-medium">+{formatCurrency(calculated.totalEquityBuilt)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className={`${labelColor}`}>📊 Avg Equity / Month (over period)</span>
                        <span className="text-green-500 font-medium">+{formatCurrency(calculated.averageEquityPerMonth)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className={`${labelColor}`}>📋 Tax Refund ({scenario.taxRefundRate}%)</span>
                        <span className="text-green-500 font-medium">+{formatCurrency(calculated.taxRefund)}</span>
                    </div>
                    
                    {scenario.downPayment > 0 && (
                        <div className="flex justify-between">
                            <span className={`${labelColor}`}>💵 Down Payment (cash in)</span>
                            <span className="text-red-500 font-medium">-{formatCurrency(scenario.downPayment)}</span>
                        </div>
                    )}
                 </>
             )}

             <div className={`flex justify-between pt-1 border-t ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
                 <span className="font-bold">
                    {scenario.isInvestmentOnly ? '💼 Total Contribution' : `💼 Net Cost (after ${projectionYears.toFixed(1)} years)`}
                 </span>
                 <span className={`${calculated.netCost < 0 ? 'text-red-500' : 'text-green-500'} font-bold`}>
                    {formatCurrency(calculated.netCost)}
                 </span>
             </div>

             {/* Home Value / Rent Metric */}
             {!scenario.isRentOnly && !scenario.isInvestmentOnly ? (
                 <div className="flex justify-between">
                     <span className={`${labelColor}`}>🏡 Est. Home Value at {projectionYears.toFixed(1)} years</span>
                     <span className={`${textColor}`}>{formatCurrency(calculated.futureHomeValue)}</span>
                 </div>
             ) : null}
         </div>

         {/* PROFIT / RETURN SECTION */}
         <div className={`mt-3 p-3 rounded-lg border ${theme === 'light' ? 'bg-green-50/30 border-green-100' : 'bg-green-900/10 border-green-900/30'}`}>
             {!scenario.isRentOnly && !scenario.isInvestmentOnly ? (
                 <>
                     <div className="flex justify-between text-xs mb-1">
                         <span className={`${labelColor}`}>📈 Equity Gain (Profit)</span>
                         <span className={`${textColor} font-semibold`}>{formatCurrency(calculated.profit)}</span>
                     </div>
                     {scenario.downPayment > 0 && (
                        <div className="flex justify-between text-xs mb-1">
                             <span className={`${labelColor}`}>📤 Down Payment Return:</span>
                             <span className={`${textColor} font-semibold`}>{formatCurrency(scenario.downPayment)}</span>
                        </div>
                     )}
                 </>
             ) : (
                 <div className="flex justify-between text-xs mb-1">
                     <span className={`${labelColor}`}>📈 Investment Profit:</span>
                     <span className={`${textColor} font-semibold`}>{formatCurrency(calculated.profit)}</span>
                 </div>
             )}

             {/* Show separate investment portfolio if exists */}
             {calculated.investmentPortfolio > 0 && !scenario.isInvestmentOnly && (
                 <div className="flex justify-between text-xs mb-1">
                     <span className={`${labelColor}`}>💰 Investment Portfolio:</span>
                     <span className={`${textColor} font-semibold`}>{formatCurrency(calculated.investmentPortfolio)}</span>
                 </div>
             )}
             
             <div className={`flex justify-between text-sm pt-2 border-t ${theme === 'light' ? 'border-green-200' : 'border-green-800'}`}>
                 <span className="font-bold text-gray-700 dark:text-gray-300">💼 Total Net Worth:</span>
                 <span className="font-black text-green-600 dark:text-green-400">
                    {formatCurrency(calculated.netWorth)}
                 </span>
             </div>
         </div>

      </div>

      {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
          <button 
            onClick={() => onViewSchedule(scenario.id)}
            className={`w-full py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${theme === 'light' ? 'text-gray-400 hover:text-brand-600 hover:bg-gray-50' : 'text-gray-500 hover:text-brand-400 hover:bg-white/5'}`}
          >
            <Table2 size={14} /> Schedule
          </button>
      )}
    </div>
  );
};
