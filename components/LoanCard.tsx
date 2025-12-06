import React, { useState, useEffect } from 'react';
import { Trash2, Lock, Unlock, Percent, Calendar, Settings2, DollarSign, Home, Copy, Table2, Globe, Trophy, TrendingUp, Link, Eye, EyeOff, PlusCircle, Info, ChevronDown, ChevronRight, PieChart, PiggyBank, CreditCard, Receipt, Building, Landmark, Wallet, Briefcase, Scale, Tag, LogOut, Clock, Calculator, Activity, Zap, Plus, ChevronUp, ShieldCheck } from 'lucide-react';
import { LoanScenario, CalculatedLoan, CustomExpense, AdditionalLoan } from '../types';
import { formatCurrency, formatNumber, generateId, calculateCurrentBalance } from '../utils/calculations';
import { Theme, ComparisonMetric } from '../App';

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
      globalInvestmentTaxRate?: number;
  };
  comparisonMetric: ComparisonMetric;
}

// Simple input for Money values with comma formatting
const MoneyInput = ({ 
    value, 
    onChange, 
    theme, 
    placeholder,
    className,
    maxDecimals = 0 // Default to 0 to strip decimals for money
}: { 
    value: number, 
    onChange: (val: number) => void, 
    theme: Theme,
    placeholder?: string,
    className?: string,
    maxDecimals?: number
}) => {
    const inputClass = theme === 'light' ? 'bg-white border-gray-300' : 'bg-black/20 border-gray-600 text-white';
    
    // Initialize with formatted value
    const [localStr, setLocalStr] = useState(formatNumber(value, maxDecimals));
    const [focused, setFocused] = useState(false);

    useEffect(() => {
        if (!focused) {
            setLocalStr(formatNumber(value, maxDecimals));
        }
    }, [value, focused, maxDecimals]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        // Allow typing numbers, commas, and dots
        if (val === '' || /^[0-9,]*\.?[0-9]*$/.test(val)) {
            setLocalStr(val);
            const clean = val.replace(/,/g, '');
            if (clean === '') {
                onChange(0);
            } else {
                const num = parseFloat(clean);
                if (!isNaN(num)) onChange(num);
            }
        }
    };
    
    const handleBlur = () => {
        setFocused(false);
        setLocalStr(formatNumber(value, maxDecimals));
    };

    return (
        <input 
            type="text"
            inputMode="decimal"
            value={localStr} 
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`w-full text-xs p-1 border rounded text-right ${inputClass} ${className || ''}`}
        />
    );
};

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
    isGlobal = false,
    className,
    error,
    subLabel
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
    isGlobal?: boolean,
    className?: string,
    error?: boolean,
    subLabel?: React.ReactNode
}) => {
    const inputClass = theme === 'light' ? 'bg-white border-gray-300' : 'bg-black/20 border-gray-600 text-white';
    const labelColor = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
    const errorClass = error ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-900/10' : '';

    const [localStr, setLocalStr] = useState(formatNumber(value));
    const [focused, setFocused] = useState(false);

    useEffect(() => {
        if (!focused) {
            setLocalStr(formatNumber(value));
        }
    }, [value, focused]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
            val = val.replace(/^0+/, ''); 
            if (val === '') val = '0'; 
        }
        if (val === '' || /^[0-9,]*\.?[0-9]*$/.test(val)) {
            setLocalStr(val);
            const clean = val.replace(/,/g, '');
            if (clean === '') {
                onChange(0);
            } else {
                const num = parseFloat(clean);
                if (!isNaN(num)) onChange(num);
            }
        }
    };
    
    const handleBlur = () => {
        setFocused(false);
        setLocalStr(formatNumber(value));
    };

    return (
        <div className={`mb-2 ${disabled ? 'opacity-75 pointer-events-none' : ''} ${className || ''}`}>
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 w-full">
                    {typeof label === 'string' ? (
                        <label className={`text-[10px] font-semibold ${labelColor} flex items-center flex-1`}>{label}</label>
                    ) : (
                        <div className={`text-[10px] font-semibold ${labelColor} flex items-center flex-1`}>{label}</div>
                    )}
                    {isGlobal && (
                        <span className="text-[9px] font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1 rounded flex items-center gap-0.5">
                            <Lock size={8} /> Global
                        </span>
                    )}
                </div>
                <div className="relative w-20">
                    <input 
                        type="text" 
                        inputMode="decimal"
                        value={localStr} 
                        onChange={handleTextChange}
                        onFocus={() => setFocused(true)}
                        onBlur={handleBlur}
                        disabled={disabled}
                        className={`w-full text-xs p-0.5 text-right border rounded ${inputClass} ${disabled ? 'bg-gray-50 dark:bg-gray-800 text-gray-500' : ''} ${errorClass}`}
                    />
                    {unit && <span className="absolute right-6 top-0.5 text-[10px] text-gray-400 opacity-0">{unit}</span>}
                </div>
            </div>
            {subLabel && <div className="mb-1 text-right">{subLabel}</div>}
            <input 
                type="range" 
                min={min} 
                max={max} 
                step={step} 
                value={value} 
                onChange={e => onChange(parseFloat(e.target.value))} 
                disabled={disabled}
                className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${disabled ? 'bg-gray-200 dark:bg-gray-700' : (error ? 'bg-red-300' : 'bg-gray-300 dark:bg-gray-600')} accent-brand-600`} 
            />
        </div>
    );
};

// Flexible Input - Simplified: Slider + Amount Input + Read-Only %
const FlexibleInput = ({
    label,
    amountValue,
    baseValue,
    onAmountChange,
    minAmount,
    maxAmount,
    stepAmount,
    theme,
    disabled = false,
    error = false
}: {
    label: string | React.ReactNode,
    amountValue: number,
    baseValue: number,
    onAmountChange: (val: number) => void,
    minAmount: number,
    maxAmount: number,
    stepAmount: number,
    theme: Theme,
    disabled?: boolean,
    error?: boolean
}) => {
    const labelColor = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
    
    // Calculate percentage for display
    const percent = baseValue > 0 ? (amountValue / baseValue) * 100 : 0;

    return (
        <div className={`mb-3 ${disabled ? 'opacity-75 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-center mb-1">
                {typeof label === 'string' ? (
                    <label className={`text-[10px] font-semibold ${labelColor}`}>{label}</label>
                ) : (
                    <div className={`text-[10px] font-semibold ${labelColor}`}>{label}</div>
                )}
            </div>

            <input 
                type="range" 
                min={minAmount} 
                max={maxAmount} 
                step={stepAmount} 
                value={amountValue} 
                onChange={e => onAmountChange(parseFloat(e.target.value))}
                className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${disabled ? 'bg-gray-200 dark:bg-gray-700' : (error ? 'bg-red-300' : 'bg-gray-300 dark:bg-gray-600 accent-brand-600')} mb-2`} 
            />

            <div className="flex justify-between items-center">
                {/* Read-only Percentage Display */}
                <div className={`text-[10px] font-mono ${theme==='light'?'text-gray-500 bg-gray-100':'text-gray-400 bg-gray-800'} px-2 py-0.5 rounded ${error ? 'text-red-500 font-bold' : ''}`}>
                    {percent.toFixed(2)}%
                </div>

                {/* Amount Input */}
                <div className="w-24">
                    <MoneyInput 
                        value={amountValue}
                        onChange={onAmountChange}
                        theme={theme}
                        className={`text-xs p-1 ${error ? 'border-red-300 text-red-600' : ''}`}
                        maxDecimals={0}
                    />
                </div>
            </div>
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
            <div className={`rounded-full w-4 h-4 flex items-center justify-center text-[10px] cursor-help transition-colors ${isVisible ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'}`}>
                <Info size={10} />
            </div>
            {isVisible && (
                <div 
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[280px] p-3 bg-gray-950 border border-gray-700 text-gray-100 text-[11px] leading-relaxed rounded-lg shadow-2xl z-50 whitespace-normal animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
                    style={{ minWidth: '180px' }}
                >
                    <div className="whitespace-pre-wrap">{text}</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-950"></div>
                </div>
            )}
        </div>
    );
};

interface BreakdownRowProps { 
    label: string, 
    value: string, 
    colorClass?: string, 
    icon?: React.ReactNode, 
    tooltip?: string,
    bgClass?: string,
    isHighlighted?: boolean,
    isDimmed?: boolean,
    onHover?: (isHovering: boolean) => void
}

const BreakdownRow: React.FC<BreakdownRowProps> = ({ 
    label, 
    value, 
    colorClass, 
    icon, 
    tooltip,
    bgClass,
    isHighlighted,
    isDimmed,
    onHover
}) => {
    const baseClass = `flex justify-between items-center text-[10px] py-1 pl-2 pr-2 rounded transition-all duration-300 cursor-default ${bgClass || ''}`;
    // Highlight Style: Pop out, yellow background
    const highlightClass = isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900/30 scale-[1.02] shadow-sm font-semibold z-10 ring-1 ring-yellow-200 dark:ring-yellow-800' : '';
    // Dim Style: Fade out
    const dimClass = isDimmed ? 'opacity-20 blur-[0.5px] grayscale' : 'hover:bg-black/5 dark:hover:bg-white/5';
    
    return (
        <div 
            className={`${baseClass} ${highlightClass} ${!isHighlighted ? dimClass : ''}`}
            onMouseEnter={() => onHover && onHover(true)}
            onMouseLeave={() => onHover && onHover(false)}
        >
            <div className="flex items-center gap-2">
                {icon && <span className={`transition-colors ${isHighlighted ? 'text-gray-600 dark:text-gray-300' : 'opacity-70 text-gray-400'}`}>{icon}</span>}
                <div className="flex items-center gap-1">
                    <span className={`font-medium transition-colors ${isHighlighted ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
                    {tooltip && <Tooltip text={tooltip} />}
                </div>
            </div>
            <span className={`font-mono font-bold ${colorClass || 'text-gray-700 dark:text-gray-300'}`}>{value}</span>
        </div>
    );
};

// One-Time Expense List Component
const OneTimeExpensesList = ({ 
    expenses, 
    onAdd, 
    onRemove, 
    onUpdate, 
    theme,
    title = "One-Time Additional Expenses"
}: { 
    expenses: CustomExpense[], 
    onAdd: () => void, 
    onRemove: (id: string) => void, 
    onUpdate: (id: string, field: keyof CustomExpense, value: any) => void, 
    theme: Theme,
    title?: string
}) => {
    const inputClass = theme === 'light' ? 'bg-white border-gray-300' : 'bg-black/20 border-gray-600 text-white';
    
    return (
        <div className="mt-2 pt-2 border-t border-dashed border-gray-600/20">
            <div className="flex justify-between items-center mb-1">
                <label className={`text-[9px] font-semibold text-gray-500 dark:text-gray-400`}>{title}</label>
                <button 
                    onClick={onAdd}
                    className={`px-1.5 py-0.5 rounded text-[8px] border flex items-center gap-1 transition-all hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 dark:hover:bg-brand-900/30 dark:hover:text-brand-400 ${theme==='light'?'bg-white border-gray-300 text-gray-500':'bg-white/5 border-gray-600 text-gray-400'}`}
                >
                    <Plus size={8} /> Add
                </button>
            </div>
            {expenses && expenses.length > 0 && (
                <div className="space-y-1">
                    {expenses.map((expense) => (
                        <div key={expense.id} className="flex gap-1 items-center animate-in slide-in-from-left-2">
                            <input 
                                type="text" 
                                value={expense.name} 
                                onChange={(e) => onUpdate(expense.id, 'name', e.target.value)}
                                className={`flex-1 text-[10px] p-0.5 border rounded ${inputClass}`}
                                placeholder="Name (e.g. Points)"
                            />
                            <div className="w-20">
                                <MoneyInput 
                                    value={expense.amount} 
                                    onChange={(val) => onUpdate(expense.id, 'amount', val)}
                                    theme={theme}
                                    placeholder="0"
                                    className="text-[10px] p-0.5"
                                    maxDecimals={0}
                                />
                            </div>
                            <button 
                                onClick={() => onRemove(expense.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                            >
                                <Trash2 size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Define highlight keys
type HighlightKey = 'outOfPocket' | 'profit' | 'loanBalance' | 'netCash' | 'netWorth' | null;

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
  globalInvestmentSettings,
  comparisonMetric
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHouseLoanOpen, setIsHouseLoanOpen] = useState(true);
  const [isExtraPaymentsOpen, setIsExtraPaymentsOpen] = useState(false); 
  const [isSellingOpen, setIsSellingOpen] = useState(true);
  
  // New States for collapsible sections
  const [isPropCostsOpen, setIsPropCostsOpen] = useState(true);
  const [isRentOpen, setIsRentOpen] = useState(true);
  const [isInvestmentOpen, setIsInvestmentOpen] = useState(true);
  
  const [showInfoOnly, setShowInfoOnly] = useState(true);
  
  // Highlighting State for Final Results -> Summary
  const [hoveredMetric, setHoveredMetric] = useState<HighlightKey>(null);

  // Highlighting State for Summary -> Inputs
  const [hoveredSummaryRow, setHoveredSummaryRow] = useState<string | null>(null);

  // Relationship Map: Which rows light up for which Final Result
  const rowHighlightMap: Record<string, string[]> = {
      outOfPocket: ['payments', 'rentTax', 'down', 'closing', 'loanFees', 'initialInv', 'invCont', 'invTax', 'expenses', 'rent', 'refund', 'propTax', 'homeIns', 'principal'],
      profit: ['payments', 'principal', 'rent', 'expenses', 'rentTax', 'refund', 'appreciation', 'down', 'closing', 'loanFees', 'selling', 'capGains', 'initialInv', 'invCont', 'invGrowth', 'invTax', 'propTax', 'homeIns'],
      loanBalance: ['principal', 'payments'],
      netCash: ['appreciation', 'principal', 'down', 'selling', 'capGains'],
      netWorth: ['appreciation', 'principal', 'down', 'initialInv', 'invCont', 'invGrowth']
  };

  // Relationship Map: Which Inputs light up for which Summary Row
  const summaryToInputMap: Record<string, string[]> = {
    'payments': ['loan-amt', 'loan-rate', 'loan-term', 'extra-pay'],
    'principal': ['loan-amt', 'loan-rate', 'loan-term', 'extra-pay'],
    'rent': ['rent-val'],
    'rentTax': ['rent-tax'],
    'expenses': ['custom-exp'],
    'netPayment': ['loan-amt', 'loan-rate', 'prop-tax', 'home-ins', 'hoa', 'pmi', 'rent-val'],
    'refund': ['loan-rate', 'prop-tax'],
    'appreciation': ['home-val', 'fmv'],
    'down': ['down-pay'],
    'closing': ['close-cost'],
    'loanFees': ['loan-fees'],
    'selling': ['sell-cost'],
    'capGains': ['cap-gains', 'home-val'],
    'initialInv': ['inv-cap'],
    'invCont': ['inv-monthly'],
    'invGrowth': ['inv-rate', 'inv-cap', 'inv-monthly'],
    'invTax': ['inv-tax'],
    'propTax': ['prop-tax'],
    'homeIns': ['home-ins']
  };

  const getRowProps = (rowId: string) => {
      // 1. Check if highlighted by Final Results hover
      if (hoveredMetric) {
          const relatedIds = rowHighlightMap[hoveredMetric] || [];
          const isRelated = relatedIds.includes(rowId);
          return {
              isHighlighted: isRelated,
              isDimmed: !isRelated
          };
      }
      
      // 2. Check if this specific row is being hovered to highlight inputs (Self is normal, others maybe dimmed?)
      // For now we don't dim others when hovering summary, we just highlight inputs.
      return {
          onHover: (isHovering: boolean) => setHoveredSummaryRow(isHovering ? rowId : null)
      };
  };

  const getInputHighlightClass = (sectionIds: string[]) => {
    if (!hoveredSummaryRow) return '';
    const targets = summaryToInputMap[hoveredSummaryRow] || [];
    // If any of the sectionIds are in the target list, highlight
    if (sectionIds.some(id => targets.includes(id))) {
        return 'ring-2 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-1 -m-1 transition-all duration-300 z-10 relative';
    }
    return 'transition-all duration-300';
  };

  const handleChange = (field: keyof LoanScenario, value: any) => {
    const numValue = parseFloat(value);
    onUpdate(scenario.id, { [field]: isNaN(numValue) ? value : numValue });
  };

  const toggleLock = (field: 'lockFMV' | 'lockLoan' | 'lockRent' | 'lockRentIncome' | 'lockInvestment' | 'lockExistingEquity') => {
    onUpdate(scenario.id, { [field]: !scenario[field] });
  };

  // Custom Expense Helpers
  const addCustomExpense = () => {
      const newExpense: CustomExpense = { id: generateId(), name: '', amount: 0 };
      onUpdate(scenario.id, { customExpenses: [...(scenario.customExpenses || []), newExpense] });
  };
  const removeCustomExpense = (expenseId: string) => {
      onUpdate(scenario.id, { customExpenses: (scenario.customExpenses || []).filter(e => e.id !== expenseId) });
  };
  const updateCustomExpense = (expenseId: string, field: keyof CustomExpense, value: any) => {
      onUpdate(scenario.id, { customExpenses: (scenario.customExpenses || []).map(e => e.id === expenseId ? { ...e, [field]: value } : e) });
  };

  // Custom Closing Costs Helpers
  const addClosingCost = () => {
      const newCost: CustomExpense = { id: generateId(), name: '', amount: 0 };
      onUpdate(scenario.id, { customClosingCosts: [...(scenario.customClosingCosts || []), newCost] });
  };
  const removeClosingCost = (id: string) => {
      onUpdate(scenario.id, { customClosingCosts: (scenario.customClosingCosts || []).filter(c => c.id !== id) });
  };
  const updateClosingCost = (id: string, field: keyof CustomExpense, value: any) => {
      onUpdate(scenario.id, { customClosingCosts: (scenario.customClosingCosts || []).map(c => c.id === id ? { ...c, [field]: value } : c) });
  };

  // Primary Loan Expense Helpers
  const addPrimaryExpense = () => {
      const newExp: CustomExpense = { id: generateId(), name: '', amount: 0 };
      onUpdate(scenario.id, { primaryLoanExpenses: [...(scenario.primaryLoanExpenses || []), newExp] });
  };
  const removePrimaryExpense = (id: string) => {
      onUpdate(scenario.id, { primaryLoanExpenses: (scenario.primaryLoanExpenses || []).filter(e => e.id !== id) });
  };
  const updatePrimaryExpense = (id: string, field: keyof CustomExpense, value: any) => {
      onUpdate(scenario.id, { primaryLoanExpenses: (scenario.primaryLoanExpenses || []).map(e => e.id === id ? { ...e, [field]: value } : e) });
  };

  // Additional Loan Helpers
  const addAdditionalLoan = () => {
      // When adding a new loan, it decreases the Down Payment (fills the gap)
      const newLoanAmount = 10000;
      const newDown = Math.max(0, scenario.downPayment - newLoanAmount);
      
      const newLoan: AdditionalLoan = { 
        id: generateId(), 
        name: 'Second Loan', 
        balance: newLoanAmount, 
        rate: 7, 
        years: 10, 
        locked: false,
        startDate: new Date().toISOString().split('T')[0],
        oneTimeExpenses: []
      };
      onUpdate(scenario.id, { 
          additionalLoans: [...(scenario.additionalLoans || []), newLoan],
          downPayment: newDown
      });
  };
  const removeAdditionalLoan = (loanId: string) => {
      const loanToRemove = (scenario.additionalLoans || []).find(l => l.id === loanId);
      if (!loanToRemove) return;
      
      // When removing a loan, Down Payment increases to cover the gap
      const newDown = scenario.downPayment + loanToRemove.balance;
      
      onUpdate(scenario.id, { 
          additionalLoans: (scenario.additionalLoans || []).filter(l => l.id !== loanId),
          downPayment: newDown 
      });
  };
  
  const updateAdditionalLoan = (loanId: string, field: keyof AdditionalLoan, value: any) => {
      // If balance changes, Down Payment adjusts
      if (field === 'balance') {
          const loan = (scenario.additionalLoans || []).find(l => l.id === loanId);
          if (loan) {
              const diff = value - loan.balance; // Positive if balance increased
              const newDown = Math.max(0, scenario.downPayment - diff);
              
              const updatedLoans = (scenario.additionalLoans || []).map(l => l.id === loanId ? { ...l, [field]: value } : l);
              onUpdate(scenario.id, { 
                  additionalLoans: updatedLoans,
                  downPayment: newDown
              });
              return;
          }
      }
      onUpdate(scenario.id, { additionalLoans: (scenario.additionalLoans || []).map(l => l.id === loanId ? { ...l, [field]: value } : l) });
  };

  const toggleAdditionalLoanLock = (loanId: string) => {
      onUpdate(scenario.id, { additionalLoans: (scenario.additionalLoans || []).map(l => l.id === loanId ? { ...l, locked: !l.locked } : l) });
  };

  // Additional Loan Expense Helpers (Deep Nested)
  const addAddLoanExpense = (loanId: string) => {
      const newExp: CustomExpense = { id: generateId(), name: '', amount: 0 };
      const updatedLoans = (scenario.additionalLoans || []).map(l => {
          if (l.id === loanId) {
              return { ...l, oneTimeExpenses: [...(l.oneTimeExpenses || []), newExp] };
          }
          return l;
      });
      onUpdate(scenario.id, { additionalLoans: updatedLoans });
  };
  
  const removeAddLoanExpense = (loanId: string, expenseId: string) => {
      const updatedLoans = (scenario.additionalLoans || []).map(l => {
          if (l.id === loanId) {
              return { ...l, oneTimeExpenses: (l.oneTimeExpenses || []).filter(e => e.id !== expenseId) };
          }
          return l;
      });
      onUpdate(scenario.id, { additionalLoans: updatedLoans });
  };

  const updateAddLoanExpense = (loanId: string, expenseId: string, field: keyof CustomExpense, value: any) => {
      const updatedLoans = (scenario.additionalLoans || []).map(l => {
          if (l.id === loanId) {
              return { 
                  ...l, 
                  oneTimeExpenses: (l.oneTimeExpenses || []).map(e => e.id === expenseId ? { ...e, [field]: value } : e) 
              };
          }
          return l;
      });
      onUpdate(scenario.id, { additionalLoans: updatedLoans });
  };

  // --- CORRELATION LOGIC ---

  // 1. Change House Price -> Adjust Equity (Down Payment or Existing)
  const handleHomeValueChange = (newVal: number) => {
      // NOTE: homeValue here represents PURCHASE PRICE in the new UI, but logic remains same for down payment calcs.
      
      const totalPrimary = calculated.startingBalance; // Use calculated current balance
      const totalAdditional = (scenario.additionalLoans || []).reduce((sum, l) => {
          // Approximate additional loan current balance if available, else use input
          const cur = calculateCurrentBalance(l.balance, l.rate, l.years, l.startDate);
          return sum + cur;
      }, 0);
      
      const equityGap = Math.max(0, newVal - totalPrimary - totalAdditional);
      
      const updates: Partial<LoanScenario> = { homeValue: newVal };
      
      // If we are in a "Zero Down" (Current Loan) state, assume gap goes to Existing Equity.
      // Otherwise, assume it affects Down Payment.
      if ((scenario.downPayment || 0) === 0) {
          updates.existingEquity = equityGap;
      } else {
          updates.downPayment = Math.max(0, equityGap - (scenario.existingEquity || 0));
      }
      
      // Update tax/ins/hoa if dynamic rate
      if (scenario.usePropertyTaxRate) updates.propertyTax = newVal * (scenario.propertyTaxRate / 100);
      if (scenario.useHomeInsuranceRate && scenario.homeInsuranceRate !== undefined) updates.homeInsurance = newVal * (scenario.homeInsuranceRate / 100);
      if (scenario.useHoaRate && scenario.hoaRate !== undefined) updates.hoa = newVal * (scenario.hoaRate / 100);

      onUpdate(scenario.id, updates);
  };

  // 2. Change Primary Loan -> Adjust Equity
  const handlePrimaryLoanChange = (newLoan: number) => {
      // User is changing ORIGINAL loan amount
      // We need to re-calculate implied current balance based on this new original amount
      const impliedCurrentBalance = calculateCurrentBalance(
          newLoan, 
          scenario.interestRate, 
          scenario.loanTermYears || 30, 
          scenario.startDate
      );

      const totalAdditional = (scenario.additionalLoans || []).reduce((sum, l) => {
          const cur = calculateCurrentBalance(l.balance, l.rate, l.years, l.startDate);
          return sum + cur;
      }, 0);

      const equityGap = Math.max(0, scenario.homeValue - impliedCurrentBalance - totalAdditional);
      
      const updates: Partial<LoanScenario> = { loanAmount: newLoan };
      
      if ((scenario.downPayment || 0) === 0) {
          updates.existingEquity = equityGap;
      } else {
          updates.downPayment = Math.max(0, equityGap - (scenario.existingEquity || 0));
      }
      
      // Recalc PMI if based on loan amount
      if (scenario.usePmiRate && scenario.pmiRate !== undefined) {
          updates.pmi = newLoan * (scenario.pmiRate / 100);
      }
      
      onUpdate(scenario.id, updates);
  };

  // 3. Change Down Payment -> Adjust Loans
  const handleDownPaymentChange = (newDown: number) => {
      // Target Debt = Home - Down - Existing
      const existing = scenario.existingEquity || 0;
      const targetCurrentTotalDebt = Math.max(0, scenario.homeValue - newDown - existing);
      
      // Current Debt = PrimaryCurrent + AddtlCurrent
      const totalAdditionalCurrent = (scenario.additionalLoans || []).reduce((sum, l) => {
          return sum + calculateCurrentBalance(l.balance, l.rate, l.years, l.startDate);
      }, 0);
      
      const targetPrimaryCurrent = Math.max(0, targetCurrentTotalDebt - totalAdditionalCurrent);
      
      let newPrimaryOriginal = targetPrimaryCurrent;
      if (scenario.startDate) {
          const ratio = calculated.startingBalance / (scenario.loanAmount || 1);
          if (ratio > 0 && ratio < 1) {
              newPrimaryOriginal = targetPrimaryCurrent / ratio;
          }
      }

      onUpdate(scenario.id, {
          downPayment: newDown,
          loanAmount: Math.round(newPrimaryOriginal)
      });
  };

  // 4. Change Existing Equity -> Adjust Loans
  const handleExistingEquityChange = (newExisting: number) => {
      const down = scenario.downPayment || 0;
      const targetCurrentTotalDebt = Math.max(0, scenario.homeValue - down - newExisting);
      
      const totalAdditionalCurrent = (scenario.additionalLoans || []).reduce((sum, l) => {
          return sum + calculateCurrentBalance(l.balance, l.rate, l.years, l.startDate);
      }, 0);
      
      const targetPrimaryCurrent = Math.max(0, targetCurrentTotalDebt - totalAdditionalCurrent);
      
      let newPrimaryOriginal = targetPrimaryCurrent;
      if (scenario.startDate) {
          const ratio = calculated.startingBalance / (scenario.loanAmount || 1);
          if (ratio > 0 && ratio < 1) {
              newPrimaryOriginal = targetPrimaryCurrent / ratio;
          }
      }

      onUpdate(scenario.id, {
          existingEquity: newExisting,
          loanAmount: Math.round(newPrimaryOriginal)
      });
  };
  
  // Validation State for Red Warning
  // Must use Current Balances
  const totalAdditionalCurrent = (scenario.additionalLoans || []).reduce((sum, l) => {
      return sum + calculateCurrentBalance(l.balance, l.rate, l.years, l.startDate);
  }, 0);
  const totalLoansActual = calculated.startingBalance + totalAdditionalCurrent;
  
  const totalEquityActual = (scenario.downPayment || 0) + (scenario.existingEquity || 0);
  const isEquationBroken = Math.abs((totalLoansActual + totalEquityActual) - scenario.homeValue) > 500; // Tolerance

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
  const badgeGlobal = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
  const badgeManual = "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";

  const rPrincipal = Math.round(calculated.principalPaid);
  const rTax = Math.round(calculated.taxRefund);
  const rRent = Math.round(calculated.accumulatedRentalIncome);
  const rRentTax = Math.round(calculated.totalRentalTax || 0);
  const rRentPaid = Math.round(calculated.totalRentPaid || 0);
  const rAppreciation = Math.round(calculated.totalAppreciation);
  
  const rInvTax = Math.round(calculated.totalInvestmentTax || 0);
  const rInvGrowthGross = Math.round(calculated.investmentPortfolio - calculated.totalInvestmentContribution - (calculated.initialCapitalBase || 0));

  const rSellingCosts = Math.round(calculated.sellingCosts);
  const rCustomExpenses = Math.round(calculated.totalCustomExpenses || 0);
  
  const rTotalPaid = Math.round(calculated.totalPaid); 
  const rClosing = Math.round((scenario.closingCosts || 0) + (scenario.customClosingCosts?.reduce((s,c)=>s+c.amount,0)||0));
  const rLoanFees = Math.round(calculated.totalLoanFees || 0);
  const rDown = Math.round(scenario.downPayment || 0);
  const rMonthlyPITI = Math.round(calculated.totalMonthlyPayment);
  const rNetMonthly = Math.round(calculated.netMonthlyPayment);
  const rCapitalGainsTax = Math.round(calculated.capitalGainsTax || 0);
  const rInvContribution = Math.round(calculated.totalInvestmentContribution || 0);
  const rInitialInv = Math.round(calculated.initialCapitalBase || 0);
  const rLoanBalance = Math.round(calculated.remainingBalance);
  const rGrossEquity = Math.round(calculated.futureHomeValue - calculated.remainingBalance);
  const rCashAfterSale = Math.round(rGrossEquity - calculated.sellingCosts - calculated.capitalGainsTax);
  
  // Instant Equity Calculation
  const instantEquity = calculated.instantEquity;

  let mainMetricLabel = "PROFIT";
  let mainMetricValue = calculated.profit;
  let metricColor = "text-brand-600 dark:text-brand-400";

  if (comparisonMetric === 'netWorth') {
      mainMetricLabel = "NET WORTH";
      mainMetricValue = calculated.netWorth;
      metricColor = "text-blue-600 dark:text-blue-400";
  } else if (comparisonMetric === 'netCost') {
      mainMetricLabel = "NET COST";
      mainMetricValue = calculated.netCost;
      metricColor = "text-red-500 dark:text-red-400";
  } else if (comparisonMetric === 'outOfPocket') {
      mainMetricLabel = "OUT OF POCKET";
      mainMetricValue = calculated.totalInvestedAmount;
      metricColor = "text-purple-600 dark:text-purple-400";
  }

  const getSummaryText = () => {
    if (scenario.isInvestmentOnly) return `Investment Strategy · ${projectionYears.toFixed(1)} years`;
    if (scenario.isRentOnly) return `Rent + Invest Monthly Savings · ${projectionYears.toFixed(1)} years`;
    return `${scenario.interestRate}% · ${formatCurrency(scenario.loanAmount)} · ${projectionYears.toFixed(1)} years`;
  };
  
  const getPitiTitle = () => {
      if (scenario.isInvestmentOnly) return "Monthly Contribution";
      if (scenario.isRentOnly) return "Monthly Outflow";
      return "Monthly Payment";
  };

  const capGainsTooltip = `Projected Sale Price: ${formatCurrency(calculated.futureHomeValue)}
- Original Purchase Price: ${formatCurrency(scenario.homeValue)}
----------------
= Gross Appreciation (Gain): ${formatCurrency(calculated.taxableCapitalGains + calculated.capitalGainsExclusion)}
${calculated.capitalGainsExclusion > 0 ? `- Exclusion Applied: ${formatCurrency(calculated.capitalGainsExclusion)}` : '- Exclusion: $0'}
----------------
= Taxable Base: ${formatCurrency(calculated.taxableCapitalGains)}
x Tax Rate (${scenario.capitalGainsTaxRate ?? 0}%): ${formatCurrency(calculated.capitalGainsTax)}

*Note: Tax is estimated on Gross Appreciation (Future Value - Purchase Price) to highlight tax on growth. Buying costs are separate.*`;
  
  const isGlobalInvestment = !scenario.lockInvestment;

  // Show balance label if different from original
  const showBalanceLabel = Math.abs(calculated.startingBalance - scenario.loanAmount) > 100;
  
  // Is property costs enabled?
  const isPropCostsEnabled = scenario.includePropertyCosts !== false;
  const isRentEnabled = scenario.includeRent !== false;
  // Default rent flow type if undefined: Rent Mode -> Outflow, Buy Mode -> Inflow
  const activeRentFlow = scenario.rentFlowType || (scenario.isRentOnly ? 'outflow' : 'inflow');

  return (
    <div 
      className={`${cardBg} rounded-xl shadow-lg border-t-4 p-4 flex flex-col gap-2 relative transition-all duration-300 hover:shadow-xl group`}
      style={{ borderColor: isWinner ? '#10b981' : scenario.color, height: 'fit-content' }}
    >
      {isExpanded ? (
        <>
            {/* Header */}
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
                    <button onClick={() => onViewSchedule(scenario.id)} className="text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 p-1" title="Amortization Schedule">
                        <Table2 size={16} />
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

            <div className={`flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-8 mt-1`}>
                
                {/* LEFT SIDE: Inputs */}
                <div className="flex flex-col gap-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1">
                        <div>{getSummaryText()}</div>
                        <div className="mt-1">
                            <div className="text-[10px] uppercase font-bold text-gray-400">{mainMetricLabel}</div>
                            <div className={`text-xl font-extrabold ${metricColor} tracking-tight`}>{formatCurrency(mainMetricValue)}</div>
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
                            {/* Toggle right, arrow left layout */}
                            <div className="flex justify-between items-center mb-2">
                                <div 
                                    className="flex items-center gap-2 cursor-pointer flex-1" 
                                    onClick={() => setIsHouseLoanOpen(!isHouseLoanOpen)}
                                >
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">HOUSE & LOAN</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {(scenario.includeHome !== false) && (
                                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => toggleLock('lockFMV')} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${scenario.lockFMV ? badgeManual : badgeGlobal}`}>
                                                Price: {scenario.lockFMV ? "Manual" : "Global"}
                                            </button>
                                            <button onClick={() => toggleLock('lockLoan')} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${scenario.lockLoan ? badgeManual : badgeGlobal}`}>
                                                Loan: {scenario.lockLoan ? "Manual" : "Global"}
                                            </button>
                                        </div>
                                    )}
                                    <label className="flex items-center cursor-pointer relative" onClick={e => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" 
                                            checked={scenario.includeHome !== false} 
                                            onChange={(e) => {
                                                const newVal = e.target.checked;
                                                onUpdate(scenario.id, { includeHome: newVal });
                                                // Auto collapse if turned off, auto expand if turned on
                                                if (!newVal) setIsHouseLoanOpen(false);
                                                else setIsHouseLoanOpen(true);
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                                    </label>
                                    <div onClick={() => setIsHouseLoanOpen(!isHouseLoanOpen)} className="cursor-pointer">
                                        {isHouseLoanOpen ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
                                    </div>
                                </div>
                            </div>
                            
                            {(isHouseLoanOpen && scenario.includeHome !== false) ? (
                                <div className="animate-in fade-in slide-in-from-top-1">
                                    {/* Purchase Price Input */}
                                    <div className={getInputHighlightClass(['home-val', 'cap-gains'])}>
                                        <SliderInput 
                                            label="Purchase Price" 
                                            value={scenario.homeValue} 
                                            onChange={handleHomeValueChange} 
                                            min={100000} max={3000000} step={5000} theme={theme} 
                                            disabled={!scenario.lockFMV}
                                            isGlobal={!scenario.lockFMV}
                                        />
                                    </div>

                                    {/* FMV Input (New) */}
                                    <div className={`mt-2 ${getInputHighlightClass(['fmv', 'appreciation'])}`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-1">
                                                <div className={`text-[10px] font-semibold ${labelColor} flex items-center`}>
                                                    Fair Market Value (FMV)
                                                </div>
                                                <Tooltip text="The estimated actual value of the property. Typically the same as purchase price, but can differ if you bought below market value (Instant Equity) or overpaid." />
                                            </div>
                                            {/* Show GLOBAL badge if active */}
                                            {!scenario.lockFMV && (
                                                <span className="text-[9px] font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1 rounded flex items-center gap-0.5">
                                                    <Lock size={8} /> Global
                                                </span>
                                            )}
                                            {/* Equity Badge */}
                                            {instantEquity !== 0 && (
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-2 ${instantEquity > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {instantEquity > 0 ? `Instant Equity: +${formatCurrency(instantEquity)}` : `Overpaying: ${formatCurrency(Math.abs(instantEquity))}`}
                                                </span>
                                            )}
                                        </div>
                                        <SliderInput 
                                            label=""
                                            value={(scenario.originalFmv && scenario.originalFmv > 0) ? scenario.originalFmv : scenario.homeValue} 
                                            onChange={(v) => onUpdate(scenario.id, { originalFmv: v })} 
                                            min={100000} max={3000000} step={5000} theme={theme}
                                            disabled={!scenario.lockFMV}
                                            isGlobal={false} // Label is hidden, badge handled above
                                        />
                                    </div>
                                    
                                    {/* Existing Equity Slider */}
                                    <div className={`mt-2 ${getInputHighlightClass(['equity'])}`}>
                                        <FlexibleInput 
                                            label={
                                                <div className="flex items-center gap-2">
                                                    <span>Equity already in the house</span>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); toggleLock('lockExistingEquity'); }}
                                                        className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${scenario.lockExistingEquity ? 'text-red-500' : 'text-gray-300'}`}
                                                        title="Lock Existing Equity"
                                                    >
                                                        {scenario.lockExistingEquity ? <Lock size={10} /> : <Unlock size={10} />}
                                                    </button>
                                                </div>
                                            }
                                            amountValue={scenario.existingEquity || 0}
                                            baseValue={scenario.homeValue}
                                            onAmountChange={handleExistingEquityChange}
                                            minAmount={0} 
                                            maxAmount={scenario.homeValue} 
                                            stepAmount={1000} 
                                            theme={theme}
                                            error={isEquationBroken}
                                            disabled={scenario.lockExistingEquity}
                                        />
                                    </div>

                                    <div className="border-t border-dashed border-gray-500/20 pt-2 mt-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-1">
                                                <label className={`text-[10px] font-bold uppercase ${labelColor}`}>Primary Loan</label>
                                                <button 
                                                    onClick={() => onUpdate(scenario.id, { primaryBalanceLocked: !scenario.primaryBalanceLocked })}
                                                    className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${scenario.primaryBalanceLocked ? 'text-red-500' : 'text-gray-300'}`}
                                                    title="Lock Balance Calculation"
                                                >
                                                    {scenario.primaryBalanceLocked ? <Lock size={10} /> : <Unlock size={10} />}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div 
                                            className="pl-3 border-l-4 mb-3"
                                            style={{ borderColor: scenario.color }}
                                        >
                                            <div className={getInputHighlightClass(['loan-amt', 'netPayment'])}>
                                                <SliderInput 
                                                    label="Loan Amount (Originated)" 
                                                    value={scenario.loanAmount} 
                                                    onChange={handlePrimaryLoanChange} 
                                                    min={50000} max={2000000} step={5000} theme={theme}
                                                    disabled={!scenario.lockLoan}
                                                    isGlobal={!scenario.lockLoan}
                                                    className="mb-1"
                                                    subLabel={showBalanceLabel && (
                                                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                                            Current Balance: {formatCurrency(calculated.startingBalance)}
                                                        </span>
                                                    )}
                                                />
                                            </div>
                                            <div className={`flex gap-2 mb-2 ${getInputHighlightClass(['loan-rate', 'loan-term', 'netPayment', 'refund'])}`}>
                                                <div className="w-1/2">
                                                    <label className={`text-[9px] font-semibold ${labelColor} block mb-0.5`}>Rate (%)</label>
                                                    <MoneyInput 
                                                        value={scenario.interestRate} 
                                                        onChange={(v) => handleChange('interestRate', v)} 
                                                        theme={theme}
                                                        maxDecimals={3}
                                                    />
                                                </div>
                                                <div className="w-1/2">
                                                    <label className={`text-[9px] font-semibold ${labelColor} block mb-0.5`}>Term (Yrs)</label>
                                                    <MoneyInput 
                                                        value={scenario.loanTermYears || 30} 
                                                        onChange={(v) => handleChange('loanTermYears', v)} 
                                                        theme={theme}
                                                        maxDecimals={0}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className={`text-[9px] font-semibold ${labelColor}`}>Start Date</label>
                                                <input 
                                                    type="date"
                                                    value={scenario.startDate || ''}
                                                    onChange={(e) => onUpdate(scenario.id, { startDate: e.target.value })}
                                                    className={`text-xs p-0.5 border rounded ${inputClass} w-28 text-right`}
                                                />
                                            </div>
                                            <div className={getInputHighlightClass(['loan-fees'])}>
                                                <OneTimeExpensesList 
                                                    expenses={scenario.primaryLoanExpenses || []}
                                                    onAdd={addPrimaryExpense}
                                                    onRemove={removePrimaryExpense}
                                                    onUpdate={updatePrimaryExpense}
                                                    theme={theme}
                                                    title="One-Time Fees / Repairs"
                                                />
                                            </div>
                                        </div>

                                        {scenario.additionalLoans && scenario.additionalLoans.length > 0 && (
                                            <div className="space-y-3 mt-3 mb-3">
                                                {scenario.additionalLoans.map((loan) => {
                                                    const subLoanCalc = calculateCurrentBalance(loan.balance, loan.rate, loan.years, loan.startDate);
                                                    const showSubBal = Math.abs(subLoanCalc - loan.balance) > 10;
                                                    return (
                                                    <div 
                                                        key={loan.id} 
                                                        className="relative group/loan pl-3 border-l-4"
                                                        style={{ borderColor: scenario.color }}
                                                    >
                                                        <div className="flex justify-between items-center mb-1">
                                                            <input 
                                                                type="text" 
                                                                value={loan.name} 
                                                                onChange={(e) => updateAdditionalLoan(loan.id, 'name', e.target.value)}
                                                                className={`text-[10px] font-bold bg-transparent border-none focus:ring-0 p-0 w-24 ${theme==='light'?'text-gray-600':'text-gray-300'}`}
                                                            />
                                                            <button onClick={() => removeAdditionalLoan(loan.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover/loan:opacity-100 transition-opacity">
                                                                <Trash2 size={10} />
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-col gap-1 mb-2">
                                                            <div className="flex gap-2 items-center">
                                                                <MoneyInput 
                                                                    value={loan.balance} 
                                                                    onChange={(v) => updateAdditionalLoan(loan.id, 'balance', v)}
                                                                    theme={theme}
                                                                    placeholder="Loan Amount (Originated)"
                                                                    className="font-bold"
                                                                    maxDecimals={0}
                                                                />
                                                                <button 
                                                                    onClick={() => toggleAdditionalLoanLock(loan.id)}
                                                                    className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${loan.locked ? 'text-red-500' : 'text-gray-300'}`}
                                                                    title="Lock Balance"
                                                                >
                                                                    {loan.locked ? <Lock size={10} /> : <Unlock size={10} />}
                                                                </button>
                                                            </div>
                                                            {showSubBal && (
                                                                <div className="text-right">
                                                                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                                                        Current Balance: {formatCurrency(subLoanCalc)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2 mb-1">
                                                            <div className="relative w-1/2">
                                                                <MoneyInput value={loan.rate} onChange={(v) => updateAdditionalLoan(loan.id, 'rate', v)} theme={theme} maxDecimals={3} />
                                                                <span className="absolute right-4 top-1 text-[8px] text-gray-400">%</span>
                                                            </div>
                                                            <div className="relative w-1/2">
                                                                <MoneyInput value={loan.years} onChange={(v) => updateAdditionalLoan(loan.id, 'years', v)} theme={theme} maxDecimals={1} />
                                                                <span className="absolute right-4 top-1 text-[8px] text-gray-400">Yr</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <label className={`text-[9px] font-semibold ${labelColor}`}>Start Date</label>
                                                            <input 
                                                                type="date"
                                                                value={loan.startDate || ''}
                                                                onChange={(e) => updateAdditionalLoan(loan.id, 'startDate', e.target.value)}
                                                                className={`text-xs p-0.5 border rounded ${inputClass} w-24 text-right`}
                                                            />
                                                        </div>
                                                        <OneTimeExpensesList 
                                                            expenses={loan.oneTimeExpenses || []}
                                                            onAdd={() => addAddLoanExpense(loan.id)}
                                                            onRemove={(eId) => removeAddLoanExpense(loan.id, eId)}
                                                            onUpdate={(eId, f, v) => updateAddLoanExpense(loan.id, eId, f, v)}
                                                            theme={theme}
                                                            title="One-Time Expenses"
                                                        />
                                                    </div>
                                                );
                                                })}
                                            </div>
                                        )}
                                        
                                        <button 
                                            onClick={addAdditionalLoan}
                                            className={`w-full py-1.5 mt-2 rounded-lg text-[10px] border border-dashed flex items-center justify-center gap-1 transition-all hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 dark:hover:bg-brand-900/30 dark:hover:text-brand-400 ${theme==='light'?'bg-white border-gray-300 text-gray-400':'bg-white/5 border-gray-600 text-gray-500'}`}
                                        >
                                            <PlusCircle size={12} /> Add Loan
                                        </button>
                                    </div>

                                    <div className={`pt-2 border-t border-dashed border-gray-500/20 mt-2 ${getInputHighlightClass(['down-pay'])}`}>
                                        <FlexibleInput 
                                            label="Down Payment (Cash)"
                                            amountValue={scenario.downPayment}
                                            baseValue={scenario.homeValue}
                                            onAmountChange={handleDownPaymentChange}
                                            minAmount={0} 
                                            maxAmount={scenario.homeValue} 
                                            stepAmount={1000} 
                                            theme={theme}
                                            error={isEquationBroken}
                                        />
                                    </div>
                                    
                                    <div className="mt-4 pt-2 border-t border-dashed border-gray-600/20">
                                        {/* Toggle right, arrow left */}
                                        <div 
                                            className={`flex justify-between items-center cursor-pointer ${getInputHighlightClass(['extra-pay'])}`}
                                            onClick={() => setIsExtraPaymentsOpen(!isExtraPaymentsOpen)}
                                        >
                                            <span className="text-[9px] font-bold text-gray-400 uppercase">EXTRA PAYMENTS</span>
                                            {isExtraPaymentsOpen ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
                                        </div>
                                        
                                        {isExtraPaymentsOpen && (
                                        <div className={`animate-in fade-in slide-in-from-top-1 mt-2 ${getInputHighlightClass(['extra-pay'])}`}>
                                            <div className="mb-2">
                                                <SliderInput label="Extra Monthly Payment" value={scenario.monthlyExtraPayment} onChange={v => handleChange('monthlyExtraPayment', v)} min={0} max={5000} step={50} theme={theme} />
                                                <div className="flex justify-end -mt-1 mb-2 gap-2">
                                                    <div className="w-1/2">
                                                        <label className={`text-[9px] font-semibold ${labelColor} block mb-0.5`}>Start after month</label>
                                                        <input 
                                                            type="number"
                                                            value={scenario.extraPaymentDelayMonths || 0}
                                                            onChange={e => onUpdate(scenario.id, {extraPaymentDelayMonths: parseInt(e.target.value) || 0})}
                                                            className={`w-full text-xs p-1 border rounded ${inputClass}`}
                                                            min={0}
                                                        />
                                                    </div>
                                                    <div className="w-1/2">
                                                        <label className={`text-[9px] font-semibold ${labelColor} block mb-0.5`}>Frequency</label>
                                                        <select 
                                                            value={scenario.monthlyExtraPaymentFrequency || 'monthly'} 
                                                            onChange={e => onUpdate(scenario.id, {monthlyExtraPaymentFrequency: e.target.value as any})}
                                                            className={`w-full text-xs p-1 border rounded ${inputClass}`}
                                                        >
                                                            <option value="monthly">Monthly</option>
                                                            <option value="annually">Annually (Spread)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mb-2 pt-2 border-t border-dashed border-gray-600/30">
                                                <SliderInput label="Annual Lump Sum" value={scenario.annualLumpSumPayment || 0} onChange={v => handleChange('annualLumpSumPayment', v)} min={0} max={50000} step={500} theme={theme} />
                                                <div className="flex justify-end -mt-1 mb-1">
                                                    <div className="w-1/2">
                                                        <label className={`text-[9px] font-semibold ${labelColor} block mb-0.5`}>Paid in Month</label>
                                                        <select 
                                                            value={scenario.annualLumpSumMonth || 0} 
                                                            onChange={e => onUpdate(scenario.id, {annualLumpSumMonth: parseInt(e.target.value)})}
                                                            className={`w-full text-xs p-1 border rounded ${inputClass}`}
                                                        >
                                                            <option value={0}>January</option>
                                                            <option value={1}>February</option>
                                                            <option value={2}>March</option>
                                                            <option value={3}>April</option>
                                                            <option value={4}>May</option>
                                                            <option value={5}>June</option>
                                                            <option value={6}>July</option>
                                                            <option value={7}>August</option>
                                                            <option value={8}>September</option>
                                                            <option value={9}>October</option>
                                                            <option value={10}>November</option>
                                                            <option value={11}>December</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-dashed border-gray-600/30">
                                                <SliderInput label="One-Time Payment" value={scenario.oneTimeExtraPayment} onChange={v => handleChange('oneTimeExtraPayment', v)} min={0} max={500000} step={1000} theme={theme} />
                                            </div>

                                            {(calculated.lifetimeInterestSaved > 0 || calculated.monthsSaved > 0) && (
                                                <div className={`mt-2 p-2 rounded text-[10px] ${theme==='light'?'bg-emerald-50 text-emerald-800 border border-emerald-100':'bg-emerald-900/20 text-emerald-300 border border-emerald-900'}`}>
                                                    <div className="flex justify-between font-bold mb-1 border-b border-emerald-200 dark:border-emerald-800 pb-1">
                                                        <span className="uppercase opacity-70">Impact of Extra</span>
                                                        <span className="text-emerald-600 dark:text-emerald-400">Savings</span>
                                                    </div>
                                                    <div className="flex justify-between mb-0.5">
                                                        <span>Interest Saved</span>
                                                        <span className="font-bold">{formatCurrency(calculated.lifetimeInterestSaved)}</span>
                                                    </div>
                                                    <div className="flex justify-between mb-2">
                                                        <span>Time Saved</span>
                                                        <span className="font-bold">{(calculated.monthsSaved/12).toFixed(1)} years</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="hidden"></div>
                            )}
                        </div>
                        )}

                        {/* 2. PROPERTY COSTS */}
                        {!scenario.isInvestmentOnly && (
                        <div className="space-y-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                             <div 
                                className="flex justify-between items-center cursor-pointer"
                                onClick={() => setIsPropCostsOpen(!isPropCostsOpen)}
                             >
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">PROPERTY & LIVING COSTS</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center cursor-pointer relative" onClick={e => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" 
                                            checked={isPropCostsEnabled} 
                                            onChange={(e) => {
                                                const newVal = e.target.checked;
                                                onUpdate(scenario.id, { includePropertyCosts: newVal });
                                                if (newVal) setIsPropCostsOpen(true);
                                                else setIsPropCostsOpen(false);
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                                    </label>
                                    {isPropCostsOpen ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
                                </div>
                            </div>
                            
                            {isPropCostsOpen && (
                            <div className={`transition-opacity duration-200 animate-in fade-in slide-in-from-top-1 ${isPropCostsEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                                {!scenario.isRentOnly && (
                                    <>
                                        <div className={getInputHighlightClass(['prop-tax', 'netPayment', 'refund'])}>
                                            <FlexibleInput
                                                label="Property Tax ($/yr)"
                                                amountValue={scenario.propertyTax}
                                                baseValue={scenario.homeValue}
                                                onAmountChange={(v) => onUpdate(scenario.id, { propertyTax: v, usePropertyTaxRate: false })}
                                                minAmount={0} maxAmount={50000} stepAmount={100} theme={theme}
                                            />
                                        </div>
                                        
                                        <div className={getInputHighlightClass(['home-ins', 'netPayment'])}>
                                            <FlexibleInput
                                                label="Insurance ($/yr)"
                                                amountValue={scenario.homeInsurance}
                                                baseValue={scenario.homeValue}
                                                onAmountChange={(v) => onUpdate(scenario.id, { homeInsurance: v, useHomeInsuranceRate: false })}
                                                minAmount={0} maxAmount={10000} stepAmount={50} theme={theme}
                                            />
                                        </div>

                                        <div className={getInputHighlightClass(['hoa', 'netPayment'])}>
                                            <FlexibleInput
                                                label="HOA ($/yr)"
                                                amountValue={scenario.hoa}
                                                baseValue={scenario.homeValue}
                                                onAmountChange={(v) => onUpdate(scenario.id, { hoa: v, useHoaRate: false })}
                                                minAmount={0} maxAmount={24000} stepAmount={50} theme={theme}
                                            />
                                        </div>

                                        <div className={getInputHighlightClass(['pmi', 'netPayment'])}>
                                            <FlexibleInput
                                                label="PMI ($/yr)"
                                                amountValue={scenario.pmi}
                                                baseValue={scenario.loanAmount}
                                                onAmountChange={(v) => onUpdate(scenario.id, { pmi: v, usePmiRate: false })}
                                                minAmount={0} maxAmount={10000} stepAmount={50} theme={theme}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            )}
                        </div>
                        )}

                         {/* 3. BUYING / SELLING (Moved Up) */}
                        {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                        <div className="space-y-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                             <div 
                                className={`flex justify-between items-center cursor-pointer ${getInputHighlightClass(['close-cost', 'sell-cost', 'cap-gains'])}`}
                                onClick={() => setIsSellingOpen(!isSellingOpen)}
                             >
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">BUYING / SELLING</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center cursor-pointer relative" onClick={e => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" 
                                            checked={scenario.enableSelling !== false} 
                                            onChange={(e) => onUpdate(scenario.id, { enableSelling: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                                    </label>
                                    {isSellingOpen ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
                                </div>
                            </div>
                            
                            {isSellingOpen && (
                                <div className={`animate-in fade-in slide-in-from-top-1 mt-2 transition-opacity duration-200 ${scenario.enableSelling !== false ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                                    <div className={getInputHighlightClass(['close-cost'])}>
                                        <FlexibleInput
                                            label="Closing Costs (Buy Side)"
                                            amountValue={scenario.closingCosts || 0}
                                            baseValue={scenario.homeValue}
                                            onAmountChange={v => handleChange('closingCosts', v)}
                                            minAmount={0} 
                                            maxAmount={50000} 
                                            stepAmount={100} 
                                            theme={theme}
                                        />
                                    </div>
                                    
                                    <div className={`mb-2 ${getInputHighlightClass(['close-cost'])}`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className={`text-[10px] font-semibold ${labelColor}`}>Extra Payment for Closing</label>
                                             <button 
                                                onClick={addClosingCost}
                                                className={`px-2 py-0.5 rounded-full text-[9px] border flex items-center gap-1 transition-all hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 dark:hover:bg-brand-900/30 dark:hover:text-brand-400 ${theme==='light'?'bg-white border-gray-300 text-gray-500':'bg-white/5 border-gray-600 text-gray-400'}`}
                                            >
                                                <Plus size={10} /> Add
                                            </button>
                                        </div>
                                        {scenario.customClosingCosts && scenario.customClosingCosts.length > 0 && (
                                            <div className="space-y-1">
                                                {scenario.customClosingCosts.map((cost) => (
                                                    <div key={cost.id} className="flex gap-2 items-center">
                                                         <input 
                                                            type="text" 
                                                            value={cost.name} 
                                                            onChange={(e) => updateClosingCost(cost.id, 'name', e.target.value)}
                                                            className={`w-1/2 text-xs p-1 border rounded ${inputClass}`}
                                                            placeholder="e.g. Points, Title"
                                                        />
                                                        <div className="relative w-1/3">
                                                            <MoneyInput 
                                                                value={cost.amount} 
                                                                onChange={(val) => updateClosingCost(cost.id, 'amount', val)}
                                                                theme={theme}
                                                                placeholder="0"
                                                                maxDecimals={0}
                                                            />
                                                        </div>
                                                        <button 
                                                            onClick={() => removeClosingCost(cost.id)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="border-t border-dashed border-gray-600/20 pt-2 mt-2">
                                        <div className={getInputHighlightClass(['sell-cost'])}>
                                            <SliderInput label="Selling Closing Cost %" value={scenario.sellingCostRate ?? 6} onChange={v => handleChange('sellingCostRate', v)} min={0} max={10} step={0.5} theme={theme} />
                                        </div>
                                        <div className={getInputHighlightClass(['cap-gains'])}>
                                            <SliderInput label={`Capital Gains Tax %`} value={scenario.capitalGainsTaxRate ?? 20} onChange={v => handleChange('capitalGainsTaxRate', v)} min={0} max={50} step={1} theme={theme} />
                                        </div>
                                        
                                        <div className="flex justify-between items-center mt-2">
                                            <span className={`text-[9px] font-semibold ${labelColor}`}>Primary Res. Exclusion ($250k)</span>
                                            <label className="flex items-center cursor-pointer relative">
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!scenario.primaryResidenceExclusion} // Default false
                                                    onChange={(e) => handleChange('primaryResidenceExclusion', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        )}

                        {/* 4. RENT (Moved Down) */}
                        {!scenario.isInvestmentOnly && (
                        <div className="space-y-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                             <div 
                                className="flex justify-between items-center mb-2 cursor-pointer"
                                onClick={() => setIsRentOpen(!isRentOpen)}
                             >
                                <span className="text-[9px] font-bold text-gray-400 uppercase">RENT</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => {e.stopPropagation(); toggleLock(scenario.isRentOnly ? 'lockRent' : 'lockRentIncome')}} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${scenario.isRentOnly ? (scenario.lockRent ? badgeManual : badgeGlobal) : (scenario.lockRentIncome ? badgeManual : badgeGlobal)}`}>
                                        {scenario.isRentOnly ? (scenario.lockRent ? "Manual" : "Global") : (scenario.lockRentIncome ? "Manual" : "Global")}
                                    </button>
                                    {/* Toggle Calculate */}
                                    <label className="flex items-center cursor-pointer relative" onClick={e => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" 
                                            checked={isRentEnabled} 
                                            onChange={(e) => {
                                                const newVal = e.target.checked;
                                                onUpdate(scenario.id, { includeRent: newVal });
                                                if(newVal) setIsRentOpen(true);
                                                else setIsRentOpen(false);
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                                    </label>
                                    {isRentOpen ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
                                </div>
                            </div>
                            
                            {isRentOpen && (
                            <div className={`transition-opacity duration-200 animate-in fade-in slide-in-from-top-1 ${isRentEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                                
                                {/* Rent Flow Type Switcher */}
                                <div className={`flex rounded mb-3 border ${theme==='light'?'bg-gray-100 border-gray-200':'bg-black/30 border-gray-700'}`}>
                                    <button 
                                        onClick={() => onUpdate(scenario.id, { rentFlowType: 'inflow' })}
                                        className={`flex-1 py-1 text-[10px] font-semibold rounded-l transition-all ${activeRentFlow === 'inflow' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Income (Inflow)
                                    </button>
                                    <button 
                                        onClick={() => onUpdate(scenario.id, { rentFlowType: 'outflow' })}
                                        className={`flex-1 py-1 text-[10px] font-semibold rounded-r transition-all ${activeRentFlow === 'outflow' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Expense (Outflow)
                                    </button>
                                </div>

                                {activeRentFlow === 'outflow' ? (
                                    <div className={getInputHighlightClass(['rent-val', 'netPayment'])}>
                                        <SliderInput 
                                            label="Rent You Pay ($/mo)" 
                                            value={scenario.rentMonthly} 
                                            onChange={v => handleChange('rentMonthly', v)} 
                                            min={500} max={10000} step={50} theme={theme} 
                                            disabled={!scenario.lockRent}
                                            isGlobal={!scenario.lockRent}
                                        />
                                        <SliderInput label="Annual Inc (%)" value={scenario.rentIncreasePerYear} onChange={v => handleChange('rentIncreasePerYear', v)} min={0} max={10} step={0.1} theme={theme} />
                                    </div>
                                ) : (
                                    <div className={getInputHighlightClass(['rent-val', 'netPayment', 'rent-tax'])}>
                                        <SliderInput 
                                            label="Rent You Receive ($/mo)" 
                                            value={scenario.rentalIncome || 0} 
                                            onChange={v => handleChange('rentalIncome', v)} 
                                            min={0} max={10000} step={50} theme={theme} 
                                            disabled={!scenario.lockRentIncome}
                                            isGlobal={!scenario.lockRentIncome}
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
                                    </div>
                                )}

                                {/* Additional Expenses Moved Here */}
                                <div className={`mt-2 pt-2 border-t border-dashed border-gray-600/20 ${getInputHighlightClass(['custom-exp'])}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className={`text-[10px] font-semibold ${labelColor} flex items-center gap-1`}>
                                            <Zap size={10} /> Additional Expenses (Monthly)
                                        </label>
                                        <button 
                                            onClick={addCustomExpense}
                                            className={`px-2 py-0.5 rounded-full text-[10px] border flex items-center gap-1 transition-all hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 dark:hover:bg-brand-900/30 dark:hover:text-brand-400 ${theme==='light'?'bg-white border-gray-300 text-gray-500':'bg-white/5 border-gray-600 text-gray-400'}`}
                                        >
                                            <Plus size={10} /> Add
                                        </button>
                                    </div>
                                    {scenario.customExpenses && scenario.customExpenses.length > 0 ? (
                                        <div className="space-y-2">
                                            {scenario.customExpenses.map((expense) => (
                                                <div key={expense.id} className="flex gap-2 items-center animate-in slide-in-from-left-2">
                                                    <input 
                                                        type="text" 
                                                        value={expense.name} 
                                                        onChange={(e) => updateCustomExpense(expense.id, 'name', e.target.value)}
                                                        className={`w-1/2 text-xs p-1 border rounded ${inputClass}`}
                                                        placeholder="e.g. Utility, Internet"
                                                    />
                                                    <div className="relative w-1/3">
                                                        <MoneyInput 
                                                            value={expense.amount} 
                                                            onChange={(val) => updateCustomExpense(expense.id, 'amount', val)}
                                                            theme={theme}
                                                            placeholder="0"
                                                            maxDecimals={0}
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={() => removeCustomExpense(expense.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-gray-400 italic text-center py-1">
                                            No additional expenses (e.g. Utility, Internet).
                                        </div>
                                    )}
                                </div>
                            </div>
                            )}
                        </div>
                        )}
                        
                        {/* 6. INVESTING */}
                        <div className="space-y-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                             <div 
                                className="flex justify-between items-center mb-2 cursor-pointer"
                                onClick={() => setIsInvestmentOpen(!isInvestmentOpen)}
                             >
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">INVESTING</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => {e.stopPropagation(); toggleLock('lockInvestment')}} 
                                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${scenario.lockInvestment ? badgeManual : badgeGlobal} ${!(scenario.includeInvestment ?? true) ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        Mode: {scenario.lockInvestment ? "Manual" : "Global"}
                                    </button>
                                    <label className="flex items-center cursor-pointer relative" onClick={e => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" 
                                            checked={scenario.includeInvestment ?? true} 
                                            onChange={(e) => {
                                                const newVal = e.target.checked;
                                                onUpdate(scenario.id, { includeInvestment: newVal });
                                                if(newVal) setIsInvestmentOpen(true);
                                                else setIsInvestmentOpen(false);
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                                    </label>
                                    {isInvestmentOpen ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
                                </div>
                            </div>
                            
                            {isInvestmentOpen && (
                            <div className={`transition-opacity duration-200 animate-in fade-in slide-in-from-top-1 ${(scenario.includeInvestment ?? true) ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                                <div className={getInputHighlightClass(['inv-cap', 'initialInv'])}>
                                    <SliderInput 
                                        label="Starting Capital" 
                                        value={!isGlobalInvestment ? (scenario.investmentCapital ?? 100000) : (globalInvestmentSettings?.globalCashInvestment ?? 0)} 
                                        onChange={v => onUpdate(scenario.id, {investmentCapital: v})} 
                                        min={0} max={1000000} step={5000} theme={theme} 
                                        disabled={isGlobalInvestment}
                                        isGlobal={isGlobalInvestment}
                                    />
                                </div>
                                <div className={getInputHighlightClass(['inv-rate', 'invGrowth'])}>
                                    <SliderInput 
                                        label="Rate (% per annum)" 
                                        value={!isGlobalInvestment ? (scenario.investmentRate ?? 5) : (globalInvestmentSettings?.investmentReturnRate ?? 0)} 
                                        onChange={v => onUpdate(scenario.id, {investmentRate: v})} 
                                        min={0} max={15} step={0.1} theme={theme} 
                                        disabled={isGlobalInvestment}
                                        isGlobal={isGlobalInvestment}
                                    />
                                </div>
                                <div className={getInputHighlightClass(['inv-tax', 'invTax'])}>
                                    <SliderInput 
                                        label="Tax Rate (%)" 
                                        value={!isGlobalInvestment ? (scenario.investmentTaxRate ?? 20) : (globalInvestmentSettings?.globalInvestmentTaxRate ?? 20)} 
                                        onChange={v => onUpdate(scenario.id, {investmentTaxRate: v})} 
                                        min={0} max={50} step={1} theme={theme} 
                                        disabled={isGlobalInvestment}
                                        isGlobal={isGlobalInvestment}
                                    />
                                </div>
                                <div className={`mb-2 ${getInputHighlightClass(['inv-monthly', 'invCont'])}`}>
                                    <SliderInput 
                                        label="Additional Amount" 
                                        value={!isGlobalInvestment ? (scenario.investmentMonthly ?? 0) : (globalInvestmentSettings?.globalMonthlyContribution ?? 0)} 
                                        onChange={v => onUpdate(scenario.id, {investmentMonthly: v})} 
                                        min={0} max={10000} step={50} theme={theme} 
                                        disabled={isGlobalInvestment}
                                        isGlobal={isGlobalInvestment}
                                    />
                                    <div className="flex justify-end">
                                        <div className="w-1/2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <label className={`text-[9px] font-semibold ${isGlobalInvestment ? 'text-gray-400' : 'text-gray-500'}`}>Frequency</label>
                                                {isGlobalInvestment && (
                                                    <span className="text-[9px] font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1 rounded flex items-center gap-0.5">
                                                        <Lock size={8} /> Global
                                                    </span>
                                                )}
                                            </div>
                                            <select 
                                                value={!isGlobalInvestment ? (scenario.investmentContributionFrequency || 'monthly') : (globalInvestmentSettings?.globalContributionFrequency || 'monthly')} 
                                                onChange={e => onUpdate(scenario.id, {investmentContributionFrequency: e.target.value as any})}
                                                disabled={isGlobalInvestment}
                                                className={`w-full text-xs p-1 border rounded ${inputClass} ${isGlobalInvestment ? 'opacity-70 bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : ''}`}
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
                            )}
                        </div>
                    </div>
                    )}
                </div>

                {/* RIGHT SIDE: Financial Summary */}
                <div className="flex flex-col gap-3">
                    {/* ... (Existing Right Side Cards) ... */}
                    {/* 0. PITI MINI CARD */}
                    {!scenario.isInvestmentOnly && (
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
                            <div className="flex flex-wrap gap-2 text-[9px] opacity-70 justify-end">
                                {!scenario.isRentOnly && <span>P&I: {formatCurrency(Math.round(calculated.monthlyPrincipalAndInterest))}</span>}
                                {scenario.isRentOnly && <span>Rent: {formatCurrency(Math.round(calculated.totalMonthlyPayment - calculated.monthlyCustomExpenses))}</span>}
                                {!scenario.isRentOnly && <span>Tax: {formatCurrency(Math.round(calculated.monthlyTax))}</span>}
                                {!scenario.isRentOnly && <span>Ins: {formatCurrency(Math.round(calculated.monthlyInsurance))}</span>}
                                {!scenario.isRentOnly && <span>Fees: {formatCurrency(Math.round(calculated.monthlyHOA + calculated.monthlyPMI))}</span>}
                            </div>
                        </div>
                    )}

                    {/* 1. TOTAL RETURN (Unified Profit) */}
                    <div className={`border rounded-lg ${theme==='light'?'border-gray-200 bg-gray-50':'border-gray-700 bg-black/20'}`}>
                        <div className="px-3 py-1.5 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 rounded-t-lg">
                            <TrendingUp size={12} className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase">FINANCIAL SUMMARY</span>
                        </div>
                        <div className="p-2 space-y-1">
                            {!scenario.isRentOnly && !scenario.isInvestmentOnly ? (
                                <>
                                    {/* 1. Mortgage Payments Breakdown (Principal & Interest) */}
                                    {calculated.loanBreakdown && calculated.loanBreakdown.length > 0 ? (
                                        calculated.loanBreakdown.map(l => (
                                            <React.Fragment key={`pay-group-${l.id}`}>
                                                {/* Principal */}
                                                <BreakdownRow 
                                                    label={l.id === 'primary' ? 'Principal From Mortgage Payments' : `Principal (${l.name})`}
                                                    value={`+${formatCurrency(Math.round(l.principalPaid))}`} 
                                                    colorClass="text-emerald-500 font-bold" 
                                                    icon={<CreditCard size={10} />} 
                                                    tooltip={`Principal portion of payments for ${l.name}`} 
                                                    {...getRowProps('principal')}
                                                />
                                                {/* Interest */}
                                                <BreakdownRow 
                                                    label={l.id === 'primary' ? 'Interest' : `Interest (${l.name})`}
                                                    value={`-${formatCurrency(Math.round(l.interestPaid))}`} 
                                                    colorClass="text-red-500 font-bold" 
                                                    icon={<Percent size={10} />} 
                                                    tooltip={`Interest portion of payments for ${l.name}`} 
                                                    {...getRowProps('payments')}
                                                />
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <>
                                            <BreakdownRow 
                                                label="Principal From Mortgage Payments" 
                                                value={`+${formatCurrency(Math.round(calculated.principalPaid))}`} 
                                                colorClass="text-emerald-500 font-bold" 
                                                icon={<CreditCard size={10} />} 
                                                {...getRowProps('principal')}
                                            />
                                            <BreakdownRow 
                                                label="Interest" 
                                                value={`-${formatCurrency(Math.round(calculated.totalInterest))}`} 
                                                colorClass="text-red-500 font-bold" 
                                                icon={<Percent size={10} />} 
                                                {...getRowProps('payments')}
                                            />
                                        </>
                                    )}

                                    {/* NEW: Property Tax & Insurance Rows */}
                                    {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                                        <>
                                            {Math.round(calculated.monthlyTax * projectionYears * 12) > 0 && (
                                                <BreakdownRow 
                                                    label="Property Tax Paid" 
                                                    value={`-${formatCurrency(Math.round(calculated.monthlyTax * projectionYears * 12))}`} 
                                                    colorClass="text-red-500 font-bold" 
                                                    icon={<Landmark size={10} />} 
                                                    tooltip="Total Property Tax paid over time" 
                                                    {...getRowProps('propTax')}
                                                />
                                            )}
                                            {Math.round(calculated.monthlyInsurance * projectionYears * 12) > 0 && (
                                                <BreakdownRow 
                                                    label="Home Insurance Paid" 
                                                    value={`-${formatCurrency(Math.round(calculated.monthlyInsurance * projectionYears * 12))}`} 
                                                    colorClass="text-red-500 font-bold" 
                                                    icon={<ShieldCheck size={10} />} 
                                                    tooltip="Total Home Insurance paid over time" 
                                                    {...getRowProps('homeIns')}
                                                />
                                            )}
                                        </>
                                    )}

                                    {/* 3. Rental Income (Gross) (Inflow) */}
                                    {Math.abs(rRent) > 0 && (
                                        <BreakdownRow 
                                            label={scenario.rentalIncomeTaxEnabled ? "Rental Income (Gross)" : "Rental Income"} 
                                            value={`+${formatCurrency(Math.abs(rRent))}`} 
                                            colorClass="text-emerald-500 font-bold" 
                                            icon={<Building size={10} />} 
                                            tooltip="Total rent collected before expenses" 
                                            {...getRowProps('rent')}
                                        />
                                    )}

                                    {/* Rent Expense (Outflow) if active */}
                                    {rRentPaid > 0 && (
                                        <BreakdownRow 
                                            label="Rent Expenses (Outflow)" 
                                            value={`-${formatCurrency(rRentPaid)}`} 
                                            colorClass="text-red-500 font-bold" 
                                            icon={<CreditCard size={10} />} 
                                            tooltip="Total rent payments (expense)" 
                                            {...getRowProps('rent')}
                                        />
                                    )}
                                    
                                    {/* 4. Rental Tax Paid (Outflow) */}
                                    {rRentTax > 0 && (
                                        <BreakdownRow 
                                            label={`Rental Tax Paid (${scenario.rentalIncomeTaxRate ?? 0}%)`} 
                                            value={`-${formatCurrency(rRentTax)}`} 
                                            colorClass="text-red-500 font-bold" 
                                            icon={<Scale size={10} />} 
                                            tooltip="Tax paid on rental income" 
                                            {...getRowProps('rentTax')}
                                        />
                                    )}

                                    {/* Addtl Expenses MOVED HERE (Below Tax) */}
                                    {rCustomExpenses > 0 && (
                                        <BreakdownRow 
                                            label="Addtl. Expenses" 
                                            value={`-${formatCurrency(Math.abs(rCustomExpenses))}`} 
                                            colorClass="text-red-500 font-bold" 
                                            icon={<Zap size={10} />} 
                                            tooltip="Total Utility/Maintenance costs over time" 
                                            {...getRowProps('expenses')}
                                        />
                                    )}

                                    {/* Toggle for Net Payment Info */}
                                    {(scenario.rentalIncome || 0) > 0 && (
                                        <div className="relative py-1 my-1">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-dashed border-gray-300 dark:border-gray-700"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <button 
                                                    onClick={() => setShowInfoOnly(!showInfoOnly)}
                                                    className={`px-2 py-0.5 text-[9px] rounded-full border shadow-sm flex items-center gap-1 transition-colors ${theme==='light'?'bg-white border-gray-200 text-gray-400 hover:text-gray-600':'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    {showInfoOnly ? <EyeOff size={8} /> : <Eye size={8} />}
                                                    {showInfoOnly ? 'Hide' : 'Show Net Payment'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* 5. Net Monthly Payment (After Rent) (Info) */}
                                    {showInfoOnly && (scenario.rentalIncome || 0) > 0 && (
                                        <>
                                            <BreakdownRow 
                                                label="Payment Left (After Rental Income ) INFO ONLY" 
                                                value={`${formatCurrency(rNetMonthly)}/mo`} 
                                                colorClass="text-indigo-500 font-bold opacity-90" 
                                                icon={<Clock size={10} className="text-indigo-400" />} 
                                                tooltip="PITI (Principal + Interest + Taxes + Ins + HOA + PMI) - Monthly Rent. Excludes Custom Expenses & Extra Payments."
                                                bgClass="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-t"
                                                {...getRowProps('netPayment')}
                                            />
                                            <BreakdownRow 
                                                label={`Total Net Payment (${projectionYears.toFixed(1)} yr)(INFO ONLY)`} 
                                                value={`-${formatCurrency(Math.abs(rNetMonthly * projectionYears * 12))}`} 
                                                colorClass="text-indigo-500 font-bold opacity-90" 
                                                icon={<Wallet size={10} className="text-indigo-400" />} 
                                                tooltip="Projected sum of all net monthly payments over this horizon."
                                                bgClass="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-b mt-[1px]" 
                                                {...getRowProps('netPayment')}
                                            />
                                            <div className="border-t border-dashed border-gray-300 dark:border-gray-700 my-1"></div>
                                        </>
                                    )}
                                    {(!showInfoOnly || (scenario.rentalIncome || 0) <= 0) && (
                                         <div className="border-t border-dashed border-gray-300 dark:border-gray-700 my-1"></div>
                                    )}

                                    {/* 6. Mortgage Tax Refund (Inflow) */}
                                    {rTax > 0 && (
                                        <BreakdownRow 
                                            label="Mortgage Tax Refund" 
                                            value={`+${formatCurrency(Math.abs(rTax))}`} 
                                            colorClass="text-emerald-500 font-bold" 
                                            icon={<Receipt size={10} />} 
                                            tooltip="Tax savings from mortgage interest deduction (Interest + Property Tax)" 
                                            {...getRowProps('refund')}
                                        />
                                    )}
                                    
                                    {/* 7. Appreciation (Inflow/Asset) */}
                                    <BreakdownRow 
                                        label="Appreciation" 
                                        value={`${rAppreciation >= 0 ? '+' : ''}${formatCurrency(rAppreciation)}`} 
                                        colorClass={`${rAppreciation >= 0 ? 'text-emerald-500' : 'text-red-500'} font-bold`} 
                                        icon={<TrendingUp size={10} />} 
                                        tooltip="Change in home value over time" 
                                        {...getRowProps('appreciation')}
                                    />
                                    
                                    {/* --- THEN ALL OTHERS --- */}
                                    
                                    {rLoanFees > 0 && (
                                        <BreakdownRow 
                                            label="Loan Fees & One-Time Exp" 
                                            value={`-${formatCurrency(Math.abs(rLoanFees))}`} 
                                            colorClass="text-red-500 font-bold" 
                                            icon={<Receipt size={10} />} 
                                            tooltip="Initial origination fees, points, or one-time repairs" 
                                            {...getRowProps('loanFees')}
                                        />
                                    )}
                                    
                                    {(scenario.enableSelling !== false) && (
                                        <>
                                            <BreakdownRow 
                                                label={`Selling Costs (${scenario.sellingCostRate}%)`} 
                                                value={rSellingCosts > 0 ? `-${formatCurrency(rSellingCosts)}` : formatCurrency(0)} 
                                                colorClass="text-red-500 font-bold" 
                                                icon={<Tag size={10} />} 
                                                tooltip="Agent fees and closing costs when selling" 
                                                {...getRowProps('selling')}
                                            />
                                            <BreakdownRow 
                                                label={`Capital Gains Tax (${scenario.capitalGainsTaxRate ?? 20}%)`} 
                                                value={rCapitalGainsTax > 0 ? `-${formatCurrency(rCapitalGainsTax)}` : '-$0'} 
                                                colorClass="text-red-500 font-bold" 
                                                icon={<Scale size={10} />} 
                                                tooltip={capGainsTooltip} 
                                                {...getRowProps('capGains')}
                                            />
                                        </>
                                    )}

                                    {/* Investment Section: Only Show if Investing is Enabled */}
                                    {(scenario.includeInvestment !== false) && (
                                        <>
                                            <div className="border-t border-dashed border-gray-300 dark:border-gray-700 my-1"></div>
                                            
                                            {/* 8. Initial Investment (Outflow) */}
                                            {rInitialInv > 0 && (
                                                <BreakdownRow 
                                                    label="Initial Investment" 
                                                    value={`-${formatCurrency(Math.abs(rInitialInv))}`} 
                                                    colorClass="text-blue-500 font-bold" 
                                                    icon={<PiggyBank size={10} />} 
                                                    tooltip="Starting lump sum allocated to investment" 
                                                    {...getRowProps('initialInv')}
                                                />
                                            )}
                                            
                                            {/* 9. Investment Contributions (Outflow) */}
                                            {rInvContribution > 0 && (
                                                <BreakdownRow 
                                                    label="Investment Contributions" 
                                                    value={`-${formatCurrency(Math.abs(rInvContribution))}`} 
                                                    colorClass="text-blue-500 font-bold" 
                                                    icon={<PiggyBank size={10} />} 
                                                    tooltip="Total recurring contributions to portfolio" 
                                                    {...getRowProps('invCont')}
                                                />
                                            )}
                                            
                                            {/* 10. Investment Growth (Inflow) */}
                                            {Math.abs(rInvGrowthGross) > 0 && (
                                                <BreakdownRow 
                                                    label="Investment Growth" 
                                                    value={`${rInvGrowthGross >= 0 ? '+' : ''}${formatCurrency(rInvGrowthGross)}`} 
                                                    colorClass={`${rInvGrowthGross >= 0 ? 'text-emerald-500' : 'text-red-500'} font-bold`} 
                                                    icon={<TrendingUp size={10} />} 
                                                    tooltip="Interest earned on side investments (Gains Only)" 
                                                    {...getRowProps('invGrowth')}
                                                />
                                            )}
                                            
                                        </>
                                    )}

                                    {/* 11. Investment Tax (Moved per request) */}
                                    {(scenario.includeInvestment !== false) && (
                                        <BreakdownRow 
                                            label={`Investment Tax (${!isGlobalInvestment ? (scenario.investmentTaxRate ?? 20) : (globalInvestmentSettings?.globalInvestmentTaxRate ?? 20)}%)`} 
                                            value={rInvTax > 0 ? `-${formatCurrency(Math.abs(rInvTax))}` : '-$0'} 
                                            colorClass="text-red-500 font-bold" 
                                            icon={<Scale size={10} />} 
                                            tooltip="Tax paid on investment gains" 
                                            {...getRowProps('invTax')}
                                        />
                                    )}

                                    {/* Down Payment & Closing Costs displayed at very bottom if not handled */}
                                    {rDown > 0 && (
                                        <div className="hidden"></div> // Already handled in breakdown if needed, but usually we hide unless part of "Out of Pocket" metric which is separate
                                    )}
                                </>
                            ) : (
                                <>
                                    <BreakdownRow 
                                        label="Investment Growth (Gross)" 
                                        value={`${rInvGrowthGross >= 0 ? '+' : ''}${formatCurrency(rInvGrowthGross)}`} 
                                        colorClass={`${rInvGrowthGross >= 0 ? 'text-emerald-500' : 'text-red-500'} font-bold`} 
                                        icon={<TrendingUp size={10} />} 
                                        tooltip="Profit from portfolio (Interest Only)" 
                                        {...getRowProps('invGrowth')}
                                    />
                                    {scenario.isRentOnly && (
                                        <BreakdownRow 
                                            label="Rent Payments" 
                                            value={`-${formatCurrency(Math.abs(rTotalPaid))}`} 
                                            colorClass="text-red-500 font-bold" 
                                            icon={<CreditCard size={10} />} 
                                            {...getRowProps('payments')}
                                        />
                                    )}
                                    
                                    <BreakdownRow 
                                        label={`Investment Tax (${!isGlobalInvestment ? (scenario.investmentTaxRate ?? 20) : (globalInvestmentSettings?.globalInvestmentTaxRate ?? 20)}%)`} 
                                        value={rInvTax > 0 ? `-${formatCurrency(Math.abs(rInvTax))}` : '-$0'} 
                                        colorClass="text-red-500 font-bold" 
                                        icon={<Scale size={10} />} 
                                        tooltip="Tax paid on investment gains" 
                                        {...getRowProps('invTax')}
                                    />
                                    
                                    {rCustomExpenses > 0 && (
                                        <BreakdownRow 
                                            label="Addtl. Expenses" 
                                            value={`-${formatCurrency(Math.abs(rCustomExpenses))}`} 
                                            colorClass="text-red-500 font-bold" 
                                            icon={<Zap size={10} />} 
                                            tooltip="Total Utility/Maintenance costs over time" 
                                            {...getRowProps('expenses')}
                                        />
                                    )}
                                    {rInitialInv > 0 && (
                                        <BreakdownRow 
                                            label="Initial Investment" 
                                            value={`-${formatCurrency(Math.abs(rInitialInv))}`} 
                                            colorClass="text-blue-500 font-bold" 
                                            icon={<PiggyBank size={10} />} 
                                            tooltip="Starting lump sum allocated to investment" 
                                            {...getRowProps('initialInv')}
                                        />
                                    )}
                                    {rInvContribution > 0 && (
                                        <BreakdownRow 
                                            label="Investment Contributions" 
                                            value={`-${formatCurrency(Math.abs(rInvContribution))}`} 
                                            colorClass="text-blue-500 font-bold" 
                                            icon={<PiggyBank size={10} />} 
                                            tooltip="Total recurring contributions to portfolio" 
                                            {...getRowProps('invCont')}
                                        />
                                    )}
                                    {/* If rent mode and custom closing costs exist (unlikely but possible) */}
                                    {rClosing > 0 && (
                                        <BreakdownRow 
                                            label="Closing Costs" 
                                            value={`-${formatCurrency(Math.abs(rClosing))}`} 
                                            colorClass="text-red-500 font-bold" 
                                            icon={<Receipt size={10} />} 
                                            {...getRowProps('closing')}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* 3. FINAL RESULTS */}
                    <div className={`border rounded-lg ${theme==='light'?'border-gray-200 bg-gray-50':'border-gray-700 bg-black/20'}`}>
                        <div className="px-3 py-1.5 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 rounded-t-lg">
                            <Calculator size={12} className="text-gray-500" />
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase">FINAL RESULTS</span>
                        </div>
                        <div className="p-3 space-y-1">
                             <div 
                                className="flex justify-between items-center text-xs py-1 cursor-help hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 transition-colors"
                                onMouseEnter={() => setHoveredMetric('outOfPocket')}
                                onMouseLeave={() => setHoveredMetric(null)}
                             >
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-500 dark:text-gray-400">Out-of-Pocket</span>
                                    <Tooltip text="Net cash you paid (Housing costs only for Buy/Refi)" />
                                </div>
                                <span className={`font-bold ${theme==='light'?'text-gray-900':'text-white'}`}>{formatCurrency(calculated.totalInvestedAmount)}</span>
                             </div>
                             
                             <div 
                                className="flex justify-between items-center text-xs py-1 border-t border-dashed border-gray-600/20 cursor-help hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 transition-colors"
                                onMouseEnter={() => setHoveredMetric('profit')}
                                onMouseLeave={() => setHoveredMetric(null)}
                             >
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-500 dark:text-gray-400">Profit</span>
                                    <Tooltip text="Total Return: Gains + Income - Costs - Taxes (Housing Only for Buy/Refi)" />
                                </div>
                                <span className={`font-bold ${calculated.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(calculated.profit)}</span>
                             </div>

                             {!scenario.isRentOnly && !scenario.isInvestmentOnly && (
                             <>
                                <div 
                                    className="flex justify-between items-center text-xs py-1 cursor-help hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 transition-colors"
                                    onMouseEnter={() => setHoveredMetric('loanBalance')}
                                    onMouseLeave={() => setHoveredMetric(null)}
                                >
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-500 dark:text-gray-400">Loan Balance at Sale</span>
                                        <Tooltip text="Remaining mortgage balance to pay off" />
                                    </div>
                                    <span className={`font-medium ${theme==='light'?'text-gray-700':'text-gray-300'}`}>{formatCurrency(rLoanBalance)}</span>
                                </div>
                                
                                <div 
                                    className="flex justify-between items-center text-xs py-1 cursor-help hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 transition-colors"
                                    onMouseEnter={() => setHoveredMetric('netCash')}
                                    onMouseLeave={() => setHoveredMetric(null)}
                                >
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-500 dark:text-gray-400">Net Cash After Sale</span>
                                        <Tooltip text="Cash in pocket if sold today (Equity - Fees - Taxes)" />
                                    </div>
                                    <span className={`font-bold ${theme==='light'?'text-gray-900':'text-white'}`}>{formatCurrency(rCashAfterSale)}</span>
                                </div>
                             </>
                             )}

                             <div 
                                className="flex justify-between items-center pt-2 mt-2 border-t border-gray-600/30 cursor-help hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 transition-colors"
                                onMouseEnter={() => setHoveredMetric('netWorth')}
                                onMouseLeave={() => setHoveredMetric(null)}
                             >
                                <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Net Worth</span>
                                <span className={`text-xl font-extrabold ${theme==='light'?'text-gray-900':'text-white'}`}>{formatCurrency(calculated.netWorth)}</span>
                             </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
      ) : (
          <div className="flex justify-between items-center">
              <div className="flex flex-col">
                  <span className={`font-bold text-lg ${theme==='light'?'text-gray-800':'text-gray-200'}`}>{scenario.name}</span>
                  <div className="flex items-center gap-2 text-xs opacity-70">
                      <span className="uppercase font-semibold">{mainMetricLabel}:</span>
                      <span className={`font-bold ${metricColor}`}>{formatCurrency(mainMetricValue)}</span>
                  </div>
              </div>
              <div className="flex gap-1">
                    <button 
                        onClick={() => setIsExpanded(true)} 
                        className="text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 p-1" 
                        title="Show Details"
                    >
                        <Eye size={16} />
                    </button>
                    <button onClick={() => onViewSchedule(scenario.id)} className="text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 p-1" title="Amortization Schedule">
                        <Table2 size={16} />
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
      )}
    </div>
  );
};
