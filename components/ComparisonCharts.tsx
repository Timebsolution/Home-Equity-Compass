
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
  Label
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
    const bgClass = isDark ? 'bg-neutral-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900';
    
    // Filter out zero values to clean up the tooltip
    const items = payload.filter((p: any) => Math.abs(p.value) > 0);
    const total = items.reduce((sum: number, item: any) => sum + item.value, 0);

    if (items.length === 0) return null;

    return (
      <div className={`p-3 rounded-xl shadow-2xl border ${bgClass} text-xs z-50 min-w-[200px]`}>
        <p className="font-bold mb-2 text-sm border-b border-dashed border-gray-400/30 pb-1">{label}</p>
        <div className="space-y-1.5">
          {items.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                <span className="opacity-80 font-medium">{entry.name}</span>
              </div>
              <span className="font-mono font-bold">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
        {/* Total Summary Line */}
        <div className="mt-2 pt-2 border-t border-gray-400/30 flex justify-between items-center">
            <span className="font-bold opacity-70">Total Wealth</span>
            <span className="font-mono font-extrabold text-brand-500">{formatCurrency(total)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const ComparisonCharts: React.FC<ComparisonChartsProps> = ({ scenarios, calculatedData, theme, comparisonMetric }) => {
  
  // Bar Chart Data (Composition of Wealth)
  const compositionData = scenarios.map(s => {
      const c = calculatedData.find(cd => cd.id === s.id);
      if (!c) return { name: s.name };
      
      // For Buy/Refi, we hide "Initial Capital" (Side Investment Principal) from the stack
      // to prevent the visual confusion of "Double Counting" side cash as housing equity.
      const initialCapital = (s.isRentOnly || s.isInvestmentOnly) ? c.totalInvestmentContribution : 0;
      
      const downPayment = (!s.isRentOnly && !s.isInvestmentOnly) ? (s.downPayment || 0) : 0;
      const principalPaid = (!s.isRentOnly && !s.isInvestmentOnly) ? c.principalPaid : 0;
      const appreciation = (!s.isRentOnly && !s.isInvestmentOnly) ? c.totalAppreciation : 0;
      const taxRefund = (!s.isRentOnly && !s.isInvestmentOnly) ? c.taxRefund : 0;
      const rawRentalIncome = (!s.isRentOnly && !s.isInvestmentOnly) ? (c.accumulatedRentalIncome - (c.totalRentalTax || 0)) : 0;
      const rentalIncome = Math.max(0, rawRentalIncome);
      
      // Investment Profit is shown for Investment/Rent modes.
      // For Buy modes, it is hidden from the main stack to keep the view "Housing Focused".
      let investmentProfit = 0;
      if (s.isInvestmentOnly || s.isRentOnly) {
          investmentProfit = c.profit;
      } else {
          investmentProfit = 0; 
      }

      return {
          name: s.name,
          initialCapital,
          downPayment,
          principalPaid,
          appreciation,
          taxRefund,
          rentalIncome,
          investmentProfit
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
                  // Plots Profit / Loss (negative allowed for Rent)
                  chartPoint[s.name] = c.annualData[index].totalGain;
              } else if (comparisonMetric === 'netWorth') {
                  chartPoint[s.name] = c.annualData[index].netWorth;
              } else {
                  // Plot NEGATIVE cost to show "drain" / outflow
                  chartPoint[s.name] = -c.annualData[index].netCost;
              }
          }
      });
      return chartPoint;
  }) || [];

  const isDark = theme !== 'light';
  const textColor = isDark ? '#e5e7eb' : '#374151'; 
  const gridColor = isDark ? '#404040' : '#f3f4f6'; 
  const tooltipBg = isDark ? '#171717' : '#ffffff';

  let chartTitle = "Net Worth Trajectory";
  let chartSubtitle = "Total Assets (Home Equity + Investments) Over Time.";
  let yAxisLabel = "Net Worth ($)";

  if (comparisonMetric === 'profit') {
      chartTitle = "Net Profit / Loss Trajectory";
      chartSubtitle = "Accumulated Wealth Generated minus Costs incurred.";
      yAxisLabel = "Net Profit ($)";
  } else if (comparisonMetric === 'netCost') {
      chartTitle = "Cumulative Cost Trajectory";
      chartSubtitle = "Total Net Cost Incurred Over Time.";
      yAxisLabel = "Cost (Negative = Outflow)";
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
                tickFormatter={(val) => `$${val/1000}k`} 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 12, fill: textColor}} 
              >
                 <Label value={yAxisLabel} angle={-90} position="insideLeft" fill={textColor} fontSize={10} />
              </YAxis>
              <Tooltip 
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                labelFormatter={(label) => `${label}`}
                cursor={{stroke: textColor}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: tooltipBg, color: isDark ? 'white' : 'black'}}
              />
              <Legend wrapperStyle={{color: textColor}} />
              {scenarios.map(s => (
                  <Line 
                    key={s.id} 
                    type="monotone" 
                    dataKey={s.name} 
                    stroke={s.color} 
                    strokeWidth={3} 
                    dot={false} 
                    activeDot={{ r: 6 }}
                  />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart: Wealth Breakdown */}
      <div className={`p-6 rounded-2xl shadow-lg border flex flex-col ${theme === 'light' ? 'bg-white border-gray-100' : 'bg-white/5 border-gray-700'}`}>
        <h3 className={`text-lg font-bold mb-1 ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>Total Wealth Breakdown</h3>
        <p className="text-xs text-gray-500 mb-4">Composition of Assets & Accumulated Cash Benefits.</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compositionData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: textColor}} />
              <YAxis tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: textColor}} />
              <Tooltip 
                content={<CustomTooltip theme={theme} />}
                cursor={{fill: isDark ? '#404040' : '#f9fafb'}}
              />
              <Legend wrapperStyle={{color: textColor}} />
              
              <Bar dataKey="initialCapital" name="Side Invest. Principal" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="downPayment" name="Down Payment (Equity)" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
              <Bar dataKey="principalPaid" name="Principal Paid" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
              <Bar dataKey="appreciation" name="Appreciation" stackId="a" fill="#14b8a6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="investmentProfit" name="Investment Growth" stackId="a" fill="#a855f7" radius={[0, 0, 0, 0]} />
              <Bar dataKey="taxRefund" name="Tax Refunds" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
              <Bar dataKey="rentalIncome" name="Rental Income (Net)" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
