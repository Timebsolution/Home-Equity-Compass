

import React, { useState, useEffect } from 'react';
import { Trash2, Lock, Unlock, Percent, Calendar, Settings2, DollarSign, Home, Copy, Table2, Globe, Trophy, TrendingUp, Link, Eye, EyeOff, PlusCircle } from 'lucide-react';
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
    theme,
    disabled = false
}: { 
    label: string, 
    value: number, 
    onChange: (val: number) => void, 
    min: number, 
    max: number, 
    step: number, 
    unit?: string, 
    theme: Theme,
    disabled?: boolean
}) => {
    const inputClass = theme === 'light' ? 'bg-white border-gray-300' : 'bg-black/20 border-gray-600 text-white';
    const labelColor = theme === 'light' ? 'text-gray-500' : 'text-gray-400';

    const [localStr, setLocalStr] = useState(value.toString());
    const [focused, setFocused] = useState(false);

    // Sync from prop only when not being edited by user to prevent jumping
    useEffect(() => {
        if (!focused) {
            setLocalStr(value.toString());
        }
    }, [value, focused]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        
        // Strip leading zero if it's not a decimal point (e.g. "05" -> "5")
        // But allow "0." for decimals
        if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
            val = val.replace(/^0+/, ''); 
            if (val === '') val = '0'; // Handle case where user typed 00 -> 0
        }

        // Allow numeric characters and one dot, or empty
        if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
            setLocalStr(val);
            if (val === '') {
                onChange(0);
            } else {
                const num = parseFloat(val);
                if (!isNaN(num)) onChange(num);
            }
        }
    };

    return (
        <div className={`mb-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-center mb-1">
                <label className={`text-[10px] font-semibold ${labelColor}`}>{label}</label>
                <div className="relative w-20">
                    <input 
                        type="text"
                        inputMode="decimal"
                        value={localStr} 
                        onChange={handleTextChange}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        disabled={disabled}
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
                disabled={disabled}
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
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (field: keyof LoanScenario, value: any) => {
    const numValue = parseFloat(value);
    onUpdate(scenario.id, { [field]: isNaN(numValue) ? value : numValue });
  };

  const toggleLock = (field: 'lockFMV' | 'lockLoan' | 'lockRent' | 'lockRentIncome' | 'lockInvestment') => {
    onUpdate(scenario.id, { [field]: !scenario[field] });
  };

  const toggleTaxMode = () => {
      onUpdate(scenario.id, { usePropertyTaxRate: !scenario.usePropertyTaxRate });
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

  const toggleSecondLoan = () => {
      if (scenario.hasSecondLoan) {
          onUpdate(scenario.id, { hasSecondLoan: false, secondLoanAmount: 0 });
      } else {
          onUpdate(scenario.id, { 
              hasSecondLoan: true, 
              secondLoanAmount: 50000, 
              secondLoanInterestRate: 3.0,
              secondLoanTermYears: 30,
              secondLoanYearsRemaining: 30
          });
      }
  };

  // --- Style Helpers based on Theme (Night is now Neutral Gray) ---
  const cardBg = theme === 'light' ? 'bg-white' : 'bg-neutral-800';
  const labelColor = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
  const textColor = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
  const advancedBg = theme === 'light' ? 'bg-gray-50' : 'bg-black/30';
  const badgeGlobal = "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
  const badgeManual = "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300";

  // Dynamic layout based on expansion state
  const containerPadding = isExpanded ? 'p-4' : 'py-3 px-4';
  const containerLayout = isExpanded ? 'flex flex-col gap-2' : 'flex flex-row items-center justify-between';

  // Calculate discrete months for display to avoid confusion
  const simulatedMonths = Math.round(projectionYears * 12);

  // --- CLEAN STRUCTURE CALCULATIONS ---
  // Round components individually first to ensure visual consistency with the grid
  const rPrincipal = Math.round(calculated.principalPaid);
  const rTax = Math.round(calculated.taxRefund);
  const rRent = Math.round(calculated.accumulatedRentalIncome);
  const rAppreciation = Math.round(calculated.totalAppreciation);
  const rInvGain = Math.round(calculated.investmentPortfolio - calculated.totalInvestmentContribution);

  // 1. Total Gain (Wealth Generated: Amortized Equity + Cash Flow + Investment Growth)
  // Use rounded components so Total Gain >= Money Returned
  const displayTotalGain = rPrincipal + rTax + rRent + rAppreciation + rInvGain;

  // 2. Your Money Returned (Hard Savings + Cash Benefits, excluding Appreciation/Investment)
  // Represents strictly what the payment generated in recoverable value.
  const displayMoneyReturned = rPrincipal + rTax + rRent;

  // 3. Cash Back If Sell (Absolute Exit Equity)
  const displayCashBack = calculated.equity;

  return (
    <div 
      className={`${cardBg} rounded-xl shadow-lg border-t-4 ${containerPadding} ${containerLayout} relative transition-all duration-300 hover:shadow-xl group`}
      style={{ borderColor: isWinner ? '#10b981' : scenario.color, height: 'fit-content' }}
    >
      {/* Expanded View */}
      {isExpanded && (
        <>
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
                    <button 
                        onClick={() => setIsExpanded(false)} 
                        className="text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 p-1" 
                        title="Hide Details"
                    >
                        <EyeOff size={16} />
                    </button>
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

            {/* Content Body - Split Layout for Compactness */}
            <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-8 mt-1">
                
                {/* LEFT SIDE: Inputs / Meta / Controls */}
                <div className="flex flex-col gap-2">
                    {/* Sub Header Info */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-0.5">
                        {!scenario.isInvestmentOnly && (
                            <div>
                                {scenario.isRentOnly 
                                    ? 'Rent Growth' 
                                    : `${scenario.interestRate}% · ${formatCurrency(scenario.loanAmount)}`
                                } · after {projectionYears.toFixed(1)} years ({simulatedMonths} mos)
                            </div>
                        )}
                        {scenario.isInvestmentOnly && (
                            <div>Investment Strategy · {projectionYears.toFixed(1)} years</div>
                        )}
                        <div className="font-semibold text-brand-600 dark:text-brand-400">Total Gain: {formatCurrency(displayTotalGain)}</div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex justify-start">
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

                    {/* Toggle Edit / Advanced */}
                    <button 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`flex items-center gap-1 text-xs font-semibold ${theme === 'light' ? 'text-gray-500 hover:text-brand-600 bg-gray-100' : 'text-gray-400 hover:text-brand-400 bg-white/10'} w-full justify-center py-1.5 rounded transition-colors mt-1`}
                    >
                        <Settings2 size={12} />
                        {showAdvanced ? 'Hide Details' : 'Edit Details'}
                    </button>

                    {/* --- INVESTMENT ONLY INPUTS --- */}
                    {scenario.isInvestmentOnly && (
                        <div className={`p-3 rounded-lg ${advancedBg} border ${theme==='light'?'border-gray-200':'border-gray-700'} space-y-3 mt-2`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">Parameters</span>
                                <button onClick={() => toggleLock('lockInvestment')} className={`text-[9px] px-1.5 py-0.5 rounded border ${!scenario.lockInvestment ? badgeGlobal : badgeManual}`}>
                                    {!scenario.lockInvestment ? "Global" : "Manual"}
                                </button>
                            </div>
                            <SliderInput 
                                label="Starting Capital" 
                                value={scenario.investmentCapital ?? 100000} 
                                onChange={v => onUpdate(scenario.id, {investmentCapital: v})} 
                                min={0} max={1000000} step={5000} theme={theme}
                                disabled={!scenario.lockInvestment}
                            />
                            <SliderInput 
                                label="Monthly Contribution" 
                                value={scenario.investmentMonthly ?? 0} 
                                onChange={v => onUpdate(scenario.id, {investmentMonthly: v})} 
                                min={0} max={10000} step={100} theme={theme} 
                                disabled={!scenario.lockInvestment}
                            />
                            <SliderInput 
                                label="Return Rate (%)" 
                                value={scenario.investmentRate ?? 5} 
                                onChange={v => onUpdate(scenario.id, {investmentRate: v})} 
                                min={0} max={15} step={0.1} theme={theme} 
                                disabled={!scenario.lockInvestment}
                            />
                        </div>
                    )}

                    {/* --- ADVANCED INPUTS (Buy/Rent) --- */}
                    {showAdvanced && !scenario.isInvestmentOnly && (
                    <div className={`${advancedBg} border ${theme==='light'?'border-gray-200':'border-gray-700'} p-3 rounded-lg space-y-3 mt-2 text-left animate-in fade-in slide-in-from-top-1`}>
                        {/* LOAN DETAILS (Buy Only) */}
                        {!scenario.isRentOnly && (
                        <div className="space-y-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">Loan Details</span>
                                <button onClick={() => toggleLock('lockLoan')} className={`text-[9px] px-1.5 py-0.5 rounded border ${scenario.lockLoan ? badgeManual : badgeGlobal}`}>
                                    {scenario.lockLoan ? "Manual" : "Global"}
                                </button>
                            </div>
                            <SliderInput label="Loan Amount" value={scenario.loanAmount} onChange={v => handleChange('loanAmount', v)} min={50000} max={2000000} step={5000} theme={theme} />
                            <SliderInput label="Interest Rate (%)" value={scenario.interestRate} onChange={v => handleChange('interestRate', v)} min={0} max={15} step={0.125} theme={theme} />
                            <div className="grid grid-cols-2 gap-2">
                                <SliderInput label="Yrs Left" value={scenario.yearsRemaining} onChange={v => handleChange('yearsRemaining', v)} min={0} max={40} step={1} theme={theme} />
                                <SliderInput label="Mos Left" value={scenario.monthsRemaining} onChange={v => handleChange('monthsRemaining', v)} min={0} max={11} step={1} theme={theme} />
                            </div>

                            {/* 2nd Loan Toggle Section */}
                            {!scenario.hasSecondLoan && (
                                <button 
                                    onClick={toggleSecondLoan}
                                    className={`w-full text-[10px] py-1 mt-2 border border-dashed rounded flex items-center justify-center gap-1 opacity-60 hover:opacity-100 transition-opacity ${theme === 'light' ? 'border-gray-400 text-gray-600' : 'border-gray-500 text-gray-300'}`}
                                >
                                    <PlusCircle size={10} /> Add 2nd Loan
                                </button>
                            )}
                            
                            {/* 2nd Loan Inputs */}
                            {scenario.hasSecondLoan && (
                                <div className={`mt-2 pt-2 border-t border-dashed ${theme==='light'?'border-gray-300':'border-gray-600'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">2nd Loan / HELOC</span>
                                        <button onClick={toggleSecondLoan} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded">
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                    <SliderInput label="Loan Amount" value={scenario.secondLoanAmount} onChange={v => handleChange('secondLoanAmount', v)} min={0} max={500000} step={1000} theme={theme} />
                                    <SliderInput label="Rate (%)" value={scenario.secondLoanInterestRate} onChange={v => handleChange('secondLoanInterestRate', v)} min={0} max={15} step={0.125} theme={theme} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <SliderInput label="Yrs Left" value={scenario.secondLoanYearsRemaining} onChange={v => handleChange('secondLoanYearsRemaining', v)} min={0} max={40} step={1} theme={theme} />
                                        <SliderInput label="Mos Left" value={scenario.secondLoanMonthsRemaining} onChange={v => handleChange('secondLoanMonthsRemaining', v)} min={0} max={11} step={1} theme={theme} />
                                    </div>
                                </div>
                            )}
                        </div>
                        )}

                        {/* RENT DETAILS (Rent Only) */}
                        {scenario.isRentOnly && (
                        <div className="space-y-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Rent Settings</span>
                            <SliderInput label="Monthly Rent" value={scenario.rentMonthly} onChange={v => handleChange('rentMonthly', v)} min={500} max={10000} step={50} theme={theme} />
                            <SliderInput label="Annual Inc (%)" value={scenario.rentIncreasePerYear} onChange={v => handleChange('rentIncreasePerYear', v)} min={0} max={10} step={0.1} theme={theme} />
                        </div>
                        )}

                        {/* EXPENSES (Buy Only) */}
                        {!scenario.isRentOnly && (
                        <div className="space-y-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">Expenses</span>
                                <button onClick={() => toggleLock('lockFMV')} className={`text-[9px] px-1.5 py-0.5 rounded border ${scenario.lockFMV ? badgeManual : badgeGlobal}`}>
                                    {scenario.lockFMV ? "Manual" : "Global"}
                                </button>
                            </div>
                            
                            {/* Property Tax with Dollar/Percentage Toggle */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className={`text-[10px] font-semibold ${labelColor}`}>Property Tax</label>
                                    <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 p-0.5 rounded text-[9px]">
                                        <button 
                                            onClick={() => scenario.usePropertyTaxRate && toggleTaxMode()}
                                            className={`px-1.5 py-0.5 rounded ${!scenario.usePropertyTaxRate ? 'bg-white dark:bg-gray-600 shadow text-brand-600' : 'text-gray-500'}`}
                                        >
                                            $
                                        </button>
                                        <button 
                                            onClick={() => !scenario.usePropertyTaxRate && toggleTaxMode()}
                                            className={`px-1.5 py-0.5 rounded ${scenario.usePropertyTaxRate ? 'bg-white dark:bg-gray-600 shadow text-brand-600' : 'text-gray-500'}`}
                                        >
                                            %
                                        </button>
                                    </div>
                                </div>
                                
                                {scenario.usePropertyTaxRate ? (
                                    <>
                                        <SliderInput 
                                            label="Annual Rate (%)" 
                                            value={scenario.propertyTaxRate ?? 1.25} 
                                            onChange={v => handleChange('propertyTaxRate', v)} 
                                            min={0} max={5} step={0.01} theme={theme} 
                                        />
                                        <div className="text-[9px] text-right text-gray-400 -mt-1 mb-2">
                                            ≈ {formatCurrency(scenario.homeValue * ((scenario.propertyTaxRate || 0)/100))}/yr
                                        </div>
                                    </>
                                ) : (
                                    <SliderInput 
                                        label="Amount ($/yr)" 
                                        value={scenario.propertyTax} 
                                        onChange={v => handleChange('propertyTax', v)} 
                                        min={0} max={50000} step={100} theme={theme} 
                                    />
                                )}
                            </div>

                            <SliderInput label="Insurance ($/yr)" value={scenario.homeInsurance} onChange={v => handleChange('homeInsurance', v)} min={0} max={10000} step={50} theme={theme} />
                            <SliderInput label="HOA ($/yr)" value={scenario.hoa} onChange={v => handleChange('hoa', v)} min={0} max={24000} step={50} theme={theme} />
                            <SliderInput label="PMI ($/yr)" value={scenario.pmi} onChange={v => handleChange('pmi', v)} min={0} max={10000} step={50} theme={theme} />
                            <SliderInput label="Marginal Tax Rate (%)" value={scenario.taxRefundRate} onChange={v => handleChange('taxRefundRate', v)} min={0} max={50} step={1} theme={theme} />
                            <SliderInput label="Home Value" value={scenario.homeValue} onChange={v => handleChange('homeValue', v)} min={100000} max={3000000} step={5000} theme={theme} />
                        </div>
                        )}

                        {/* CASH & PAYMENTS (Buy Only) */}
                        {!scenario.isRentOnly && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">Cash & Payments</span>
                                <button onClick={() => toggleLock('lockRentIncome')} className={`text-[9px] px-1.5 py-0.5 rounded border ${scenario.lockRentIncome ? badgeManual : badgeGlobal}`}>
                                    {scenario.lockRentIncome ? "Manual Rent" : "Global Rent"}
                                </button>
                            </div>
                            <SliderInput label="Down Payment" value={scenario.downPayment} onChange={v => handleChange('downPayment', v)} min={0} max={1000000} step={5000} theme={theme} />
                            <SliderInput label="One-Time Extra" value={scenario.oneTimeExtraPayment} onChange={v => handleChange('oneTimeExtraPayment', v)} min={0} max={500000} step={1000} theme={theme} />
                            
                            {/* Rental Income Input */}
                            <div>
                                <SliderInput label="Rental Income ($/mo)" value={scenario.rentalIncome || 0} onChange={v => handleChange('rentalIncome', v)} min={0} max={10000} step={50} theme={theme} />
                                
                                <div className="flex items-center gap-2 mb-2 mt-1 justify-end">
                                    <label className={`text-[9px] flex items-center gap-1 ${labelColor} cursor-pointer`}>
                                        <input 
                                            type="checkbox" 
                                            checked={scenario.rentalIncomeTaxEnabled} 
                                            onChange={(e) => handleChange('rentalIncomeTaxEnabled', e.target.checked)}
                                            className="rounded text-brand-600 focus:ring-brand-500 w-3 h-3"
                                        />
                                        Taxable Income
                                    </label>
                                </div>

                                {scenario.rentalIncomeTaxEnabled && (
                                    <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                                        <SliderInput 
                                            label="Tax Rate (%)" 
                                            value={scenario.rentalIncomeTaxRate ?? 20} 
                                            onChange={v => handleChange('rentalIncomeTaxRate', v)} 
                                            min={0} max={50} step={1} 
                                            theme={theme} 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        )}
                    </div>
                    )}
                </div>

                {/* RIGHT SIDE: Metrics & Results */}
                <div className="flex flex-col gap-3">
                    {/* Monthly Payment Section */}
                    {!scenario.isInvestmentOnly && (
                        !scenario.isRentOnly ? (
                            <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-blue-50/50' : 'bg-blue-900/10'} border ${theme==='light'?'border-blue-100':'border-blue-900/30'}`}>
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Monthly PITI</span>
                                    <span className={`font-bold text-base ${textColor}`}>{formatCurrency(calculated.totalMonthlyPayment)}</span>
                                </div>
                                <div className="text-[9px] text-gray-400 flex flex-wrap justify-between gap-1">
                                    {/* Breakdown: If 2 loans, split P&I */}
                                    {scenario.hasSecondLoan ? (
                                        <>
                                            <span className="w-full flex justify-between">
                                                <span>1st P&I: {formatCurrency(calculated.monthlyFirstPI)}</span>
                                                <span>2nd P&I: {formatCurrency(calculated.monthlySecondPI)}</span>
                                            </span>
                                        </>
                                    ) : (
                                        <span>P&I: {formatCurrency(calculated.monthlyPrincipalAndInterest)}</span>
                                    )}
                                    <div className="flex gap-2 w-full justify-between mt-0.5 border-t border-dashed border-gray-600/20 pt-0.5">
                                        <span>Tax: {formatCurrency(calculated.monthlyTax)}</span>
                                        <span>Ins: {formatCurrency(calculated.monthlyInsurance)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-orange-50/50' : 'bg-orange-900/10'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Monthly Rent</span>
                                    <span className={`font-bold text-base ${textColor}`}>{formatCurrency(calculated.totalMonthlyPayment)}</span>
                                </div>
                            </div>
                        )
                    )}

                    {/* Detailed Metrics Grid - 2 Column Dense */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] leading-tight">
                        <div className={`${labelColor}`}>Total Paid:</div>
                        <div className="text-red-500 font-medium text-right">{formatCurrency(calculated.totalPaid)}</div>
                        
                        {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                            <>
                                {/* CHANGE: Rename Total Equity to Principal Paid to be accurate */}
                                <div className={`${labelColor}`}>Principal Paid:</div>
                                <div className="text-green-500 font-medium text-right">+{formatCurrency(calculated.principalPaid)}</div>
                                
                                <div className={`${labelColor}`}>Avg Equity/Mo:</div>
                                <div className="text-green-500 font-medium text-right">+{formatCurrency(calculated.averageEquityPerMonth)}</div>
                                
                                <div className={`${labelColor}`}>Tax Refund:</div>
                                <div className="text-green-500 font-medium text-right">+{formatCurrency(calculated.taxRefund)}</div>

                                {scenario.downPayment > 0 && (
                                    <>
                                        <div className={`${labelColor}`}>Down Pmt:</div>
                                        <div className="text-red-500 font-medium text-right">-{formatCurrency(scenario.downPayment)}</div>
                                    </>
                                )}
                            </>
                        )}

                        <div className={`col-span-2 border-t pt-1 mt-1 ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}></div>

                        <div className="font-bold">Net Cost:</div>
                        <div className={`${calculated.netCost < 0 ? 'text-red-500' : 'text-green-500'} font-bold text-right`}>
                            {formatCurrency(calculated.netCost)}
                        </div>
                        
                        {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                             <>
                                <div className={`${labelColor}`}>Est. Value:</div>
                                <div className={`${textColor} text-right`}>{formatCurrency(calculated.futureHomeValue)}</div>
                             </>
                        )}
                    </div>

                    {/* CLEAN STRUCTURE RESULTS SECTION */}
                    <div className={`p-2 rounded-lg border mt-auto ${theme === 'light' ? 'bg-green-50/30 border-green-100' : 'bg-green-900/10 border-green-900/30'}`}>
                        
                        {/* 1. TOTAL GAIN (Wealth Generated during period) */}
                        <div className="flex justify-between items-center mb-1">
                            <span className={`${labelColor} font-bold text-xs`}>Total Gain</span>
                            <span className="text-emerald-500 font-bold text-base">
                                {formatCurrency(displayTotalGain)}
                            </span>
                        </div>

                        {/* 2. YOUR MONEY RETURNED (Hard Savings + Cash Benefits) */}
                        <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className={`${labelColor}`}>Your Money Returned</span>
                            <span className={`${textColor} font-semibold`}>
                                {formatCurrency(displayMoneyReturned)}
                            </span>
                        </div>

                        {/* 3. CASH BACK IF SELL (Absolute Exit Equity) */}
                        {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                            <div className="flex justify-between items-center text-[10px] pt-1 border-t border-dashed border-gray-600/20">
                                <span className={`${labelColor}`}>Cash Back If Sell</span>
                                <span className={`${textColor}`}>{formatCurrency(displayCashBack)}</span>
                            </div>
                        )}
                    </div>

                    {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                        <button 
                            onClick={() => onViewSchedule(scenario.id)}
                            className={`w-full py-1 text-[10px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${theme === 'light' ? 'text-gray-400 hover:text-brand-600 hover:bg-gray-50' : 'text-gray-500 hover:text-brand-400 hover:bg-white/5'}`}
                        >
                            <Table2 size={12} /> View Amortization Schedule
                        </button>
                    )}
                </div>
            </div>
        </>
      )}

      {/* Collapsed View */}
      {!isExpanded && (
        <>
            <div className="flex items-center gap-2">
                 <span className={`font-bold ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>
                    {scenario.name}
                 </span>
            </div>
            
            <button 
                onClick={() => setIsExpanded(true)} 
                className="text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 p-1"
                title="Show Details"
            >
                <Eye size={20} />
            </button>
        </>
      )}
    </div>
  );
};
