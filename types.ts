
export interface LoanScenario {
  id: string;
  name: string;
  color: string;
  isRentOnly: boolean;
  isInvestmentOnly?: boolean; // New mode

  // Asset
  homeValue: number;
  lockFMV: boolean;

  // Loan
  loanAmount: number;
  lockLoan: boolean;
  interestRate: number;
  loanTermYears: number; // Total original term
  yearsRemaining: number; 
  monthsRemaining: number;

  // Annual Expenses ($)
  propertyTax: number;
  homeInsurance: number;
  hoa: number;
  pmi: number;

  // Tax Benefit
  taxRefundRate: number; // % of interest returned

  // Cash / Payments
  downPayment: number; // Initial Cash In
  oneTimeExtraPayment: number;
  oneTimeExtraPaymentMonth: number;
  monthlyExtraPayment: number;

  // Rent Mode Specifics
  rentMonthly: number;
  lockRent?: boolean; // New lock for buy mode rent
  rentIncreasePerYear: number;
  rentIncludeTax: boolean; // Does rent include expenses?
  rentTaxRate: number; 
  
  // Investment Mode Specifics (Overrides globals if needed, strictly for this card)
  investmentCapital?: number;
  investmentMonthly?: number;
  investmentRate?: number;
}

export interface CalculatedLoan {
  id: string;
  
  // Monthly Averages (for UI)
  monthlyPrincipalAndInterest: number;
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
  
  // Snapshot at Horizon
  futureHomeValue: number;
  remainingBalance: number;
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
  balance: number;
  interest: number;
  principal: number;
  extraPayment: number;
  totalPayment: number;
  totalInterest: number;
  totalPaidToDate: number;
  equity: number;
}

export interface AnnualDataPoint {
  year: number;
  homeEquity: number;
  investmentValue: number;
  returnedCapital: number; // Down Payment portion
  netWorth: number;
  netCost: number;
}

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';
