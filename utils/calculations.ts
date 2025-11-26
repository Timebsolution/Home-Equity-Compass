
import { LoanScenario, CalculatedLoan, AmortizationPoint, AnnualDataPoint } from '../types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const COLORS = [
  '#3b82f6', 
  '#10b981', 
  '#8b5cf6', 
  '#f59e0b', 
  '#ef4444', 
  '#ec4899', 
  '#06b6d4', 
  '#84cc16', 
];

const convertToMonthlyContribution = (amount: number, frequency: string): number => {
    switch (frequency) {
        case 'weekly': return amount * 52 / 12;
        case 'biweekly': return amount * 26 / 12;
        case 'monthly': return amount;
        case 'semiannually': return amount * 2 / 12;
        case 'annually': return amount / 12;
        default: return amount;
    }
};

export const calculateLoan = (
  scenario: LoanScenario, 
  horizonYears: number,
  appreciationRate: number,
  investmentReturnRate: number,
  globalCashInvestment: number, // "Starting Capital"
  globalMonthlyContribution: number, // "Replenishment Amount" (Already converted to monthly if global)
  baselineMonthlyPayment?: number, // Payment of Scenario 0 for break-even calc
  globalRent?: number, // NEW: Enforce global rent consistency
  useGlobalRent?: boolean // NEW: Enforce global rent consistency
): CalculatedLoan => {
  const horizonMonths = Math.round(horizonYears * 12);
  const start = new Date(); 

  // Determine chart granularity: Monthly if <= 2 years, Annually otherwise
  const useMonthlyPoints = horizonMonths <= 24;
  const step = useMonthlyPoints ? 1 : 12;

  // Helper for Investment Calculation
  const getInvestParams = () => {
      if (scenario.isInvestmentOnly || scenario.lockInvestment) {
          // Manual Overrides (lockInvestment = true means Manual Mode)
          const contribution = scenario.investmentMonthly ?? globalMonthlyContribution;
          const effectiveMonthly = scenario.investmentContributionFrequency 
              ? convertToMonthlyContribution(contribution, scenario.investmentContributionFrequency)
              : contribution;

          return {
              principal: scenario.investmentCapital ?? globalCashInvestment,
              monthly: effectiveMonthly,
              rate: scenario.investmentRate ?? investmentReturnRate
          };
      }
      // Global Mode (lockInvestment = false means Global Mode)
      // globalMonthlyContribution passed in is already converted to monthly in App.tsx if using global freq
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
      // If investment savings are disabled by user toggle, return 0 growth on contributions
      const params = getInvestParams();
      const effectiveRate = scenario.investMonthlySavings ? params.rate : 0;
      
      const investedPrincipal = Math.max(0, params.principal - cashUsedForDownAndOneTime);
      const investedMonthly = scenario.investMonthlySavings ? Math.max(0, params.monthly - monthlyExtraUsed) : 0;

      const r = effectiveRate / 100;
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
      const totalGain = finalInv.value - finalInv.totalContributed;
      const totalInvestedAmount = finalInv.totalContributed;
      
      // Annualized Return (CAGR)
      const startValue = Math.max(1, params.principal);
      const endValue = finalInv.value;
      const effectiveAnnualReturn = horizonYears > 0 
          ? (Math.pow(endValue / startValue, 1 / horizonYears) - 1) * 100
          : 0;

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
        netMonthlyPayment: params.monthly, // Contribution
        
        totalPaid: finalInv.totalContributed,
        totalInterest: 0,
        totalEquityBuilt: 0,
        taxRefund: 0,
        netCost: finalInv.totalContributed, 
        
        principalPaid: 0,
        totalAppreciation: 0,
        accumulatedRentalIncome: 0,
        totalRentalTax: 0,
        totalPropertyCosts: 0,

        futureHomeValue: 0,
        remainingBalance: 0,
        equity: 0,
        
        netWorth: finalInv.value,
        investmentPortfolio: finalInv.value,
        totalInvestmentContribution: finalInv.totalContributed,
        
        profit: totalGain,
        totalCashInvested: finalInv.totalContributed,
        averageEquityPerMonth: (finalInv.value - finalInv.totalContributed) / horizonMonths,
        totalExtraPrincipal: 0,

        payoffDate: 'N/A',
        amortizationSchedule: [],
        annualData,
        
        totalInvestedAmount,
        initialCapitalBase: startValue,
        effectiveAnnualReturn,
        lifetimeInterestSaved: 0,
        monthsSaved: 0,
        interestSavedAtHorizon: 0,
        breakEvenMonths: 0,
        sellingCosts: 0,
        capitalGainsTax: 0
      };
  }

  // --- RENT MODE ---
  if (scenario.isRentOnly) {
    let totalRentPaid = 0;
    
    // RENT MODE: Use scenario rent, optionally sync to global if not locked
    let currentRent = scenario.rentMonthly;
    if (useGlobalRent && !scenario.lockRent && globalRent !== undefined) {
        currentRent = globalRent;
    }
    
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
    
    // Total Invested for Rent Mode = Rent Paid. Side investment is not a housing cost.
    const totalInvestedAmount = totalRentPaid;
    
    // True Cost = Rent Paid
    const netCost = totalRentPaid;

    const params = getInvestParams();
    const startValue = Math.max(1, params.principal);
    const endValue = finalInv.value; 
    const effectiveAnnualReturn = horizonYears > 0
        ? (Math.pow(endValue / startValue, 1 / horizonYears) - 1) * 100
        : 0;

    // Profit for Rent Mode usually includes investment growth since that's the alternative strategy
    const profit = Math.max(0, finalInv.value - finalInv.totalContributed);

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
        netMonthlyPayment: effectiveMonthlyRent, // Savings/Rent cost
        
        totalPaid: totalRentPaid,
        totalInterest: 0,
        totalEquityBuilt: 0,
        taxRefund: 0,
        netCost, 
        
        principalPaid: 0,
        totalAppreciation: 0,
        accumulatedRentalIncome: 0,
        totalRentalTax: 0,
        totalPropertyCosts: 0,

        futureHomeValue: 0,
        remainingBalance: 0,
        equity: 0,
        netWorth: finalInv.value, 
        investmentPortfolio: finalInv.value,
        
        profit,
        totalCashInvested: 0,
        totalInvestmentContribution: finalInv.totalContributed,
        averageEquityPerMonth: 0,
        totalExtraPrincipal: 0,

        payoffDate: 'N/A',
        amortizationSchedule: [],
        annualData,
        
        totalInvestedAmount,
        initialCapitalBase: startValue,
        effectiveAnnualReturn,
        lifetimeInterestSaved: 0,
        monthsSaved: 0,
        interestSavedAtHorizon: 0,
        breakEvenMonths: 0,
        sellingCosts: 0,
        capitalGainsTax: 0
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

  // Standard Amortization Tracking
  let standardBalance1 = scenario.loanAmount;
  let accumulatedStandardInterest = 0;

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
  const startHomeValue = scenario.homeValue; 
  const initialEquity = startHomeValue - initialTotalLoan; 

  // Property Tax Calculation (Rate vs Fixed)
  const annualPropertyTax = scenario.usePropertyTaxRate 
      ? scenario.homeValue * (scenario.propertyTaxRate / 100)
      : scenario.propertyTax;
  
  const monthlyTax = annualPropertyTax / 12;
  const monthlyIns = scenario.homeInsurance / 12;
  const monthlyHOA = scenario.hoa / 12;
  
  // Base PMI
  const baseMonthlyPMI = scenario.pmi / 12;
  // Calculate Initial PMI based on starting LTV
  const initialPMI = (startHomeValue > 0 && (scenario.loanAmount / startHomeValue) > 0.8) ? baseMonthlyPMI : 0;
  
  // Rental Income Calculation
  let rawRentalIncome = scenario.rentalIncome || 0;
  // FORCE SYNC: If global mode is on and rent is not locked, use global rent.
  if (useGlobalRent && !scenario.lockRentIncome && globalRent !== undefined) {
      rawRentalIncome = globalRent;
  }
  
  const currentRentalIncome = Math.max(0, rawRentalIncome);
  
  const schedule: AmortizationPoint[] = [];
  const annualData: AnnualDataPoint[] = [];
  
  let accumulatedInterest = 0;
  let accumulatedPaid = 0; // Total Monthly Cash Flow (PITI + HOA + Extra)
  let accumulatedEquity = 0; // Tracks Principal Paid
  let accumulatedTaxRefund = 0;
  let accumulatedExtra = 0; // Total extra paid
  let accumulatedPropertyCosts = 0; // Tax + Ins + HOA + PMI
  
  let accumulatedGrossRentalIncome = 0;
  let accumulatedRentalTax = 0;
  
  let currentDate = new Date(start);
  const simulationMonths = Math.max(horizonMonths, Math.max(totalMonthsRemaining1, totalMonthsRemaining2)); 
  
  const closingCosts = scenario.closingCosts || 0; // upfront cost
  const sellingCostRate = scenario.sellingCostRate !== undefined ? scenario.sellingCostRate : 6;
  
  let actualPayoffMonth = 0;
  let isPaidOff = false;

  let interestSavedAtHorizon = 0;

  // Extra Payment Logic Setup
  const monthlyExtraBase = convertToMonthlyContribution(scenario.monthlyExtraPayment || 0, scenario.monthlyExtraPaymentFrequency || 'monthly');

  for (let m = 1; m <= simulationMonths; m++) {
      
      // --- Standard Loan 1 (No Extras) Tracking ---
      if (standardBalance1 > 0.01) {
          const stdInt = standardBalance1 * monthlyRate1;
          const stdPrin = monthlyPI1 - stdInt;
          accumulatedStandardInterest += stdInt;
          standardBalance1 -= stdPrin;
          if (standardBalance1 < 0) standardBalance1 = 0;
      }

      // --- Loan 1 Calculation ---
      let interest1 = 0;
      let principal1 = 0;
      let extra = 0;

      // Extra Payment Logic
      if (scenario.manualExtraPayments && scenario.manualExtraPayments[m] !== undefined) {
          extra = scenario.manualExtraPayments[m];
      } else {
          extra = monthlyExtraBase; // Use converted frequency amount
          if (scenario.oneTimeExtraPayment > 0 && m === scenario.oneTimeExtraPaymentMonth) {
              extra += scenario.oneTimeExtraPayment;
          }
      }
      
      if (balance1 > 0.01) {
          interest1 = balance1 * monthlyRate1;
          principal1 = monthlyPI1 - interest1;
          
          const maxPrincipal = balance1;
          if (principal1 + extra > maxPrincipal) {
              const needed = maxPrincipal - principal1;
              if (needed < 0) {
                 extra = 0; 
                 principal1 = maxPrincipal;
              } else {
                 extra = needed;
              }
          }

          balance1 -= (principal1 + extra);
          if (balance1 < 0.01) {
             balance1 = 0;
             if (!isPaidOff && balance2 < 0.01) {
                isPaidOff = true;
                actualPayoffMonth = m;
             }
          }
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
          if (balance2 < 0.01) {
             balance2 = 0;
          }
      } else {
          interest2 = 0;
          principal2 = 0;
      }

      if (balance1 <= 0.01 && balance2 <= 0.01 && actualPayoffMonth === 0) {
          actualPayoffMonth = m;
      }

      const totalPrincipalThisMonth = principal1 + extra + principal2;
      const totalInterestThisMonth = interest1 + interest2;

      // --- DYNAMIC PMI LOGIC ---
      const currentLTV = balance1 / startHomeValue;
      const effectivePMI = (currentLTV > 0.8) ? baseMonthlyPMI : 0;
      
      const monthlyPropCost = monthlyTax + monthlyIns + monthlyHOA + effectivePMI;
      accumulatedPropertyCosts += monthlyPropCost;

      const totalMonthPayment = totalPrincipalThisMonth + totalInterestThisMonth + monthlyPropCost;

      accumulatedInterest += totalInterestThisMonth;
      accumulatedEquity += totalPrincipalThisMonth;
      accumulatedPaid += totalMonthPayment;
      accumulatedExtra += extra;
      
      accumulatedGrossRentalIncome += currentRentalIncome;
      
      if (scenario.rentalIncomeTaxEnabled) {
          const monthlyRentTax = currentRentalIncome * (scenario.rentalIncomeTaxRate / 100);
          accumulatedRentalTax += monthlyRentTax;
      }

      // TAX REFUND: (Interest + PropertyTax) * MarginalRate
      const refund = (totalInterestThisMonth + monthlyTax) * (scenario.taxRefundRate / 100);
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
          equity: accumulatedEquity,
          accumulatedRentalIncome: accumulatedGrossRentalIncome,
          accumulatedRentalTax: accumulatedRentalTax,
          accumulatedPropertyCosts: accumulatedPropertyCosts // Store in schedule
      });

      if (m === horizonMonths) {
          interestSavedAtHorizon = Math.max(0, accumulatedStandardInterest - accumulatedInterest);
      }

      // Chart Data Updates
      if (m % step === 0 && m <= horizonMonths) {
          const yearFraction = m / 12;
          const label = useMonthlyPoints ? `Mo ${m}` : `Yr ${Math.round(yearFraction)}`;
          
          const futureVal = scenario.homeValue * Math.pow(1 + appreciationRate / 100, yearFraction);
          const currentTotalBalance = balance1 + balance2;
          const equityAtYear = futureVal - currentTotalBalance;
          
          const cashUsed = scenario.downPayment + closingCosts + (scenario.oneTimeExtraPaymentMonth <= m ? scenario.oneTimeExtraPayment : 0);
          const monthlyExtra = monthlyExtraBase; // Use base monthly logic for chart assumption
          const inv = calculateInvestmentPortfolio(cashUsed, monthlyExtra, yearFraction);

          const equityGain = equityAtYear - initialEquity; 
          
          const estimatedSellingCost = futureVal * (sellingCostRate / 100);
          
          // Net Cost Tracker for Chart
          const cashOut = accumulatedPaid + scenario.downPayment + closingCosts + accumulatedRentalTax;
          const cashIn = accumulatedTaxRefund + accumulatedGrossRentalIncome;
          const accumulatedNetCost = cashOut - cashIn;

          const investmentGain = inv.value - inv.totalContributed;
          // Note: Chart gain logic can remain approximate or we can strict match profit logic. 
          // For simplicity, charts keep showing investment growth component.
          const totalGain = equityGain + accumulatedTaxRefund + accumulatedGrossRentalIncome + investmentGain - closingCosts - estimatedSellingCost - accumulatedRentalTax;

          annualData.push({
              label,
              year: yearFraction,
              homeEquity: equityGain, 
              returnedCapital: initialEquity,
              investmentValue: inv.value,
              netWorth: equityAtYear + inv.value,
              netCost: accumulatedNetCost,
              totalGain: totalGain
          });
      }
      
      currentDate.setMonth(currentDate.getMonth() + 1);
  }

  const lifetimeInterestSaved = Math.max(0, accumulatedStandardInterest - accumulatedInterest);
  const monthsSaved = (actualPayoffMonth > 0) ? (totalMonthsRemaining1 - actualPayoffMonth) : 0;

  // Horizon Snapshot
  const snapshotIndex = Math.min(horizonMonths, schedule.length) - 1;
  const snapshot = snapshotIndex >= 0 ? schedule[snapshotIndex] : null;

  const totalPaidAtHorizon = snapshot ? snapshot.totalPaidToDate : 0;
  const interestAtHorizon = snapshot ? snapshot.totalInterest : 0;
  const taxRefundAtHorizon = snapshot ? snapshot.totalTaxRefund : 0; 
  const grossRentalIncomeAtHorizon = snapshot ? snapshot.accumulatedRentalIncome : accumulatedGrossRentalIncome;
  const rentalTaxAtHorizon = snapshot ? snapshot.accumulatedRentalTax : accumulatedRentalTax;
  const balanceAtHorizon = snapshot ? snapshot.balance : (balance1 + balance2);
  const extraAtHorizon = (scenario.oneTimeExtraPaymentMonth <= horizonMonths) ? scenario.oneTimeExtraPayment : 0;
  const totalPropertyCostsAtHorizon = snapshot ? snapshot.accumulatedPropertyCosts : accumulatedPropertyCosts; // SNAPSHOT VALUE
  
  const futureHomeValue = scenario.homeValue * Math.pow(1 + appreciationRate / 100, horizonYears);
  const equityAtHorizon = futureHomeValue - balanceAtHorizon;
  
  const sellingCostsAtHorizon = futureHomeValue * (sellingCostRate / 100);

  // Capital Gains Tax Calculation
  // Strict logic: ONLY if horizon is LESS THAN OR EQUAL TO 2 years (24 months)
  // If it is > 24 months, tax is 0.
  let capitalGainsTax = 0;
  if (horizonMonths <= 24) { 
      const flipProfit = (futureHomeValue - scenario.homeValue) - sellingCostsAtHorizon - closingCosts;
      if (flipProfit > 0) {
          capitalGainsTax = flipProfit * ((scenario.capitalGainsTaxRate || 20) / 100);
      }
  }
  
  const realEquityAtHorizon = equityAtHorizon - sellingCostsAtHorizon - capitalGainsTax;
  
  const totalPrincipalPaid = (initialTotalLoan - balanceAtHorizon);
  const totalAppreciation = futureHomeValue - scenario.homeValue;
  const totalEquityBuilt = totalPrincipalPaid + totalAppreciation;

  const cashUsedTotal = scenario.downPayment + closingCosts + extraAtHorizon;
  const monthlyExtra = monthlyExtraBase; 
  const finalInv = calculateInvestmentPortfolio(cashUsedTotal, monthlyExtra, horizonYears);
  const netWorth = realEquityAtHorizon + finalInv.value;
  
  // --- STRICT FORMULA IMPLEMENTATION ---

  // 1. NET OUT-OF-POCKET
  // Formula: (Total Paid + Upfront + Taxes - Rent - Refund) + Investment Contribution
  // FIX: Only include investment contribution for Pure Investment mode. For Buy/Rent, side investment is separate.
  const investmentAddon = scenario.isInvestmentOnly ? finalInv.totalContributed : 0;
  const simpleTotalInvested = (totalPaidAtHorizon + scenario.downPayment + closingCosts + rentalTaxAtHorizon + investmentAddon) - grossRentalIncomeAtHorizon;

  // 2. CASH AFTER SALE
  // Formula: Equity at Sale (FMV - Balance - SellingCosts) - Capital Gains Tax
  const cashAfterSale = realEquityAtHorizon;

  // 3. TRUE COST
  // Formula: Net Out-of-Pocket - Cash After Sale
  const netCost = simpleTotalInvested - cashAfterSale;

  // 4. PROFIT (Total Return)
  // For Buy Scenarios, DO NOT include investment growth unless user requests. 
  let totalGain = totalAppreciation 
                  + totalPrincipalPaid 
                  + taxRefundAtHorizon 
                  + grossRentalIncomeAtHorizon 
                  - sellingCostsAtHorizon 
                  - closingCosts 
                  - rentalTaxAtHorizon
                  - capitalGainsTax;
                  
  // For Investment Only or Rent Only (where investment is primary), include growth.
  if (scenario.isInvestmentOnly || scenario.isRentOnly) {
      totalGain += (finalInv.value - finalInv.totalContributed);
  }

  const statedCapital = (scenario.investmentCapital ?? globalCashInvestment);
  const initialBase = Math.max(1, Math.max(statedCapital, scenario.downPayment + closingCosts));
  
  const effectiveAnnualReturn = horizonYears > 0
    ? (Math.pow(1 + (totalGain / initialBase), 1 / horizonYears) - 1) * 100
    : 0;

  const currentMonthlyPITI = monthlyPI1 + monthlyPI2 + monthlyTax + monthlyIns + monthlyHOA + initialPMI;
  const netMonthlyPayment = currentMonthlyPITI - currentRentalIncome;

  return {
    id: scenario.id,
    monthlyPrincipalAndInterest: monthlyPI1 + monthlyPI2,
    monthlyFirstPI: monthlyPI1,
    monthlySecondPI: monthlyPI2,
    monthlyTax,
    monthlyInsurance: monthlyIns,
    monthlyHOA: monthlyHOA,
    monthlyPMI: initialPMI,
    totalMonthlyPayment: currentMonthlyPITI, 
    netMonthlyPayment, // PITI - Rent
    
    totalPaid: totalPaidAtHorizon,
    totalInterest: interestAtHorizon,
    totalEquityBuilt,
    taxRefund: taxRefundAtHorizon,
    netCost,
    
    principalPaid: totalPrincipalPaid,
    totalAppreciation,
    accumulatedRentalIncome: grossRentalIncomeAtHorizon,
    totalRentalTax: rentalTaxAtHorizon, 
    totalPropertyCosts: totalPropertyCostsAtHorizon, 

    futureHomeValue,
    remainingBalance: balanceAtHorizon,
    equity: realEquityAtHorizon,
    netWorth,
    investmentPortfolio: finalInv.value,
    
    profit: totalGain,
    totalCashInvested: 0, 
    totalInvestmentContribution: finalInv.totalContributed,
    averageEquityPerMonth: totalEquityBuilt / horizonMonths,
    totalExtraPrincipal: accumulatedExtra, 

    payoffDate: isPaidOff 
        ? new Date(start.setMonth(start.getMonth() + actualPayoffMonth)).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
        : 'N/A',
    amortizationSchedule: schedule,
    
    annualData,
    
    totalInvestedAmount: simpleTotalInvested, 
    initialCapitalBase: initialBase,
    effectiveAnnualReturn,
    lifetimeInterestSaved,
    monthsSaved,
    interestSavedAtHorizon,
    breakEvenMonths: 0,
    sellingCosts: sellingCostsAtHorizon,
    capitalGainsTax
  };
};
