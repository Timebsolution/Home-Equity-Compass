
import React from 'react';
import { TrendingUp, Wallet, Landmark, PiggyBank, Trophy, Percent, ShieldCheck, Banknote, Home } from 'lucide-react';
import { LoanScenario, CalculatedLoan } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Theme } from '../App';

interface VerdictSummaryProps {
  scenarios: LoanScenario[];
  calculatedData: CalculatedLoan[];
  theme: Theme;
}

const VerdictCard = ({ 
    label, 
    value, 
    scenarioName, 
    color, 
    icon, 
    subLabel,
    theme,
    alertColor
}: { 
    label: string, 
    value: string, 
    scenarioName: string, 
    color: string, 
    icon: React.ReactNode, 
    subLabel?: string,
    theme: Theme,
    alertColor?: string
}) => {
    const cardBg = theme === 'light' ? 'bg-white border-gray-200' : 'bg-white/5 border-gray-700';
    const textClass = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
    const subTextClass = theme === 'light' ? 'text-gray-500' : 'text-gray-400';

    return (
        <div className={`p-4 rounded-xl border shadow-sm flex flex-col gap-3 ${cardBg} relative overflow-hidden group`}>
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: alertColor || color }}></div>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-gray-800 text-gray-300'}`}>
                        {icon}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${subTextClass}`}>{label}</span>
                </div>
            </div>
            <div>
                <div className={`text-lg font-bold truncate mb-0.5 ${textClass}`} style={{ color: alertColor || color }}>
                    {scenarioName}
                </div>
                <div className={`text-2xl font-extrabold ${textClass}`}>
                    {value}
                </div>
                {subLabel && <div className={`text-xs mt-1 ${subTextClass}`}>{subLabel}</div>}
            </div>
        </div>
    );
};

export const VerdictSummary: React.FC<VerdictSummaryProps> = ({ scenarios, calculatedData, theme }) => {
    if (scenarios.length === 0 || calculatedData.length === 0) return null;

    // Helper to find winner
    const findWinner = (fn: (c: CalculatedLoan) => number, mode: 'max' | 'min') => {
        let best = calculatedData[0];
        let bestVal = fn(best);

        calculatedData.forEach(c => {
            const val = fn(c);
            if (mode === 'max' ? val > bestVal : val < bestVal) {
                best = c;
                bestVal = val;
            }
        });
        const scenario = scenarios.find(s => s.id === best.id);
        return { scenario, calculated: best, value: bestVal };
    };

    const bestProfit = findWinner(c => c.profit, 'max');
    const bestNetWorth = findWinner(c => c.netWorth, 'max');
    const bestROI = findWinner(c => c.effectiveAnnualReturn, 'max');
    const lowestCost = findWinner(c => c.netCost, 'min');
    const lowestOOP = findWinner(c => c.totalInvestedAmount, 'min');
    const lowestMonthly = findWinner(c => c.netMonthlyPayment, 'min');

    // Strategy Comparison: Investment (Rent/Pure) vs Equity (Buy/Refi)
    const investmentStrategies = calculatedData.filter(c => {
        const s = scenarios.find(sc => sc.id === c.id);
        return s?.isInvestmentOnly || s?.isRentOnly;
    });
    
    const equityStrategies = calculatedData.filter(c => {
        const s = scenarios.find(sc => sc.id === c.id);
        return !s?.isInvestmentOnly && !s?.isRentOnly;
    });

    // Find best of each class
    const bestInvest = investmentStrategies.sort((a,b) => b.netWorth - a.netWorth)[0];
    const bestEquity = equityStrategies.sort((a,b) => b.netWorth - a.netWorth)[0];

    let strategyInsight = null;
    if (bestInvest && bestEquity) {
        const diff = bestInvest.netWorth - bestEquity.netWorth;
        const winner = diff > 0 ? bestInvest : bestEquity;
        const sName = scenarios.find(s => s.id === winner.id)?.name || "";
        const strategyName = diff > 0 ? "Investing Strategy" : "Equity Strategy";
        const msg = `${strategyName} Wins by ${formatCurrency(Math.abs(diff))}`;
        
        strategyInsight = {
            title: "Strategy Insight",
            value: msg,
            sub: `Comparing Net Worth: ${sName} vs ${diff > 0 ? scenarios.find(s=>s.id===bestEquity.id)?.name : scenarios.find(s=>s.id===bestInvest.id)?.name}`,
            color: diff > 0 ? '#a855f7' : '#22c55e', // Purple for Invest, Green for Equity
            icon: diff > 0 ? <TrendingUp size={16} /> : <Home size={16} />
        };
    }

    const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';
    const subText = theme === 'light' ? 'text-gray-500' : 'text-gray-400';

    return (
        <div className="mt-12 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1.5 bg-yellow-500 rounded-full"></div>
                <div>
                    <h2 className={`text-2xl font-bold ${textColor}`}>Final Verdict</h2>
                    <p className={`${subText} text-sm`}>Performance summary across key financial metrics.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {strategyInsight && (
                    <VerdictCard 
                        label={strategyInsight.title}
                        value={strategyInsight.value}
                        scenarioName={strategyInsight.value.split(" Wins")[0]} // Hacky visual
                        color={strategyInsight.color}
                        icon={strategyInsight.icon}
                        subLabel={strategyInsight.sub}
                        theme={theme}
                        alertColor={strategyInsight.color}
                    />
                )}

                <VerdictCard 
                    label="Best Profit"
                    value={formatCurrency(bestProfit.value)}
                    scenarioName={bestProfit.scenario?.name || ''}
                    color={bestProfit.scenario?.color || '#ccc'}
                    icon={<TrendingUp size={16} />}
                    subLabel="Highest Wealth Generated"
                    theme={theme}
                />
                <VerdictCard 
                    label="Highest Net Worth"
                    value={formatCurrency(bestNetWorth.value)}
                    scenarioName={bestNetWorth.scenario?.name || ''}
                    color={bestNetWorth.scenario?.color || '#ccc'}
                    icon={<Landmark size={16} />}
                    subLabel="Equity + Investments"
                    theme={theme}
                />
                <VerdictCard 
                    label="Best Annual Return"
                    value={`${bestROI.value.toFixed(1)}%`}
                    scenarioName={bestROI.scenario?.name || ''}
                    color={bestROI.scenario?.color || '#ccc'}
                    icon={<Percent size={16} />}
                    subLabel="Return on Cash Invested"
                    theme={theme}
                />
                <VerdictCard 
                    label="Lowest True Cost"
                    value={formatCurrency(lowestCost.value)}
                    scenarioName={lowestCost.scenario?.name || ''}
                    color={lowestCost.scenario?.color || '#ccc'}
                    icon={<ShieldCheck size={16} />}
                    subLabel="Net Cost after Sale"
                    theme={theme}
                />
                <VerdictCard 
                    label="Lowest Out-of-Pocket"
                    value={formatCurrency(lowestOOP.value)}
                    scenarioName={lowestOOP.scenario?.name || ''}
                    color={lowestOOP.scenario?.color || '#ccc'}
                    icon={<Wallet size={16} />}
                    subLabel="Least Cash Required"
                    theme={theme}
                />
                <VerdictCard 
                    label="Lowest Monthly Payment"
                    value={formatCurrency(lowestMonthly.value)}
                    scenarioName={lowestMonthly.scenario?.name || ''}
                    color={lowestMonthly.scenario?.color || '#ccc'}
                    icon={<Banknote size={16} />}
                    subLabel="Best Cash Flow"
                    theme={theme}
                />
                
            </div>
        </div>
    );
};
