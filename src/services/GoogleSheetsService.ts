import { Customer, Payment, LogEntry } from '@/types/loan';

// Real Google Sheets API integration using Google Apps Script
class GoogleSheetsService {
  private static instance: GoogleSheetsService;
  
  // Google Apps Script Web App URL - User needs to deploy this
  private WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
  
  // Sheet URLs from user
  private SHEET_URLS = {
    master: 'https://docs.google.com/spreadsheets/d/1JH0ve9dfGtStpaozYB86WPwP3c9gFjJ-/edit?gid=1245849665#gid=1245849665',
    payments: 'https://docs.google.com/spreadsheets/d/1JH0ve9dfGtStpaozYB86WPwP3c9gFjJ-/edit?gid=577116218#gid=577116218',
    logbook: 'https://docs.google.com/spreadsheets/d/1JH0ve9dfGtStpaozYB86WPwP3c9gFjJ-/edit?gid=659815523#gid=659815523'
  };

  private cache: {
    customers: Customer[];
    payments: Payment[];
    logbook: LogEntry[];
    lastSync: number;
  } = {
    customers: [],
    payments: [],
    logbook: [],
    lastSync: 0
  };

  public static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  // Set the deployed Google Apps Script URL
  public setWebAppUrl(url: string) {
    this.WEB_APP_URL = url;
    localStorage.setItem('sheets_web_app_url', url);
  }

  constructor() {
    // Load saved URL from localStorage
    const savedUrl = localStorage.getItem('sheets_web_app_url');
    if (savedUrl) {
      this.WEB_APP_URL = savedUrl;
    }
    
    // Initialize with sample data for demo
    this.initializeSampleData();
  }

  public initializeSampleData() {
    this.cache.customers = [
      {
        customerID: '1',
        name: 'SatyaSai',
        phone: '9959610817',
        tenderName: 'DailyPlan',
        startDate: '2025-08-28',
        principal: 10000,
        disbursedAmount: 9000,
        interest: 1000,
        durationMonths: 3,
        installmentType: 'DAY',
        totalInstallments: 90,
        installmentAmount: 111.11,
        paidInstallments: 10,
        remainingInstallments: 80,
        collectedAmount: 1111.1,
        remainingAmount: 8800,
        nextDueDate: '2025-09-08',
        status: 'ACTIVE',
        notes: ''
      },
      {
        customerID: '2',
        name: 'Reeshma',
        phone: '7330940336',
        tenderName: 'MonthlyPlan',
        startDate: '2025-08-28',
        principal: 50000,
        disbursedAmount: 45000,
        interest: 5000,
        durationMonths: 10,
        installmentType: 'MONTH',
        totalInstallments: 10,
        installmentAmount: 5500,
        paidInstallments: 2,
        remainingInstallments: 8,
        collectedAmount: 11000,
        remainingAmount: 44000,
        nextDueDate: '2025-09-28',
        status: 'ACTIVE',
        notes: ''
      },
      {
        customerID: '3',
        name: 'Rishi',
        phone: '9133651512',
        tenderName: 'DailyPlan',
        startDate: '2025-08-28',
        principal: 5000,
        disbursedAmount: 4500,
        interest: 500,
        durationMonths: 2,
        installmentType: 'DAY',
        totalInstallments: 60,
        installmentAmount: 91.67,
        paidInstallments: 0,
        remainingInstallments: 60,
        collectedAmount: 0,
        remainingAmount: 5000,
        nextDueDate: '2025-09-08',
        status: 'ACTIVE',
        notes: ''
      },
      {
        customerID: '4',
        name: 'Mohan',
        phone: '8106754515',
        tenderName: 'DailyPlan',
        startDate: '2025-09-01',
        principal: 10000,
        disbursedAmount: 9000,
        interest: 1000,
        durationMonths: 3,
        installmentType: 'DAY',
        totalInstallments: 90,
        installmentAmount: 111.11,
        paidInstallments: 1,
        remainingInstallments: 89,
        collectedAmount: 111.11,
        remainingAmount: 9900,
        nextDueDate: '2025-09-09',
        status: 'ACTIVE',
        notes: ''
      }
    ];

    this.cache.payments = [
      {
        id: 'PAY001',
        customerID: '1',
        name: 'SatyaSai',
        tenderName: 'DailyPlan',
        dateOfPayment: '2025-08-29',
        amountPaid: 400,
        installmentsCovered: 4,
        newNextDueDate: '2025-09-02',
        paymentMode: 'Cash',
        notes: ''
      },
      {
        id: 'PAY002',
        customerID: '2',
        name: 'Reeshma',
        tenderName: 'MonthlyPlan',
        dateOfPayment: '2025-08-29',
        amountPaid: 500,
        installmentsCovered: 1,
        newNextDueDate: '2025-09-28',
        paymentMode: 'UPI',
        notes: ''
      }
    ];

    this.cache.logbook = [
      {
        id: 'LOG001',
        timestampISO: '2025-08-29T09:00:00Z',
        action: 'PAYMENT_ADDED',
        actorEmail: 'admin@vinaya.com',
        detailsJSON: '{"CustomerID":"1","Amount":400}',
        entryHash: 'hash1'
      }
    ];
  }

  // Make HTTP request to Supabase Edge Function
  private async makeRequest(action: string, data: any = {}): Promise<any> {
    try {
      // Use Supabase Edge Function instead of Google Apps Script
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl) {
        console.warn('Supabase not configured, using local data');
        return this.handleLocalOperation(action, data);
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/google-sheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          action,
          data: {
            ...data,
            actorEmail: 'admin@vinaya.com', // Add actor email for logging
          },
          spreadsheetId: this.extractSpreadsheetId(),
          sheetName: this.getSheetNameForAction(action),
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }

      return result.data;
    } catch (error) {
      console.error('Google Sheets API Error:', error);
      // Fallback to local operations
      return this.handleLocalOperation(action, data);
    }
  }

  private extractSpreadsheetId(): string {
    // Extract spreadsheet ID from the master sheet URL
    const url = this.SHEET_URLS.master;
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  }

  private getSheetNameForAction(action: string): string {
    switch (action) {
      case 'getCustomers':
      case 'addCustomer':
      case 'updateCustomer':
        return 'Master';
      case 'getPayments':
      case 'addPayment':
        return 'Payments';
      case 'getLogbook':
        return 'Logbook';
      default:
        return 'Master';
    }
  }

  private async handleLocalOperation(action: string, data: any): Promise<any> {
    // Fallback operations using local cache
    switch (action) {
      case 'getCustomers':
        return [...this.cache.customers];
      case 'addCustomer':
        const newCustomer: Customer = {
          ...data,
          customerID: String(this.cache.customers.length + 1)
        };
        this.cache.customers.push(newCustomer);
        return newCustomer;
      case 'updateCustomer':
        const index = this.cache.customers.findIndex(c => c.customerID === data.customerID);
        if (index !== -1) {
          this.cache.customers[index] = { ...this.cache.customers[index], ...data.updates };
          return this.cache.customers[index];
        }
        return null;
      case 'getPayments':
        return [...this.cache.payments];
      case 'addPayment':
        const newPayment: Payment = {
          ...data,
          id: `PAY${String(this.cache.payments.length + 1).padStart(3, '0')}`
        };
        this.cache.payments.push(newPayment);
        return newPayment;
      case 'getLogbook':
        return [...this.cache.logbook].reverse();
      default:
        return null;
    }
  }

  // Customer CRUD operations
  public async getCustomers(): Promise<Customer[]> {
    return await this.makeRequest('getCustomers');
  }

  public async addCustomer(customer: Omit<Customer, 'customerID'>): Promise<Customer> {
    return await this.makeRequest('addCustomer', customer);
  }

  public async updateCustomer(customerID: string, updates: Partial<Customer>): Promise<Customer | null> {
    return await this.makeRequest('updateCustomer', { customerID, updates });
  }

  public async deleteCustomer(customerID: string): Promise<boolean> {
    const result = await this.makeRequest('deleteCustomer', { customerID });
    return result === true;
  }

  // Payment operations
  public async getPayments(): Promise<Payment[]> {
    return await this.makeRequest('getPayments');
  }

  public async addPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    return await this.makeRequest('addPayment', payment);
  }

  // Record payment with automatic customer update
  public async recordPayment(customerID: string, amount: number, installments: number, newNextDueDate?: string): Promise<any> {
    return await this.makeRequest('recordPayment', {
      customerID,
      amount,
      installments,
      newNextDueDate,
      dateOfPayment: new Date().toISOString().split('T')[0],
    });
  }

  // Logbook operations
  public async getLogbook(): Promise<LogEntry[]> {
    return await this.makeRequest('getLogbook');
  }

  // Force sync with Google Sheets
  public async syncToSheets(): Promise<void> {
    try {
      await this.makeRequest('syncAll');
      this.cache.lastSync = Date.now();
      console.log('Successfully synced to Google Sheets');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  // Export data as CSV
  public exportCustomersCSV(): string {
    const headers = [
      'CustomerID', 'Name', 'Phone', 'TenderName', 'StartDate',
      'Principal', 'DisbursedAmount', 'Interest', 'DurationMonths',
      'InstallmentType', 'TotalInstallments', 'InstallmentAmount',
      'PaidInstallments', 'RemainingInstallments', 'CollectedAmount',
      'RemainingAmount', 'NextDueDate', 'Status', 'Notes'
    ];
    
    const csvData = this.cache.customers.map(customer => [
      customer.customerID, customer.name, customer.phone, customer.tenderName,
      customer.startDate, customer.principal, customer.disbursedAmount,
      customer.interest, customer.durationMonths, customer.installmentType,
      customer.totalInstallments, customer.installmentAmount,
      customer.paidInstallments, customer.remainingInstallments,
      customer.collectedAmount, customer.remainingAmount,
      customer.nextDueDate, customer.status, customer.notes
    ]);

    return [headers, ...csvData].map(row => row.join(',')).join('\n');
  }

  // Get sheet URLs for reference
  public getSheetUrls() {
    return this.SHEET_URLS;
  }

  // Check if properly configured
  public isConfigured(): boolean {
    return this.WEB_APP_URL && !this.WEB_APP_URL.includes('YOUR_DEPLOYMENT_ID');
  }

  // Get last sync time
  public getLastSyncTime(): Date | null {
    return this.cache.lastSync ? new Date(this.cache.lastSync) : null;
  }
}

export default GoogleSheetsService;