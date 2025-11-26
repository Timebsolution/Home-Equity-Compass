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
import { Theme } from '../App';

interface ComparisonChartsProps {
  scenarios: LoanScenario[];
  calculatedData: CalculatedLoan[];
  theme: Theme;
}

export const ComparisonCharts: React.FC<ComparisonChartsProps> = ({ scenarios, calculatedData, theme }) => {
  
  // Data for Asset Composition (Stacked Bar)
  const compositionData = scenarios.map(s => {
      const c = calculatedData.find(cd => cd.id === s.id);
      if (!c) return { name: s.name };
      
      // 1. Initial Capital Logic
      // STRICT FIX: Only "Pure Investment" shows Initial Capital (Total Portfolio Value).
      // Buy/Rent scenarios show 0 for Initial Capital so the bar represents "Wealth Generated" (Net Gain).
      let initialCapital = 0;
      if (s.isInvestmentOnly) {
          initialCapital = c.totalInvestmentContribution;
      }

      // 2. Principal Paid (Amortized Equity)
      const principalPaid = (!s.isRentOnly && !s.isInvestmentOnly) ? c.principalPaid : 0;

      // 3. Appreciation (Market Gain)
      const appreciation = (!s.isRentOnly && !s.isInvestmentOnly) ? c.totalAppreciation : 0;

      // 4. Tax Refunds (Strict Tax Refund Only)
      const taxRefund = (!s.isRentOnly && !s.isInvestmentOnly) ? c.taxRefund : 0;
      
      // 5. Rental Income (Net of Tax)
      // Safety: Ensure we don't display negative bars if tax calc is weird, though it shouldn't be with the main fix.
      const rawRentalIncome = (!s.isRentOnly && !s.isInvestmentOnly) ? (c.accumulatedRentalIncome - (c.totalRentalTax || 0)) : 0;
      const rentalIncome = Math.max(0, rawRentalIncome);
      
      // 6. Investment Profit (Side Portfolio Gain)
      let investmentProfit = 0;
      if (s.isInvestmentOnly || s.isRentOnly) {
          investmentProfit = c.profit;
      } else {
          // For Buy mode, profit is Value - Contribution
          investmentProfit = Math.max(0, c.investmentPortfolio - c.totalInvestmentContribution);
      }

      return {
          name: s.name,
          initialCapital,
          principalPaid,
          appreciation,
          taxRefund,
          rentalIncome,
          investmentProfit,
          // Helper for total top label if needed
          total: initialCapital + principalPaid + appreciation + taxRefund + rentalIncome + investmentProfit
      };
  });

  // Data for Line Chart (Strictly TOTAL GAIN Trajectory)
  // Use data from the first calculated scenario to establish X-axis labels (labels are standardized in calc logic)
  const primaryScenario = calculatedData[0];
  const lineChartData = primaryScenario?.annualData.map((point, index) => {
      const chartPoint: any = { label: point.label };
      
      scenarios.forEach(s => {
          const c = calculatedData.find(cd => cd.id === s.id);
          if (c && c.annualData[index]) {
              chartPoint[s.name] = c.annualData[index].totalGain;
          }
      });
      return chartPoint;
  }) || [];

  const isDark = theme !== 'light';
  const textColor = isDark ? '#e5e7eb' : '#374151'; 
  const gridColor = isDark ? '#404040' : '#f3f4f6'; 
  const tooltipBg = isDark ? '#171717' : '#ffffff';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
      
      {/* Wealth Trajectory (Line Chart) - Uses TOTAL GAIN */}
      <div className={`p-6 rounded-2xl shadow-lg border flex flex-col ${theme === 'light' ? 'bg-white border-gray-100' : 'bg-white/5 border-gray-700'}`}>
        <h3 className={`text-lg font-bold mb-6 ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>Total Gain Trajectory</h3>
        <p className="text-xs text-gray-500 mb-4">Cumulative Wealth Generated Over Time (Profit). <br/>Includes Equity Gains, Tax Refunds, Rental Income, and Investment Growth.</p>
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
                 <Label value="Total Gain ($)" angle={-90} position="insideLeft" fill={textColor} fontSize={10} />
              </YAxis>
              <Tooltip 
                formatter={(value: number, name: string) => [formatCurrency(value), 'Total Gain']}
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

      {/* Asset Composition (Stacked Bar) - Correct Buckets */}
      <div className={`p-6 rounded-2xl shadow-lg border flex flex-col ${theme === 'light' ? 'bg-white border-gray-100' : 'bg-white/5 border-gray-700'}`}>
        <h3 className={`text-lg font-bold mb-6 ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>Total Wealth Breakdown</h3>
        <p className="text-xs text-gray-500 mb-4">Composition of Assets & Accumulated Cash Benefits.</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compositionData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: textColor}} />
              <YAxis tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: textColor}} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)} 
                cursor={{fill: isDark ? '#404040' : '#f9fafb'}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: tooltipBg, color: isDark ? 'white' : 'black'}}
              />
              <Legend wrapperStyle={{color: textColor}} />
              
              {/* STACK ORDER (Bottom to Top) */}
              
              {/* 1. Initial Capital (Blue) - ONLY FOR PURE INVESTMENT */}
              <Bar dataKey="initialCapital" name="Initial Capital" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              
              {/* 2. Principal Paid (Green) */}
              <Bar dataKey="principalPaid" name="Principal Paid" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
              
              {/* 3. Appreciation (Teal) */}
              <Bar dataKey="appreciation" name="Appreciation" stackId="a" fill="#14b8a6" radius={[0, 0, 0, 0]} />
              
              {/* 4. Investment Profit (Purple) */}
              <Bar dataKey="investmentProfit" name="Inv. Profit" stackId="a" fill="#a855f7" radius={[0, 0, 0, 0]} />
              
              {/* 5. Tax Refund (Cyan) */}
              <Bar dataKey="taxRefund" name="Tax Refunds" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
              
              {/* 6. Rental Income (Gold - Top) */}
              <Bar dataKey="rentalIncome" name="Rental Income (Net)" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
