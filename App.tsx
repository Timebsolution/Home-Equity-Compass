import React, { useState, useMemo, useEffect } from 'react';
import { PlusCircle, Calculator, Clock, TrendingUp, Sun, Moon, PiggyBank, Link, ChevronUp, ChevronDown, Globe, Eye, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LoanScenario, CalculatedLoan, AnalysisStatus } from './types';
import { calculateLoan, generateId, COLORS, formatCurrency } from './utils/calculations';
import { LoanCard } from './components/LoanCard';
import { ComparisonCharts } from './components/ComparisonCharts';
import { extractPropertyData } from './services/geminiService';
import { AmortizationModal } from './components/AmortizationModal';
import { ImportModal } from './components/ImportModal';

const DEFAULT_GLOBAL_FMV = 500000;
const DEFAULT_GLOBAL_LOAN = 500000;
const DEFAULT_GLOBAL_RENT = 2000;

export type Theme = 'light' | 'night';

// Helper Input that allows clearing (empty string) without forcing 0 immediately in the UI
const SmartInput = ({ value, onChange, className, ...props }: { value: number, onChange: (v: number) => void, className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) => {
  const [localStr, setLocalStr] = useState(value.toString());
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setLocalStr(value.toString());
    }
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // Strip leading zero if it's not a decimal point (e.g. "05" -> "5")
    // But allow "0." for decimals
    if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
        val = val.replace(/^0+/, ''); 
        if (val === '') val = '0'; // Handle case where user typed 00 -> 0
    }
    
    // Allow empty or valid decimal number
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
    <input 
      type="text" 
      inputMode="decimal"
      value={localStr} 
      onChange={handleChange} 
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={className} 
      {...props} 
    />
  );
};

function App() {
  // --- Theme State (Default Night which is now Gray-ish) ---
  const [theme, setTheme] = useState<Theme>('night');

  // --- Global Controls ---
  const [globalFMV, setGlobalFMV] = useState<number>(DEFAULT_GLOBAL_FMV);
  const [globalLoan, setGlobalLoan] = useState<number>(DEFAULT_GLOBAL_LOAN);
  const [globalRent, setGlobalRent] = useState<number>(DEFAULT_GLOBAL_RENT);
  const [useGlobalRent, setUseGlobalRent] = useState<boolean>(true);

  // --- Header Visibility State (Collapsible) ---
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  
  // Section Visibility - CLOSED BY DEFAULT
  const [isGlobalsOpen, setIsGlobalsOpen] = useState(false);
  const [isInvestOpen, setIsInvestOpen] = useState(false);
  const [isProjectionOpen, setIsProjectionOpen] = useState(false);

  // --- Projection Settings ---
  const [horizonMode, setHorizonMode] = useState<'years' | 'months'>('months');
  // Default to 24 months so charts have data points to show (annual data needs at least 1 year)
  const [horizonValue, setHorizonValue] = useState<number>(24);
  const [growthEnabled, setGrowthEnabled] = useState<boolean>(false);
  const [appreciationRate, setAppreciationRate] = useState<number>(4.0);
  
  // --- Investment Calculator Settings ---
  const [globalCashInvestment, setGlobalCashInvestment] = useState<number>(100000); 
  const [globalMonthlyContribution, setGlobalMonthlyContribution] = useState<number>(0);
  const [investmentReturnRate, setInvestmentReturnRate] = useState<number>(5.0);
  const [modelSeparateInvestment, setModelSeparateInvestment] = useState<boolean>(true);

  const [viewScheduleId, setViewScheduleId] = useState<string | null>(null);
  
  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargetId, setImportTargetId] = useState<string | null>(null); 
  
  // --- Scenarios ---
  const [scenarios, setScenarios] = useState<LoanScenario[]>([
    {
      id: generateId(),
      name: 'Current Loan',
      color: COLORS[0],
      isRentOnly: false,
      homeValue: DEFAULT_GLOBAL_FMV,
      lockFMV: false,
      loanAmount: DEFAULT_GLOBAL_LOAN, // Will match global 500k
      lockLoan: false,
      interestRate: 5.75,
      loanTermYears: 30,
      yearsRemaining: 28,
      monthsRemaining: 0,
      hasSecondLoan: false,
      secondLoanAmount: 0,
      secondLoanInterestRate: 3.0,
      secondLoanTermYears: 30,
      secondLoanYearsRemaining: 30,
      secondLoanMonthsRemaining: 0,
      propertyTax: 3000,
      propertyTaxRate: 0.6, // Derived from 3000/500000
      usePropertyTaxRate: false, // Default to manual $
      homeInsurance: 1500,
      hoa: 0,
      pmi: 0,
      taxRefundRate: 25,
      downPayment: 0,
      oneTimeExtraPayment: 0,
      oneTimeExtraPaymentMonth: 1,
      monthlyExtraPayment: 0,
      rentalIncome: 0,
      lockRentIncome: true, // Manual by default (usually 0)
      rentMonthly: DEFAULT_GLOBAL_RENT,
      lockRent: false,
      rentIncreasePerYear: 3,
      rentIncludeTax: true,
      rentTaxRate: 25,
      lockInvestment: true
    },
    {
      id: generateId(),
      name: 'Refi + Cash In',
      color: COLORS[1],
      isRentOnly: false,
      homeValue: DEFAULT_GLOBAL_FMV,
      lockFMV: false,
      loanAmount: 400000, // 500k - 100k down
      lockLoan: true, 
      interestRate: 4.99,
      loanTermYears: 30,
      yearsRemaining: 30,
      monthsRemaining: 0,
      hasSecondLoan: false,
      secondLoanAmount: 0,
      secondLoanInterestRate: 3.0,
      secondLoanTermYears: 30,
      secondLoanYearsRemaining: 30,
      secondLoanMonthsRemaining: 0,
      propertyTax: 3000,
      propertyTaxRate: 0.6,
      usePropertyTaxRate: false,
      homeInsurance: 1500,
      hoa: 0,
      pmi: 0,
      taxRefundRate: 25,
      downPayment: 100000, 
      oneTimeExtraPayment: 0,
      oneTimeExtraPaymentMonth: 1,
      monthlyExtraPayment: 0,
      rentalIncome: 0,
      lockRentIncome: true,
      rentMonthly: DEFAULT_GLOBAL_RENT,
      lockRent: false,
      rentIncreasePerYear: 3,
      rentIncludeTax: true,
      rentTaxRate: 25,
      lockInvestment: true
    },
    {
      id: generateId(),
      name: 'Keep Renting',
      color: COLORS[4],
      isRentOnly: true,
      homeValue: 0,
      lockFMV: true,
      loanAmount: 0,
      lockLoan: true,
      interestRate: 0,
      loanTermYears: 0,
      yearsRemaining: 0,
      monthsRemaining: 0,
      hasSecondLoan: false,
      secondLoanAmount: 0,
      secondLoanInterestRate: 0,
      secondLoanTermYears: 0,
      secondLoanYearsRemaining: 0,
      secondLoanMonthsRemaining: 0,
      propertyTax: 0,
      propertyTaxRate: 0.6,
      usePropertyTaxRate: false,
      homeInsurance: 0,
      hoa: 0,
      pmi: 0,
      taxRefundRate: 0,
      downPayment: 0,
      oneTimeExtraPayment: 0,
      oneTimeExtraPaymentMonth: 0,
      monthlyExtraPayment: 0,
      rentalIncome: 0,
      lockRentIncome: true,
      rentMonthly: 1500,
      lockRent: true,
      rentIncreasePerYear: 3,
      rentIncludeTax: true,
      rentTaxRate: 25,
      lockInvestment: true
    },
    {
      id: generateId(),
      name: 'Pure Investment',
      color: COLORS[2],
      isRentOnly: false,
      isInvestmentOnly: true,
      homeValue: 0,
      lockFMV: true,
      loanAmount: 0,
      lockLoan: true,
      interestRate: 0,
      loanTermYears: 0,
      yearsRemaining: 0,
      monthsRemaining: 0,
      hasSecondLoan: false,
      secondLoanAmount: 0,
      secondLoanInterestRate: 0,
      secondLoanTermYears: 0,
      secondLoanYearsRemaining: 0,
      secondLoanMonthsRemaining: 0,
      propertyTax: 0,
      propertyTaxRate: 0,
      usePropertyTaxRate: false,
      homeInsurance: 0,
      hoa: 0,
      pmi: 0,
      taxRefundRate: 0,
      downPayment: 0,
      oneTimeExtraPayment: 0,
      oneTimeExtraPaymentMonth: 0,
      monthlyExtraPayment: 0,
      rentalIncome: 0,
      lockRentIncome: true,
      rentMonthly: 0,
      lockRent: false,
      rentIncreasePerYear: 0,
      rentIncludeTax: false,
      rentTaxRate: 0,
      investmentCapital: 100000,
      investmentMonthly: 0,
      investmentRate: 5,
      lockInvestment: false // Default to Global
    }
  ]);

  // --- Broadcast Globals to Unlocked Scenarios ---
  useEffect(() => {
    setScenarios(prev => prev.map(s => {
        let updates: Partial<LoanScenario> = {};
        if (!s.lockFMV && !s.isRentOnly && !s.isInvestmentOnly) updates.homeValue = globalFMV;
        if (!s.lockLoan && !s.isRentOnly && !s.isInvestmentOnly) updates.loanAmount = globalLoan;
        
        // Rent Mode Cost
        if (useGlobalRent && !s.lockRent) updates.rentMonthly = globalRent;
        
        // Buy Mode Rental Income (if unlocked and in Global mode)
        if (useGlobalRent && !s.lockRentIncome && !s.isRentOnly && !s.isInvestmentOnly) updates.rentalIncome = globalRent;
        
        // Investment Capital & Rate (if unlocked and investment mode)
        if (!s.lockInvestment && s.isInvestmentOnly) {
             updates.investmentCapital = globalCashInvestment;
             updates.investmentMonthly = globalMonthlyContribution;
             updates.investmentRate = investmentReturnRate;
        }

        return Object.keys(updates).length > 0 ? { ...s, ...updates } : s;
    }));
  }, [globalFMV, globalLoan, globalRent, useGlobalRent, globalCashInvestment, globalMonthlyContribution, investmentReturnRate]);

  const effectiveProjectionYears = useMemo(() => {
      return horizonMode === 'years' ? horizonValue : horizonValue / 12;
  }, [horizonMode, horizonValue]);

  const calculatedData: CalculatedLoan[] = useMemo(() => {
    const investmentCashToPass = modelSeparateInvestment ? globalCashInvestment : 0;
    const investmentMonthlyToPass = modelSeparateInvestment ? globalMonthlyContribution : 0;
    const effectiveAppreciation = growthEnabled ? appreciationRate : 0;
    
    return scenarios.map(s => calculateLoan(
        s, 
        effectiveProjectionYears, 
        effectiveAppreciation, 
        investmentReturnRate, 
        investmentCashToPass, 
        investmentMonthlyToPass
    ));
  }, [scenarios, effectiveProjectionYears, growthEnabled, appreciationRate, investmentReturnRate, globalCashInvestment, globalMonthlyContribution, modelSeparateInvestment]);

  const winnerId = useMemo(() => {
      if (calculatedData.length === 0) return null;
      return calculatedData.reduce((prev, current) => (prev.netWorth > current.netWorth) ? prev : current).id;
  }, [calculatedData]);

  // --- Handlers ---

  const updateScenario = (id: string, updates: Partial<LoanScenario>) => {
    // If switching to Global mode (unlocking), immediately snap to global values
    if (updates.lockInvestment === false) {
       updates.investmentCapital = globalCashInvestment;
       updates.investmentMonthly = globalMonthlyContribution;
       updates.investmentRate = investmentReturnRate;
    }

    // BI-DIRECTIONAL SYNC LOGIC (Optional, but kept for manually editing global card values if we decide to enable inputs)
    const scenario = scenarios.find(s => s.id === id);
    if (scenario) {
        if (updates.homeValue !== undefined && !scenario.lockFMV && !scenario.isRentOnly && !scenario.isInvestmentOnly) {
            setGlobalFMV(updates.homeValue);
        }
        if (updates.loanAmount !== undefined && !scenario.lockLoan && !scenario.isRentOnly && !scenario.isInvestmentOnly) {
            setGlobalLoan(updates.loanAmount);
        }
        if (updates.rentMonthly !== undefined && !scenario.lockRent && useGlobalRent) {
            setGlobalRent(updates.rentMonthly);
        }
        if (updates.rentalIncome !== undefined && !scenario.lockRentIncome && useGlobalRent) {
            setGlobalRent(updates.rentalIncome);
        }
    }

    setScenarios(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addScenario = () => {
    if (scenarios.length >= 10) return;
    const newId = generateId();
    const newColor = COLORS[scenarios.length % COLORS.length];
    
    setScenarios([...scenarios, {
      ...scenarios[0],
      id: newId,
      name: `Scenario ${scenarios.length + 1}`,
      color: newColor,
      lockLoan: false,
      lockFMV: false,
      lockRent: false,
      lockRentIncome: true, // Default new scenarios to manual rent income (0)
      rentalIncome: 0,
      isInvestmentOnly: false,
      isRentOnly: false,
      lockInvestment: true,
      propertyTaxRate: 0.6,
      usePropertyTaxRate: false,
      hasSecondLoan: false,
      secondLoanAmount: 0,
      secondLoanInterestRate: 3.0,
      secondLoanTermYears: 30,
      secondLoanYearsRemaining: 30,
      secondLoanMonthsRemaining: 0
    }]);
  };

  const openImportModal = (targetId?: string) => {
      setImportTargetId(targetId || null);
      setIsImportModalOpen(true);
  };

  const handleImportUrl = async (url: string) => {
    const extracted = await extractPropertyData(url);
    if (!extracted) throw new Error("Failed to extract");

    if (importTargetId) {
        updateScenario(importTargetId, {
            ...extracted,
            lockFMV: true, 
            lockLoan: true,
            loanAmount: extracted.homeValue ? extracted.homeValue * 0.8 : 0,
            downPayment: extracted.homeValue ? extracted.homeValue * 0.2 : 0,
        });
    } else {
        if (scenarios.length >= 10) return;
        
        const newId = generateId();
        const newColor = COLORS[scenarios.length % COLORS.length];
        const loanAmt = extracted.homeValue ? extracted.homeValue * 0.8 : 400000; 

        setScenarios([...scenarios, {
          ...scenarios[0],
          id: newId,
          name: 'Imported Property',
          color: newColor,
          lockLoan: true,
          lockFMV: true,
          lockRent: false,
          lockRentIncome: true,
          rentalIncome: 0,
          isInvestmentOnly: false,
          isRentOnly: false,
          loanAmount: loanAmt,
          downPayment: extracted.homeValue ? extracted.homeValue * 0.2 : 0,
          ...extracted,
          homeValue: extracted.homeValue || DEFAULT_GLOBAL_FMV,
          propertyTax: extracted.propertyTax || 3000,
          propertyTaxRate: 0.6,
          usePropertyTaxRate: false,
          lockInvestment: true,
          homeInsurance: extracted.homeInsurance || 1200,
          hoa: extracted.hoa || 0,
          hasSecondLoan: false,
          secondLoanAmount: 0,
          secondLoanInterestRate: 3.0,
          secondLoanTermYears: 30,
          secondLoanYearsRemaining: 30,
          secondLoanMonthsRemaining: 0
        } as LoanScenario]);
    }
  };

  const duplicateScenario = (id: string) => {
      if (scenarios.length >= 10) return;
      const original = scenarios.find(s => s.id === id);
      if (!original) return;

      const newId = generateId();
      const newColor = COLORS[scenarios.length % COLORS.length];

      setScenarios([...scenarios, {
          ...original,
          id: newId,
          name: `${original.name} Copy`,
          color: newColor
      }]);
  };

  const removeScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  const selectedScenario = scenarios.find(s => s.id === viewScheduleId);
  const selectedCalculated = calculatedData.find(c => c.id === viewScheduleId);

  // NIGHT THEME IS NOW NEUTRAL GRAY
  const containerClass = theme === 'light' 
    ? 'bg-slate-50 text-gray-900' 
    : 'dark bg-neutral-900 text-gray-100';

  const inputClass = theme === 'light' ? 'bg-white border-gray-300' : 'bg-black/30 border-gray-600 text-white';

  // Investment Result Helper
  const calcInvestmentResult = useMemo(() => {
      const p = globalCashInvestment;
      const pmt = globalMonthlyContribution;
      const r = investmentReturnRate / 100;
      const t = effectiveProjectionYears;
      const n = 12;
      
      const fvLump = p * Math.pow(1 + r/n, n*t);
      let fvSeries = 0;
      if (pmt > 0) {
          if (r === 0) fvSeries = pmt * n * t;
          else fvSeries = pmt * (Math.pow(1 + r/n, n*t) - 1) / (r/n);
      }
      return { 
          fv: fvLump + fvSeries, 
          profit: (fvLump + fvSeries) - (p + (pmt * n * t)) 
      };
  }, [globalCashInvestment, globalMonthlyContribution, investmentReturnRate, effectiveProjectionYears]);

  return (
    <div className={`min-h-screen pb-20 font-sans transition-colors duration-300 ${containerClass}`}>
      
      {/* HEADER - STICKY TOP BAR ONLY */}
      <header className={`border-b sticky top-0 z-30 transition-colors duration-300 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-neutral-900/90 border-gray-700 backdrop-blur-md'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="bg-brand-600 text-white p-2 rounded-lg shadow-lg shadow-brand-500/30"><Calculator size={20} /></div>
                    <h1 className="text-xl font-bold tracking-tight">Home Equity Compass</h1>
                    
                    {/* Mobile Toggle Button */}
                    <button 
                      onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                      className={`ml-2 p-1.5 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-gray-700 text-gray-400'}`}
                    >
                      {isHeaderExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>

                {/* Theme Switcher */}
                <div className={`flex p-1 rounded-lg border ${theme === 'light' ? 'bg-gray-100 border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                    <button onClick={() => setTheme('light')} className={`p-2 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${theme === 'light' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
                        <Sun size={14} /> Day
                    </button>
                    <button onClick={() => setTheme('night')} className={`p-2 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${theme === 'night' ? 'bg-neutral-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
                        <Moon size={14} /> Night
                    </button>
                </div>
            </div>
        </div>
      </header>

      {/* EXPANDABLE CONTROLS - NOT STICKY (Fixes mobile scrolling issue) */}
      {isHeaderExpanded && (
        <div className={`border-b transition-colors duration-300 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-neutral-900 border-gray-700'}`}>
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* 1. Global Market Data */}
                <div className={`rounded-xl border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-gray-700'}`}>
                     <button 
                        onClick={() => setIsGlobalsOpen(!isGlobalsOpen)}
                        className="w-full flex items-center justify-between p-4 text-left"
                     >
                        <div className="flex items-center gap-2">
                           <Globe size={18} className="text-brand-500" />
                           <span className={`text-xs font-bold uppercase ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>Global Market Data</span>
                        </div>
                        {isGlobalsOpen ? <Eye size={16} className="text-brand-500" /> : <EyeOff size={16} className="text-gray-400" />}
                     </button>
                     
                     {isGlobalsOpen && (
                        <div className="px-5 pb-5 pt-0 border-t border-dashed border-transparent">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                {/* FMV */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className={`text-xs font-bold uppercase ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Global FMV</label>
                                        <div className="relative w-24">
                                            <span className="absolute left-2 top-1 text-xs text-gray-400">$</span>
                                            <SmartInput 
                                                value={globalFMV} 
                                                onChange={setGlobalFMV}
                                                className={`w-full pl-4 py-0.5 text-xs border rounded text-right ${inputClass}`}
                                            />
                                        </div>
                                    </div>
                                    <input type="range" min="100000" max="2000000" step="5000" value={globalFMV} onChange={e => setGlobalFMV(Number(e.target.value))} className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-600 dark:bg-gray-600" />
                                </div>
                                {/* Loan */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className={`text-xs font-bold uppercase ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Global Loan</label>
                                        <div className="relative w-24">
                                            <span className="absolute left-2 top-1 text-xs text-gray-400">$</span>
                                            <SmartInput 
                                                value={globalLoan} 
                                                onChange={setGlobalLoan}
                                                className={`w-full pl-4 py-0.5 text-xs border rounded text-right ${inputClass}`}
                                            />
                                        </div>
                                    </div>
                                    <input type="range" min="50000" max="1500000" step="5000" value={globalLoan} onChange={e => setGlobalLoan(Number(e.target.value))} className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-600 dark:bg-gray-600" />
                                </div>
                                {/* Rent */}
                                <div>
                                    <div className="flex justify-between mb-2 items-center">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={useGlobalRent} onChange={e => setUseGlobalRent(e.target.checked)} className="rounded text-brand-600 focus:ring-brand-500" />
                                            <label className={`text-xs font-bold uppercase ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Global Rent & Rent income</label>
                                        </div>
                                        <div className="relative w-24">
                                            <span className="absolute left-2 top-1 text-xs text-gray-400">$</span>
                                            <SmartInput 
                                                value={globalRent} 
                                                onChange={setGlobalRent}
                                                disabled={!useGlobalRent}
                                                className={`w-full pl-4 py-0.5 text-xs border rounded text-right ${!useGlobalRent ? 'opacity-50' : ''} ${inputClass}`}
                                            />
                                        </div>
                                    </div>
                                    <input type="range" min="500" max="10000" step="50" value={globalRent} onChange={e => setGlobalRent(Number(e.target.value))} disabled={!useGlobalRent} className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${useGlobalRent ? 'bg-gray-300 accent-brand-600 dark:bg-gray-600' : 'bg-gray-200 dark:bg-gray-800'}`} />
                                </div>
                            </div>
                        </div>
                     )}
                </div>

                {/* 2. Investment Calculator */}
                <div className={`rounded-xl border ${theme === 'light' ? 'bg-blue-50/50 border-blue-100' : 'bg-blue-900/10 border-blue-900/30'}`}>
                    <div 
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => setIsInvestOpen(!isInvestOpen)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <PiggyBank size={18} className="text-blue-600 dark:text-blue-400" />
                                <span className={`text-xs font-bold uppercase ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>Investment Calculator</span>
                            </div>

                            <div 
                                className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <input 
                                    type="checkbox" 
                                    checked={modelSeparateInvestment} 
                                    onChange={e => setModelSeparateInvestment(e.target.checked)} 
                                    className="rounded text-brand-600 focus:ring-brand-500 cursor-pointer" 
                                    id="invest-active-check"
                                />
                                <label htmlFor="invest-active-check" className="cursor-pointer select-none">Active</label>
                            </div>
                        </div>

                        {/* Collapsed Summary to show why Side Portfolio exists */}
                        {!isInvestOpen && modelSeparateInvestment && (
                             <div className="hidden md:block text-[10px] text-gray-400">
                                Starting: <span className="text-gray-300 font-semibold">{formatCurrency(globalCashInvestment)}</span> · Rate: <span className="text-gray-300 font-semibold">{investmentReturnRate}%</span>
                             </div>
                        )}

                        <div className="text-gray-400">
                             {isInvestOpen ? <Eye size={16} className="text-brand-500" /> : <EyeOff size={16} className="text-gray-400" />}
                        </div>
                    </div>

                    {isInvestOpen && (
                        <div className="px-5 pb-5 pt-0">
                            {/* Investment Calculator Body */}
                            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
                                <span className="italic">Compound interest investment calculator with replenishment</span>
                            </div>

                            {modelSeparateInvestment && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* LEFT COLUMN: INPUTS */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Starting Capital</label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1.5 text-xs text-gray-400">$</span>
                                            <SmartInput 
                                                value={globalCashInvestment} 
                                                onChange={setGlobalCashInvestment} 
                                                className={`w-full pl-5 py-1.5 text-sm border rounded ${inputClass}`} 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Investment Term</label>
                                        <div className="relative">
                                            <input 
                                            type="number" 
                                            value={effectiveProjectionYears.toFixed(1)} 
                                            readOnly
                                            className={`w-full pr-8 py-1.5 text-sm border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-gray-500 dark:text-gray-400`} 
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400">yrs</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Rate (% per annum)</label>
                                        <div className="relative">
                                            <SmartInput 
                                                value={investmentReturnRate} 
                                                onChange={setInvestmentReturnRate} 
                                                className={`w-full pr-5 py-1.5 text-sm border rounded ${inputClass}`} 
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400">%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center mt-4">
                                        <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <input type="checkbox" checked readOnly className="rounded text-brand-600" />
                                            Reinvest Income
                                        </label>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Replenishment Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1.5 text-xs text-gray-400">$</span>
                                            <SmartInput 
                                                value={globalMonthlyContribution} 
                                                onChange={setGlobalMonthlyContribution} 
                                                className={`w-full pl-5 py-1.5 text-sm border rounded ${inputClass}`} 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Frequency</label>
                                        <select disabled className={`w-full py-1.5 text-sm border rounded opacity-70 ${inputClass}`}>
                                            <option>Once a month</option>
                                        </select>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: RESULT */}
                                <div className={`rounded-xl p-6 flex flex-col justify-center gap-4 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-white/5 border border-gray-600'}`}>
                                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                                        <span className="text-xs uppercase font-bold text-gray-500">Your Goal (FV)</span>
                                        <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">{formatCurrency(calcInvestmentResult.fv)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs uppercase font-bold text-gray-500">Income (Interest)</span>
                                        <span className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>+{formatCurrency(calcInvestmentResult.profit)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs uppercase font-bold text-gray-500">Starting Capital</span>
                                        <span className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>{formatCurrency(globalCashInvestment)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs uppercase font-bold text-gray-500">Total Replenished</span>
                                        <span className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>{formatCurrency(globalMonthlyContribution * 12 * effectiveProjectionYears)}</span>
                                    </div>
                                </div>
                            </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Horizon & Appreciation Controls */}
                <div className={`rounded-xl border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-gray-700'}`}>
                    <button 
                        onClick={() => setIsProjectionOpen(!isProjectionOpen)}
                        className="w-full flex items-center justify-between p-4 text-left"
                    >
                        <div className="flex items-center gap-2">
                           <Clock size={18} className="text-purple-500" />
                           <span className={`text-xs font-bold uppercase ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>Timeline & Appreciation</span>
                        </div>
                        {isProjectionOpen ? <Eye size={16} className="text-brand-500" /> : <EyeOff size={16} className="text-gray-400" />}
                    </button>

                    {isProjectionOpen && (
                        <div className="px-5 pb-5 pt-0 border-t border-dashed border-transparent">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                                {/* Time Horizon */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className={`text-xs font-bold uppercase ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Time Horizon</label>
                                        <div className="flex rounded-md shadow-sm border border-gray-300 dark:border-gray-600 overflow-hidden">
                                            <button 
                                            onClick={() => setHorizonMode('years')} 
                                            className={`px-3 py-1 text-xs font-medium transition-colors ${horizonMode === 'years' ? (theme === 'light' ? 'bg-gray-200 text-gray-800' : 'bg-gray-700 text-white') : (theme === 'light' ? 'bg-white text-gray-500 hover:bg-gray-50' : 'bg-transparent text-gray-400 hover:bg-white/5')}`}
                                            >
                                            Years
                                            </button>
                                            <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
                                            <button 
                                            onClick={() => setHorizonMode('months')} 
                                            className={`px-3 py-1 text-xs font-medium transition-colors ${horizonMode === 'months' ? (theme === 'light' ? 'bg-gray-200 text-gray-800' : 'bg-gray-700 text-white') : (theme === 'light' ? 'bg-white text-gray-500 hover:bg-gray-50' : 'bg-transparent text-gray-400 hover:bg-white/5')}`}
                                            >
                                            Months
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <input 
                                        type="range" 
                                        min={1} 
                                        max={horizonMode === 'years' ? 30 : 360} 
                                        step={1} 
                                        value={horizonValue} 
                                        onChange={e => setHorizonValue(Number(e.target.value))} 
                                        className="flex-1 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-gray-600" 
                                        />
                                        <span className={`text-lg font-bold w-24 text-right ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                                            {horizonValue} <span className="text-sm font-normal text-gray-500">{horizonMode}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Home Appreciation */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className={`text-xs font-bold uppercase ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Home Appreciation Rate</label>
                                        <div className="flex rounded-md shadow-sm border border-gray-300 dark:border-gray-600 overflow-hidden">
                                            <button 
                                            onClick={() => setGrowthEnabled(false)} 
                                            className={`px-3 py-1 text-xs font-medium transition-colors ${!growthEnabled ? (theme === 'light' ? 'bg-gray-200 text-gray-800' : 'bg-gray-700 text-white') : (theme === 'light' ? 'bg-white text-gray-500 hover:bg-gray-50' : 'bg-transparent text-gray-400 hover:bg-white/5')}`}
                                            >
                                            Off
                                            </button>
                                            <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
                                            <button 
                                            onClick={() => setGrowthEnabled(true)} 
                                            className={`px-3 py-1 text-xs font-medium transition-colors ${growthEnabled ? (theme === 'light' ? 'bg-gray-200 text-gray-800' : 'bg-gray-700 text-white') : (theme === 'light' ? 'bg-white text-gray-500 hover:bg-gray-50' : 'bg-transparent text-gray-400 hover:bg-white/5')}`}
                                            >
                                            ON
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center gap-2 flex-1 ${!growthEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <span className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Annual rate:</span>
                                            <div className="relative w-24">
                                                <SmartInput 
                                                    value={appreciationRate} 
                                                    onChange={setAppreciationRate} 
                                                    className={`w-full pr-6 py-1 text-sm border rounded text-right ${inputClass}`}
                                                />
                                                <span className="absolute right-2 top-1 text-xs text-gray-400">%</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-lg font-bold ${growthEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                                {growthEnabled ? `${appreciationRate}%` : '0%'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                    
                {/* Hide Button Below */}
                <div className="flex justify-center mt-6 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={() => setIsHeaderExpanded(false)}
                        className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                        <ChevronUp size={16} /> Hide Controls
                    </button>
                </div>
            </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Loan Cards Grid - SINGLE COLUMN STACK */}
        <div className="grid grid-cols-1 gap-6 mb-8 items-start max-w-3xl mx-auto">
          {scenarios.map((scenario) => {
            const calculated = calculatedData.find(c => c.id === scenario.id);
            if (!calculated) return null;
            return (
              <LoanCard 
                key={scenario.id} 
                scenario={scenario} 
                calculated={calculated}
                onUpdate={updateScenario}
                onRemove={removeScenario}
                onDuplicate={duplicateScenario}
                onViewSchedule={setViewScheduleId}
                onOpenImport={() => openImportModal(scenario.id)}
                canRemove={scenarios.length > 1}
                theme={theme}
                projectionYears={effectiveProjectionYears}
                isWinner={scenario.id === winnerId}
              />
            );
          })}
          
          {/* Add Scenario Button Card */}
          {scenarios.length < 10 && (
            <div className="grid grid-cols-2 gap-4 h-24">
                <button 
                  onClick={addScenario}
                  className={`border-2 border-dashed rounded-xl flex items-center justify-center gap-3 p-4 transition-all h-full ${
                      theme === 'light' 
                      ? 'border-gray-300 text-gray-400 hover:text-brand-500 hover:border-brand-500 hover:bg-white' 
                      : 'border-gray-700 text-gray-500 hover:text-brand-400 hover:border-brand-400 hover:bg-white/5'
                  }`}
                >
                  <PlusCircle size={20} />
                  <span className="font-semibold text-sm">Add Standard</span>
                </button>

                <button 
                  onClick={() => openImportModal()}
                  className={`border-2 border-dashed rounded-xl flex items-center justify-center gap-3 p-4 transition-all h-full ${
                      theme === 'light' 
                      ? 'border-gray-300 text-gray-400 hover:text-purple-500 hover:border-purple-500 hover:bg-white' 
                      : 'border-gray-700 text-gray-500 hover:text-purple-400 hover:border-purple-400 hover:bg-white/5'
                  }`}
                >
                  <Link size={20} />
                  <span className="font-semibold text-sm">Import</span>
                </button>
            </div>
          )}
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1.5 bg-brand-600 rounded-full"></div>
            <div>
                <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Visual Breakdown</h2>
                <p className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-sm`}>Comparison based on Net Worth and Cost over {effectiveProjectionYears.toFixed(1)} years.</p>
            </div>
          </div>
          <ComparisonCharts scenarios={scenarios} calculatedData={calculatedData} theme={theme} />
        </div>

      </main>

      {selectedScenario && selectedCalculated && (
        <AmortizationModal 
          isOpen={!!viewScheduleId} 
          onClose={() => setViewScheduleId(null)}
          scenario={selectedScenario}
          calculated={selectedCalculated}
          theme={theme}
        />
      )}

      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportUrl}
        theme={theme}
      />
    </div>
  );
}

export default App;
