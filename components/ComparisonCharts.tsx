
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
  Line
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
  
  // Data for Profit / Net Worth Stack
  const profitData = scenarios.map(s => {
      const c = calculatedData.find(cd => cd.id === s.id);
      
      let houseEquity = 0;
      let returnedCapital = 0;
      let investmentPortfolio = 0;

      if (s.isInvestmentOnly) {
          investmentPortfolio = c?.netWorth || 0;
      } else if (s.isRentOnly) {
          investmentPortfolio = c?.netWorth || 0; // Rent mode net worth is pure investment
      } else {
          houseEquity = c?.profit || 0;
          returnedCapital = s.downPayment;
          investmentPortfolio = c?.investmentPortfolio || 0;
      }

      return {
          name: s.name,
          houseEquity,
          returnedCapital,
          investmentPortfolio,
          color: s.color
      };
  });

  // Data for Line Chart (Wealth Trajectory)
  const maxYears = Math.max(...calculatedData.map(c => c.annualData.length));
  const lineChartData = [];
  
  for (let i = 0; i < maxYears; i++) {
      const point: any = { year: i + 1 };
      scenarios.forEach(s => {
          const c = calculatedData.find(cd => cd.id === s.id);
          if (c && c.annualData[i]) {
              point[s.name] = c.annualData[i].netWorth;
          }
      });
      lineChartData.push(point);
  }

  // Data for Net Cost Comparison
  const costData = scenarios.map(s => {
      const c = calculatedData.find(cd => cd.id === s.id);
      return {
          name: s.name,
          netCost: Math.abs(c?.netCost || 0), // Show as positive bar
          color: s.color
      };
  });

  const isDark = theme !== 'light';
  const textColor = isDark ? '#e5e7eb' : '#374151'; 
  const gridColor = isDark ? '#374151' : '#f3f4f6'; 
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
      
      {/* Wealth Trajectory (Line Chart) */}
      <div className={`p-6 rounded-2xl shadow-lg border flex flex-col ${theme === 'light' ? 'bg-white border-gray-100' : 'bg-white/5 border-gray-700'}`}>
        <h3 className={`text-lg font-bold mb-6 ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>Wealth Trajectory</h3>
        <p className="text-xs text-gray-500 mb-4">Net Worth growth over time (Equity + Investments).</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: textColor}} />
              <YAxis tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: textColor}} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)} 
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
                  />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Asset Composition (Stacked Bar) */}
      <div className={`p-6 rounded-2xl shadow-lg border flex flex-col ${theme === 'light' ? 'bg-white border-gray-100' : 'bg-white/5 border-gray-700'}`}>
        <h3 className={`text-lg font-bold mb-6 ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>Asset Composition</h3>
        <p className="text-xs text-gray-500 mb-4">Breakdown of Home Equity vs Side Investment Portfolio.</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profitData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: textColor}} />
              <YAxis tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: textColor}} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)} 
                cursor={{fill: isDark ? '#374151' : '#f9fafb'}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: tooltipBg, color: isDark ? 'white' : 'black'}}
              />
              <Legend wrapperStyle={{color: textColor}} />
              <Bar dataKey="returnedCapital" name="Returned Capital" stackId="a" fill="#818cf8" radius={[0, 0, 0, 0]} />
              <Bar dataKey="houseEquity" name="Home Equity Gain" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
              <Bar dataKey="investmentPortfolio" name="Investment Portfolio" stackId="a" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
