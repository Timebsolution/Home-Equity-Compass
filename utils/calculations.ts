

import { LoanScenario, CalculatedLoan, AmortizationPoint, AnnualDataPoint } from '../types';

export const calculateLoan = (
  scenario: LoanScenario, 
  horizonYears: number,
  appreciationRate: number,
  investmentReturnRate: number,
  globalCashInvestment: number, // "Starting Capital"
  globalMonthlyContribution: number // "Replenishment Amount"
): CalculatedLoan => {
  const horizonMonths = Math.round(horizonYears * 12);
  const start = new Date(); 

  // Determine chart granularity: Monthly if <= 2 years, Annually otherwise
  const useMonthlyPoints = horizonMonths <= 24;
  const step = useMonthlyPoints ? 1 : 12;

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
          if (m % step === 0) {
              const yearFraction = m / 12;
              const label = useMonthlyPoints ? `Mo ${m}` : `Yr ${Math.round(yearFraction)}`;
              
              const inv = calculateInvestmentPortfolio(0, 0, yearFraction);
              const gain = inv.value - inv.totalContributed;
              
              annualData.push({
                  label,
                  year: yearFraction,
                  homeEquity: 0,
                  returnedCapital: 0,
                  investmentValue: inv.value,
                  netWorth: inv.value,
                  netCost: inv.totalContributed,
                  totalGain: gain
              });
          }
      }
      
      const finalInv = calculateInvestmentPortfolio(0, 0, horizonYears);
      
      return {
        id: scenario.id,
        monthlyPrincipalAndInterest: 0,
        monthlyFirstPI: 0,
        monthlySecondPI: 0,
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
        
        principalPaid: 0,
        totalAppreciation: 0,
        accumulatedRentalIncome: 0,

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

        if (m % step === 0) {
            const yearFraction = m / 12;
            const label = useMonthlyPoints ? `Mo ${m}` : `Yr ${Math.round(yearFraction)}`;
            
            const inv = calculateInvestmentPortfolio(0, 0, yearFraction);
            const gain = inv.value - inv.totalContributed;
            
            annualData.push({
                label,
                year: yearFraction,
                homeEquity: 0,
                returnedCapital: 0,
                investmentValue: inv.value,
                netWorth: inv.value,
                netCost: accumulatedRentCost,
                totalGain: gain
            });
        }
        
        // Apply rent growth annually regardless of chart step
        if (m % 12 === 0) {
             effectiveMonthlyRent *= (1 + (scenario.rentIncreasePerYear || 0) / 100);
        }
    }

    const finalInv = calculateInvestmentPortfolio(0, 0, horizonYears);

    return {
        id: scenario.id,
        monthlyPrincipalAndInterest: 0,
        monthlyFirstPI: 0,
        monthlySecondPI: 0,
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
        
        principalPaid: 0,
        totalAppreciation: 0,
        accumulatedRentalIncome: 0,

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
  
  // 1st Loan Setup
  let balance1 = scenario.loanAmount;
  const monthlyRate1 = scenario.interestRate / 100 / 12;
  const totalMonthsRemaining1 = (scenario.yearsRemaining * 12) + scenario.monthsRemaining;
  let monthlyPI1 = 0;
  if (totalMonthsRemaining1 > 0) {
      if (monthlyRate1 === 0) {
          monthlyPI1 = balance1 / totalMonthsRemaining1;
      } else {
          monthlyPI1 = balance1 * (monthlyRate1 * Math.pow(1 + monthlyRate1, totalMonthsRemaining1)) / (Math.pow(1 + monthlyRate1, totalMonthsRemaining1) - 1);
      }
  }

  // 2nd Loan Setup
  let balance2 = scenario.hasSecondLoan ? scenario.secondLoanAmount : 0;
  const monthlyRate2 = scenario.hasSecondLoan ? (scenario.secondLoanInterestRate / 100 / 12) : 0;
  const totalMonthsRemaining2 = scenario.hasSecondLoan ? ((scenario.secondLoanYearsRemaining * 12) + scenario.secondLoanMonthsRemaining) : 0;
  let monthlyPI2 = 0;
  if (scenario.hasSecondLoan && totalMonthsRemaining2 > 0 && balance2 > 0) {
      if (monthlyRate2 === 0) {
          monthlyPI2 = balance2 / totalMonthsRemaining2;
      } else {
          monthlyPI2 = balance2 * (monthlyRate2 * Math.pow(1 + monthlyRate2, totalMonthsRemaining2)) / (Math.pow(1 + monthlyRate2, totalMonthsRemaining2) - 1);
      }
  }

  const initialTotalLoan = scenario.loanAmount + (scenario.hasSecondLoan ? scenario.secondLoanAmount : 0);
  const initialEquity = scenario.homeValue - initialTotalLoan; 

  // Property Tax Calculation (Rate vs Fixed)
  const annualPropertyTax = scenario.usePropertyTaxRate 
      ? scenario.homeValue * (scenario.propertyTaxRate / 100)
      : scenario.propertyTax;
  
  const monthlyTax = annualPropertyTax / 12;
  const monthlyIns = scenario.homeInsurance / 12;
  const monthlyHOA = scenario.hoa / 12;
  const monthlyPMI = scenario.pmi / 12;
  
  // Rental Income Calculation (House Hacking)
  let currentRentalIncome = scenario.rentalIncome || 0;
  
  const schedule: AmortizationPoint[] = [];
  const annualData: AnnualDataPoint[] = [];
  
  let accumulatedInterest = 0;
  let accumulatedPaid = 0;
  let accumulatedEquity = 0; // Tracks Principal Paid
  let accumulatedTaxRefund = 0;
  let accumulatedRentalIncome = 0;
  
  let currentDate = new Date(start);
  const simulationMonths = Math.max(horizonMonths, Math.max(totalMonthsRemaining1, totalMonthsRemaining2)); 
  
  for (let m = 1; m <= simulationMonths; m++) {
      
      // --- Loan 1 Calculation ---
      let interest1 = 0;
      let principal1 = 0;
      let extra = scenario.monthlyExtraPayment || 0;
      
      if (balance1 > 0.01) {
          interest1 = balance1 * monthlyRate1;
          principal1 = monthlyPI1 - interest1;
          
          if (scenario.oneTimeExtraPayment > 0 && m === scenario.oneTimeExtraPaymentMonth) {
              extra += scenario.oneTimeExtraPayment;
          }

          if (principal1 + extra > balance1) {
              principal1 = balance1 - extra; 
              if (principal1 < 0) {
                  extra = balance1;
                  principal1 = 0;
              }
          }
          balance1 -= (principal1 + extra);
          if (balance1 < 0) balance1 = 0;
      } else {
          extra = 0;
          principal1 = 0;
          interest1 = 0;
      }

      // --- Loan 2 Calculation ---
      let interest2 = 0;
      let principal2 = 0;
      
      if (balance2 > 0.01) {
          interest2 = balance2 * monthlyRate2;
          principal2 = monthlyPI2 - interest2;

          if (principal2 > balance2) {
             principal2 = balance2;
          }
          balance2 -= principal2;
          if (balance2 < 0) balance2 = 0;
      } else {
          interest2 = 0;
          principal2 = 0;
      }

      const totalPrincipalThisMonth = principal1 + extra + principal2;
      const totalInterestThisMonth = interest1 + interest2;
      
      const totalMonthPayment = totalPrincipalThisMonth + totalInterestThisMonth + monthlyTax + monthlyIns + monthlyHOA + monthlyPMI;

      accumulatedInterest += totalInterestThisMonth;
      accumulatedEquity += totalPrincipalThisMonth;
      accumulatedPaid += totalMonthPayment;
      
      // Calculate Rental Income for this month
      accumulatedRentalIncome += currentRentalIncome;

      // TAX REFUND CALCULATION
      // Refund based strictly on Mortgage Interest deduction (Including 2nd loan)
      const refund = totalInterestThisMonth * (scenario.taxRefundRate / 100);
      accumulatedTaxRefund += refund;
      
      schedule.push({
          monthIndex: m,
          date: currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          balance: balance1 + balance2,
          interest: totalInterestThisMonth,
          principal: totalPrincipalThisMonth,
          extraPayment: extra,
          totalPayment: totalMonthPayment,
          totalInterest: accumulatedInterest,
          totalTaxRefund: accumulatedTaxRefund,
          totalPaidToDate: accumulatedPaid,
          equity: accumulatedEquity // This is strictly accumulated PRINCIPAL PAID
      });

      // Chart Data Updates (Monthly or Annually)
      if (m % step === 0 && m <= horizonMonths) {
          const yearFraction = m / 12;
          const label = useMonthlyPoints ? `Mo ${m}` : `Yr ${Math.round(yearFraction)}`;
          
          const futureVal = scenario.homeValue * Math.pow(1 + appreciationRate / 100, yearFraction);
          const currentTotalBalance = balance1 + balance2;
          const equityAtYear = futureVal - currentTotalBalance;
          
          const cashUsed = scenario.downPayment + (scenario.oneTimeExtraPaymentMonth <= m ? scenario.oneTimeExtraPayment : 0);
          const monthlyExtra = scenario.monthlyExtraPayment || 0;
          const inv = calculateInvestmentPortfolio(cashUsed, monthlyExtra, yearFraction);

          // Net Cost Calculation (Economic Cost over period)
          const equityGain = equityAtYear - initialEquity; 
          const cost = accumulatedPaid - accumulatedTaxRefund - equityGain - accumulatedRentalIncome;
          
          const investmentGain = inv.value - inv.totalContributed;
          const totalGain = equityGain + accumulatedTaxRefund + accumulatedRentalIncome + investmentGain;

          annualData.push({
              label,
              year: yearFraction,
              homeEquity: equityGain, 
              returnedCapital: initialEquity,
              investmentValue: inv.value,
              netWorth: equityAtYear + inv.value,
              netCost: cost,
              totalGain: totalGain
          });
      }

      // Annual Logic for internal state (Appreciation Base & Rent Growth)
      if (m % 12 === 0) {
           // Apply rent growth for next year
           currentRentalIncome *= (1 + (scenario.rentIncreasePerYear || 0) / 100);
      }
      
      currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Horizon Snapshot
  const snapshotIndex = Math.min(horizonMonths, schedule.length) - 1;
  const snapshot = snapshotIndex >= 0 ? schedule[snapshotIndex] : null;

  const totalPaidAtHorizon = snapshot ? snapshot.totalPaidToDate : 0;
  const interestAtHorizon = snapshot ? snapshot.totalInterest : 0;
  const taxRefundAtHorizon = snapshot ? snapshot.totalTaxRefund : 0; 
  
  // Re-calculate accumulated rental income up to horizon exactly
  let rentalIncomeAtHorizon = 0;
  let rIncome = scenario.rentalIncome || 0;
  for (let i = 1; i <= horizonMonths; i++) {
      rentalIncomeAtHorizon += rIncome;
      if (i % 12 === 0) {
          rIncome *= (1 + (scenario.rentIncreasePerYear || 0) / 100);
      }
  }

  const balanceAtHorizon = snapshot ? snapshot.balance : (balance1 + balance2);
  const extraAtHorizon = (scenario.oneTimeExtraPaymentMonth <= horizonMonths) ? scenario.oneTimeExtraPayment : 0;
  
  const futureHomeValue = scenario.homeValue * Math.pow(1 + appreciationRate / 100, horizonYears);
  const equityAtHorizon = futureHomeValue - balanceAtHorizon;
  
  // Wealth Components
  const totalPrincipalPaid = (initialTotalLoan - balanceAtHorizon);
  const totalAppreciation = futureHomeValue - scenario.homeValue;
  
  // Total Equity Built (Change Only)
  const totalEquityBuilt = totalPrincipalPaid + totalAppreciation;

  // Investment Portfolio
  const cashUsedTotal = scenario.downPayment + extraAtHorizon;
  const monthlyExtra = scenario.monthlyExtraPayment || 0;
  const finalInv = calculateInvestmentPortfolio(cashUsedTotal, monthlyExtra, horizonYears);

  const netWorth = equityAtHorizon + finalInv.value;
  
  // Net Cost at Horizon (Economic Cost)
  const netCost = totalPaidAtHorizon - taxRefundAtHorizon - rentalIncomeAtHorizon - totalEquityBuilt;
  
  // Profit = Pure Wealth Generation (Equity Growth)
  const profit = totalEquityBuilt;

  const finalPaymentRow = schedule.find(r => r.balance === 0);
  const payoffDate = finalPaymentRow ? finalPaymentRow.date : 'Not within simulation';
  const avgEquity = horizonMonths > 0 ? profit / horizonMonths : 0;

  return {
    id: scenario.id,
    monthlyPrincipalAndInterest: monthlyPI1 + monthlyPI2,
    monthlyFirstPI: monthlyPI1,
    monthlySecondPI: monthlyPI2,
    monthlyTax,
    monthlyInsurance: monthlyIns,
    monthlyHOA,
    monthlyPMI,
    totalMonthlyPayment: monthlyPI1 + monthlyPI2 + monthlyTax + monthlyIns + monthlyHOA + monthlyPMI,
    
    totalPaid: totalPaidAtHorizon,
    totalInterest: interestAtHorizon,
    
    // CHANGE ONLY
    totalEquityBuilt: totalEquityBuilt, 
    
    taxRefund: taxRefundAtHorizon,
    netCost,
    
    principalPaid: totalPrincipalPaid,
    totalAppreciation,
    accumulatedRentalIncome: rentalIncomeAtHorizon,

    futureHomeValue,
    remainingBalance: balanceAtHorizon,
    
    // ABSOLUTE EQUITY (Exit Value)
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
