

export interface LoanScenario {
  id: string;
  name: string;
  color: string;
  isRentOnly: boolean;
  isInvestmentOnly?: boolean; 
  includeHome?: boolean; // New: Toggle entire house/loan section

  // Asset
  homeValue: number; // This is now treated as "Purchase Price"
  originalFmv?: number; // New: Fair Market Value at start (for Instant Equity)
  lockFMV: boolean;

  // Loans
  startDate?: string; // Mortgage Start Date YYYY-MM-DD
  loanAmount: number; // Primary Loan
  lockLoan: boolean; // Global Sync Lock
  primaryBalanceLocked?: boolean; // Correlation Calculation Lock
  manualCurrentBalance?: number; // New: Manual Override for Current Balance
  primaryLoanExpenses?: CustomExpense[]; // New: One-time expenses for primary loan
  interestRate: number;
  loanTermYears: number; 
  
  // New: Dynamic Additional Loans (Solar, 2nd Mortgage, etc.)
  additionalLoans: AdditionalLoan[];

  // Annual Expenses ($)
  includePropertyCosts?: boolean; // New: Toggle calculation
  propertyTax: number;
  propertyTaxRate: number; 
  usePropertyTaxRate: boolean; 
  
  homeInsurance: number;
  homeInsuranceRate?: number; // New
  useHomeInsuranceRate?: boolean; // New

  hoa: number;
  hoaRate?: number; // New
  useHoaRate?: boolean; // New

  pmi: number;
  pmiRate?: number; // New
  usePmiRate?: boolean; // New
  
  // Repair
  repair?: number;
  repairRate?: number;
  useRepairRate?: boolean;
  
  // Custom Expenses (Monthly)
  customExpenses: CustomExpense[];

  // Tax Benefit
  taxRefundRate: number; 

  // Cash / Payments
  downPayment: number; // Cash Down Payment (Out of Pocket)
  existingEquity?: number; // Equity already in the house (Not Out of Pocket)
  lockExistingEquity?: boolean; // Lock for Existing Equity slider
  
  // Selling & Buying Costs
  enableSelling: boolean; // New: Toggle for selling logic
  closingCosts: number; // Standard Buying closing costs
  customClosingCosts?: CustomExpense[]; // New: Extra renameable closing costs
  sellingCostRate: number; 
  capitalGainsTaxRate: number; 
  primaryResidenceExclusion?: boolean; // New: Toggle for $250k exclusion
  
  // Extra Payment Strategies
  extraPaymentDelayMonths: number;
  oneTimeExtraPayment: number;
  oneTimeExtraPaymentMonth: number;
  monthlyExtraPayment: number;
  monthlyExtraPaymentFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'semiannually' | 'annually'; 
  
  // True Annual Lump Sum
  annualLumpSumPayment: number; 
  annualLumpSumMonth: number; // 0-11 (Jan-Dec)

  manualExtraPayments?: Record<number, number>; 
  
  // Income (Buy Mode)
  rentalIncome: number;
  lockRentIncome: boolean;
  rentalIncomeTaxEnabled: boolean; 
  rentalIncomeTaxRate: number; 

  // Rent Mode Specifics
  includeRent?: boolean; // New: Toggle rent calculation
  rentFlowType?: 'inflow' | 'outflow'; // New: Explicit income vs expense
  rentMonthly: number;
  lockRent?: boolean; 
  rentIncreasePerYear: number;
  rentIncludeTax: boolean; 
  rentTaxRate: number; 
  
  // Investment Mode Specifics
  investmentCapital?: number;
  lockInvestment: boolean; 
  investmentMonthly?: number;
  investmentContributionFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'semiannually' | 'annually'; 
  investmentRate?: number;
  investMonthlySavings: boolean; 
  includeInvestment?: boolean; 
  investmentTaxRate?: number; 
}

export interface AdditionalLoan {
  id: string;
  name: string;
  balance: number;
  rate: number;
  years: number;
  startDate?: string;
  locked?: boolean; // Calculation Lock
  oneTimeExpenses?: CustomExpense[]; // New: One-time expenses specific to this loan
  monthlyExtraPayment?: number;
  monthlyExtraPaymentFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'semiannually' | 'annually';
}

export interface CustomExpense {
  id: string;
  name: string;
  amount: number; // Amount (Monthly for expenses, One-time for closing costs)
}

export interface LoanBreakdown {
  id: string;
  name: string;
  principalPaid: number; // Total Principal (Scheduled + Extra)
  extraPrincipalPaid: number; // New: Portion that was Extra
  interestPaid: number;
  totalPaid: number;
  remainingBalance: number;
}

export interface CalculatedLoan {
  id: string;
  
  // Monthly Averages (for UI)
  monthlyPrincipalAndInterest: number; 
  monthlyFirstPI: number; 
  
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  monthlyPMI: number;
  monthlyCustomExpenses: number; 
  monthlyRepair: number; // ADDED
  totalMonthlyPayment: number; 
  netMonthlyPayment: number; 
  
  // Totals over Horizon
  totalPaid: number;
  totalRentPaid: number; // New
  totalInterest: number;
  totalEquityBuilt: number; 
  taxRefund: number;
  netCost: number; 
  
  // Wealth Components
  principalPaid: number; 
  totalAppreciation: number; 
  accumulatedRentalIncome: number; 
  totalRentalTax: number; 
  totalPropertyCosts: number; 
  totalCustomExpenses: number; 
  totalLoanFees: number; // New: Sum of all one-time loan expenses

  // Snapshot at Horizon
  futureHomeValue: number;
  remainingBalance: number;
  startingBalance: number;
  equity: number;
  netWorth: number; 
  investmentPortfolio: number; 
  
  // New metrics
  profit: number; 
  totalCashInvested: number; 
  averageEquityPerMonth: number;
  totalExtraPrincipal: number;
  totalInvestmentContribution: number; 
  totalInvestmentTax: number; 
  instantEquity: number; // New

  payoffDate: string;
  amortizationSchedule: AmortizationPoint[];
  subSchedules?: Record<string, AmortizationPoint[]>; // New: Individual schedules for each loan

  // Annual Data points for graphs
  annualData: AnnualDataPoint[];
  
  // Analysis
  breakEvenMonths?: number;
  sellingCosts: number; 
  capitalGainsTax: number; 
  taxableCapitalGains: number; // New
  capitalGainsExclusion: number; // New
  
  // Detailed Cash Flow & ROI
  totalInvestedAmount: number; 
  initialCapitalBase: number; 
  effectiveAnnualReturn: number; 

  // Extra Payment Analysis (Baseline Comparison)
  lifetimeInterestSaved: number;
  monthsSaved: number;
  interestSavedAtHorizon: number;
  
  // New: Baseline Comparison Fields (Assuming NO extra payments)
  baselineTotalInterest: number;
  baselinePayoffDate: string;
  baselineTotalPaid: number;
  
  // New: Per-Loan Breakdown
  loanBreakdown: LoanBreakdown[];
}

export interface AmortizationPoint {
  monthIndex: number;
  date: string;
  balance: number; 
  interest: number; 
  principal: number; 
  extraPayment: number;
  totalPayment: number;
  totalInterest: number;
  totalTaxRefund: number; 
  totalPaidToDate: number;
  equity: number;
  accumulatedRentalIncome: number; 
  accumulatedRentalTax: number; 
  accumulatedPropertyCosts: number; 
  // New fields for table visibility
  customExpenses: number; 
  investmentBalance: number;
  investmentTax: number; 
}

export interface AnnualDataPoint {
  label: string; 
  year: number; 
  homeEquity: number;
  investmentValue: number;
  returnedCapital: number; 
  netWorth: number;
  netCost: number; 
  totalGain: number; 
  netProfit?: number; 
  outOfPocket: number; 
  trueCost: number; 
  // Flows
  cumulativeInflow: number;
  cumulativeOutflow: number;
}

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';
