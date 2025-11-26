
import React, { useState, useEffect } from 'react';
import { Trash2, Lock, Unlock, Percent, Calendar, Settings2, DollarSign, Home, Copy, Table2, Globe, Trophy, TrendingUp, Link, Eye, EyeOff, PlusCircle, Info, ChevronDown, ChevronRight, PieChart, PiggyBank, CreditCard, Receipt, Building, Landmark, Wallet, Briefcase, Scale, Tag, LogOut, Clock, Calculator } from 'lucide-react';
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
  globalInvestmentSettings?: {
      globalCashInvestment: number;
      investmentReturnRate: number;
      globalMonthlyContribution: number;
      globalContributionFrequency: string;
  };
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
    disabled = false,
    className
}: { 
    label: string | React.ReactNode, 
    value: number, 
    onChange: (val: number) => void, 
    min: number, 
    max: number, 
    step: number, 
    unit?: string, 
    theme: Theme,
    disabled?: boolean,
    className?: string
}) => {
    const inputClass = theme === 'light' ? 'bg-white border-gray-300' : 'bg-black/20 border-gray-600 text-white';
    const labelColor = theme === 'light' ? 'text-gray-500' : 'text-gray-400';

    const [localStr, setLocalStr] = useState(value.toString());
    const [focused, setFocused] = useState(false);

    useEffect(() => {
        if (!focused) {
            setLocalStr(value.toString());
        }
    }, [value, focused]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
            val = val.replace(/^0+/, ''); 
            if (val === '') val = '0'; 
        }
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
        <div className={`mb-2 ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className || ''}`}>
            <div className="flex justify-between items-center mb-1">
                <label className={`text-[10px] font-semibold ${labelColor} flex items-center`}>{label}</label>
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

const Tooltip = ({ text }: { text: string }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div 
            className="relative inline-flex items-center ml-1 z-20"
            onMouseEnter={(e) => {
                e.stopPropagation();
                setIsVisible(true);
            }}
            onMouseLeave={(e) => {
                e.stopPropagation();
                setIsVisible(false);
            }}
            onClick={(e) => e.stopPropagation()} 
        >
            <div className={`cursor-help transition-colors ${isVisible ? 'text-brand-500' : 'text-gray-400 hover:text-gray-500'}`}>
                <Info size={12} />
            </div>
            {isVisible && (
                <div 
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[280px] p-3 bg-gray-900/95 backdrop-blur border border-gray-700 text-gray-100 text-[11px] leading-relaxed rounded-lg shadow-2xl z-50 whitespace-normal animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
                    style={{ minWidth: '180px' }}
                >
                    <div className="whitespace-pre-wrap">{text}</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/95"></div>
                </div>
            )}
        </div>
    );
};

const BreakdownRow = ({ 
    label, 
    value, 
    colorClass, 
    icon, 
    tooltip,
    bgClass
}: { 
    label: string, 
    value: string, 
    colorClass?: string, 
    icon?: React.ReactNode, 
    tooltip?: string,
    bgClass?: string
}) => (
    <div className={`flex justify-between items-center text-[10px] py-1 pl-2 pr-2 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors ${bgClass || ''}`}>
        <div className="flex items-center gap-2">
            {icon && <span className="opacity-70 text-gray-400">{icon}</span>}
            <div className="flex items-center gap-1">
                <span className="text-gray-500 dark:text-gray-400 font-medium">{label}</span>
                {tooltip && <Tooltip text={tooltip} />}
            </div>
        </div>
        <span className={`font-mono font-bold ${colorClass || 'text-gray-700 dark:text-gray-300'}`}>{value}</span>
    </div>
);

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
  isWinner,
  globalInvestmentSettings
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

  const cycleMode = () => {
    if (scenario.isInvestmentOnly) {
        onUpdate(scenario.id, { isInvestmentOnly: false, isRentOnly: false }); 
    } else if (scenario.isRentOnly) {
        onUpdate(scenario.id, { isRentOnly: false, isInvestmentOnly: true }); 
    } else {
        onUpdate(scenario.id, { isRentOnly: true }); 
    }
  };

  const cardBg = theme === 'light' ? 'bg-white' : 'bg-neutral-800';
  const labelColor = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
  const inputClass = theme === 'light' ? 'bg-white border-gray-300' : 'bg-black/20 border-gray-600 text-white';
  const advancedBg = theme === 'light' ? 'bg-gray-50' : 'bg-black/30';
  const badgeGlobal = "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
  const badgeManual = "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300";

  const simulatedMonths = Math.round(projectionYears * 12);

  const rPrincipal = Math.round(calculated.principalPaid);
  const rTax = Math.round(calculated.taxRefund);
  const rRent = Math.round(calculated.accumulatedRentalIncome);
  const rRentTax = Math.round(calculated.totalRentalTax || 0);
  const rAppreciation = Math.round(calculated.totalAppreciation);
  const rRealInvGain = Math.round(Math.max(0, calculated.investmentPortfolio - calculated.totalInvestmentContribution));
  const rSellingCosts = Math.round(calculated.sellingCosts);
  const rPropertyCosts = Math.round(calculated.totalPropertyCosts);
  const rTotalPaid = Math.round(calculated.totalPaid); // PITI + HOA + Extra
  const rClosing = Math.round(scenario.closingCosts || 0);
  const rDown = Math.round(scenario.downPayment || 0);
  const rMonthlyPITI = Math.round(calculated.totalMonthlyPayment);
  const rNetMonthly = Math.round(calculated.netMonthlyPayment);
  const rCapitalGainsTax = Math.round(calculated.capitalGainsTax || 0);
  const rInvContribution = Math.round(calculated.totalInvestmentContribution || 0);
  const rLoanBalance = Math.round(calculated.remainingBalance);
  const rEquityAtSale = Math.round(calculated.futureHomeValue - calculated.remainingBalance - calculated.sellingCosts);

  const displayTotalGain = calculated.profit;
  const displayCashBack = calculated.equity; // Cash After Sale (Equity - CapGains)

  const getSummaryText = () => {
    if (scenario.isInvestmentOnly) return `Investment Strategy · ${projectionYears.toFixed(1)} years`;
    if (scenario.isRentOnly) return `Rent Growth · ${projectionYears.toFixed(1)} years (${simulatedMonths} mos)`;
    return `${scenario.interestRate}% · ${formatCurrency(scenario.loanAmount)} · ${projectionYears.toFixed(1)} years (${simulatedMonths} mos)`;
  };
  
  const getPitiTitle = () => {
      if (scenario.isInvestmentOnly) return "Monthly Contribution";
      if (scenario.isRentOnly) return "Monthly Savings";
      return "Monthly Payment (PITI)";
  };

  const getNetPaymentTitle = () => {
      if (scenario.isInvestmentOnly) return "Net Contribution";
      if (scenario.isRentOnly) return "Net Monthly Savings";
      return "Your Net Payment";
  };
  
  // lockInvestment = false means Global (Blue), lockInvestment = true means Manual (Orange)
  const isGlobalInvestment = !scenario.lockInvestment;

  return (
    <div 
      className={`${cardBg} rounded-xl shadow-lg border-t-4 p-4 flex flex-col gap-2 relative transition-all duration-300 hover:shadow-xl group`}
      style={{ borderColor: isWinner ? '#10b981' : scenario.color, height: 'fit-content' }}
    >
      {isExpanded && (
        <>
            {isWinner && (
                <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Trophy size={10} /> WINNER
                </div>
            )}

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

            <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-8 mt-1">
                
                {/* LEFT SIDE: Inputs / Meta / Controls */}
                <div className="flex flex-col gap-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1">
                        <div>{getSummaryText()}</div>
                        <div className="mt-1">
                            <div className="text-[10px] uppercase font-bold text-gray-400">PROFIT</div>
                            <div className="text-xl font-extrabold text-brand-600 dark:text-brand-400 tracking-tight">{formatCurrency(displayTotalGain)}</div>
                        </div>
                    </div>

                    <div className="flex justify-start mt-1">
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

                    <button 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`flex items-center gap-1 text-xs font-semibold ${theme === 'light' ? 'text-gray-500 hover:text-brand-600 bg-gray-100' : 'text-gray-400 hover:text-brand-400 bg-white/10'} w-full justify-center py-1.5 rounded transition-colors mt-1`}
                    >
                        <Settings2 size={12} />
                        {showAdvanced ? 'Hide Details' : 'Edit Details'}
                    </button>

                    {showAdvanced && (
                    <div className={`${advancedBg} border ${theme==='light'?'border-gray-200':'border-gray-700'} p-3 rounded-lg space-y-3 mt-2 text-left animate-in fade-in slide-in-from-top-1`}>
                        
                        {/* 1. HOUSE & LOAN */}
                        {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                        <div className="space-y-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">HOUSE & LOAN</span>
                                <div>
                                    <button onClick={() => toggleLock('lockFMV')} className={`text-[9px] px-1.5 py-0.5 rounded border mr-1 ${scenario.lockFMV ? badgeManual : badgeGlobal}`}>
                                        FMV: {scenario.lockFMV ? "Manual" : "Global"}
                                    </button>
                                    <button onClick={() => toggleLock('lockLoan')} className={`text-[9px] px-1.5 py-0.5 rounded border ${scenario.lockLoan ? badgeManual : badgeGlobal}`}>
                                        Loan: {scenario.lockLoan ? "Manual" : "Global"}
                                    </button>
                                </div>
                            </div>
                            <SliderInput 
                                label="House Price" 
                                value={scenario.homeValue} 
                                onChange={v => handleChange('homeValue', v)} 
                                min={100000} max={3000000} step={5000} theme={theme} 
                                disabled={!scenario.lockFMV}
                            />
                            <SliderInput 
                                label="Loan Amount" 
                                value={scenario.loanAmount} 
                                onChange={v => handleChange('loanAmount', v)} 
                                min={50000} max={2000000} step={5000} theme={theme}
                                disabled={!scenario.lockLoan}
                            />
                            <SliderInput label="Interest Rate (%)" value={scenario.interestRate} onChange={v => handleChange('interestRate', v)} min={0} max={15} step={0.125} theme={theme} />
                            <SliderInput label="Years Left" value={scenario.yearsRemaining} onChange={v => handleChange('yearsRemaining', v)} min={0} max={40} step={1} theme={theme} />
                        </div>
                        )}

                        {/* 2. PROPERTY COSTS */}
                        {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                        <div className="space-y-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                             <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">PROPERTY COSTS</span>
                            </div>
                            
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className={`text-[10px] font-semibold ${labelColor}`}>Property Tax ($/yr)</label>
                                </div>
                                <SliderInput label="" value={scenario.propertyTax} onChange={v => handleChange('propertyTax', v)} min={0} max={50000} step={100} theme={theme} />
                            </div>
                            <SliderInput label="Insurance ($/yr)" value={scenario.homeInsurance} onChange={v => handleChange('homeInsurance', v)} min={0} max={10000} step={50} theme={theme} />
                            <SliderInput label="HOA ($/yr)" value={scenario.hoa} onChange={v => handleChange('hoa', v)} min={0} max={24000} step={50} theme={theme} />
                            <SliderInput label="PMI ($/yr)" value={scenario.pmi} onChange={v => handleChange('pmi', v)} min={0} max={10000} step={50} theme={theme} />
                        </div>
                        )}

                        {/* 3. RENT */}
                        {!scenario.isInvestmentOnly && (
                        <div className="space-y-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                             <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">RENT {(!scenario.isRentOnly) && "(IF RENTING PART)"}</span>
                                {scenario.isRentOnly ? (
                                     <button onClick={() => toggleLock('lockRent')} className={`text-[9px] px-1.5 py-0.5 rounded border ${scenario.lockRent ? badgeManual : badgeGlobal}`}>
                                        {scenario.lockRent ? "Manual" : "Global"}
                                     </button>
                                ) : (
                                    <button onClick={() => toggleLock('lockRentIncome')} className={`text-[9px] px-1.5 py-0.5 rounded border ${scenario.lockRentIncome ? badgeManual : badgeGlobal}`}>
                                        {scenario.lockRentIncome ? "Manual" : "Global"}
                                    </button>
                                )}
                            </div>
                            
                            {scenario.isRentOnly ? (
                                <>
                                    <SliderInput 
                                        label="Rent You Pay ($/mo)" 
                                        value={scenario.rentMonthly} 
                                        onChange={v => handleChange('rentMonthly', v)} 
                                        min={500} max={10000} step={50} theme={theme} 
                                        disabled={!scenario.lockRent}
                                    />
                                    <SliderInput label="Annual Inc (%)" value={scenario.rentIncreasePerYear} onChange={v => handleChange('rentIncreasePerYear', v)} min={0} max={10} step={0.1} theme={theme} />
                                </>
                            ) : (
                                <>
                                    <SliderInput 
                                        label="Rent You Receive ($/mo)" 
                                        value={scenario.rentalIncome || 0} 
                                        onChange={v => handleChange('rentalIncome', v)} 
                                        min={0} max={10000} step={50} theme={theme} 
                                        disabled={!scenario.lockRentIncome}
                                    />
                                    <div className="flex items-center gap-2 mb-2 mt-1 justify-end">
                                        <label className={`text-[9px] flex items-center gap-1 ${labelColor} cursor-pointer`}>
                                            <input 
                                                type="checkbox" 
                                                checked={scenario.rentalIncomeTaxEnabled} 
                                                onChange={(e) => handleChange('rentalIncomeTaxEnabled', e.target.checked)}
                                                className="rounded text-brand-600 focus:ring-brand-500 w-3 h-3"
                                            />
                                            Rental Tax Apply?
                                        </label>
                                    </div>
                                    {scenario.rentalIncomeTaxEnabled && (
                                        <SliderInput label="Rental Tax Rate (%)" value={scenario.rentalIncomeTaxRate ?? 20} onChange={v => handleChange('rentalIncomeTaxRate', v)} min={0} max={50} step={1} theme={theme} />
                                    )}
                                </>
                            )}
                        </div>
                        )}
                        
                        {/* 4. BUYING / SELLING */}
                        {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                        <div className="space-y-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                             <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">BUYING / SELLING</span>
                            </div>
                            <SliderInput label="Down Payment" value={scenario.downPayment} onChange={v => handleChange('downPayment', v)} min={0} max={1000000} step={5000} theme={theme} />
                            <SliderInput label="Closing Costs" value={scenario.closingCosts || 0} onChange={v => handleChange('closingCosts', v)} min={0} max={50000} step={100} theme={theme} />
                            <SliderInput label="Selling Cost %" value={scenario.sellingCostRate ?? 6} onChange={v => handleChange('sellingCostRate', v)} min={0} max={10} step={0.5} theme={theme} />
                            <SliderInput label={`Gain Tax % (< 2 yrs)`} value={scenario.capitalGainsTaxRate ?? 20} onChange={v => handleChange('capitalGainsTaxRate', v)} min={0} max={50} step={1} theme={theme} />
                        </div>
                        )}

                        {/* 5. YOUR TAX SETTINGS */}
                        <div className="space-y-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                             <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">YOUR TAX SETTINGS</span>
                            </div>
                            <SliderInput label="Your Tax Bracket %" value={scenario.taxRefundRate} onChange={v => handleChange('taxRefundRate', v)} min={0} max={50} step={1} theme={theme} />
                        </div>
                        
                        {/* 6. INVESTING */}
                        <div className="space-y-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                             <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">INVESTING</span>
                                <button onClick={() => toggleLock('lockInvestment')} className={`text-[9px] px-1.5 py-0.5 rounded border ${scenario.lockInvestment ? badgeManual : badgeGlobal}`}>
                                    {scenario.lockInvestment ? "Manual" : "Global"}
                                </button>
                            </div>
                            
                            {/* Unified Inputs: Enabled if Manual (lock=true), Disabled if Global (lock=false) */}
                            <SliderInput 
                                label="Starting Capital" 
                                value={!isGlobalInvestment ? (scenario.investmentCapital ?? 100000) : (globalInvestmentSettings?.globalCashInvestment ?? 0)} 
                                onChange={v => onUpdate(scenario.id, {investmentCapital: v})} 
                                min={0} max={1000000} step={5000} theme={theme} 
                                disabled={isGlobalInvestment}
                            />
                            <SliderInput 
                                label="Rate (% per annum)" 
                                value={!isGlobalInvestment ? (scenario.investmentRate ?? 5) : (globalInvestmentSettings?.investmentReturnRate ?? 0)} 
                                onChange={v => onUpdate(scenario.id, {investmentRate: v})} 
                                min={0} max={15} step={0.1} theme={theme} 
                                disabled={isGlobalInvestment}
                            />
                            <div className="mb-2">
                                <SliderInput 
                                    label="Additional Amount" 
                                    value={!isGlobalInvestment ? (scenario.investmentMonthly ?? 0) : (globalInvestmentSettings?.globalMonthlyContribution ?? 0)} 
                                    onChange={v => onUpdate(scenario.id, {investmentMonthly: v})} 
                                    min={0} max={10000} step={50} theme={theme} 
                                    disabled={isGlobalInvestment}
                                />
                                <div className="flex justify-end">
                                    <div className="w-1/2">
                                        <label className={`text-[9px] font-semibold ${isGlobalInvestment ? 'text-gray-400' : 'text-gray-500'} mb-1 block`}>Frequency</label>
                                        <select 
                                            value={!isGlobalInvestment ? (scenario.investmentContributionFrequency || 'monthly') : (globalInvestmentSettings?.globalContributionFrequency || 'monthly')} 
                                            onChange={e => onUpdate(scenario.id, {investmentContributionFrequency: e.target.value as any})}
                                            disabled={isGlobalInvestment}
                                            className={`w-full text-xs p-1 border rounded ${inputClass} ${isGlobalInvestment ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="weekly">Weekly</option>
                                            <option value="biweekly">Every 2 weeks</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="semiannually">Semi-annually</option>
                                            <option value="annually">Annually</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* 7. EXTRA PAYMENTS */}
                        {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                        <div className="space-y-2">
                             <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">EXTRA PAYMENTS</span>
                            </div>
                            
                            <div className="mb-2">
                                <SliderInput label="Extra Monthly Payment" value={scenario.monthlyExtraPayment} onChange={v => handleChange('monthlyExtraPayment', v)} min={0} max={5000} step={50} theme={theme} />
                                <div className="flex justify-end -mt-1 mb-2">
                                    <div className="w-1/2">
                                        <select 
                                            value={scenario.monthlyExtraPaymentFrequency || 'monthly'} 
                                            onChange={e => onUpdate(scenario.id, {monthlyExtraPaymentFrequency: e.target.value as any})}
                                            className={`w-full text-xs p-1 border rounded ${inputClass}`}
                                        >
                                            <option value="weekly">Weekly</option>
                                            <option value="biweekly">Every 2 weeks</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="semiannually">Semi-annually</option>
                                            <option value="annually">Annually</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <SliderInput label="One-Time Payment" value={scenario.oneTimeExtraPayment} onChange={v => handleChange('oneTimeExtraPayment', v)} min={0} max={500000} step={1000} theme={theme} />
                        </div>
                        )}
                    </div>
                    )}
                </div>

                {/* RIGHT SIDE: Financial Summary */}
                <div className="flex flex-col gap-3">

                    {/* 0. PITI MINI CARD */}
                    {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                        <div className={`rounded-lg border p-2 flex flex-col gap-2 shadow-sm ${theme==='light'?'bg-blue-50/50 border-blue-200 text-blue-900':'bg-blue-900/10 border-blue-800 text-blue-100'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <PieChart size={14} className="text-blue-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{getPitiTitle()}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold block">{formatCurrency(rMonthlyPITI)}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 text-[9px] opacity-70 justify-end">
                                <span>P&I: {formatCurrency(Math.round(calculated.monthlyPrincipalAndInterest))}</span>
                                <span>Tax: {formatCurrency(Math.round(calculated.monthlyTax))}</span>
                                <span>Ins: {formatCurrency(Math.round(calculated.monthlyInsurance))}</span>
                                <span>Fees: {formatCurrency(Math.round(calculated.monthlyHOA + calculated.monthlyPMI))}</span>
                            </div>
                            
                            {(scenario.rentalIncome || 0) > 0 && (
                                <div className="border-t border-blue-200/30 mt-1 pt-2 flex justify-between items-center">
                                    <span className="text-[10px] uppercase font-bold opacity-80 flex items-center gap-1">
                                        {getNetPaymentTitle()} <Tooltip text={`Total Monthly Payment minus Rental Income`} />
                                    </span>
                                    <span className="text-lg font-bold">{formatCurrency(rNetMonthly)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 1. TOTAL RETURN (Unified Profit) */}
                    <div className={`border rounded-lg ${theme==='light'?'border-gray-200 bg-gray-50':'border-gray-700 bg-black/20'}`}>
                        <div className="px-3 py-1.5 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 rounded-t-lg">
                            <TrendingUp size={12} className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase">TOTAL RETURN</span>
                        </div>
                        <div className="p-2 space-y-1">
                            {!scenario.isRentOnly && !scenario.isInvestmentOnly ? (
                                <>
                                    <BreakdownRow label="Appreciation" value={`+${formatCurrency(rAppreciation)}`} colorClass="text-emerald-500 font-bold" icon={<TrendingUp size={10} />} tooltip="Increase in home value over time" />
                                    <BreakdownRow label="Principal Paid" value={`+${formatCurrency(rPrincipal)}`} colorClass="text-emerald-500 font-bold" icon={<PiggyBank size={10} />} tooltip="Amount of loan balance paid down (Equity)" />
                                    {rTax > 0 && <BreakdownRow label="Mortgage Tax Refund" value={`+${formatCurrency(rTax)}`} colorClass="text-emerald-500 font-bold" icon={<Receipt size={10} />} tooltip="Tax savings from mortgage interest deduction (Interest + Property Tax)" />}
                                    <BreakdownRow label={scenario.rentalIncomeTaxEnabled ? "Rental Income (Gross)" : "Rental Income"} value={`+${formatCurrency(rRent)}`} colorClass="text-emerald-500 font-bold" icon={<Building size={10} />} tooltip="Total rent collected before expenses" />
                                    <BreakdownRow label="Rental Tax" value={`-${formatCurrency(rRentTax)}`} colorClass="text-red-500 font-bold" icon={<Scale size={10} />} tooltip="Tax paid on rental income" />
                                    {(rRealInvGain > 0 && (scenario.isInvestmentOnly || scenario.isRentOnly)) && <BreakdownRow label="Investment Growth" value={`+${formatCurrency(rRealInvGain)}`} colorClass="text-emerald-500 font-bold" icon={<TrendingUp size={10} />} tooltip="Profit from invested idle cash or side portfolio" /> }
                                    <BreakdownRow label={`Selling Costs (${scenario.sellingCostRate}%)`} value={`-${formatCurrency(rSellingCosts)}`} colorClass="text-red-500 font-bold" icon={<Tag size={10} />} tooltip="Agent fees and closing costs when selling" />
                                    {rCapitalGainsTax > 0 && <BreakdownRow label={`Capital Gains Tax (${scenario.capitalGainsTaxRate ?? 20}%)`} value={`-${formatCurrency(rCapitalGainsTax)}`} colorClass="text-red-500 font-bold" icon={<Scale size={10} />} tooltip="Tax on profit if sold within 2 years" />}
                                </>
                            ) : (
                                <>
                                    <BreakdownRow label="Investment Growth" value={`+${formatCurrency(rRealInvGain)}`} colorClass="text-emerald-500 font-bold" icon={<TrendingUp size={10} />} tooltip="Profit from portfolio" />
                                </>
                            )}
                        </div>
                    </div>

                    {/* 2. TOTAL CASH OUT-OF-POCKET */}
                    <div className={`border rounded-lg ${theme==='light'?'border-gray-200 bg-gray-50':'border-gray-700 bg-black/20'}`}>
                         <div className="px-3 py-1.5 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 rounded-t-lg">
                            <Wallet size={12} className="text-gray-500" />
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase">TOTAL CASH OUT-OF-POCKET</span>
                        </div>
                        <div className="p-2 space-y-1">
                            {!scenario.isRentOnly ? (
                                <>
                                    {!scenario.isInvestmentOnly && (
                                        <>
                                            <BreakdownRow label="Mortgage Payments" value={`-${formatCurrency(rTotalPaid)}`} colorClass="text-red-500 font-bold" icon={<CreditCard size={10} />} tooltip="Total PITI + Extra payments made" />
                                            <BreakdownRow label="Property Costs" value={`(${formatCurrency(rPropertyCosts)})`} colorClass="text-gray-400 italic" icon={<Landmark size={10} />} tooltip="Included in Monthly Payments (PITI). Shown here for info only." />
                                        </>
                                    )}
                                    <BreakdownRow label="Less: Rental Income" value={`+${formatCurrency(rRent)}`} colorClass="text-emerald-500 font-bold" icon={<Building size={10} />} tooltip="Rent collected offsets your costs" />
                                    {rRentTax > 0 && <BreakdownRow label="Rental Tax Paid" value={`-${formatCurrency(rRentTax)}`} colorClass="text-red-500 font-bold" icon={<Scale size={10} />} tooltip="Tax liability from rental income" /> }
                                    {!scenario.isInvestmentOnly && rDown > 0 && <BreakdownRow label="Down Payment" value={`-${formatCurrency(rDown)}`} colorClass="text-red-500 font-bold" icon={<Wallet size={10} />} tooltip="Initial cash for purchase" />}
                                    {!scenario.isInvestmentOnly && rClosing > 0 && <BreakdownRow label="Closing Costs" value={`-${formatCurrency(rClosing)}`} colorClass="text-red-500 font-bold" icon={<Receipt size={10} />} tooltip="Initial fees for loan/purchase" />}
                                    
                                    {/* Add Investment Contributions row for Investment Only mode */}
                                    {scenario.isInvestmentOnly && rInvContribution > 0 && <BreakdownRow label="Investment Contributions" value={`-${formatCurrency(rInvContribution)}`} colorClass="text-blue-500 font-bold" icon={<PiggyBank size={10} />} tooltip="Total Cash put into Side Investment Portfolio" />}
                                </>
                            ) : (
                                <>
                                    <BreakdownRow label="Rent Payments" value={`-${formatCurrency(rTotalPaid)}`} colorClass="text-red-500 font-bold" icon={<CreditCard size={10} />} />
                                    {/* Rent mode also doesn't count side investment as housing cost */}
                                </>
                            )}
                            <div className="border-t border-dashed border-gray-600/20 pt-1 mt-1">
                                 <div className="flex justify-between items-center text-[10px] pl-2 pr-2 font-bold">
                                     <div className="flex items-center gap-2">
                                        <Wallet size={10} className="text-gray-400" />
                                        <span className="text-gray-500 dark:text-gray-400 uppercase">Total Out-of-Pocket</span>
                                     </div>
                                     <span className={theme==='light'?'text-gray-900':'text-white'}>{formatCurrency(calculated.totalInvestedAmount)}</span>
                                 </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. FINAL RESULTS */}
                    <div className={`border rounded-lg ${theme==='light'?'border-gray-200 bg-gray-50':'border-gray-700 bg-black/20'}`}>
                        <div className="px-3 py-1.5 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 rounded-t-lg">
                            <Calculator size={12} className="text-gray-500" />
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase">FINAL RESULTS</span>
                        </div>
                        <div className="p-3 space-y-1">
                             <div className="flex justify-between items-center text-xs py-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-500 dark:text-gray-400">Out-of-Pocket</span>
                                    <Tooltip text="Net cash you paid (Payments + Upfront + Taxes - Rent)" />
                                </div>
                                <span className={`font-bold ${theme==='light'?'text-gray-900':'text-white'}`}>{formatCurrency(calculated.totalInvestedAmount)}</span>
                             </div>
                             
                             <div className="flex justify-between items-center text-xs py-1 border-t border-dashed border-gray-600/20">
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-500 dark:text-gray-400">Profit</span>
                                    <Tooltip text="Total Return: Gains + Income - Costs - Taxes" />
                                </div>
                                <span className="font-bold text-emerald-500">{formatCurrency(calculated.profit)}</span>
                             </div>

                             <div className="flex justify-between items-center text-xs py-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-500 dark:text-gray-400">True Cost</span>
                                    <Tooltip text="Net Cost = Out-of-Pocket - Cash After Sale. Represents the sunk cost of housing." />
                                </div>
                                <span className="font-bold text-red-500">{formatCurrency(calculated.netCost)}</span>
                             </div>
                             
                             {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                             <>
                                <div className="flex justify-between items-center text-xs py-1">
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-500 dark:text-gray-400">Loan Balance at Sale</span>
                                        <Tooltip text="Remaining mortgage balance to pay off" />
                                    </div>
                                    <span className={`font-medium ${theme==='light'?'text-gray-700':'text-gray-300'}`}>{formatCurrency(rLoanBalance)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs py-1">
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-500 dark:text-gray-400">Equity at Sale</span>
                                        <Tooltip text="Proceeds after paying off loan and selling costs (before Capital Gains Tax)" />
                                    </div>
                                    <span className={`font-medium ${theme==='light'?'text-gray-700':'text-gray-300'}`}>{formatCurrency(rEquityAtSale)}</span>
                                </div>
                             </>
                             )}

                             {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                             <div className="flex justify-between items-center text-xs py-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-500 dark:text-gray-400">Cash After Sale</span>
                                    <Tooltip text="Actual cash pocketed: Equity - Capital Gains Tax" />
                                </div>
                                <span className={`font-bold ${theme==='light'?'text-gray-900':'text-white'}`}>{formatCurrency(displayCashBack)}</span>
                             </div>
                             )}

                             <div className="flex justify-between items-center text-xs py-1 border-t border-gray-600/20 mt-1 pt-2">
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px]">Annual Return %</span>
                                    <Tooltip text="Compound Annual Growth Rate (CAGR) on your capital" />
                                </div>
                                <span className="font-bold text-gray-400">{calculated.effectiveAnnualReturn.toFixed(1)}%</span>
                             </div>
                        </div>
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

      {!isExpanded && (
        <div 
            className="w-full cursor-pointer group" 
            onClick={() => setIsExpanded(true)}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <Eye size={18} className="text-gray-400 group-hover:text-brand-500 transition-colors" />
                    <span className={`font-bold text-lg leading-none ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>
                        {scenario.name}
                    </span>
                </div>
                {isWinner && (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 animate-in zoom-in">
                        <Trophy size={10} /> WINNER
                    </span>
                )}
            </div>
            <div className={`text-xs mb-3 font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                {getSummaryText()}
            </div>
            
            {/* COLLAPSED SUMMARY VIEW */}
            <div className="pt-2 border-t border-dashed border-gray-500/20 space-y-2">
                <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>Profit:</span>
                    <span className={`text-sm font-extrabold tracking-tight ${isWinner ? (theme==='light' ? 'text-emerald-600' : 'text-emerald-400') : (theme === 'light' ? 'text-gray-700' : 'text-gray-200')}`}>
                        {formatCurrency(displayTotalGain)}
                    </span>
                </div>
                {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col">
                            <span className="uppercase font-bold opacity-70">Monthly PITI</span>
                            <span className="font-semibold">{formatCurrency(rMonthlyPITI)}</span>
                        </div>
                        {(scenario.rentalIncome || 0) > 0 && (
                            <div className="flex flex-col text-right">
                                <span className="uppercase font-bold opacity-70">{getNetPaymentTitle()}</span>
                                <span className="font-semibold">{formatCurrency(rNetMonthly)}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
