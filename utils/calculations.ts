
import { LoanScenario, CalculatedLoan, AmortizationPoint, AnnualDataPoint } from '../types';

export const calculateLoan = (
  scenario: LoanScenario, 
  horizonYears: number,
  appreciationRate: number,
  investmentReturnRate: number,
  globalCashInvestment: number, // "Starting Capital"
  globalMonthlyContribution: number // "Replenishment Amount"
): CalculatedLoan => {
  const horizonMonths = horizonYears * 12;
  const start = new Date(); 

  // Helper for Investment Calculation
  const getInvestParams = () => {
      if (scenario.isInvestmentOnly) {
          return {
              principal: scenario.investmentCapital ?? globalCashInvestment,
              monthly: scenario.investmentMonthly ?? globalMonthlyContribution,
              rate: scenario.investmentRate ?? investmentReturnRate
          };
      }
      return {
          principal: globalCashInvestment,
          monthly: globalMonthlyContribution,
          rate: investmentReturnRate
      };
  };

  const calculateInvestmentPortfolio = (
    cashUsedForDownAndOneTime: number,
    monthlyExtraUsed: number,
    years: number
  ) => {
      const params = getInvestParams();
      
      const investedPrincipal = Math.max(0, params.principal - cashUsedForDownAndOneTime);
      const investedMonthly = Math.max(0, params.monthly - monthlyExtraUsed);

      const r = params.rate / 100;
      const n = 12; 
      const t = years;
      const totalMonths = t * 12;

      const fvPrincipal = investedPrincipal * Math.pow(1 + r/n, totalMonths);

      let fvSeries = 0;
      if (investedMonthly > 0) {
          if (r === 0) {
              fvSeries = investedMonthly * totalMonths;
          } else {
              fvSeries = investedMonthly * (Math.pow(1 + r/n, totalMonths) - 1) / (r/n);
          }
      }

      const totalContributed = investedPrincipal + (investedMonthly * totalMonths);
      const value = fvPrincipal + fvSeries;

      return { value, totalContributed };
  };

  // --- INVESTMENT ONLY MODE ---
  if (scenario.isInvestmentOnly) {
      const annualData: AnnualDataPoint[] = [];
      const params = getInvestParams();
      
      for (let m = 1; m <= horizonMonths; m++) {
          if (m % 12 === 0) {
              const year = m / 12;
              const inv = calculateInvestmentPortfolio(0, 0, year);
              
              annualData.push({
                  year,
                  homeEquity: 0,
                  returnedCapital: 0,
                  investmentValue: inv.value,
                  netWorth: inv.value,
                  netCost: inv.totalContributed 
              });
          }
      }
      
      const finalInv = calculateInvestmentPortfolio(0, 0, horizonYears);
      
      return {
        id: scenario.id,
        monthlyPrincipalAndInterest: 0,
        monthlyTax: 0,
        monthlyInsurance: 0,
        monthlyHOA: 0,
        monthlyPMI: 0,
        totalMonthlyPayment: params.monthly,
        
        totalPaid: finalInv.totalContributed,
        totalInterest: 0,
        totalEquityBuilt: 0,
        taxRefund: 0,
        netCost: finalInv.totalContributed, 
        
        futureHomeValue: 0,
        remainingBalance: 0,
        equity: 0,
        
        netWorth: finalInv.value,
        investmentPortfolio: finalInv.value,
        totalInvestmentContribution: finalInv.totalContributed,
        
        profit: finalInv.value - finalInv.totalContributed,
        totalCashInvested: finalInv.totalContributed,
        averageEquityPerMonth: (finalInv.value - finalInv.totalContributed) / horizonMonths,
        totalExtraPrincipal: 0,

        payoffDate: 'N/A',
        amortizationSchedule: [],
        annualData
      };
  }

  // --- RENT MODE ---
  if (scenario.isRentOnly) {
    let totalRentPaid = 0;
    let currentRent = scenario.rentMonthly;
    
    let effectiveMonthlyRent = currentRent;
    if (scenario.rentIncludeTax) {
        effectiveMonthlyRent = currentRent * (1 - scenario.rentTaxRate / 100);
    }

    const annualData: AnnualDataPoint[] = [];
    let accumulatedRentCost = 0;

    for (let m = 1; m <= horizonMonths; m++) {
        totalRentPaid += effectiveMonthlyRent;
        accumulatedRentCost += effectiveMonthlyRent;

        if (m % 12 === 0) {
            effectiveMonthlyRent *= (1 + (scenario.rentIncreasePerYear || 0) / 100);
            const year = m / 12;
            const inv = calculateInvestmentPortfolio(0, 0, year);
            
            annualData.push({
                year,
                homeEquity: 0,
                returnedCapital: 0,
                investmentValue: inv.value,
                netWorth: inv.value,
                netCost: accumulatedRentCost
            });
        }
    }

    const finalInv = calculateInvestmentPortfolio(0, 0, horizonYears);

    return {
        id: scenario.id,
        monthlyPrincipalAndInterest: 0,
        monthlyTax: 0,
        monthlyInsurance: 0,
        monthlyHOA: 0,
        monthlyPMI: 0,
        totalMonthlyPayment: effectiveMonthlyRent, 
        
        totalPaid: totalRentPaid,
        totalInterest: 0,
        totalEquityBuilt: 0,
        taxRefund: 0,
        netCost: totalRentPaid, 
        
        futureHomeValue: 0,
        remainingBalance: 0,
        equity: 0,
        netWorth: finalInv.value, 
        investmentPortfolio: finalInv.value,
        
        profit: Math.max(0, finalInv.value - finalInv.totalContributed),
        totalCashInvested: 0,
        totalInvestmentContribution: finalInv.totalContributed,
        averageEquityPerMonth: 0,
        totalExtraPrincipal: 0,

        payoffDate: 'N/A',
        amortizationSchedule: [],
        annualData
    };
  }

  // --- BUY MODE ---
  
  let balance = scenario.loanAmount;
  const monthlyRate = scenario.interestRate / 100 / 12;
  const totalMonthsRemaining = (scenario.yearsRemaining * 12) + scenario.monthsRemaining;
  
  let monthlyPI = 0;
  if (totalMonthsRemaining > 0) {
      if (monthlyRate === 0) {
          monthlyPI = balance / totalMonthsRemaining;
      } else {
          monthlyPI = balance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonthsRemaining)) / (Math.pow(1 + monthlyRate, totalMonthsRemaining) - 1);
      }
  }

  const monthlyTax = scenario.propertyTax / 12;
  const monthlyIns = scenario.homeInsurance / 12;
  const monthlyHOA = scenario.hoa / 12;
  const monthlyPMI = scenario.pmi / 12;
  
  const schedule: AmortizationPoint[] = [];
  const annualData: AnnualDataPoint[] = [];
  
  let accumulatedInterest = 0;
  let accumulatedPaid = 0;
  let accumulatedEquity = 0;
  let accumulatedTaxRefund = 0;
  let accumulatedRentIncome = 0; // NEW: Track rent for Buy Mode
  
  // Rent Income Logic for Buy Mode
  let currentRentIncome = scenario.rentMonthly || 0;
  let effectiveRentIncome = currentRentIncome;
  if (scenario.rentIncludeTax) {
      effectiveRentIncome = currentRentIncome * (1 - scenario.rentTaxRate / 100);
  }

  let currentDate = new Date(start);
  const simulationMonths = Math.max(horizonMonths, totalMonthsRemaining); 
  
  for (let m = 1; m <= simulationMonths; m++) {
      let interest = 0;
      let principal = 0;
      let extra = scenario.monthlyExtraPayment || 0;
      
      if (balance > 0.01) {
          interest = balance * monthlyRate;
          principal = monthlyPI - interest;
          
          if (scenario.oneTimeExtraPayment > 0 && m === scenario.oneTimeExtraPaymentMonth) {
              extra += scenario.oneTimeExtraPayment;
          }

          if (principal + extra > balance) {
              principal = balance - extra; 
              if (principal < 0) {
                  extra = balance;
                  principal = 0;
              }
          }
          balance -= (principal + extra);
          if (balance < 0) balance = 0;
      } else {
          extra = 0;
          principal = 0;
          interest = 0;
      }

      const totalMonthPayment = principal + interest + extra + monthlyTax + monthlyIns + monthlyHOA + monthlyPMI;
      accumulatedInterest += interest;
      accumulatedEquity += (principal + extra);
      accumulatedPaid += totalMonthPayment;
      
      const refund = interest * (scenario.taxRefundRate / 100);
      accumulatedTaxRefund += refund;
      
      // Accumulate Rental Income
      accumulatedRentIncome += effectiveRentIncome;

      schedule.push({
          monthIndex: m,
          date: currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          balance: balance,
          interest: interest,
          principal: principal + extra,
          extraPayment: extra,
          totalPayment: totalMonthPayment,
          totalInterest: accumulatedInterest,
          totalPaidToDate: accumulatedPaid,
          equity: accumulatedEquity
      });

      // Annual Updates
      if (m % 12 === 0) {
           // Inflate Rent Income
           effectiveRentIncome *= (1 + (scenario.rentIncreasePerYear || 0) / 100);

           if (m <= horizonMonths) {
              const year = m / 12;
              const futureVal = scenario.homeValue * Math.pow(1 + appreciationRate / 100, year);
              const equity = futureVal - balance;
              
              const cashUsed = scenario.downPayment + (scenario.oneTimeExtraPaymentMonth <= m ? scenario.oneTimeExtraPayment : 0);
              const monthlyExtra = scenario.monthlyExtraPayment || 0;
              const inv = calculateInvestmentPortfolio(cashUsed, monthlyExtra, year);

              // Net Cost = Outflows - Inflows
              // Outflows: TotalPaid + CashIn
              // Inflows: Refund + Equity(Unrealized) + RentIncome
              const cost = accumulatedPaid + cashUsed - accumulatedTaxRefund - equity - accumulatedRentIncome;

              annualData.push({
                  year,
                  homeEquity: equity - scenario.downPayment, 
                  returnedCapital: scenario.downPayment,
                  investmentValue: inv.value,
                  netWorth: equity + inv.value,
                  netCost: -cost
              });
           }
      }
      
      currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Horizon Snapshot
  const snapshotIndex = Math.min(horizonMonths, schedule.length) - 1;
  const snapshot = snapshotIndex >= 0 ? schedule[snapshotIndex] : null;

  const totalPaidAtHorizon = snapshot ? snapshot.totalPaidToDate : 0;
  const interestAtHorizon = snapshot ? snapshot.totalInterest : 0;
  const balanceAtHorizon = snapshot ? snapshot.balance : balance;
  const extraAtHorizon = (scenario.oneTimeExtraPaymentMonth <= horizonMonths) ? scenario.oneTimeExtraPayment : 0;
  
  const futureHomeValue = scenario.homeValue * Math.pow(1 + appreciationRate / 100, horizonYears);
  const equityAtHorizon = futureHomeValue - balanceAtHorizon;
  
  // Investment Portfolio
  const cashUsedTotal = scenario.downPayment + extraAtHorizon;
  const monthlyExtra = scenario.monthlyExtraPayment || 0;
  const finalInv = calculateInvestmentPortfolio(cashUsedTotal, monthlyExtra, horizonYears);

  const netWorth = equityAtHorizon + finalInv.value;
  
  // Net Cost at Horizon
  // Re-calculate precise Rent Income up to horizon
  let totalRentAtHorizon = 0;
  let rRate = scenario.rentMonthly || 0;
  if (scenario.rentIncludeTax) rRate *= (1 - scenario.rentTaxRate / 100);
  for(let i=1; i<=horizonMonths; i++) {
      totalRentAtHorizon += rRate;
      if (i%12===0) rRate *= (1 + (scenario.rentIncreasePerYear||0)/100);
  }

  const netCost = -(totalPaidAtHorizon + scenario.downPayment + extraAtHorizon - accumulatedTaxRefund - equityAtHorizon - totalRentAtHorizon);
  
  const profit = equityAtHorizon - scenario.downPayment;
  const finalPaymentRow = schedule.find(r => r.balance === 0);
  const payoffDate = finalPaymentRow ? finalPaymentRow.date : 'Not within simulation';
  const avgEquity = horizonMonths > 0 ? profit / horizonMonths : 0;

  return {
    id: scenario.id,
    monthlyPrincipalAndInterest: monthlyPI,
    monthlyTax,
    monthlyInsurance: monthlyIns,
    monthlyHOA,
    monthlyPMI,
    totalMonthlyPayment: monthlyPI + monthlyTax + monthlyIns + monthlyHOA + monthlyPMI,
    
    totalPaid: totalPaidAtHorizon,
    totalInterest: interestAtHorizon,
    totalEquityBuilt: equityAtHorizon,
    taxRefund: accumulatedTaxRefund,
    netCost,
    
    futureHomeValue,
    remainingBalance: balanceAtHorizon,
    equity: equityAtHorizon,
    
    netWorth,
    investmentPortfolio: finalInv.value,
    totalInvestmentContribution: finalInv.totalContributed,
    
    profit,
    totalCashInvested: cashUsedTotal,
    averageEquityPerMonth: avgEquity,
    totalExtraPrincipal: extraAtHorizon,

    payoffDate,
    amortizationSchedule: schedule,
    annualData
  };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const COLORS = [
  "#2563eb", // blue-600
  "#dc2626", // red-600
  "#16a34a", // green-600
  "#9333ea", // purple-600
  "#ea580c", // orange-600
];
