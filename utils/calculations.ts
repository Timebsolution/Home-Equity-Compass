
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
    switch (frequency) {
        case 'weekly': return amount * 52 / 12;
        case 'biweekly': return amount * 26 / 12;
        case 'monthly': return amount;
        case 'semiannually': return amount * 2 / 12;
        case 'annually': return amount / 12;
        default: return amount;
    }
};

// Calculate current balance based on amortization from a start date
export const calculateCurrentBalance = (
    originalBalance: number,
    annualRate: number,
    termYears: number,
    startDateStr?: string
): number => {
    if (!startDateStr) return originalBalance;

    const start = new Date(startDateStr);
    const now = new Date();
    // Calculate full months elapsed (approximate, simple difference)
    let months = (now.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += now.getMonth();
    
    // If loan is in the future, balance is original
    if (months <= 0) return originalBalance;

    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = termYears * 12;
    
    // If 0% interest
    if (monthlyRate === 0) {
        const paid = (originalBalance / totalMonths) * months;
        return Math.max(0, originalBalance - paid);
    }

    const factorN = Math.pow(1 + monthlyRate, totalMonths);
    const factorP = Math.pow(1 + monthlyRate, months);

    // Remaining Balance Formula
    // B_k = L * [ (1+i)^n - (1+i)^k ] / [ (1+i)^n - 1 ]
    const balance = originalBalance * (factorN - factorP) / (factorN - 1);
    
    return Math.max(0, balance);
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
    return balance * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
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
    // FMV logic: If originalFmv is set and > 0, use it. Else default to Purchase Price (homeValue).
    const startFMV = (scenario.originalFmv && scenario.originalFmv > 0) ? scenario.originalFmv : scenario.homeValue;
    let currentFMV = includeHome ? startFMV : 0;
    
    // Instant Equity (Difference between what it's worth vs what you paid)
    const instantEquity = includeHome ? (startFMV - scenario.homeValue) : 0;
    
    // Loan Init
    // Primary
    let primaryBal = includeHome ? calculateCurrentBalance(scenario.loanAmount, scenario.interestRate, scenario.loanTermYears, scenario.startDate) : 0;
    
    // Additional Loans
    const subLoans = (scenario.additionalLoans || []).map(l => ({
        ...l,
        currentBal: includeHome ? calculateCurrentBalance(l.balance, l.rate, l.years, l.startDate) : 0,
        monthlyPI: includeHome ? calculateMonthlyPI(l.balance, l.rate, l.years) : 0
    }));

    let investmentBal = investCapital;
    
    // Accumulators
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    let totalTaxPaid = 0;
    let totalInsurancePaid = 0;
    let totalHOAPaid = 0;
    let totalPMIPaid = 0;
    let totalCustomPaid = 0;
    let totalRentalIncome = 0;
    let totalRentPaid = 0; // New
    let totalRentalTax = 0;
    let totalInvestmentTax = 0;
    let totalInvestmentContribution = 0;
    let totalTaxRefund = 0;
    let totalAppreciation = 0;
    let totalExtraPayments = 0;

    const schedule: AmortizationPoint[] = [];
    const subSchedules: Record<string, AmortizationPoint[]> = {};
    subLoans.forEach(l => subSchedules[l.id] = []);
    
    const annualData: AnnualDataPoint[] = [];

    // Monthly Loop
    for (let m = 1; m <= horizonMonths; m++) {
        const yearIndex = Math.ceil(m / 12);
        
        // 1. Property Appreciation (Based on FMV, not Purchase Price)
        const monthlyAppreciation = currentFMV * (appreciationRate / 100 / 12);
        currentFMV += monthlyAppreciation;
        totalAppreciation += monthlyAppreciation;

        // 2. Loans
        let monthPrincipal = 0;
        let monthInterest = 0;
        let monthExtra = 0;
        let monthTotalPayment = 0; // P&I + Extra

        // Primary
        if (primaryBal > 0) {
            const monthlyRate = scenario.interestRate / 100 / 12;
            const interest = primaryBal * monthlyRate;
            let pmt = calculateMonthlyPI(scenario.loanAmount, scenario.interestRate, scenario.loanTermYears);
            
            // Adjust PMT if paid off
            if (pmt > primaryBal + interest) pmt = primaryBal + interest;
            
            let principal = pmt - interest;
            
            // Extra Payments
            let extra = 0;
            // Monthly Extra
            if (m > scenario.extraPaymentDelayMonths) {
                if (scenario.monthlyExtraPaymentFrequency === 'annually') {
                    if (m % 12 === 0) extra += scenario.monthlyExtraPayment;
                } else {
                    extra += scenario.monthlyExtraPayment;
                }
            }
            // One Time
            if (m === scenario.oneTimeExtraPaymentMonth) {
                extra += scenario.oneTimeExtraPayment;
            }
            // Annual Lump Sum
            if ((m - 1) % 12 === scenario.annualLumpSumMonth) {
                extra += scenario.annualLumpSumPayment;
            }
            // Manual Override
            if (scenario.manualExtraPayments && scenario.manualExtraPayments[m] !== undefined) {
                extra = scenario.manualExtraPayments[m];
            }

            if (extra > primaryBal - principal) extra = primaryBal - principal;
            
            principal += extra;
            primaryBal -= principal;
            if (primaryBal < 0) primaryBal = 0; // safety

            monthPrincipal += principal;
            monthInterest += interest;
            monthExtra += extra;
            monthTotalPayment += (interest + principal); // Includes extra
        }

        // Sub Loans
        subLoans.forEach(l => {
            if (l.currentBal > 0) {
                const monthlyRate = l.rate / 100 / 12;
                const interest = l.currentBal * monthlyRate;
                let pmt = l.monthlyPI;
                if (pmt > l.currentBal + interest) pmt = l.currentBal + interest;
                const principal = pmt - interest;
                
                l.currentBal -= principal;
                if (l.currentBal < 0) l.currentBal = 0;

                monthPrincipal += principal;
                monthInterest += interest;
                monthTotalPayment += pmt;

                // Sub Schedule recording
                subSchedules[l.id].push({
                    monthIndex: m,
                    date: '', // filled later
                    balance: l.currentBal,
                    interest,
                    principal,
                    extraPayment: 0,
                    totalPayment: pmt,
                    totalInterest: 0, // accum later
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
        
        // Property Costs logic with Toggle
        if (scenario.includePropertyCosts !== false && includeHome) { // Defaults to true, must have home
            if (!scenario.isRentOnly && !scenario.isInvestmentOnly) {
                // Property Tax usually based on Assessed Value (Purchase Price initially), 
                // but strictly speaking assessments lag. We will use Purchase Price (homeValue) for tax base
                // unless user specifically inputs a fixed amount.
                // Note: User can toggle rate based vs fixed. 
                propTax = scenario.propertyTax / 12; 
                ins = (scenario.homeInsurance || 0) / 12;
                hoa = (scenario.hoa || 0) / 12;
                pmi = (scenario.pmi || 0) / 12; 
            }
        }
        
        let customExp = (scenario.customExpenses || []).reduce((s, e) => s + e.amount, 0);

        totalTaxPaid += propTax;
        totalInsurancePaid += ins;
        totalHOAPaid += hoa;
        totalPMIPaid += pmi;
        totalCustomPaid += customExp;

        const propertyCosts = propTax + ins + hoa + pmi + customExp;

        // 4. Rent (In or Out)
        let rentFlow = 0;
        let rentTax = 0;
        
        if (scenario.includeRent !== false) {
            const flowType = scenario.rentFlowType || (scenario.isRentOnly ? 'outflow' : 'inflow');

            if (flowType === 'outflow') {
                // Outflow Logic (Expense)
                const currentRent = rentOutInput * Math.pow(1 + scenario.rentIncreasePerYear/100, (yearIndex-1));
                rentFlow = -currentRent; 
                totalRentPaid += currentRent;
            } else {
                // Inflow Logic (Income)
                const currentRent = rentInInput * Math.pow(1 + (scenario.rentIncreasePerYear || 0)/100, (yearIndex-1));
                if (currentRent > 0) {
                    rentFlow = currentRent; // Positive flow tracking
                    totalRentalIncome += currentRent;
                    if (scenario.rentalIncomeTaxEnabled) {
                        // Deduct effective property costs for tax calculation
                        const taxable = currentRent - (propTax + ins + hoa + monthInterest); 
                        if (taxable > 0) {
                            rentTax = taxable * (scenario.rentalIncomeTaxRate / 100);
                            totalRentalTax += rentTax;
                        }
                    }
                }
            }
        }

        // 5. Investment
        // Growth
        const monthlyInvRate = investRate / 100 / 12;
        const growth = investmentBal * monthlyInvRate;
        investmentBal += growth;
        
        // Tax on growth (if annually? simplified monthly accrual)
        const invTax = growth * (investTaxRate / 100);
        totalInvestmentTax += invTax;
        investmentBal -= invTax;

        // Contribution
        let contribution = monthlyInvestContribution;
        
        // "Invest the difference" logic
        if (scenario.isRentOnly && scenario.investMonthlySavings && baselineMonthlyPayment) {
            const rentCost = (scenario.includeRent !== false && (scenario.rentFlowType === 'outflow' || (scenario.rentFlowType === undefined && scenario.isRentOnly)))
                ? Math.abs(rentFlow)
                : 0;
                
            const outflow = rentCost + customExp; 
            const savings = baselineMonthlyPayment - outflow;
            if (savings > 0) {
                contribution += savings;
            }
        }

        investmentBal += contribution;
        totalInvestmentContribution += contribution;

        // 6. Tax Refund (Mortgage Interest Deduction)
        let refund = 0;
        if (!scenario.isRentOnly && !scenario.isInvestmentOnly) {
            // Deductible is Interest + Property Tax (if property costs enabled)
            const deductible = monthInterest + propTax; 
            refund = deductible * (scenario.taxRefundRate / 100);
            totalTaxRefund += refund;
        }

        totalPrincipalPaid += monthPrincipal;
        totalInterestPaid += monthInterest;
        totalExtraPayments += monthExtra;

        // Record Point
        const date = new Date();
        date.setMonth(date.getMonth() + m);
        
        const totalLoanBal = primaryBal + subLoans.reduce((s,l)=>s+l.currentBal,0);
        
        schedule.push({
            monthIndex: m,
            date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            balance: totalLoanBal,
            interest: monthInterest,
            principal: monthPrincipal,
            extraPayment: monthExtra,
            totalPayment: monthTotalPayment + propertyCosts + (scenario.includeRent !== false && (scenario.rentFlowType === 'outflow' || (scenario.rentFlowType === undefined && scenario.isRentOnly)) ? Math.abs(rentFlow) : 0), // Cash outflow
            totalInterest: totalInterestPaid,
            totalTaxRefund: totalTaxRefund,
            totalPaidToDate: totalPrincipalPaid + totalInterestPaid + totalTaxPaid + totalInsurancePaid + totalHOAPaid + totalPMIPaid + totalCustomPaid + totalExtraPayments + totalRentPaid,
            equity: currentFMV - totalLoanBal,
            accumulatedRentalIncome: totalRentalIncome,
            accumulatedRentalTax: totalRentalTax,
            accumulatedPropertyCosts: totalTaxPaid + totalInsurancePaid + totalHOAPaid + totalPMIPaid + totalCustomPaid,
            customExpenses: customExp,
            investmentBalance: investmentBal,
            investmentTax: totalInvestmentTax
        });

        // Annual Data Point
        if (m % 12 === 0 || m === horizonMonths) {
            const closingCostsEffect = (scenario.enableSelling !== false && includeHome) ? (scenario.closingCosts || 0) : 0;
            const customClosingEffect = (scenario.enableSelling !== false && includeHome) ? (scenario.customClosingCosts?.reduce((s,c)=>s+c.amount,0)||0) : 0;
            const downPaymentEffect = includeHome ? (scenario.downPayment || 0) : 0;

            const totalOutflow = totalPrincipalPaid + totalInterestPaid + totalTaxPaid + totalInsurancePaid + totalHOAPaid + totalPMIPaid + totalCustomPaid + totalRentalTax + totalInvestmentTax + totalInvestmentContribution + totalRentPaid + closingCostsEffect + customClosingEffect;
            const totalInflow = totalRentalIncome + totalTaxRefund; 

            const netWorth = (currentFMV - totalLoanBal) + investmentBal;
            
            // Out of Pocket
            const oop = totalOutflow - totalInflow; // Net Cash Spent
            
            // Net Cost (True Cost)
            // Recoverable Equity = (FMV - SellingCosts - Loan)
            // Note: Selling Costs based on current FMV
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
                // Net profit considers initial instant equity as wealth but doesn't cost anything.
                // Profit = Net Worth - Total Invested (Down + Closing + Monthly Costs)
                // Down Payment is based on PURCHASE Price.
                netProfit: netWorth - (downPaymentEffect + closingCostsEffect + customClosingEffect + totalInvestmentContribution + (scenario.investmentCapital||0)),
                outOfPocket: oop,
                trueCost: trueCost,
                cumulativeInflow: totalInflow + totalAppreciation + instantEquity + (investmentBal - totalInvestmentContribution),
                cumulativeOutflow: totalOutflow
            });
        }
    }

    // Wrap up Summary
    // One time fees
    const primaryLoanFees = (scenario.primaryLoanExpenses || []).reduce((sum, e) => sum + e.amount, 0);
    const additionalLoanFees = (scenario.additionalLoans || []).reduce((sum, l) => {
        return sum + (l.oneTimeExpenses || []).reduce((s, e) => s + e.amount, 0);
    }, 0);
    const totalLoanFees = primaryLoanFees + additionalLoanFees;
    
    // Final Selling based on FMV
    const sellingCosts = (scenario.enableSelling !== false && includeHome) ? (currentFMV * (scenario.sellingCostRate / 100)) : 0;
    const closingCostsFinal = (scenario.enableSelling !== false && includeHome) ? (scenario.closingCosts || 0) : 0;
    const customClosingFinal = (scenario.enableSelling !== false && includeHome) ? (scenario.customClosingCosts?.reduce((s,c)=>s+c.amount,0)||0) : 0;
    const downPaymentFinal = includeHome ? (scenario.downPayment || 0) : 0;

    // Capital Gains Tax
    // Basis = Purchase Price + Improvements (Ignored here)
    // Gain = Sale Price (FMV) - Selling Costs - Basis
    let capitalGainsTax = 0;
    let taxableCapitalGains = 0;
    let capitalGainsExclusion = 0;

    if (scenario.enableSelling !== false && !scenario.isRentOnly && !scenario.isInvestmentOnly && includeHome) {
        // Gain is based on Purchase Price vs Current FMV
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

    // Profit
    const finalNetWorth = (currentFMV - totalEndLoanBal) + investmentBal;
    const liquidNetWorth = (Math.max(0, currentFMV - sellingCosts - capitalGainsTax - totalEndLoanBal)) + investmentBal;
    
    const totalCashInvested = 
        downPaymentFinal + 
        closingCostsFinal + 
        customClosingFinal +
        totalLoanFees + 
        investCapital + 
        totalInvestmentContribution +
        (totalPrincipalPaid + totalInterestPaid + totalTaxPaid + totalInsurancePaid + totalHOAPaid + totalPMIPaid + totalCustomPaid + totalRentalTax + totalExtraPayments + totalInvestmentTax + totalRentPaid - totalRentalIncome - totalTaxRefund); // Net Monthly Cash Flow sum
    
    const profit = liquidNetWorth - totalCashInvested;
    const netCost = totalCashInvested - liquidNetWorth;

    // Monthly Averages for UI
    const totalMonthlyPayment = schedule[0]?.totalPayment || 0; // First month snapshot
    
    const monthlyRentEffect = (scenario.includeRent !== false) 
        ? ((scenario.rentFlowType === 'outflow' || (scenario.rentFlowType === undefined && scenario.isRentOnly)) 
            ? 0 // It's an expense, so it adds to payment via TotalPayment, doesn't reduce PITI. 
            : (rentInInput || 0)) // It's income, so it reduces PITI.
        : 0;
    
    const primaryPI = includeHome ? calculateMonthlyPI(scenario.loanAmount, scenario.interestRate, scenario.loanTermYears) : 0;
    const subLoansPI = subLoans.reduce((sum, l) => sum + l.monthlyPI, 0);
    const monthlyPITI = primaryPI + subLoansPI + ((scenario.includePropertyCosts!==false && includeHome) ? (scenario.propertyTax / 12) + ((scenario.homeInsurance || 0) / 12) + ((scenario.hoa || 0) / 12) + ((scenario.pmi || 0) / 12) : 0);
    
    const netMonthlyPayment = monthlyPITI - monthlyRentEffect;

    // Loan Breakdown for chart
    const loanBreakdown: LoanBreakdown[] = [
        {
            id: 'primary',
            name: 'Primary Loan',
            principalPaid: totalPrincipalPaid,
            interestPaid: totalInterestPaid,
            totalPaid: totalPrincipalPaid + totalInterestPaid + totalExtraPayments,
            remainingBalance: primaryBal
        },
        ...subLoans.map(l => ({
            id: l.id,
            name: l.name,
            principalPaid: (l.balance - l.currentBal), 
            interestPaid: 0, 
            totalPaid: 0,
            remainingBalance: l.currentBal
        }))
    ];

    return {
        id: scenario.id,
        monthlyPrincipalAndInterest: includeHome ? calculateMonthlyPI(scenario.loanAmount, scenario.interestRate, scenario.loanTermYears) : 0,
        monthlyFirstPI: 0, // unused
        monthlyTax: (scenario.includePropertyCosts!==false && includeHome) ? scenario.propertyTax / 12 : 0,
        monthlyInsurance: (scenario.includePropertyCosts!==false && includeHome) ? (scenario.homeInsurance || 0) / 12 : 0,
        monthlyHOA: (scenario.includePropertyCosts!==false && includeHome) ? (scenario.hoa || 0) / 12 : 0,
        monthlyPMI: (scenario.includePropertyCosts!==false && includeHome) ? (scenario.pmi || 0) / 12 : 0,
        monthlyCustomExpenses: (scenario.customExpenses || []).reduce((s, e) => s + e.amount, 0),
        totalMonthlyPayment,
        netMonthlyPayment,
        
        totalPaid: totalPrincipalPaid + totalInterestPaid + totalExtraPayments + totalTaxPaid + totalInsurancePaid + totalHOAPaid + totalPMIPaid + totalCustomPaid + totalRentalTax + totalInvestmentTax + totalRentPaid,
        totalRentPaid,

        totalInterest: totalInterestPaid,
        totalEquityBuilt: currentFMV - totalEndLoanBal,
        taxRefund: totalTaxRefund,
        netCost,
        
        principalPaid: totalPrincipalPaid,
        totalAppreciation,
        accumulatedRentalIncome: totalRentalIncome,
        totalRentalTax,
        totalPropertyCosts: totalTaxPaid + totalInsurancePaid + totalHOAPaid + totalPMIPaid,
        totalCustomExpenses: totalCustomPaid,
        totalLoanFees,

        futureHomeValue: currentFMV,
        remainingBalance: totalEndLoanBal,
        startingBalance: includeHome ? calculateCurrentBalance(scenario.loanAmount, scenario.interestRate, scenario.loanTermYears, scenario.startDate) : 0,
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
        effectiveAnnualReturn: (profit / totalCashInvested) * 100 / (horizonMonths / 12), // simple annualized ROI

        lifetimeInterestSaved: 0, 
        monthsSaved: 0,
        interestSavedAtHorizon: 0,
        
        baselineTotalInterest: 0,
        baselinePayoffDate: '',
        baselineTotalPaid: 0,
        
        loanBreakdown
    };
};
