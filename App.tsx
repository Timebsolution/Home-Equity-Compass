
import React, { useState, useMemo, useEffect } from 'react';
import { PlusCircle, Calculator, Clock, TrendingUp, Sun, Moon, PiggyBank, Link, ChevronUp, ChevronDown, Globe, Eye, EyeOff, BarChart3, Wallet, ShieldCheck } from 'lucide-react';
import { LoanScenario, CalculatedLoan } from './types';
import { calculateLoan, generateId, COLORS, formatCurrency, calculateInvestmentPortfolio } from './utils/calculations';
import { LoanCard } from './components/LoanCard';
import { ComparisonCharts } from './components/ComparisonCharts';
import { VerdictSummary } from './components/VerdictSummary';
import { extractPropertyData } from './services/geminiService';
import { AmortizationModal } from './components/AmortizationModal';
import { ImportModal } from './components/ImportModal';

const DEFAULT_GLOBAL_FMV = 467000;
const DEFAULT_GLOBAL_LOAN = 467000;
const DEFAULT_GLOBAL_RENT = 1900;

export type Theme = 'light' | 'night';
export type ComparisonMetric = 'profit' | 'netWorth' | 'netCost';

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
  const [theme, setTheme] = useState<Theme>('night');
  const [globalFMV, setGlobalFMV] = useState<number>(DEFAULT_GLOBAL_FMV);
  const [globalLoan, setGlobalLoan] = useState<number>(DEFAULT_GLOBAL_LOAN);
  const [globalRent, setGlobalRent] = useState<number>(DEFAULT_GLOBAL_RENT);
  const [useGlobalRent, setUseGlobalRent] = useState<boolean>(true);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  
  const [isGlobalsOpen, setIsGlobalsOpen] = useState(false);
  const [isInvestOpen, setIsInvestOpen] = useState(true); 
  const [isProjectionOpen, setIsProjectionOpen] = useState(true);

  const [horizonMode, setHorizonMode] = useState<'years' | 'months'>('years');
  const [horizonValue, setHorizonValue] = useState<number>(5); 
  const [growthEnabled, setGrowthEnabled] = useState<boolean>(true);
  const [appreciationRate, setAppreciationRate] = useState<number>(2.0); 
  
  const [globalCashInvestment, setGlobalCashInvestment] = useState<number>(100000); 
  const [globalMonthlyContribution, setGlobalMonthlyContribution] = useState<number>(500); 
  const [globalContributionFrequency, setGlobalContributionFrequency] = useState<string>('monthly');
  const [investmentReturnRate, setInvestmentReturnRate] = useState<number>(5.0); 
  const [modelSeparateInvestment, setModelSeparateInvestment] = useState<boolean>(true);
  const [globalReinvest, setGlobalReinvest] = useState<boolean>(true);

  const [comparisonMetric, setComparisonMetric] = useState<ComparisonMetric>('profit');

  const [viewScheduleId, setViewScheduleId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargetId, setImportTargetId] = useState<string | null>(null); 
  
  const [scenarios, setScenarios] = useState<LoanScenario[]>([
    {
      id: generateId(),
      name: 'Current Loan',
      color: COLORS[0],
      isRentOnly: false,
      homeValue: DEFAULT_GLOBAL_FMV,
      lockFMV: false,
      loanAmount: 450000, 
      lockLoan: true, // Manual
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
      propertyTaxRate: 0.6, 
      usePropertyTaxRate: false, 
      homeInsurance: 1500,
      hoa: 0,
      pmi: 0,
      taxRefundRate: 20, 
      downPayment: 0,
      closingCosts: 0,
      sellingCostRate: 6,
      oneTimeExtraPayment: 0,
      oneTimeExtraPaymentMonth: 1,
      monthlyExtraPayment: 0,
      monthlyExtraPaymentFrequency: 'monthly',
      manualExtraPayments: {},
      rentalIncome: DEFAULT_GLOBAL_RENT,
      lockRentIncome: false, 
      rentalIncomeTaxEnabled: true,
      rentalIncomeTaxRate: 20,
      rentMonthly: DEFAULT_GLOBAL_RENT,
      lockRent: false,
      rentIncreasePerYear: 3,
      rentIncludeTax: true,
      rentTaxRate: 25,
      lockInvestment: false,
      investmentContributionFrequency: 'monthly',
      investMonthlySavings: true,
      capitalGainsTaxRate: 20
    },
    {
      id: generateId(),
      name: 'Refi + Cash In',
      color: COLORS[1],
      isRentOnly: false,
      homeValue: DEFAULT_GLOBAL_FMV,
      lockFMV: false,
      loanAmount: 400000, 
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
      taxRefundRate: 0,
      downPayment: 100000, 
      closingCosts: 0,
      sellingCostRate: 6,
      oneTimeExtraPayment: 0,
      oneTimeExtraPaymentMonth: 1,
      monthlyExtraPayment: 0,
      monthlyExtraPaymentFrequency: 'monthly',
      manualExtraPayments: {},
      rentalIncome: DEFAULT_GLOBAL_RENT,
      lockRentIncome: false, 
      rentalIncomeTaxEnabled: true,
      rentalIncomeTaxRate: 20,
      rentMonthly: DEFAULT_GLOBAL_RENT,
      lockRent: false,
      rentIncreasePerYear: 3,
      rentIncludeTax: true,
      rentTaxRate: 25,
      lockInvestment: false,
      investmentContributionFrequency: 'monthly',
      investMonthlySavings: true,
      capitalGainsTaxRate: 20
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
      closingCosts: 0,
      sellingCostRate: 0,
      oneTimeExtraPayment: 0,
      oneTimeExtraPaymentMonth: 0,
      monthlyExtraPayment: 0,
      monthlyExtraPaymentFrequency: 'monthly',
      manualExtraPayments: {},
      rentalIncome: 0,
      lockRentIncome: true,
      rentalIncomeTaxEnabled: false,
      rentalIncomeTaxRate: 20,
      rentMonthly: 1900,
      lockRent: false,
      rentIncreasePerYear: 0,
      rentIncludeTax: true,
      rentTaxRate: 25,
      lockInvestment: true, // Manual
      investmentCapital: 0, 
      investmentRate: 4,    
      investmentMonthly: 0, 
      investmentContributionFrequency: 'monthly',
      investMonthlySavings: true,
      capitalGainsTaxRate: 20
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
      taxRefundRate: 20,
      downPayment: 0,
      closingCosts: 0,
      sellingCostRate: 0,
      oneTimeExtraPayment: 0,
      oneTimeExtraPaymentMonth: 0,
      monthlyExtraPayment: 0,
      monthlyExtraPaymentFrequency: 'monthly',
      manualExtraPayments: {},
      rentalIncome: 0,
      lockRentIncome: true,
      rentalIncomeTaxEnabled: false,
      rentalIncomeTaxRate: 20,
      rentMonthly: 0,
      lockRent: false,
      rentIncreasePerYear: 0,
      rentIncludeTax: false,
      rentTaxRate: 0,
      investmentCapital: 100000,
      investmentMonthly: 500,
      investmentRate: 5,
      lockInvestment: false, 
      investmentContributionFrequency: 'monthly',
      investMonthlySavings: true,
      capitalGainsTaxRate: 20
    }
  ]);

  useEffect(() => {
    setScenarios(prev => prev.map(s => {
        let updates: Partial<LoanScenario> = {};
        if (!s.lockFMV && !s.isRentOnly && !s.isInvestmentOnly) updates.homeValue = globalFMV;
        if (!s.lockLoan && !s.isRentOnly && !s.isInvestmentOnly) updates.loanAmount = globalLoan;
        if (useGlobalRent && !s.lockRent) updates.rentMonthly = globalRent;
        if (useGlobalRent && !s.lockRentIncome && !s.isRentOnly && !s.isInvestmentOnly) updates.rentalIncome = globalRent;
        
        if (!s.lockInvestment) {
             updates.investmentCapital = globalCashInvestment;
             updates.investmentMonthly = globalMonthlyContribution;
             updates.investmentRate = investmentReturnRate;
             updates.investmentContributionFrequency = globalContributionFrequency as any;
        }

        return Object.keys(updates).length > 0 ? { ...s, ...updates } : s;
    }));
  }, [globalFMV, globalLoan, globalRent, useGlobalRent, globalCashInvestment, globalMonthlyContribution, investmentReturnRate, globalContributionFrequency]);

  const effectiveProjectionYears = useMemo(() => {
      return horizonMode === 'years' ? horizonValue : horizonValue / 12;
  }, [horizonMode, horizonValue]);

  const calculatedData: CalculatedLoan[] = useMemo(() => {
    const investmentCashToPass = modelSeparateInvestment ? globalCashInvestment : 0;
    const investmentMonthlyToPass = modelSeparateInvestment ? globalMonthlyContribution : 0;
    const effectiveAppreciation = growthEnabled ? appreciationRate : 0;
    
    let baselinePayment: number | undefined = undefined;
    if (scenarios.length > 0) {
        const tempBaseline = calculateLoan(
            scenarios[0], 
            effectiveProjectionYears, 
            effectiveAppreciation, 
            investmentReturnRate, 
            investmentCashToPass, 
            investmentMonthlyToPass,
            globalContributionFrequency,
            undefined, 
            globalRent, 
            useGlobalRent
        );
        baselinePayment = tempBaseline.totalMonthlyPayment;
    }

    return scenarios.map(s => calculateLoan(
        s, 
        effectiveProjectionYears, 
        effectiveAppreciation, 
        investmentReturnRate, 
        investmentCashToPass, 
        investmentMonthlyToPass,
        globalContributionFrequency,
        baselinePayment, 
        globalRent, 
        useGlobalRent
    ));
  }, [scenarios, effectiveProjectionYears, growthEnabled, appreciationRate, investmentReturnRate, globalCashInvestment, globalMonthlyContribution, globalContributionFrequency, modelSeparateInvestment, globalRent, useGlobalRent]);

  const winnerId = useMemo(() => {
      if (calculatedData.length === 0) return null;
      
      return calculatedData.reduce((prev, current) => {
          let prevVal, currVal;
          
          if (comparisonMetric === 'profit') {
              prevVal = prev.profit;
              currVal = current.profit;
              return prevVal > currVal ? prev : current;
          } else if (comparisonMetric === 'netWorth') {
              prevVal = prev.netWorth;
              currVal = current.netWorth;
              return prevVal > currVal ? prev : current;
          } else {
              // Net Cost (True Cost) - Lower is better
              prevVal = prev.netCost;
              currVal = current.netCost;
              return prevVal < currVal ? prev : current;
          }
      }).id;
  }, [calculatedData, comparisonMetric]);

  const updateScenario = (id: string, updates: Partial<LoanScenario>) => {
    if (updates.lockInvestment === false) {
       updates.investmentCapital = globalCashInvestment;
       updates.investmentMonthly = globalMonthlyContribution;
       updates.investmentRate = investmentReturnRate;
       updates.investmentContributionFrequency = globalContributionFrequency as any;
    }
    if (updates.lockInvestment === true) {
       updates.investmentCapital = globalCashInvestment;
       updates.investmentMonthly = globalMonthlyContribution;
       updates.investmentRate = investmentReturnRate;
       updates.investmentContributionFrequency = globalContributionFrequency as any;
    }

    if (updates.lockRent === false) {
        updates.rentMonthly = globalRent;
    }
    if (updates.lockRentIncome === false) {
        updates.rentalIncome = globalRent;
    }
    
    if (updates.lockFMV === false) {
        updates.homeValue = globalFMV;
    }
    if (updates.lockLoan === false) {
        updates.loanAmount = globalLoan;
    }

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
      lockRentIncome: false, 
      rentalIncome: useGlobalRent ? globalRent : 0,
      rentalIncomeTaxEnabled: false,
      rentalIncomeTaxRate: 20,
      isInvestmentOnly: false,
      isRentOnly: false,
      lockInvestment: false,
      propertyTaxRate: 0.6,
      usePropertyTaxRate: false,
      hasSecondLoan: false,
      secondLoanAmount: 0,
      secondLoanInterestRate: 3.0,
      secondLoanTermYears: 30,
      secondLoanYearsRemaining: 30,
      secondLoanMonthsRemaining: 0,
      closingCosts: 0,
      sellingCostRate: 6,
      investMonthlySavings: true,
      manualExtraPayments: {},
      capitalGainsTaxRate: 20,
      monthlyExtraPaymentFrequency: 'monthly'
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
          lockRentIncome: false,
          rentalIncome: useGlobalRent ? globalRent : 0,
          rentalIncomeTaxEnabled: false,
          rentalIncomeTaxRate: 20,
          isInvestmentOnly: false,
          isRentOnly: false,
          loanAmount: loanAmt,
          downPayment: extracted.homeValue ? extracted.homeValue * 0.2 : 0,
          ...extracted,
          homeValue: extracted.homeValue || DEFAULT_GLOBAL_FMV,
          propertyTax: extracted.propertyTax || 3000,
          propertyTaxRate: 0.6,
          usePropertyTaxRate: false,
          lockInvestment: false,
          homeInsurance: extracted.homeInsurance || 1200,
          hoa: extracted.hoa || 0,
          hasSecondLoan: false,
          secondLoanAmount: 0,
          secondLoanInterestRate: 3.0,
          secondLoanTermYears: 30,
          secondLoanYearsRemaining: 30,
          secondLoanMonthsRemaining: 0,
          closingCosts: 0,
          sellingCostRate: 6,
          investMonthlySavings: true,
          manualExtraPayments: {},
          capitalGainsTaxRate: 20,
          monthlyExtraPaymentFrequency: 'monthly'
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
  const containerClass = theme === 'light' ? 'bg-slate-50 text-gray-900' : 'dark bg-neutral-900 text-gray-100';
  const inputClass = theme === 'light' ? 'bg-white border-gray-300' : 'bg-black/30 border-gray-600 text-white';

  const calcInvestmentResult = useMemo(() => {
      const result = calculateInvestmentPortfolio(
          globalCashInvestment,
          globalMonthlyContribution,
          globalContributionFrequency,
          investmentReturnRate,
          effectiveProjectionYears, 
          globalReinvest
      );
      
      return { 
          fv: result.finalValue, 
          profit: result.interestEarned,
          replenished: result.totalReplenished
      };
  }, [globalCashInvestment, globalMonthlyContribution, globalContributionFrequency, investmentReturnRate, effectiveProjectionYears, globalReinvest]);

  return (
    <div className={`min-h-screen pb-20 font-sans transition-colors duration-300 ${containerClass}`}>
      <header className={`border-b sticky top-0 z-30 transition-colors duration-300 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-neutral-900/90 border-gray-700 backdrop-blur-md'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="bg-brand-600 text-white p-2 rounded-lg shadow-lg shadow-brand-500/30"><Calculator size={20} /></div>
                    <h1 className="text-xl font-bold tracking-tight">Home Equity Compass</h1>
                    <button 
                      onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                      className={`ml-2 p-1.5 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-gray-700 text-gray-400'}`}
                    >
                      {isHeaderExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>
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

      {isHeaderExpanded && (
        <div className={`border-b transition-colors duration-300 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-neutral-900 border-gray-700'}`}>
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
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
                            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
                                <span className="italic">Compound interest investment calculator with replenishment</span>
                            </div>

                            {modelSeparateInvestment && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                                            type="text" 
                                            value={effectiveProjectionYears.toFixed(1)} 
                                            readOnly
                                            disabled 
                                            className={`w-full pr-8 py-1.5 text-sm border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed`} 
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
                                        <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={globalReinvest} 
                                                onChange={e => setGlobalReinvest(e.target.checked)}
                                                className="rounded text-brand-600 cursor-pointer" 
                                            />
                                            Reinvest Income
                                        </label>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Additional Amount</label>
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
                                        <select 
                                          value={globalContributionFrequency} 
                                          onChange={e => setGlobalContributionFrequency(e.target.value)}
                                          className={`w-full py-1.5 text-sm border rounded cursor-pointer ${inputClass}`}
                                        >
                                            <option value="weekly">Weekly</option>
                                            <option value="biweekly">Every 2 weeks (Bi-weekly)</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="semiannually">Every 6 months (Semi-annually)</option>
                                            <option value="annually">Annually</option>
                                        </select>
                                    </div>
                                </div>
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
                                    {calcInvestmentResult.replenished > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs uppercase font-bold text-gray-500">Total Replenished</span>
                                        <span className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>{formatCurrency(calcInvestmentResult.replenished)}</span>
                                    </div>
                                    )}
                                </div>
                            </div>
                            )}
                        </div>
                    )}
                </div>

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
                globalInvestmentSettings={{
                    globalCashInvestment,
                    investmentReturnRate,
                    globalMonthlyContribution,
                    globalContributionFrequency
                }}
                comparisonMetric={comparisonMetric}
              />
            );
          })}
          
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
          <ComparisonCharts scenarios={scenarios} calculatedData={calculatedData} theme={theme} comparisonMetric={comparisonMetric} />
          
          <div className="max-w-3xl mx-auto mt-6 flex justify-center">
            <div className={`flex p-1 rounded-xl border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-black/20 border-gray-700'}`}>
                <button
                    onClick={() => setComparisonMetric('profit')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${comparisonMetric === 'profit' ? (theme === 'light' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm' : 'bg-emerald-900/30 text-emerald-400 border border-emerald-800') : (theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-gray-200')}`}
                >
                    <BarChart3 size={14} /> Profit / ROI
                </button>
                <button
                    onClick={() => setComparisonMetric('netWorth')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${comparisonMetric === 'netWorth' ? (theme === 'light' ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' : 'bg-blue-900/30 text-blue-400 border border-blue-800') : (theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-gray-200')}`}
                >
                    <Wallet size={14} /> Net Worth
                </button>
                <button
                    onClick={() => setComparisonMetric('netCost')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${comparisonMetric === 'netCost' ? (theme === 'light' ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm' : 'bg-red-900/30 text-red-400 border border-red-800') : (theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-gray-200')}`}
                >
                    <ShieldCheck size={14} /> Lowest Cost
                </button>
            </div>
        </div>
        </div>

        <VerdictSummary scenarios={scenarios} calculatedData={calculatedData} theme={theme} />

      </main>

      {selectedScenario && selectedCalculated && (
        <AmortizationModal 
          isOpen={!!viewScheduleId} 
          onClose={() => setViewScheduleId(null)}
          scenario={selectedScenario}
          calculated={selectedCalculated}
          onUpdate={updateScenario} 
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
