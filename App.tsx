import React, { useState, useMemo, useEffect } from 'react';
import { PlusCircle, Calculator, Sparkles, Clock, TrendingUp, Sun, Moon, Monitor, Wallet, PiggyBank, Calendar, RefreshCcw, Link, ChevronUp, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LoanScenario, CalculatedLoan, AnalysisStatus } from './types';
import { calculateLoan, generateId, COLORS, formatCurrency } from './utils/calculations';
import { LoanCard } from './components/LoanCard';
import { ComparisonCharts } from './components/ComparisonCharts';
import { analyzeLoansWithGemini, extractPropertyData } from './services/geminiService';
import { AmortizationModal } from './components/AmortizationModal';
import { ImportModal } from './components/ImportModal';

const DEFAULT_GLOBAL_FMV = 500000;
const DEFAULT_GLOBAL_LOAN = 555000;
const DEFAULT_GLOBAL_RENT = 2000;

export type Theme = 'light' | 'night' | 'gray';

function App() {
  // --- Theme State (Default Gray) ---
  const [theme, setTheme] = useState<Theme>('gray');

  // --- Global Controls ---
  const [globalFMV, setGlobalFMV] = useState<number>(DEFAULT_GLOBAL_FMV);
  const [globalLoan, setGlobalLoan] = useState<number>(DEFAULT_GLOBAL_LOAN);
  const [globalRent, setGlobalRent] = useState<number>(DEFAULT_GLOBAL_RENT);
  const [useGlobalRent, setUseGlobalRent] = useState<boolean>(true);

  // --- Header Visibility State (Collapsible) ---
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

  // --- Projection Settings ---
  const [horizonMode, setHorizonMode] = useState<'years' | 'months'>('years');
  const [horizonValue, setHorizonValue] = useState<number>(10);
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
      loanAmount: 458000,
      lockLoan: false,
      interestRate: 5.75,
      loanTermYears: 30,
      yearsRemaining: 28,
      monthsRemaining: 0,
      propertyTax: 3000,
      homeInsurance: 1500,
      hoa: 0,
      pmi: 0,
      taxRefundRate: 25,
      downPayment: 0,
      oneTimeExtraPayment: 0,
      oneTimeExtraPaymentMonth: 1,
      monthlyExtraPayment: 0,
      rentMonthly: DEFAULT_GLOBAL_RENT,
      lockRent: false,
      rentIncreasePerYear: 3,
      rentIncludeTax: true,
      rentTaxRate: 25
    },
    {
      id: generateId(),
      name: 'Refi + Cash In',
      color: COLORS[1],
      isRentOnly: false,
      homeValue: DEFAULT_GLOBAL_FMV,
      lockFMV: false,
      loanAmount: 458000, 
      lockLoan: true, 
      interestRate: 4.99,
      loanTermYears: 30,
      yearsRemaining: 30,
      monthsRemaining: 0,
      propertyTax: 3000,
      homeInsurance: 1500,
      hoa: 0,
      pmi: 0,
      taxRefundRate: 25,
      downPayment: 100000, 
      oneTimeExtraPayment: 0,
      oneTimeExtraPaymentMonth: 1,
      monthlyExtraPayment: 0,
      rentMonthly: DEFAULT_GLOBAL_RENT,
      lockRent: false,
      rentIncreasePerYear: 3,
      rentIncludeTax: true,
      rentTaxRate: 25
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
      propertyTax: 0,
      homeInsurance: 0,
      hoa: 0,
      pmi: 0,
      taxRefundRate: 0,
      downPayment: 0,
      oneTimeExtraPayment: 0,
      oneTimeExtraPaymentMonth: 0,
      monthlyExtraPayment: 0,
      rentMonthly: DEFAULT_GLOBAL_RENT,
      lockRent: false,
      rentIncreasePerYear: 3,
      rentIncludeTax: true,
      rentTaxRate: 25
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
      propertyTax: 0,
      homeInsurance: 0,
      hoa: 0,
      pmi: 0,
      taxRefundRate: 0,
      downPayment: 0,
      oneTimeExtraPayment: 0,
      oneTimeExtraPaymentMonth: 0,
      monthlyExtraPayment: 0,
      rentMonthly: 0,
      lockRent: false,
      rentIncreasePerYear: 0,
      rentIncludeTax: false,
      rentTaxRate: 0,
      investmentCapital: 100000,
      investmentMonthly: 0,
      investmentRate: 5
    }
  ]);

  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');

  // --- Broadcast Globals to Unlocked Scenarios ---
  useEffect(() => {
    setScenarios(prev => prev.map(s => {
        let updates: Partial<LoanScenario> = {};
        if (!s.lockFMV && !s.isRentOnly && !s.isInvestmentOnly) updates.homeValue = globalFMV;
        if (!s.lockLoan && !s.isRentOnly && !s.isInvestmentOnly) updates.loanAmount = globalLoan;
        if (useGlobalRent && !s.lockRent) updates.rentMonthly = globalRent;
        
        return Object.keys(updates).length > 0 ? { ...s, ...updates } : s;
    }));
  }, [globalFMV, globalLoan, globalRent, useGlobalRent]);

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
    // BI-DIRECTIONAL SYNC LOGIC
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
      isInvestmentOnly: false,
      isRentOnly: false
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
          isInvestmentOnly: false,
          isRentOnly: false,
          loanAmount: loanAmt,
          downPayment: extracted.homeValue ? extracted.homeValue * 0.2 : 0,
          ...extracted,
          homeValue: extracted.homeValue || DEFAULT_GLOBAL_FMV,
          propertyTax: extracted.propertyTax || 3000,
          homeInsurance: extracted.homeInsurance || 1200,
          hoa: extracted.hoa || 0
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

  const handleAnalyze = async () => {
    setAnalysisStatus('loading');
    setAnalysis(null);
    try {
      const result = await analyzeLoansWithGemini(scenarios, calculatedData, globalFMV, effectiveProjectionYears);
      setAnalysis(result);
      setAnalysisStatus('success');
    } catch (e) {
      setAnalysisStatus('error');
    }
  };

  const selectedScenario = scenarios.find(s => s.id === viewScheduleId);
  const selectedCalculated = calculatedData.find(c => c.id === viewScheduleId);

  const containerClass = theme === 'light' 
    ? 'bg-slate-50 text-gray-900' 
    : theme === 'night' 
        ? 'dark bg-slate-900 text-gray-100' 
        : 'dark bg-neutral-900 text-gray-100'; // Gray mode

  const borderClass = theme === 'light' ? 'border-gray-200' : 'border-gray-700';
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
      
      {/* HEADER */}
      <header className={`border-b sticky top-0 z-30 transition-colors duration-300 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/90 border-gray-700 backdrop-blur-md'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
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
                    <button onClick={() => setTheme('night')} className={`p-2 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${theme === 'night' ? 'bg-slate-700 text-brand-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
                        <Moon size={14} /> Night
                    </button>
                    <button onClick={() => setTheme('gray')} className={`p-2 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${theme === 'gray' ? 'bg-neutral-700 text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
                        <Monitor size={14} /> Gray
                    </button>
                </div>
            </div>

            {/* Collapsible Container */}
            {isHeaderExpanded && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Global Sliders with INPUTS */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-xl border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-gray-700'}`}>
                    {/* FMV */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className={`text-xs font-bold uppercase ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Global FMV</label>
                            <div className="relative w-24">
                                <span className="absolute left-2 top-1 text-xs text-gray-400">$</span>
                                <input 
                                    type="number" 
                                    value={globalFMV} 
                                    onChange={e => setGlobalFMV(Number(e.target.value))}
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
                                <input 
                                    type="number" 
                                    value={globalLoan} 
                                    onChange={e => setGlobalLoan(Number(e.target.value))}
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
                                <label className={`text-xs font-bold uppercase ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Global Rent</label>
                            </div>
                            <div className="relative w-24">
                                <span className="absolute left-2 top-1 text-xs text-gray-400">$</span>
                                <input 
                                    type="number" 
                                    value={globalRent} 
                                    onChange={e => setGlobalRent(Number(e.target.value))}
                                    disabled={!useGlobalRent}
                                    className={`w-full pl-4 py-0.5 text-xs border rounded text-right ${!useGlobalRent ? 'opacity-50' : ''} ${inputClass}`}
                                />
                            </div>
                        </div>
                        <input type="range" min="500" max="10000" step="50" value={globalRent} onChange={e => setGlobalRent(Number(e.target.value))} disabled={!useGlobalRent} className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${useGlobalRent ? 'bg-gray-300 accent-brand-600 dark:bg-gray-600' : 'bg-gray-200 dark:bg-gray-800'}`} />
                    </div>
                </div>

                {/* Investment Calculator */}
                <div className={`mt-4 pt-4 border-t ${borderClass}`}>
                    <div className={`mb-4 p-5 rounded-lg ${theme === 'light' ? 'bg-blue-50/50' : 'bg-blue-900/10'}`}>
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <PiggyBank size={18} className="text-blue-600 dark:text-blue-400" />
                                <span className={`text-sm font-bold uppercase ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>Compound interest investment calculator with replenishment</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <input type="checkbox" checked={modelSeparateInvestment} onChange={e => setModelSeparateInvestment(e.target.checked)} className="rounded" />
                                <span>Active for all scenarios</span>
                            </div>
                        </div>

                        {modelSeparateInvestment && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* LEFT COLUMN: INPUTS */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Starting Capital</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1.5 text-xs text-gray-400">$</span>
                                        <input type="number" value={globalCashInvestment} onChange={e => setGlobalCashInvestment(Number(e.target.value))} className={`w-full pl-5 py-1.5 text-sm border rounded ${inputClass}`} />
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
                                        <input type="number" value={investmentReturnRate} onChange={e => setInvestmentReturnRate(Number(e.target.value))} className={`w-full pr-5 py-1.5 text-sm border rounded ${inputClass}`} />
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
                                        <input type="number" value={globalMonthlyContribution} onChange={e => setGlobalMonthlyContribution(Number(e.target.value))} className={`w-full pl-5 py-1.5 text-sm border rounded ${inputClass}`} />
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

                    {/* Horizon & Appreciation Controls */}
                    <div className={`mt-6 pt-4 border-t ${borderClass} grid grid-cols-1 md:grid-cols-2 gap-8`}>
                        
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
                                        <input 
                                            type="number" 
                                            value={appreciationRate} 
                                            onChange={e => setAppreciationRate(Number(e.target.value))} 
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
            </div>
            )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Loan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
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
            <div className="grid grid-rows-2 gap-4 min-h-[400px]">
                <button 
                  onClick={addScenario}
                  className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-all h-full ${
                      theme === 'light' 
                      ? 'border-gray-300 text-gray-400 hover:text-brand-500 hover:border-brand-500 hover:bg-white' 
                      : 'border-gray-700 text-gray-500 hover:text-brand-400 hover:border-brand-400 hover:bg-white/5'
                  }`}
                >
                  <div className={`p-3 rounded-full mb-2 transition-colors ${theme === 'light' ? 'bg-gray-100 group-hover:bg-brand-50' : 'bg-gray-800'}`}>
                    <PlusCircle size={24} />
                  </div>
                  <span className="font-semibold text-sm">Add Standard Scenario</span>
                </button>

                <button 
                  onClick={() => openImportModal()}
                  className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-all h-full ${
                      theme === 'light' 
                      ? 'border-gray-300 text-gray-400 hover:text-purple-500 hover:border-purple-500 hover:bg-white' 
                      : 'border-gray-700 text-gray-500 hover:text-purple-400 hover:border-purple-400 hover:bg-white/5'
                  }`}
                >
                  <div className={`p-3 rounded-full mb-2 transition-colors ${theme === 'light' ? 'bg-gray-100 group-hover:bg-purple-50' : 'bg-gray-800'}`}>
                    <Link size={24} />
                  </div>
                  <span className="font-semibold text-sm">Import from Zillow / Propwire</span>
                </button>
            </div>
          )}
        </div>

        <div className="flex justify-center mb-12">
           <button 
             onClick={handleAnalyze}
             disabled={analysisStatus === 'loading'}
             className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
           >
             <Sparkles size={20} className={analysisStatus === 'loading' ? 'animate-spin' : ''} />
             {analysisStatus === 'loading' ? 'Analyzing...' : 'Analyze with AI'}
           </button>
        </div>

        {analysis && (
          <div className={`rounded-2xl shadow-xl border p-8 mb-12 animate-fade-in-up ${theme === 'light' ? 'bg-white border-indigo-100' : 'bg-gray-800 border-gray-700'}`}>
            <div className={`flex items-center gap-3 mb-6 border-b pb-4 ${theme === 'light' ? 'border-indigo-50' : 'border-gray-700'}`}>
              <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full text-indigo-600 dark:text-indigo-400">
                <Sparkles size={24} />
              </div>
              <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>Gemini Financial Analysis</h2>
            </div>
            <div className={`prose max-w-none ${theme === 'light' ? 'text-gray-600 prose-indigo' : 'text-gray-300 prose-invert'}`}>
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          </div>
        )}

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
