
import React, { useState, useMemo } from 'react';
import { X, Calendar, Table2, Trash2, Layers, CreditCard } from 'lucide-react';
import { CalculatedLoan, LoanScenario } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { Theme } from '../App';

interface AmortizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: LoanScenario;
  calculated: CalculatedLoan;
  onUpdate: (id: string, updates: Partial<LoanScenario>) => void;
  theme: Theme;
}

type ViewMode = 'monthly' | 'annual';

// Helper for the inline table input
const TableInput = ({ 
    value, 
    onChange, 
    theme,
    placeholder,
    isOverridden
}: { 
    value: number, 
    onChange: (val: number | null) => void, 
    theme: Theme,
    placeholder?: string,
    isOverridden: boolean
}) => {
    // Local state to manage input display
    const [localStr, setLocalStr] = useState(formatNumber(value));
    
    // Sync external changes (e.g. scroll or clear all)
    React.useEffect(() => {
        setLocalStr(formatNumber(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalStr(e.target.value);
    };

    const handleBlur = () => {
        const clean = localStr.replace(/,/g, '');
        if (clean === '') {
            onChange(null); // Signal revert/clear
            return;
        }
        const num = parseFloat(clean);
        if (!isNaN(num)) {
            onChange(num);
            setLocalStr(formatNumber(num));
        } else {
            onChange(null);
            setLocalStr('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    // Styling logic: Highlight if overridden
    const isModifiedStyle = isOverridden 
        ? (theme === 'light' ? 'bg-amber-50 font-bold text-amber-700' : 'bg-amber-900/30 font-bold text-amber-400')
        : (value > 0 ? (theme === 'light' ? 'font-bold text-blue-600' : 'text-blue-400') : (theme === 'light' ? 'text-gray-400' : 'text-gray-500'));

    return (
        <input 
            type="text"
            inputMode="decimal"
            // If it's the default 0 and NOT overridden, show empty to let placeholder show '-'
            value={localStr === '0' && !isOverridden && value === 0 ? '' : localStr} 
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-24 px-2 py-1 text-right text-xs bg-transparent border-b border-transparent hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-500/10 transition-all rounded-sm ${isModifiedStyle}`}
        />
    );
};

export const AmortizationModal: React.FC<AmortizationModalProps> = ({ 
  isOpen, 
  onClose, 
  scenario, 
  calculated,
  onUpdate,
  theme
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [activeTab, setActiveTab] = useState<string>('combined'); // 'combined' | 'primary' | loanId

  if (!isOpen) return null;

  const bgClass = theme === 'light' ? 'bg-white' : 'bg-neutral-800';
  const textClass = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
  const subTextClass = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
  const borderClass = theme === 'light' ? 'border-gray-200' : 'border-gray-700';
  const headerBg = theme === 'light' ? 'bg-gray-50' : 'bg-neutral-900/50';
  const hoverBg = theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/5';
  const activeTabClass = theme === 'light' ? 'bg-white text-brand-600 shadow-sm' : 'bg-neutral-700 text-white shadow-sm';
  const inactiveTabClass = theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-gray-200';
  const activeSubTab = theme === 'light' ? 'border-brand-500 text-brand-600' : 'border-brand-400 text-brand-400';
  const inactiveSubTab = theme === 'light' ? 'border-transparent text-gray-500 hover:text-gray-700' : 'border-transparent text-gray-400 hover:text-gray-200';

  const hasManualOverrides = scenario.manualExtraPayments && Object.keys(scenario.manualExtraPayments).length > 0;
  const hasMultipleLoans = (scenario.additionalLoans || []).length > 0;
  
  // Select the correct schedule based on tab
  // Use safety checks to ensure we don't crash if subSchedules is missing or activeTab is stale
  const activeSchedule = activeTab === 'combined' 
      ? calculated.amortizationSchedule 
      : (calculated.subSchedules ? (calculated.subSchedules[activeTab] || []) : []);

  const handleExtraPaymentChange = (monthIndex: number, amount: number | null) => {
      // Only allow editing extra payment on combined or primary view
      // Currently extra payment logic in calc is mostly primary based, but could be extended
      if (activeTab !== 'combined' && activeTab !== 'primary') return;

      const newManuals = { ...(scenario.manualExtraPayments || {}) };
      
      // If amount is null or negative, clear the override (revert to global)
      if (amount === null || amount < 0) {
          delete newManuals[monthIndex];
      } else {
          // Allow 0 as a valid override to block global extra payments
          newManuals[monthIndex] = amount;
      }
      onUpdate(scenario.id, { manualExtraPayments: newManuals });
  };

  const clearManualOverrides = () => {
      onUpdate(scenario.id, { manualExtraPayments: {} });
  };

  // --- Aggregate Annual Data ---
  const annualData = useMemo(() => {
    if (!activeSchedule) return [];

    const years: Record<number, {
      year: number;
      totalPayment: number;
      principal: number;
      interest: number;
      tax: number;
      insurance: number;
      fees: number; // HOA + PMI
      extra: number;
      taxRefund: number;
      endBalance: number;
      customExpenses: number;
      investmentBalance: number;
      investmentTax: number;
      subLoanBalances: Record<string, number>;
    }> = {};

    activeSchedule.forEach((row, index) => {
      const year = Math.floor((row.monthIndex - 1) / 12) + 1;
      
      if (!years[year]) {
        years[year] = {
          year,
          totalPayment: 0,
          principal: 0,
          interest: 0,
          tax: 0,
          insurance: 0,
          fees: 0,
          extra: 0,
          taxRefund: 0,
          endBalance: row.balance, // Will update to last month
          customExpenses: 0,
          investmentBalance: row.investmentBalance, // Will update to last month
          investmentTax: 0,
          subLoanBalances: {}
        };
      }

      const tax = activeTab === 'combined' ? calculated.monthlyTax : 0;
      const ins = activeTab === 'combined' ? calculated.monthlyInsurance : 0;
      const hoa = activeTab === 'combined' ? calculated.monthlyHOA : 0;
      
      // Derived PMI logic only applies to combined really, or we assume it's part of Property Cost not loan specific
      const pmi = 0; 
      const fees = hoa + pmi;
      
      years[year].totalPayment += row.totalPayment;
      years[year].principal += row.principal;
      years[year].interest += row.interest;
      years[year].tax += tax;
      years[year].insurance += ins;
      years[year].fees += fees;
      years[year].extra += row.extraPayment;
      years[year].taxRefund = row.totalTaxRefund; // Snapshot end of year

      years[year].endBalance = row.balance;
      years[year].customExpenses += row.customExpenses;
      years[year].investmentBalance = row.investmentBalance;
      years[year].investmentTax += row.investmentTax;

      // Track sub loan balances annually
      if (activeTab === 'combined' && calculated.subSchedules) {
          (scenario.additionalLoans || []).forEach(l => {
              const subPoint = calculated.subSchedules?.[l.id]?.[index];
              if (subPoint) {
                  years[year].subLoanBalances[l.id] = subPoint.balance;
              }
          });
      }
    });

    return Object.values(years);
  }, [activeSchedule, calculated, activeTab, scenario.additionalLoans]);

  // Use opaque overlay to hide background content
  const overlayClass = theme === 'light' ? 'bg-slate-50' : 'bg-neutral-950';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClass} animate-in fade-in`}>
      <div className={`${bgClass} rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border ${borderClass}`}>
        
        {/* Header */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b gap-4 ${borderClass}`}>
          <div>
            <h2 className={`text-xl font-bold ${textClass}`}>{scenario.name} Schedule</h2>
            <div className="flex gap-4 mt-1">
                 <p className={`text-sm ${subTextClass}`}>Payoff Date: {calculated.payoffDate}</p>
                 <p className={`text-sm ${subTextClass}`}>Total Equity: {formatCurrency(calculated.totalEquityBuilt)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* View Toggle */}
             <div className={`flex p-1 rounded-lg border ${theme === 'light' ? 'bg-gray-100 border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                <button 
                  onClick={() => setViewMode('monthly')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${viewMode === 'monthly' ? activeTabClass : inactiveTabClass}`}
                >
                  <Calendar size={14} /> Monthly
                </button>
                <button 
                  onClick={() => setViewMode('annual')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${viewMode === 'annual' ? activeTabClass : inactiveTabClass}`}
                >
                  <Table2 size={14} /> Annual
                </button>
             </div>

             <button 
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${hoverBg} ${subTextClass}`}
              >
                <X size={24} />
             </button>
          </div>
        </div>

        {/* Warning / Status Banners */}
        <div className="flex flex-col gap-2 mx-6 mt-4">
            {/* 1. Global Extra Payment Active Banner */}
            {(scenario.monthlyExtraPayment > 0 || scenario.annualLumpSumPayment > 0) && !hasManualOverrides && activeTab === 'combined' && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-3">
                <span className="text-xl">ℹ️</span>
                <div>
                    <strong className={`block text-sm font-bold ${theme==='light'?'text-gray-800':'text-gray-200'}`}>Extra Payment Strategy Active</strong>
                    <div className={`text-xs ${theme==='light'?'text-gray-600':'text-gray-400'}`}>
                        {scenario.monthlyExtraPayment > 0 && <span>Paying <span className="font-semibold">{formatCurrency(scenario.monthlyExtraPayment)}/month</span></span>}
                        {scenario.monthlyExtraPayment > 0 && scenario.annualLumpSumPayment > 0 && <span> + </span>}
                        {scenario.annualLumpSumPayment > 0 && <span>Annual Lump Sum of <span className="font-semibold">{formatCurrency(scenario.annualLumpSumPayment)}</span></span>}
                    </div>
                </div>
                </div>
                
                <div className="flex gap-6 text-sm">
                    <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Time Saved</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{(calculated.monthsSaved / 12).toFixed(1)} years</span>
                    </div>
                    <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Interest Saved</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(calculated.lifetimeInterestSaved)}</span>
                    </div>
                </div>
            </div>
            )}

            {/* 2. Manual Overrides Active Banner */}
            {hasManualOverrides && activeTab === 'combined' && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-2">
                    <div className="flex gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <strong className={`block text-sm font-bold ${theme==='light'?'text-gray-800':'text-gray-200'}`}>Manual Schedule Overrides Active</strong>
                            <p className={`text-xs ${theme==='light'?'text-gray-600':'text-gray-400'}`}>
                                Some months have specific extra payment amounts that override the global setting.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={clearManualOverrides}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded flex items-center gap-2 transition-colors"
                    >
                        <Trash2 size={12} /> Clear Manual Changes
                    </button>
                </div>
            )}
        </div>

        {/* Loan Selection Tabs */}
        {hasMultipleLoans && (
            <div className={`mx-6 mt-4 border-b ${borderClass} flex overflow-x-auto`}>
                <button
                    onClick={() => setActiveTab('combined')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'combined' ? activeSubTab : inactiveSubTab}`}
                >
                    <Layers size={14} /> Combined
                </button>
                <button
                    onClick={() => setActiveTab('primary')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'primary' ? activeSubTab : inactiveSubTab}`}
                >
                    <CreditCard size={14} /> Primary Loan
                </button>
                {scenario.additionalLoans.map((l, i) => (
                    <button
                        key={l.id}
                        onClick={() => setActiveTab(l.id)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === l.id ? activeSubTab : inactiveSubTab}`}
                    >
                        <CreditCard size={14} /> {l.name || `Loan ${i+2}`}
                    </button>
                ))}
            </div>
        )}

        {/* Scrollable Content */}
        <div className="overflow-auto flex-1 p-0 mt-0">
          <table className="w-full text-xs md:text-sm text-left border-collapse">
            <thead className={`sticky top-0 font-semibold shadow-sm z-10 ${headerBg} ${textClass}`}>
              <tr>
                <th className={`px-4 py-3 border-b ${borderClass} whitespace-nowrap`}>{viewMode === 'monthly' ? 'Date' : 'Year'}</th>
                <th className={`px-4 py-3 border-b ${borderClass}`}>Total Outflow</th>
                <th className={`px-4 py-3 border-b text-green-700 dark:text-green-400 ${borderClass}`}>Principal</th>
                <th className={`px-4 py-3 border-b text-red-600 dark:text-red-400 ${borderClass}`}>Interest</th>
                
                {activeTab === 'combined' && (
                    <>
                        <th className={`px-4 py-3 border-b text-gray-500 dark:text-gray-400 ${borderClass} hidden lg:table-cell`}>Tax</th>
                        <th className={`px-4 py-3 border-b text-gray-500 dark:text-gray-400 ${borderClass} hidden lg:table-cell`}>Ins</th>
                        <th className={`px-4 py-3 border-b text-orange-500 dark:text-orange-400 ${borderClass} hidden md:table-cell`}>Exp</th>
                    </>
                )}
                
                <th className={`px-4 py-3 border-b text-blue-600 dark:text-blue-400 ${borderClass} w-24`}>Extra</th>
                <th className={`px-4 py-3 border-b text-cyan-600 dark:text-cyan-400 ${borderClass} hidden md:table-cell`}>Cum. Refund</th>
                
                {activeTab === 'combined' && (
                    <>
                        <th className={`px-4 py-3 border-b text-purple-600 dark:text-purple-400 ${borderClass} hidden md:table-cell`}>Inv. Value</th>
                        <th className={`px-4 py-3 border-b text-gray-400 dark:text-gray-500 ${borderClass} hidden md:table-cell`}>Inv. Tax</th>
                    </>
                )}
                
                {/* Additional Loan Balance Columns (Combined View Only) */}
                {activeTab === 'combined' && scenario.additionalLoans.map(l => (
                    <th key={l.id} className={`px-4 py-3 border-b text-right text-gray-500 dark:text-gray-400 ${borderClass} hidden sm:table-cell`}>
                        {l.name} Bal
                    </th>
                ))}

                <th className={`px-4 py-3 border-b text-right ${borderClass}`}>
                    {activeTab === 'combined' ? 'Total Balance' : 'Balance'}
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-100' : 'divide-gray-700'}`}>
              
              {viewMode === 'monthly' ? (
                // --- MONTHLY ROWS ---
                activeSchedule && activeSchedule.map((row, index) => {
                  const tax = activeTab === 'combined' ? calculated.monthlyTax : 0;
                  const ins = activeTab === 'combined' ? calculated.monthlyInsurance : 0;
                  
                  // Check if this row is overridden
                  const isOverridden = scenario.manualExtraPayments?.[row.monthIndex] !== undefined;
                  const canEditExtra = activeTab === 'combined' || activeTab === 'primary';

                  return (
                    <tr key={row.monthIndex} className={hoverBg}>
                      <td className={`px-4 py-2 font-mono ${subTextClass} whitespace-nowrap`}>{row.date}</td>
                      <td className={`px-4 py-2 font-medium ${textClass}`}>{formatCurrency(row.totalPayment)}</td>
                      <td className="px-4 py-2 text-green-700 dark:text-green-400">{formatCurrency(row.principal)}</td>
                      <td className="px-4 py-2 text-red-600 dark:text-red-400">{formatCurrency(row.interest)}</td>
                      
                      {activeTab === 'combined' && (
                          <>
                            <td className="px-4 py-2 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{formatCurrency(tax)}</td>
                            <td className="px-4 py-2 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{formatCurrency(ins)}</td>
                            <td className="px-4 py-2 text-orange-500 dark:text-orange-400 hidden md:table-cell">{row.customExpenses > 0 ? formatCurrency(row.customExpenses) : '-'}</td>
                          </>
                      )}
                      
                      <td className="px-4 py-2">
                        {canEditExtra ? (
                            <TableInput 
                                value={row.extraPayment} 
                                onChange={(val) => handleExtraPaymentChange(row.monthIndex, val)} 
                                theme={theme}
                                placeholder={scenario.monthlyExtraPayment > 0 ? scenario.monthlyExtraPayment.toString() : '-'}
                                isOverridden={isOverridden}
                            />
                        ) : (
                            <span className="text-gray-500">{row.extraPayment > 0 ? formatCurrency(row.extraPayment) : '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-cyan-600 dark:text-cyan-400 hidden md:table-cell font-mono text-xs">
                         {formatCurrency(row.totalTaxRefund)}
                      </td>
                      
                      {activeTab === 'combined' && (
                          <>
                            <td className="px-4 py-2 text-purple-600 dark:text-purple-400 hidden md:table-cell font-medium">
                                {formatCurrency(row.investmentBalance)}
                            </td>
                            <td className="px-4 py-2 text-gray-400 dark:text-gray-500 hidden md:table-cell font-mono text-xs">
                                {row.investmentTax > 0 ? formatCurrency(row.investmentTax) : '-'}
                            </td>
                          </>
                      )}
                      
                      {/* Individual Loan Balances */}
                      {activeTab === 'combined' && scenario.additionalLoans.map(l => {
                          const subBalance = calculated.subSchedules?.[l.id]?.[index]?.balance || 0;
                          return (
                            <td key={l.id} className="px-4 py-2 text-right text-gray-500 dark:text-gray-400 hidden sm:table-cell text-xs font-mono">
                                {formatCurrency(subBalance)}
                            </td>
                          );
                      })}

                      <td className={`px-4 py-2 text-right font-bold ${textClass}`}>
                        {formatCurrency(row.balance)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                // --- ANNUAL ROWS (Read Only) ---
                annualData.map((row) => {
                    // For cumulative snapshot columns
                    const cumRefund = row.taxRefund; // Computed as snapshot in useMemo

                    return (
                        <tr key={row.year} className={hoverBg}>
                        <td className={`px-4 py-3 font-mono font-bold ${textClass}`}>Year {row.year}</td>
                        <td className={`px-4 py-3 font-bold ${textClass}`}>{formatCurrency(row.totalPayment)}</td>
                        <td className="px-4 py-3 text-green-700 dark:text-green-400 font-medium">{formatCurrency(row.principal)}</td>
                        <td className="px-4 py-3 text-red-600 dark:text-red-400 font-medium">{formatCurrency(row.interest)}</td>
                        
                        {activeTab === 'combined' && (
                            <>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{formatCurrency(row.tax)}</td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{formatCurrency(row.insurance)}</td>
                                <td className="px-4 py-3 text-orange-500 dark:text-orange-400 hidden md:table-cell font-medium">{row.customExpenses > 0 ? formatCurrency(row.customExpenses) : '-'}</td>
                            </>
                        )}
                        
                        <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-semibold">
                            {row.extra > 0 ? formatCurrency(row.extra) : '-'}
                        </td>
                        <td className="px-4 py-3 text-cyan-600 dark:text-cyan-400 hidden md:table-cell font-mono text-xs font-bold">
                            {formatCurrency(cumRefund)}
                        </td>
                        
                        {activeTab === 'combined' && (
                            <>
                                <td className="px-4 py-3 text-purple-600 dark:text-purple-400 hidden md:table-cell font-bold">
                                    {formatCurrency(row.investmentBalance)}
                                </td>
                                <td className="px-4 py-3 text-gray-400 dark:text-gray-500 hidden md:table-cell font-mono text-xs">
                                    {row.investmentTax > 0 ? formatCurrency(row.investmentTax) : '-'}
                                </td>
                            </>
                        )}
                        
                        {/* Individual Loan Balances (Annual) */}
                        {activeTab === 'combined' && scenario.additionalLoans.map(l => (
                            <td key={l.id} className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 hidden sm:table-cell text-xs font-mono font-medium">
                                {formatCurrency(row.subLoanBalances[l.id] || 0)}
                            </td>
                        ))}

                        <td className={`px-4 py-3 text-right font-bold ${textClass}`}>
                            {formatCurrency(row.endBalance)}
                        </td>
                        </tr>
                    );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className={`p-4 border-t flex flex-wrap gap-6 justify-between text-sm ${headerBg} ${borderClass}`}>
          <div className="flex gap-6">
            <div>
              <span className={`${subTextClass} block text-xs`}>Total Interest</span>
              <span className={`font-bold ${textClass}`}>
                  {activeTab === 'combined' ? formatCurrency(calculated.totalInterest) : 
                    activeSchedule && activeSchedule.length > 0 ? formatCurrency(activeSchedule[activeSchedule.length - 1].totalInterest) : '$0'}
              </span>
            </div>
            <div>
              <span className={`${subTextClass} block text-xs`}>Total Paid</span>
              <span className={`font-bold ${textClass}`}>
                   {activeTab === 'combined' ? formatCurrency(calculated.totalPaid) : 
                    activeSchedule && activeSchedule.length > 0 ? formatCurrency(activeSchedule[activeSchedule.length - 1].totalPaidToDate) : '$0'}
              </span>
            </div>
            {activeTab === 'combined' && (
                <>
                    <div>
                    <span className={`${subTextClass} block text-xs`}>Total Equity</span>
                    <span className={`font-bold text-green-600 dark:text-green-400`}>{formatCurrency(calculated.totalEquityBuilt)}</span>
                    </div>
                    {calculated.investmentPortfolio > 0 && (
                    <div>
                    <span className={`${subTextClass} block text-xs`}>Investment Portfolio</span>
                    <span className={`font-bold text-purple-600 dark:text-purple-400`}>{formatCurrency(calculated.investmentPortfolio)}</span>
                    </div>
                    )}
                </>
            )}
          </div>
          <button 
             onClick={onClose}
             className={`px-6 py-2 border rounded-lg font-medium text-xs transition-colors ${theme === 'light' ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-neutral-800 border-gray-600 text-gray-200 hover:bg-neutral-700'}`}
          >
             Close
          </button>
        </div>
      </div>
    </div>
  );
};
