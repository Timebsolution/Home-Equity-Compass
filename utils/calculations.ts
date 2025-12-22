

import { LoanScenario, CalculatedLoan, AmortizationPoint, AnnualDataPoint, AdditionalLoan, LoanBreakdown } from '../types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number, maxDecimals: number = 3): string => {
  if (value === undefined || value === null || isNaN(value)) return '';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
    useGrouping: true
  }).format(value);
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
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

export const convertToMonthlyContribution = (amount: number, frequency: string): number => {
    // Safety check for numeric input if coming from raw string
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return 0;
    
    switch (frequency) {
        case 'weekly': return numAmount * 52 / 12;
        case 'biweekly': return numAmount * 26 / 12;
        case 'monthly': return numAmount;
        case 'semiannually': return numAmount * 2 / 12; // Average monthly effect
        case 'annually': return numAmount / 12; // Average monthly effect
        default: return numAmount;
    }
};

interface ExtraPaymentConfig {
    monthlyExtraPayment?: number;
    monthlyExtraPaymentFrequency?: string;
    oneTimeExtraPayment?: number;
    oneTimeExtraPaymentMonth?: number;
    annualLumpSumPayment?: number;
    annualLumpSumMonth?: number;
    extraPaymentDelayMonths?: number;
    manualExtraPayments?: Record<number, number>;
}

// Calculate current balance based on amortization from a start date
// Updated to separate historical vs future extra payment application logic
export const calculateCurrentBalance = (
    originalBalance: number,
    annualRate: number,
    termYears: number,
    startDateStr?: string,
    extraConfig?: ExtraPaymentConfig
): number => {
    if (!startDateStr) return originalBalance;

    const start = new Date(startDateStr);
    const now = new Date();
    // Calculate full months elapsed
    let monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12;
    monthsElapsed -= start.getMonth();
    monthsElapsed += now.getMonth();
    
    // If loan is in the future, balance is original
    if (monthsElapsed <= 0) return originalBalance;

    const monthlyRate = annualRate / 100 / 12;
    
    // Calculate Standard Monthly Payment (P&I)
    // Formula: P = L * [c(1+c)^n] / [(1+c)^n - 1]
    const totalMonths = termYears * 12;
    let fixedPmt = 0;
    
    if (monthlyRate === 0) {
        fixedPmt = originalBalance / totalMonths;
    } else {
        fixedPmt = originalBalance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    // SIMULATE HISTORY
    let currentBal = originalBalance;
    const startMonthIndex = start.getMonth(); // 0-11

    for (let m = 1; m <= monthsElapsed; m++) {
        // Robust Calendar Month Calculation
        const currentCalMonth = (startMonthIndex + m) % 12;

        const interest = currentBal * monthlyRate;
        let principal = fixedPmt - interest;
        
        // Add Historical Extra Payments if configured
        if (extraConfig) {
            let extra = 0;
            
            // Monthly Extra
            if (extraConfig.monthlyExtraPayment && extraConfig.monthlyExtraPayment > 0) {
                // Check delay (m is Loan Age here)
                if (m > (extraConfig.extraPaymentDelayMonths || 0)) {
                    const freq = extraConfig.monthlyExtraPaymentFrequency || 'monthly';
                    if (freq === 'annually') {
                        // Apply only on loan anniversary months (roughly)
                        if (m % 12 === 0) extra += extraConfig.monthlyExtraPayment;
                    } else {
                        extra += convertToMonthlyContribution(extraConfig.monthlyExtraPayment, freq);
                    }
                }
            }
            
            // One Time Extra (m is Loan Age)
            if (extraConfig.oneTimeExtraPayment && extraConfig.oneTimeExtraPayment > 0) {
                 if (m === (extraConfig.oneTimeExtraPaymentMonth || 0)) {
                     extra += extraConfig.oneTimeExtraPayment;
                 }
            }

            // Annual Lump Sum (Calendar Month Based)
            if (extraConfig.annualLumpSumPayment && extraConfig.annualLumpSumPayment > 0) {
                if (currentCalMonth === (extraConfig.annualLumpSumMonth || 0)) {
                    extra += extraConfig.annualLumpSumPayment;
                }
            }

            // Note: Manual Overrides are intentionally ignored for History 
            // to avoid collision with Projection indices (which user edits in UI).

            // Apply Extra
            principal += extra;
        }

        // Cap principal to balance
        if (principal > currentBal) principal = currentBal;
        
        currentBal -= principal;
        if (currentBal <= 0) return 0;
    }

    return Math.max(0, currentBal);
};

// --- CENTRALIZED INVESTMENT ENGINE ---
export const calculateInvestmentPortfolio = (
    principal: number,
    contribution: number, // The amount per frequency
    frequency: string, // 'weekly', 'biweekly', 'monthly', 'semiannually', 'annually'
    annualRate: number,
    years: number,
    reinvest: boolean = true
) => {
    let periodsPerYear = 12;
    switch (frequency) {
        case 'weekly': periodsPerYear = 52; break;
        case 'biweekly': periodsPerYear = 26; break;
        case 'monthly': periodsPerYear = 12; break;
        case 'semiannually': periodsPerYear = 2; break;
        case 'annually': periodsPerYear = 1; break;
        default: periodsPerYear = 12;
    }

    const r = annualRate / 100;
    const n = periodsPerYear;
    const t = years;
    const totalPeriods = n * t;

    // Total Cash Added (Periodic Only)
    let totalReplenished = contribution * totalPeriods;
    
    let fv = 0;
    let interestEarned = 0;

    if (reinvest) {
        const fvPrincipal = principal * Math.pow(1 + r/n, totalPeriods);
        let fvSeries = 0;
        
        if (contribution > 0) {
            if (r === 0) {
                fvSeries = totalReplenished;
            } else {
                fvSeries = contribution * (Math.pow(1 + r/n, totalPeriods) - 1) / (r/n);
            }
        }
        fv = fvPrincipal + fvSeries;
        interestEarned = fv - (principal + totalReplenished);
    } else {
        const interestPrincipal = principal * r * t;
        const interestSeries = totalReplenished * r * (t / 2);
        
        interestEarned = interestPrincipal + interestSeries;
        fv = principal + totalReplenished + interestEarned;
    }

    return {
        finalValue: fv,
        totalReplenished,
        startingCapital: principal,
        totalContributed: principal + totalReplenished,
        interestEarned
    };
};

const calculateMonthlyPI = (balance: number, rate: number, years: number) => {
    const monthlyRate = rate / 100 / 12;
    const months = years * 12;
    if (months <= 0) return 0;
    if (balance <= 0) return 0;
    if (rate === 0) return balance / months;
    return balance / ((Math.pow(1 + monthlyRate, months) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, months)));
};

export const calculateLoan = (
  scenario: LoanScenario, 
  horizonYears: number,
  appreciationRate: number,
  investmentReturnRate: number,
  globalCashInvestment: number, 
  globalContributionAmount: number,
  globalContributionFrequency: string,
  baselineMonthlyPayment?: number, 
  globalRent?: number, 
  useGlobalRent?: boolean,
  globalInvestmentTaxRate?: number
): CalculatedLoan => {
    const horizonMonths = Math.round(horizonYears * 12);
    const includeHome = scenario.includeHome !== false;
    
    // Determine effective input values (Global vs Local locks)
    // Investment Params
    let investCapital = globalCashInvestment;
    let investMonthly = globalContributionAmount;
    let investFreq = globalContributionFrequency;
    let investRate = investmentReturnRate;
    let investTaxRate = globalInvestmentTaxRate || 0;

    if (scenario.lockInvestment) {
        investCapital = scenario.investmentCapital || 0;
        investMonthly = scenario.investmentMonthly || 0;
        investFreq = scenario.investmentContributionFrequency || 'monthly';
        investRate = scenario.investmentRate || 0;
        investTaxRate = scenario.investmentTaxRate || 0;
    }
    
    if (scenario.includeInvestment === false) {
        investCapital = 0;
        investMonthly = 0;
    }

    const monthlyInvestContribution = convertToMonthlyContribution(investMonthly, investFreq);

    // Rent Inputs
    let rentOutInput = scenario.rentMonthly;
    if (useGlobalRent && !scenario.lockRent) {
        rentOutInput = globalRent || scenario.rentMonthly;
    }

    let rentInInput = scenario.rentalIncome;
    if (useGlobalRent && !scenario.lockRentIncome) {
        rentInInput = globalRent || scenario.rentalIncome;
    }

    // Initialize State
    const startFMV = (scenario.originalFmv && scenario.originalFmv > 0) ? scenario.originalFmv : scenario.homeValue;
    let currentFMV = includeHome ? startFMV : 0;
    const instantEquity = includeHome ? (startFMV - scenario.homeValue) : 0;
    
    // Loan Init
    // Primary
    let primaryBal = 0;
    if (includeHome) {
        if (scenario.primaryBalanceLocked && scenario.manualCurrentBalance !== undefined) {
            primaryBal = scenario.manualCurrentBalance;
        } else {
            // FIX: For Current Loans, we generally do NOT want to apply the extra payment settings
            // to the historical calculation, because "Extra Payment" is typically a future strategy.
            // If we apply it historically, it rewrites history and lowers the starting balance artificially.
            // We pass an empty config for history so it calculates standard amortization until Today.
            // The future projection loop will pick up the extra payments starting from now.
            
            const extraConfigHistory: ExtraPaymentConfig = {
                // Intentionally empty to treat history as standard amortization
                // unless we want to support 'historical corrections' in the future.
            };

            primaryBal = calculateCurrentBalance(
                scenario.loanAmount, 
                scenario.interestRate, 
                scenario.loanTermYears, 
                scenario.startDate,
                extraConfigHistory
            );
        }
    }
    
    const startingPrimaryBal = primaryBal; // Store for snapshot

    // Additional Loans
    const subLoans = (scenario.additionalLoans || []).map(l => {
        // Sub-loans extra payment also treated as future strategy
        return {
            ...l,
            currentBal: includeHome ? calculateCurrentBalance(l.balance, l.rate, l.years, l.startDate, {}) : 0,
            monthlyPI: includeHome ? calculateMonthlyPI(l.balance, l.rate, l.years) : 0,
            accumulatedInterest: 0,
            accumulatedPrincipal: 0,
            accumulatedExtra: 0 // New accumulator for sub loans
        };
    });

    let investmentBal = investCapital;
    
    // Accumulators
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    let totalTaxPaid = 0;
    let totalInsurancePaid = 0;
    let totalHOAPaid = 0;
    let totalPMIPaid = 0;
    let totalCustomPaid = 0;
    let totalRepairPaid = 0;
    let totalRentalIncome = 0;
    let totalRentPaid = 0; 
    let totalRentalTax = 0;
    let totalInvestmentTax = 0;
    let totalInvestmentContribution = 0;
    let totalTaxRefund = 0;
    let totalAppreciation = 0;
    let totalExtraPayments = 0;

    // Per Loan Primary Accumulators
    let primaryPrincipalPaid = 0;
    let primaryExtraPaid = 0; // NEW: Track primary extra payments specifically
    let primaryInterestPaid = 0;

    const schedule: AmortizationPoint[] = [];
    const subSchedules: Record<string, AmortizationPoint[]> = {};
    subLoans.forEach(l => subSchedules[l.id] = []);
    
    const annualData: AnnualDataPoint[] = [];

    // Calculate monthsElapsed for Primary Loan to align "m" (projection) with Loan Age
    let monthsElapsed = 0;
    if (scenario.startDate) {
        const start = new Date(scenario.startDate);
        const now = new Date();
        monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12;
        monthsElapsed -= start.getMonth();
        monthsElapsed += now.getMonth();
        if (monthsElapsed < 0) monthsElapsed = 0;
    }

    // Monthly Loop (Projection)
    for (let m = 1; m <= horizonMonths; m++) {
        const yearIndex = Math.ceil(m / 12);
        const loanAge = monthsElapsed + m; // Effective Age of loan at this projection month
        
        const date = new Date();
        date.setMonth(date.getMonth() + m);
        const calendarMonth = date.getMonth(); // 0-11
        
        // 1. Property Appreciation
        const monthlyAppreciation = currentFMV * (appreciationRate / 100 / 12);
        currentFMV += monthlyAppreciation;
        totalAppreciation += monthlyAppreciation;

        // 2. Loans
        let monthPrincipal = 0;
        let monthInterest = 0;
        let monthExtra = 0;
        let monthTotalPayment = 0; 

        // Primary
        if (primaryBal > 0) {
            const monthlyRate = scenario.interestRate / 100 / 12;
            const interest = primaryBal * monthlyRate;
            let pmt = calculateMonthlyPI(scenario.loanAmount, scenario.interestRate, scenario.loanTermYears);
            
            // Adjust PMT if paid off
            if (pmt > primaryBal + interest) pmt = primaryBal + interest;
            
            let principal = pmt - interest;
            
            // Extra Payments (APPLIED HERE FOR FUTURE)
            let extra = 0;
            
            // Monthly Extra - Check against Loan Age
            // FIX: Robust check for undefined delay
            const delay = scenario.extraPaymentDelayMonths || 0;
            if (loanAge > delay) {
                const freq = scenario.monthlyExtraPaymentFrequency || 'monthly';
                
                if (freq === 'annually') {
                    if (loanAge % 12 === 0) extra += scenario.monthlyExtraPayment;
                } else {
                    // Convert to monthly effective amount
                    extra += convertToMonthlyContribution(scenario.monthlyExtraPayment, freq);
                }
            }
            
            // One Time - Check against Loan Age
            // FIX: Robust check for undefined
            const oneTimeMonth = scenario.oneTimeExtraPaymentMonth || 0;
            if (loanAge === oneTimeMonth) {
                extra += scenario.oneTimeExtraPayment;
            }
            
            // Annual Lump Sum - Check against Calendar Month
            const lumpMonth = scenario.annualLumpSumMonth || 0;
            if (calendarMonth === lumpMonth) {
                extra += scenario.annualLumpSumPayment;
            }
            
            // Manual Override
            if (scenario.manualExtraPayments && scenario.manualExtraPayments[m] !== undefined) {
                const val = Number(scenario.manualExtraPayments[m]);
                extra = isNaN(val) ? 0 : val;
            }

            if (extra > primaryBal - principal) extra = primaryBal - principal;
            
            // Apply Extra to Principal
            principal += extra;
            
            // Deduct Total Principal from Balance
            primaryBal -= principal;
            if (primaryBal < 0) primaryBal = 0; 

            // Update Primary Accumulators
            primaryPrincipalPaid += principal;
            primaryExtraPaid += extra; // Track Extra
            primaryInterestPaid += interest;

            monthPrincipal += principal;
            monthInterest += interest;
            monthExtra += extra;
            monthTotalPayment += (interest + principal); 
        }

        // Sub Loans
        subLoans.forEach(l => {
            if (l.currentBal > 0) {
                const monthlyRate = l.rate / 100 / 12;
                const interest = l.currentBal * monthlyRate;
                let pmt = l.monthlyPI;
                if (pmt > l.currentBal + interest) pmt = l.currentBal + interest;
                let principal = pmt - interest;

                // Extra Payment Logic for Sub Loans
                let extra = 0;
                if (l.monthlyExtraPayment && l.monthlyExtraPayment > 0) {
                     const freq = l.monthlyExtraPaymentFrequency || 'monthly';
                     if (freq === 'annually') {
                         if (m % 12 === 0) extra += l.monthlyExtraPayment;
                     } else {
                         extra += convertToMonthlyContribution(l.monthlyExtraPayment, freq);
                     }
                }
                
                if (extra > l.currentBal - principal) extra = l.currentBal - principal;
                principal += extra;

                l.currentBal -= principal;
                if (l.currentBal < 0) l.currentBal = 0;

                l.accumulatedInterest += interest;
                l.accumulatedPrincipal += principal;
                l.accumulatedExtra += extra; // Track Sub Extra

                monthPrincipal += principal;
                monthInterest += interest;
                monthTotalPayment += (pmt + extra);

                subSchedules[l.id].push({
                    monthIndex: m,
                    date: '', 
                    balance: l.currentBal,
                    interest,
                    principal,
                    extraPayment: extra,
                    totalPayment: pmt + extra,
                    totalInterest: 0, 
                    totalTaxRefund: 0,
                    totalPaidToDate: 0,
                    equity: 0,
                    accumulatedRentalIncome: 0,
                    accumulatedRentalTax: 0,
                    accumulatedPropertyCosts: 0,
                    customExpenses: 0,
                    investmentBalance: 0,
                    investmentTax: 0
                });
            } else {
                 subSchedules[l.id].push({
                    monthIndex: m, date: '', balance: 0, interest: 0, principal: 0, extraPayment: 0, totalPayment: 0, 
                    totalInterest: 0, totalTaxRefund: 0, totalPaidToDate: 0, equity: 0, 
                    accumulatedRentalIncome: 0, accumulatedRentalTax: 0, accumulatedPropertyCosts: 0, 
                    customExpenses: 0, investmentBalance: 0, investmentTax: 0
                });
            }
        });

        // 3. Expenses
        let propTax = 0;
        let ins = 0;
        let hoa = 0;
        let pmi = 0;
        let repair = 0;
        
        if (scenario.includePropertyCosts !== false && includeHome) { 
             propTax = scenario.propertyTax / 12; 
             ins = (scenario.homeInsurance || 0) / 12;
             hoa = (scenario.hoa || 0) / 12;
             pmi = (scenario.pmi || 0) / 12; 
             
             if (scenario.useRepairRate && scenario.repairRate !== undefined) {
                 repair = (currentFMV * (scenario.repairRate / 100)) / 12;
             } else {
                 repair = (scenario.repair || 0) / 12;
             }
        }
        
        let customExp = (scenario.customExpenses || []).reduce((s, e) => s + e.amount, 0);

        totalTaxPaid += propTax;
        totalInsurancePaid += ins;
        totalHOAPaid += hoa;
        totalPMIPaid += pmi;
        totalCustomPaid += customExp;
        totalRepairPaid += repair;

        const propertyCosts = propTax + ins + hoa + pmi + customExp + repair;

        // 4. Rent (In or Out)
        let rentFlow = 0;
        let rentTax = 0;
        
        if (scenario.includeRent !== false) {
            const flowType = scenario.rentFlowType || (scenario.isRentOnly ? 'outflow' : 'inflow');

            if (flowType === 'outflow') {
                const currentRent = rentOutInput * Math.pow(1 + scenario.rentIncreasePerYear/100, (yearIndex-1));
                rentFlow = -currentRent; 
                totalRentPaid += currentRent;
            } else {
                const currentRent = rentInInput * Math.pow(1 + (scenario.rentIncreasePerYear || 0)/100, (yearIndex-1));
                if (currentRent > 0) {
                    rentFlow = currentRent; 
                    totalRentalIncome += currentRent;
                    if (scenario.rentalIncomeTaxEnabled) {
                        const taxable = currentRent - (propTax + ins + hoa + monthInterest + repair); 
                        if (taxable > 0) {
                            rentTax = taxable * (scenario.rentalIncomeTaxRate / 100);
                            totalRentalTax += rentTax;
                        }
                    }
                }
            }
        }

        // 5. Investment
        const monthlyInvRate = investRate / 100 / 12;
        const growth = investmentBal * monthlyInvRate;
        investmentBal += growth;
        
        const invTax = growth * (investTaxRate / 100);
        totalInvestmentTax += invTax;
        investmentBal -= invTax;

        let contribution = monthlyInvestContribution;
        
        if (scenario.includeInvestment !== false && scenario.isRentOnly && scenario.investMonthlySavings && baselineMonthlyPayment) {
            const rentCost = (scenario.includeRent !== false && (scenario.rentFlowType === 'outflow' || (scenario.rentFlowType === undefined && scenario.isRentOnly)))
                ? Math.abs(rentFlow)
                : 0;
                
            const outflow = rentCost + customExp + repair; 
            const savings = baselineMonthlyPayment - outflow;
            if (savings > 0) {
                contribution += savings;
            }
        }

        investmentBal += contribution;
        totalInvestmentContribution += contribution;

        // 6. Tax Refund (Mortgage Interest Deduction)
        let refund = 0;
        if (includeHome) {
            const deductible = monthInterest + propTax; 
            refund = deductible * (scenario.taxRefundRate / 100);
            totalTaxRefund += refund;
        }

        totalPrincipalPaid += monthPrincipal;
        totalInterestPaid += monthInterest;
        totalExtraPayments += monthExtra;

        const totalLoanBal = primaryBal + subLoans.reduce((s,l)=>s+l.currentBal,0);
        const totalPaidToDate = totalPrincipalPaid + totalInterestPaid + totalTaxPaid + totalInsurancePaid + totalHOAPaid + totalPMIPaid + totalCustomPaid + totalRepairPaid + totalRentalTax + totalRentPaid;

        schedule.push({
            monthIndex: m,
            date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            balance: totalLoanBal,
            interest: monthInterest,
            principal: monthPrincipal,
            extraPayment: monthExtra,
            totalPayment: monthTotalPayment + propertyCosts + (scenario.includeRent !== false && (scenario.rentFlowType === 'outflow' || (scenario.rentFlowType === undefined && scenario.isRentOnly)) ? Math.abs(rentFlow) : 0),
            totalInterest: totalInterestPaid,
            totalTaxRefund: totalTaxRefund,
            totalPaidToDate: totalPaidToDate,
            equity: currentFMV - totalLoanBal,
            accumulatedRentalIncome: totalRentalIncome,
            accumulatedRentalTax: totalRentalTax,
            accumulatedPropertyCosts: totalTaxPaid + totalInsurancePaid + totalHOAPaid + totalPMIPaid + totalCustomPaid + totalRepairPaid,
            customExpenses: customExp,
            investmentBalance: investmentBal,
            investmentTax: totalInvestmentTax
        });

        if (m % 12 === 0 || m === horizonMonths) {
            const closingCostsEffect = (scenario.enableSelling !== false && includeHome) ? (scenario.closingCosts || 0) : 0;
            const customClosingEffect = (scenario.enableSelling !== false && includeHome) ? (scenario.customClosingCosts?.reduce((s,c)=>s+c.amount,0)||0) : 0;
            const downPaymentEffect = includeHome ? (scenario.downPayment || 0) : 0;

            const totalOutflow = totalPrincipalPaid + totalInterestPaid + totalTaxPaid + totalInsurancePaid + totalHOAPaid + totalPMIPaid + totalCustomPaid + totalRepairPaid + totalRentalTax + totalInvestmentContribution + totalRentPaid + closingCostsEffect + customClosingEffect;
            const totalInflow = totalRentalIncome + totalTaxRefund; 

            const netWorth = (currentFMV - totalLoanBal) + investmentBal;
            
            const oop = totalOutflow - totalInflow; 
            
            const sellingCost = (scenario.enableSelling !== false && includeHome) ? (currentFMV * (scenario.sellingCostRate / 100)) : 0;
            const recoverableEquity = Math.max(0, currentFMV - sellingCost - totalLoanBal);
            const trueCost = oop - recoverableEquity - investmentBal;

            annualData.push({
                label: `Year ${Math.ceil(m/12)}`,
                year: Math.ceil(m/12),
                homeEquity: currentFMV - totalLoanBal,
                investmentValue: investmentBal,
                returnedCapital: 0,
                netWorth: netWorth,
                netCost: trueCost,
                totalGain: 0, 
                netProfit: netWorth - oop,
                outOfPocket: oop,
                trueCost: trueCost,
                cumulativeInflow: totalInflow + totalAppreciation + instantEquity + (investmentBal - totalInvestmentContribution),
                cumulativeOutflow: totalOutflow
            });
        }
    }

    const primaryLoanFees = (scenario.primaryLoanExpenses || []).reduce((sum, e) => sum + e.amount, 0);
    const additionalLoanFees = (scenario.additionalLoans || []).reduce((sum, l) => {
        return sum + (l.oneTimeExpenses || []).reduce((s, e) => s + e.amount, 0);
    }, 0);
    const totalLoanFees = primaryLoanFees + additionalLoanFees;
    
    const sellingCosts = (scenario.enableSelling !== false && includeHome) ? (currentFMV * (scenario.sellingCostRate / 100)) : 0;
    const closingCostsFinal = (scenario.enableSelling !== false && includeHome) ? (scenario.closingCosts || 0) : 0;
    const customClosingFinal = (scenario.enableSelling !== false && includeHome) ? (scenario.customClosingCosts?.reduce((s,c)=>s+c.amount,0)||0) : 0;
    const downPaymentFinal = includeHome ? (scenario.downPayment || 0) : 0;

    let capitalGainsTax = 0;
    let taxableCapitalGains = 0;
    let capitalGainsExclusion = 0;

    if (scenario.enableSelling !== false && includeHome) {
        const gain = currentFMV - sellingCosts - scenario.homeValue; 
        
        if (gain > 0) {
            let taxable = gain;
            if (scenario.primaryResidenceExclusion === true) { 
                capitalGainsExclusion = 250000; 
                taxable = Math.max(0, taxable - capitalGainsExclusion);
            }
            taxableCapitalGains = taxable;
            capitalGainsTax = taxable * (scenario.capitalGainsTaxRate / 100);
        }
    }

    const totalEndLoanBal = primaryBal + subLoans.reduce((s,l)=>s+l.currentBal,0);

    const finalNetWorth = (currentFMV - totalEndLoanBal) + investmentBal;
    const liquidNetWorth = (Math.max(0, currentFMV - sellingCosts - capitalGainsTax - totalEndLoanBal)) + investmentBal;
    
    const totalCashInvested = 
        downPaymentFinal + 
        closingCostsFinal + 
        customClosingFinal +
        totalLoanFees + 
        investCapital + 
        totalInvestmentContribution +
        (totalPrincipalPaid + totalInterestPaid + totalTaxPaid + totalInsurancePaid + totalHOAPaid + totalPMIPaid + totalCustomPaid + totalRepairPaid + totalRentalTax + totalRentPaid - totalRentalIncome - totalTaxRefund); 
    
    const profit = liquidNetWorth - totalCashInvested;
    const netCost = totalCashInvested - liquidNetWorth;

    let lifetimeInterestSaved = 0;
    let monthsSaved = 0;
    let baselinePayoffDate = '';
    
    const hasExtras = scenario.monthlyExtraPayment > 0 || scenario.oneTimeExtraPayment > 0 || scenario.annualLumpSumPayment > 0 || (scenario.manualExtraPayments && Object.keys(scenario.manualExtraPayments).length > 0);

    if (hasExtras && includeHome && startingPrimaryBal > 0) {
        const maxMonths = 1200; 
        const monthlyRate = scenario.interestRate / 100 / 12;
        const fixedPmt = calculateMonthlyPI(scenario.loanAmount, scenario.interestRate, scenario.loanTermYears);
        
        // 1. Baseline Lifetime (No Extra)
        let baseLifeInt = 0;
        let baseLifeMonths = 0;
        let tempBal = startingPrimaryBal;
        while(tempBal > 0.1 && baseLifeMonths < maxMonths) {
            baseLifeMonths++;
            const int = tempBal * monthlyRate;
            let prin = fixedPmt - int;
            if (prin > tempBal + int) prin = tempBal + int; 
            if (prin < 0) prin = 0; 
            
            const principalPart = Math.min(prin, tempBal); 
            
            tempBal -= principalPart;
            baseLifeInt += int;
        }
        
        // 2. Actual Lifetime (With Extra)
        let actLifeInt = 0;
        let actLifeMonths = 0;
        tempBal = startingPrimaryBal;
        
        const now = new Date(); 
        
        while(tempBal > 0.1 && actLifeMonths < maxMonths) {
            actLifeMonths++;
            const loanAge = monthsElapsed + actLifeMonths;
            const simDate = new Date(now);
            simDate.setMonth(simDate.getMonth() + actLifeMonths);
            
            const int = tempBal * monthlyRate;
            let prin = fixedPmt - int; 
            
            let extra = 0;
            // FIX: Robust check for undefined
            const delay = scenario.extraPaymentDelayMonths || 0;
            if (loanAge > delay) {
                 const freq = scenario.monthlyExtraPaymentFrequency || 'monthly';
                if (freq === 'annually') {
                    if (loanAge % 12 === 0) extra += scenario.monthlyExtraPayment;
                } else {
                    extra += convertToMonthlyContribution(scenario.monthlyExtraPayment, freq);
                }
            }
            
            // FIX: Robust check for undefined
            const oneTimeMonth = scenario.oneTimeExtraPaymentMonth || 0;
            if (loanAge === oneTimeMonth) extra += scenario.oneTimeExtraPayment;
            
            const lumpMonth = scenario.annualLumpSumMonth || 0;
            if (simDate.getMonth() === lumpMonth) extra += scenario.annualLumpSumPayment;
            
            if (scenario.manualExtraPayments && scenario.manualExtraPayments[actLifeMonths] !== undefined) {
                const val = Number(scenario.manualExtraPayments[actLifeMonths]);
                extra = isNaN(val) ? 0 : val;
            }
            
            const totalPlannedPayment = fixedPmt + extra;
            const maxNeeded = tempBal + int;
            const actualPayment = Math.min(totalPlannedPayment, maxNeeded);
            const actualPrincipal = Math.max(0, actualPayment - int);
            
            tempBal -= actualPrincipal;
            actLifeInt += int;
        }
        
        lifetimeInterestSaved = baseLifeInt - actLifeInt;
        monthsSaved = baseLifeMonths - actLifeMonths;
        
        if (scenario.startDate) {
            const d = new Date(scenario.startDate);
            d.setMonth(d.getMonth() + monthsElapsed + baseLifeMonths);
            baselinePayoffDate = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
    }

    const primaryPI = includeHome ? calculateMonthlyPI(scenario.loanAmount, scenario.interestRate, scenario.loanTermYears) : 0;
    const subLoansPI = subLoans.reduce((sum, l) => sum + l.monthlyPI, 0);
    
    let initialRepair = 0;
    if (scenario.includePropertyCosts !== false && includeHome) {
         if (scenario.useRepairRate && scenario.repairRate !== undefined) {
             initialRepair = (startFMV * (scenario.repairRate / 100)) / 12;
         } else {
             initialRepair = (scenario.repair || 0) / 12;
         }
    }

    const monthlyPITI = primaryPI + subLoansPI + ((scenario.includePropertyCosts!==false && includeHome) ? (scenario.propertyTax / 12) + ((scenario.homeInsurance || 0) / 12) + ((scenario.hoa || 0) / 12) + ((scenario.pmi || 0) / 12) : 0) + initialRepair;
    
    const monthlyCustomExpenses = (scenario.customExpenses || []).reduce((s, e) => s + e.amount, 0);
    const totalMonthlyPayment = monthlyPITI + monthlyCustomExpenses;

    const monthlyRentEffect = (scenario.includeRent !== false) 
        ? ((scenario.rentFlowType === 'outflow' || (scenario.rentFlowType === undefined && scenario.isRentOnly)) 
            ? 0 
            : (rentInInput || 0)) 
        : 0;

    const netMonthlyPayment = monthlyPITI - monthlyRentEffect;

    const loanBreakdown: LoanBreakdown[] = [
        {
            id: 'primary',
            name: 'Primary Loan',
            principalPaid: primaryPrincipalPaid,
            extraPrincipalPaid: primaryExtraPaid,
            interestPaid: primaryInterestPaid,
            totalPaid: primaryPrincipalPaid + primaryInterestPaid, 
            remainingBalance: primaryBal
        },
        ...subLoans.map(l => ({
            id: l.id,
            name: l.name,
            principalPaid: l.accumulatedPrincipal, 
            extraPrincipalPaid: l.accumulatedExtra,
            interestPaid: l.accumulatedInterest, 
            totalPaid: l.accumulatedPrincipal + l.accumulatedInterest,
            remainingBalance: l.currentBal
        }))
    ];

    return {
        id: scenario.id,
        monthlyPrincipalAndInterest: includeHome ? calculateMonthlyPI(scenario.loanAmount, scenario.interestRate, scenario.loanTermYears) : 0,
        monthlyFirstPI: 0, 
        monthlyTax: (scenario.includePropertyCosts!==false && includeHome) ? scenario.propertyTax / 12 : 0,
        monthlyInsurance: (scenario.includePropertyCosts!==false && includeHome) ? (scenario.homeInsurance || 0) / 12 : 0,
        monthlyHOA: (scenario.includePropertyCosts!==false && includeHome) ? (scenario.hoa || 0) / 12 : 0,
        monthlyPMI: (scenario.includePropertyCosts!==false && includeHome) ? (scenario.pmi || 0) / 12 : 0,
        monthlyCustomExpenses,
        monthlyRepair: initialRepair,
        totalMonthlyPayment, 
        netMonthlyPayment,
        
        totalPaid: totalPrincipalPaid + totalInterestPaid + totalTaxPaid + totalInsurancePaid + totalHOAPaid + totalPMIPaid + totalCustomPaid + totalRepairPaid + totalRentalTax + totalRentPaid,
        totalRentPaid,

        totalInterest: totalInterestPaid,
        totalEquityBuilt: currentFMV - totalEndLoanBal,
        taxRefund: totalTaxRefund,
        netCost,
        
        principalPaid: totalPrincipalPaid,
        totalAppreciation,
        accumulatedRentalIncome: totalRentalIncome,
        totalRentalTax,
        totalPropertyCosts: totalTaxPaid + totalInsurancePaid + totalHOAPaid + totalPMIPaid + totalRepairPaid,
        totalCustomExpenses: totalCustomPaid,
        totalLoanFees,

        futureHomeValue: currentFMV,
        remainingBalance: totalEndLoanBal,
        startingBalance: startingPrimaryBal,
        equity: currentFMV - totalEndLoanBal,
        netWorth: finalNetWorth,
        investmentPortfolio: investmentBal,
        instantEquity,
        
        profit,
        totalCashInvested,
        averageEquityPerMonth: 0,
        totalExtraPrincipal: totalExtraPayments,
        totalInvestmentContribution,
        totalInvestmentTax,

        payoffDate: primaryBal === 0 ? schedule.find(p => p.balance === 0)?.date || 'Paid' : 'Not Paid',
        amortizationSchedule: schedule,
        subSchedules,
        annualData,
        
        breakEvenMonths: 0,
        sellingCosts,
        capitalGainsTax,
        taxableCapitalGains,
        capitalGainsExclusion,
        
        totalInvestedAmount: totalCashInvested,
        initialCapitalBase: investCapital,
        effectiveAnnualReturn: (profit / totalCashInvested) * 100 / (horizonMonths / 12), 

        lifetimeInterestSaved: lifetimeInterestSaved, 
        monthsSaved: monthsSaved,
        interestSavedAtHorizon: 0,
        
        baselineTotalInterest: 0,
        baselinePayoffDate: baselinePayoffDate,
        baselineTotalPaid: 0,
        
        loanBreakdown
    };
};
