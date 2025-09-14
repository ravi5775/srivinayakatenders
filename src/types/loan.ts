export interface Customer {
  customerID: string;
  name: string;
  phone: string;
  tenderName: string;
  startDate: string;
  principal: number;
  disbursedAmount: number;
  interest: number;
  durationMonths: number;
  installmentType: 'DAY' | 'MONTH';
  totalInstallments: number;
  installmentAmount: number;
  paidInstallments: number;
  remainingInstallments: number;
  collectedAmount: number;
  remainingAmount: number;
  nextDueDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  notes: string;
}

export interface Payment {
  id: string;
  customerID: string;
  name: string;
  tenderName: string;
  dateOfPayment: string;
  amountPaid: number;
  installmentsCovered: number;
  newNextDueDate: string;
  paymentMode: 'Cash' | 'UPI' | 'BankTransfer';
  notes: string;
}

export interface LogEntry {
  id: string;
  timestampISO: string;
  action: string;
  actorEmail: string;
  detailsJSON: string;
  entryHash: string;
}

export interface Settings {
  defaultInterestType: 'FLAT' | 'PERCENT';
  defaultInterestRate: number;
  defaultInstallmentType: 'DAY' | 'MONTH';
  adminEmail: string;
  sessionTimeoutMinutes: number;
}

export interface DashboardSummary {
  totalGiven: number;
  totalCollected: number;
  totalOutstanding: number;
  totalProfit: number;
  dueToday: Customer[];
  overdue: Customer[];
  recentPayments: Payment[];
}

export interface AuthState {
  isAuthenticated: boolean;
  adminEmail: string | null;
  sessionToken: string | null;
}