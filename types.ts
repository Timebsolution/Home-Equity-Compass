

export interface LoanScenario {
  id: string;
  name: string;
  color: string;
  isRentOnly: boolean;
  isInvestmentOnly?: boolean; // New mode

  // Asset
  homeValue: number;
  lockFMV: boolean;

  // Loan 1
  loanAmount: number;
  lockLoan: boolean;
  interestRate: number;
  loanTermYears: number; // Total original term
  yearsRemaining: number; 
  monthsRemaining: number;

  // Loan 2 (New)
  hasSecondLoan: boolean;
  secondLoanAmount: number;
  secondLoanInterestRate: number;
  secondLoanTermYears: number;
  secondLoanYearsRemaining: number;
  secondLoanMonthsRemaining: number;

  // Annual Expenses ($)
  propertyTax: number;
  propertyTaxRate: number; // New: Percentage based tax
  usePropertyTaxRate: boolean; // New: Toggle for % vs $
  homeInsurance: number;
  hoa: number;
  pmi: number;

  // Tax Benefit
  taxRefundRate: number; // Marginal Tax Rate (applied to Mortgage Interest only)

  // Cash / Payments
  downPayment: number; // Initial Cash In
  oneTimeExtraPayment: number;
  oneTimeExtraPaymentMonth: number;
  monthlyExtraPayment: number;
  
  // Income (Buy Mode)
  rentalIncome: number;
  lockRentIncome: boolean;
  rentalIncomeTaxEnabled: boolean; // New: Apply tax to rental income?
  rentalIncomeTaxRate: number; // New: Tax rate for rental income

  // Rent Mode Specifics
  rentMonthly: number;
  lockRent?: boolean; // New lock for buy mode rent
  rentIncreasePerYear: number;
  rentIncludeTax: boolean; // Does rent include expenses?
  rentTaxRate: number; 
  
  // Investment Mode Specifics (Overrides globals if needed, strictly for this card)
  investmentCapital?: number;
  lockInvestment: boolean; // New: Sync with global investment capital
  investmentMonthly?: number;
  investmentRate?: number;
}

export interface CalculatedLoan {
  id: string;
  
  // Monthly Averages (for UI)
  monthlyPrincipalAndInterest: number; // Total 1st + 2nd
  monthlyFirstPI: number; // 1st Loan P&I breakdown
  monthlySecondPI: number; // 2nd Loan P&I breakdown
  
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  monthlyPMI: number;
  totalMonthlyPayment: number; // PITI + HOA
  
  // Totals over Horizon
  totalPaid: number;
  totalInterest: number;
  totalEquityBuilt: number; // Principal Paid + Appreciation
  taxRefund: number;
  netCost: number; // Total Paid - Equity - Refund
  
  // Wealth Components
  principalPaid: number; // Pure principal paydown (Forced Savings)
  totalAppreciation: number; // Market growth
  accumulatedRentalIncome: number; // Cash from rent

  // Snapshot at Horizon
  futureHomeValue: number;
  remainingBalance: number; // 1st + 2nd
  equity: number;
  netWorth: number; // Equity + Investment Portfolio (if modeled)
  investmentPortfolio: number; // Future Value of side cash
  
  // New Metrics
  profit: number; // Equity - Down Payment (Return on Capital logic)
  totalCashInvested: number; // Down + Extra + OneTime
  averageEquityPerMonth: number;
  totalExtraPrincipal: number;
  totalInvestmentContribution: number; // Total cash put into investment (Principal + Monthly)

  payoffDate: string;
  amortizationSchedule: AmortizationPoint[];
  
  // Annual Data points for graphs
  annualData: AnnualDataPoint[];
}

export interface AmortizationPoint {
  monthIndex: number;
  date: string;
  balance: number; // Total Balance
  interest: number; // Total Interest
  principal: number; // Total Principal
  extraPayment: number;
  totalPayment: number;
  totalInterest: number;
  totalTaxRefund: number; // Added to track cumulative refund at each point
  totalPaidToDate: number;
  equity: number;
}

export interface AnnualDataPoint {
  label: string; // "Mo 1" or "Yr 1"
  year: number; // Numeric index for sorting/logic
  homeEquity: number;
  investmentValue: number;
  returnedCapital: number; // Down Payment portion
  netWorth: number;
  netCost: number;
  totalGain: number; // Wealth Generated (Profit)
}

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';
