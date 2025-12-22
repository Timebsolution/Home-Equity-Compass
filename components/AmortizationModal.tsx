

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Label,
  ReferenceLine
} from 'recharts';
import { LoanScenario, CalculatedLoan } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Theme, ComparisonMetric } from '../App';

interface ComparisonChartsProps {
  scenarios: LoanScenario[];
  calculatedData: CalculatedLoan[];
  theme: Theme;
  comparisonMetric: ComparisonMetric;
}

const CustomTooltip = ({ active, payload, label, theme }: any) => {
  if (active && payload && payload.length) {
    const isDark = theme !== 'light';
    
    // Explicit inline style to ensure solid opacity
    const tooltipStyle: React.CSSProperties = {
        backgroundColor: isDark ? '#0f172a' : '#ffffff', // slate-900 : white
        borderColor: isDark ? '#334155' : '#e5e7eb',
        opacity: 1
    };
    
    const textClass = isDark ? 'text-gray-100' : 'text-gray-900';
    
    // Sort payload so positives are first, then negatives
    const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

    // Calculate Net (Total Height)
    const total = payload.reduce((sum: number, item: any) => sum + item.value, 0);

    return (
      <div 
        className={`p-3 rounded-xl shadow-2xl border ${textClass} text-xs min-w-[200px]`}
        style={tooltipStyle}
      >
        <p className="font-bold mb-2 text-sm border-b border-dashed border-gray-400/30 pb-1">{label}</p>
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {sortedPayload.map((entry: any, index: number) => {
             // Skip near-0 values
             if (Math.abs(entry.value) < 1) return null;
             return (
                <div key={index} className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color || entry.fill || entry.stroke }} />
                    <span className="opacity-80 font-medium">{entry.name}</span>
                </div>
                <span className={`font-mono font-bold ${entry.value < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{formatCurrency(entry.value)}</span>
                </div>
             );
          })}
        </div>
        {/* Total Summary Line */}
        <div className="mt-2 pt-2 border-t border-gray-400/30 flex justify-between items-center">
            <span className="font-bold opacity-70">Net Profit / Wealth</span>
            <span className={`font-mono font-extrabold ${total >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(total)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const ComparisonCharts: React.FC<ComparisonChartsProps> = ({ scenarios, calculatedData, theme, comparisonMetric }) => {
  
  // Bar Chart Data (Cash Flow -> Asset Value)
  const compositionData = scenarios.map(s => {
      const c = calculatedData.find(cd => cd.id === s.id);
      if (!c) return { name: s.name };
      
      // --- INFLOWS / ASSETS (Positive Stack) ---
      
      // 1. Home Appreciation (Growth only)
      const appreciation = c.totalAppreciation;
      
      // 2. Investment Gains (Profit Only)
      // This is Gross Growth - Tax. (Net Gain)
      const invGain = Math.max(0, c.investmentPortfolio - c.totalInvestmentContribution - (c.initialCapitalBase || 0));
      
      // 3. Rental Income
      const rentIncome = c.accumulatedRentalIncome;
      
      // 4. Tax Refunds
      const taxRefund = c.taxRefund;

      // 5. Principal Paid (Equity Acquired)
      const principalAcquired = c.principalPaid;

      // 6. Investment Contributions (Basis Acquired)
      const invBasis = c.totalInvestmentContribution + (c.initialCapitalBase || 0);

      // --- OUTFLOWS / COSTS (Negative Stack) ---
      
      // 1. Mortgage Interest
      const interest = -c.totalInterest;
      
      // 2. Property Upkeep (Taxes, Ins, HOA, PMI, Maint)
      const upkeep = -(c.totalPropertyCosts + c.totalCustomExpenses);

      // 3. Transaction Costs (Closing, Selling, Loan Fees)
      const transaction = -(
          (s.closingCosts || 0) + 
          (s.customClosingCosts?.reduce((a,b)=>a+b.amount,0)||0) + 
          c.totalLoanFees + 
          c.sellingCosts
      );

      // 4. Taxes (Capital Gains, Rental)
      // NOTE: Removed InvestmentTax because it is already deducted from the Investment Gain (Net Gain).
      // Including it here would double count the penalty.
      const taxes = -(c.capitalGainsTax + (c.totalRentalTax || 0));
      
      // 5. Principal Payment (Cash Outflow)
      const principalOutflow = -c.principalPaid;

      // 6. Investment Contribution (Cash Outflow)
      const invOutflow = -(c.totalInvestmentContribution + (c.initialCapitalBase || 0));
      
      return {
          name: s.name,
          // Gains / Assets
          principalAcquired,
          invBasis,
          appreciation,
          invGain,
          rentIncome,
          taxRefund,
          
          // Costs / Outflows
          principalOutflow,
          invOutflow,
          interest,
          upkeep,
          transaction,
          taxes
      };
  });

  // Line Chart Data (Dynamic based on Metric)
  const primaryScenario = calculatedData[0];
  const lineChartData = primaryScenario?.annualData.map((point, index) => {
      const chartPoint: any = { label: point.label };
      
      scenarios.forEach(s => {
          const c = calculatedData.find(cd => cd.id === s.id);
          if (c && c.annualData[index]) {
              if (comparisonMetric === 'profit') {
                  chartPoint[s.name] = c.annualData[index].netProfit;
              } else if (comparisonMetric === 'netWorth') {
                  chartPoint[s.name] = c.annualData[index].netWorth;
              } else if (comparisonMetric === 'equity') {
                  chartPoint[s.name] = c.annualData[index].homeEquity || 0;
              } else if (comparisonMetric === 'outOfPocket') {
                  chartPoint[s.name] = -(c.annualData[index].outOfPocket || 0);
              } else if (comparisonMetric === 'cashFlow') {
                  // For Cash Flow, we add TWO keys per scenario to split line
                  chartPoint[`${s.name} Inflow`] = c.annualData[index].cumulativeInflow;
                  chartPoint[`${s.name} Outflow`] = -c.annualData[index].cumulativeOutflow; // Flip to negative
              } else {
                  chartPoint[s.name] = -(c.annualData[index].netCost);
              }
          }
      });
      return chartPoint;
  }) || [];

  const isDark = theme !== 'light';
  const textColor = isDark ? '#e5e7eb' : '#374151'; 
  const gridColor = isDark ? '#404040' : '#f3f4f6'; 
  const tooltipBg = isDark ? '#0a0a0a' : '#ffffff';

  let chartTitle = "Net Worth Trajectory";
  let chartSubtitle = "Total Assets (Home Equity + Investments) Over Time.";
  let yAxisLabel = "Net Worth ($)";

  if (comparisonMetric === 'profit') {
      chartTitle = "Net Profit / Loss Trajectory";
      chartSubtitle = "Accumulated Wealth Generated minus Costs incurred.";
      yAxisLabel = "Net Profit ($)";
  } else if (comparisonMetric === 'equity') {
      chartTitle = "Home Equity Accumulation";
      chartSubtitle = "Total Property Equity (Market Value - Loan Balance).";
      yAxisLabel = "Equity ($)";
  } else if (comparisonMetric === 'netCost') {
      chartTitle = "Cumulative True Cost Trajectory";
      chartSubtitle = "Net Cost Incurred (After Equity/Sales).";
      yAxisLabel = "Cost (Negative = Drain)";
  } else if (comparisonMetric === 'outOfPocket') {
      chartTitle = "Cumulative Cash Out-of-Pocket";
      chartSubtitle = "Total Cash Paid Over Time.";
      yAxisLabel = "Cash Paid (Negative)";
  } else if (comparisonMetric === 'cashFlow') {
      chartTitle = "Inflow vs Outflow";
      chartSubtitle = "Solid: Cumulative Income/Assets. Dashed: Cumulative Expenses/Costs.";
      yAxisLabel = "Cumulative Value ($)";
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
      
      {/* Line Chart */}
      <div className={`p-6 rounded-2xl shadow-lg border flex flex-col ${theme === 'light' ? 'bg-white border-gray-100' : 'bg-white/5 border-gray-700'}`}>
        <h3 className={`text-lg font-bold mb-1 ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>{chartTitle}</h3>
        <p className="text-xs text-gray-500 mb-4">{chartSubtitle}</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 12, fill: textColor}} 
                label={{ value: 'Timeline', position: 'insideBottomRight', offset: -5, fill: textColor, fontSize: 10 }}
              />
              <YAxis 
                tickFormatter={(val) => `${val < 0 ? '-' : ''}$${Math.abs(val)/1000}k`} 
                axisLine={false} 
                tickLine={false} 
                domain={['auto', 'auto']}
                tick={{fontSize: 12, fill: textColor}} 
              >
                 <Label value={yAxisLabel} angle={-90} position="insideLeft" fill={textColor} fontSize={10} />
              </YAxis>
              <Tooltip 
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                labelFormatter={(label) => `${label}`}
                cursor={{stroke: textColor}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: tooltipBg, color: isDark ? 'white' : 'black'}}
                wrapperStyle={{ zIndex: 1000 }}
              />
              <Legend wrapperStyle={{color: textColor}} />
              <ReferenceLine y={0} stroke={textColor} strokeWidth={1} strokeOpacity={0.5} />
              
              {scenarios.map(s => {
                  if (comparisonMetric === 'cashFlow') {
                       return (
                           <React.Fragment key={s.id}>
                               <Line 
                                    type="monotone" 
                                    dataKey={`${s.name} Inflow`} 
                                    name={`${s.name} (In)`}
                                    stroke={s.color} 
                                    strokeWidth={2} 
                                    dot={false} 
                                    activeDot={{ r: 4 }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey={`${s.name} Outflow`} 
                                    name={`${s.name} (Out)`}
                                    stroke={s.color} 
                                    strokeWidth={2} 
                                    strokeDasharray="4 4" // Dashed for Expenses/Outflows
                                    dot={false} 
                                    activeDot={{ r: 4 }}
                                />
                           </React.Fragment>
                       );
                  }
                  return (
                    <Line 
                        key={s.id} 
                        type="monotone" 
                        dataKey={s.name} 
                        stroke={s.color} 
                        strokeWidth={3} 
                        dot={false} 
                        activeDot={{ r: 6 }}
                    />
                  );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart: Profit Breakdown */}
      <div className={`p-6 rounded-2xl shadow-lg border flex flex-col ${theme === 'light' ? 'bg-white border-gray-100' : 'bg-white/5 border-gray-700'}`}>
        <h3 className={`text-lg font-bold mb-1 ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>Flows of Wealth</h3>
        <p className="text-xs text-gray-500 mb-4">
            Top: Assets & Income (Gains). Bottom: Expenses & Outflows.
            <br/>
            <span className="opacity-70 italic">Net Height Difference = Total Profit Generated.</span>
        </p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {/* stackOffset="sign" ensures negative values render below zero axis */}
            <BarChart data={compositionData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: textColor}} />
              <YAxis tickFormatter={(val) => `${val < 0 ? '-' : ''}$${Math.abs(val)/1000}k`} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: textColor}} />
              <Tooltip 
                content={<CustomTooltip theme={theme} />}
                cursor={{fill: isDark ? '#404040' : '#f9fafb'}}
                wrapperStyle={{ zIndex: 1000 }}
              />
              <Legend wrapperStyle={{color: textColor}} />
              
              <ReferenceLine y={0} stroke={textColor} strokeOpacity={0.8} strokeWidth={2} />

              {/* POSITIVE STACK (INFLOWS / ASSETS) */}
              <Bar dataKey="appreciation" name="Home Appreciation" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="principalAcquired" name="Principal Paid (Equity)" stackId="a" fill="#2dd4bf" radius={[0, 0, 0, 0]} />
              <Bar dataKey="invBasis" name="Inv. Basis (Principal)" stackId="a" fill="#c084fc" radius={[0, 0, 0, 0]} />
              <Bar dataKey="invGain" name="Investment Gains" stackId="a" fill="#a855f7" radius={[0, 0, 0, 0]} />
              <Bar dataKey="rentIncome" name="Rental Income" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="taxRefund" name="Tax Refunds" stackId="a" fill="#06b6d4" radius={[4, 4, 0, 0]} />

              {/* NEGATIVE STACK (OUTFLOWS / COSTS) */}
              <Bar dataKey="interest" name="Mortgage Interest" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey="upkeep" name="Prop. Taxes & Maint" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
              <Bar dataKey="taxes" name="Inc/CapGains Tax" stackId="a" fill="#b91c1c" radius={[0, 0, 0, 0]} />
              <Bar dataKey="transaction" name="Closing/Selling Fees" stackId="a" fill="#64748b" radius={[0, 0, 0, 0]} />
              
              {/* Transfers (Outflows matching Assets) */}
              <Bar dataKey="principalOutflow" name="Principal Cost" stackId="a" fill="#115e59" radius={[0, 0, 0, 0]} />
              <Bar dataKey="invOutflow" name="Inv. Contribution" stackId="a" fill="#581c87" radius={[0, 0, 4, 4]} />
              
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
