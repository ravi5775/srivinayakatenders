import { Customer, Payment, LogEntry } from '@/types/loan';

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffFactor: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number;
}

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingOperations: any[];
  syncInProgress: boolean;
}

// Enhanced Google Sheets API integration with offline support and retry logic
class EnhancedGoogleSheetsService {
  private static instance: EnhancedGoogleSheetsService;
  
  // Configuration
  private WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
  private SHEET_URLS = {
    master: 'https://docs.google.com/spreadsheets/d/1jkSASVUEKfxGUTa3DhDwQViJvziWTHPf3I-g8ptbeXM/edit?gid=0#gid=0',
    payments: 'https://docs.google.com/spreadsheets/d/1jkSASVUEKfxGUTa3DhDwQViJvziWTHPf3I-g8ptbeXM/edit?gid=577116218#gid=577116218',
    logbook: 'https://docs.google.com/spreadsheets/d/1jkSASVUEKfxGUTa3DhDwQViJvziWTHPf3I-g8ptbeXM/edit?gid=659815523#gid=659815523'
  };

  private retryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    backoffFactor: 2
  };

  private cacheConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000
  };

  // Enhanced cache with timestamps and offline support
  private cache: {
    customers: { data: Customer[]; timestamp: number; };
    payments: { data: Payment[]; timestamp: number; };
    logbook: { data: LogEntry[]; timestamp: number; };
    lastSync: number;
  } = {
    customers: { data: [], timestamp: 0 },
    payments: { data: [], timestamp: 0 },
    logbook: { data: [], timestamp: 0 },
    lastSync: 0
  };

  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingOperations: [],
    syncInProgress: false
  };

  // Event listeners for offline/online detection
  private eventListeners: (() => void)[] = [];

  public static getInstance(): EnhancedGoogleSheetsService {
    if (!EnhancedGoogleSheetsService.instance) {
      EnhancedGoogleSheetsService.instance = new EnhancedGoogleSheetsService();
    }
    return EnhancedGoogleSheetsService.instance;
  }

  constructor() {
    // Load saved configuration
    this.loadConfig();
    
    // Initialize sample data for demo
    this.initializeSampleData();

    // Set up offline/online detection
    this.setupNetworkListeners();

    // Load cached data from localStorage
    this.loadFromLocalStorage();

    // Start periodic sync
    this.startPeriodicSync();
  }

  private setupNetworkListeners() {
    const handleOnline = () => {
      console.log('Network: Online');
      this.syncStatus.isOnline = true;
      this.processPendingOperations();
    };

    const handleOffline = () => {
      console.log('Network: Offline');
      this.syncStatus.isOnline = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    this.eventListeners.push(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });
  }

  private loadConfig() {
    const savedUrl = localStorage.getItem('sheets_web_app_url');
    if (savedUrl) {
      this.WEB_APP_URL = savedUrl;
    }

    const savedConfig = localStorage.getItem('sheets_service_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        this.retryConfig = { ...this.retryConfig, ...config.retry };
        this.cacheConfig = { ...this.cacheConfig, ...config.cache };
      } catch (error) {
        console.warn('Failed to load saved config:', error);
      }
    }
  }

  private saveConfig() {
    const config = {
      retry: this.retryConfig,
      cache: this.cacheConfig
    };
    localStorage.setItem('sheets_service_config', JSON.stringify(config));
  }

  private loadFromLocalStorage() {
    try {
      const cachedData = localStorage.getItem('sheets_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        this.cache = { ...this.cache, ...parsed };
      }

      const pendingOps = localStorage.getItem('pending_operations');
      if (pendingOps) {
        this.syncStatus.pendingOperations = JSON.parse(pendingOps);
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('sheets_cache', JSON.stringify(this.cache));
      localStorage.setItem('pending_operations', JSON.stringify(this.syncStatus.pendingOperations));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  private startPeriodicSync() {
    // Sync every 2 minutes when online
    setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress) {
        this.syncAll();
      }
    }, 2 * 60 * 1000);
  }

  private isCacheValid(cacheEntry: { timestamp: number }): boolean {
    return Date.now() - cacheEntry.timestamp < this.cacheConfig.ttl;
  }

  // Enhanced HTTP request with retry logic and exponential backoff
  private async makeRequestWithRetry(action: string, data: any = {}, retryCount = 0): Promise<any> {
    try {
      return await this.makeRequest(action, data);
    } catch (error) {
      console.error(`Request failed (attempt ${retryCount + 1}):`, error);

      if (retryCount < this.retryConfig.maxRetries) {
        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffFactor, retryCount);
        console.log(`Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequestWithRetry(action, data, retryCount + 1);
      }

      // If all retries failed and we're offline, queue the operation
      if (!this.syncStatus.isOnline) {
        this.queueOperation(action, data);
        return this.handleOfflineOperation(action, data);
      }

      throw error;
    }
  }

  private async makeRequest(action: string, data: any = {}): Promise<any> {
    if (!this.WEB_APP_URL || this.WEB_APP_URL.includes('YOUR_DEPLOYMENT_ID')) {
      console.warn('Google Apps Script URL not configured, using local data');
      return this.handleLocalOperation(action, data);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(this.WEB_APP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          data,
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Update cache with successful response
      this.updateCache(action, result.data);
      
      return result.data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateCache(action: string, data: any) {
    const now = Date.now();
    
    switch (action) {
      case 'getCustomers':
        this.cache.customers = { data: data || [], timestamp: now };
        break;
      case 'getPayments':
        this.cache.payments = { data: data || [], timestamp: now };
        break;
      case 'getLogbook':
        this.cache.logbook = { data: data || [], timestamp: now };
        break;
    }
    
    this.cache.lastSync = now;
    this.saveToLocalStorage();
  }

  private queueOperation(action: string, data: any) {
    const operation = {
      id: this.generateRequestId(),
      action,
      data,
      timestamp: new Date().toISOString(),
      attempts: 0
    };

    this.syncStatus.pendingOperations.push(operation);
    this.saveToLocalStorage();
    
    console.log('Operation queued for later sync:', operation);
  }

  private async processPendingOperations() {
    if (this.syncStatus.pendingOperations.length === 0 || this.syncStatus.syncInProgress) {
      return;
    }

    console.log(`Processing ${this.syncStatus.pendingOperations.length} pending operations...`);
    this.syncStatus.syncInProgress = true;

    const successfulOperations: string[] = [];

    for (const operation of this.syncStatus.pendingOperations) {
      try {
        operation.attempts++;
        await this.makeRequest(operation.action, operation.data);
        successfulOperations.push(operation.id);
        console.log('Pending operation completed:', operation.id);
      } catch (error) {
        console.error('Failed to process pending operation:', operation.id, error);
        
        // Remove operations that have failed too many times
        if (operation.attempts >= this.retryConfig.maxRetries) {
          successfulOperations.push(operation.id); // Remove from queue
          console.error('Removing failed operation after max attempts:', operation.id);
        }
      }
    }

    // Remove successful operations
    this.syncStatus.pendingOperations = this.syncStatus.pendingOperations.filter(
      op => !successfulOperations.includes(op.id)
    );

    this.syncStatus.syncInProgress = false;
    this.saveToLocalStorage();
  }

  private async handleOfflineOperation(action: string, data: any): Promise<any> {
    // Handle read operations with cached data
    if (['getCustomers', 'getPayments', 'getLogbook'].includes(action)) {
      return this.handleLocalOperation(action, data);
    }

    // For write operations, update local cache optimistically
    const result = this.handleLocalOperation(action, data);
    
    // Update cache timestamp to prevent immediate re-sync
    const now = Date.now();
    if (action === 'addCustomer' || action === 'updateCustomer') {
      this.cache.customers.timestamp = now;
    } else if (action === 'addPayment') {
      this.cache.payments.timestamp = now;
    }
    
    return result;
  }

  private handleLocalOperation(action: string, data: any): any {
    // Enhanced local operations with better error handling
    switch (action) {
      case 'getCustomers':
        return [...this.cache.customers.data];
        
      case 'addCustomer':
        const newCustomer: Customer = {
          ...data,
          customerID: this.generateCustomerId()
        };
        this.cache.customers.data.push(newCustomer);
        this.saveToLocalStorage();
        return newCustomer;
        
      case 'updateCustomer':
        const customerIndex = this.cache.customers.data.findIndex(c => c.customerID === data.customerID);
        if (customerIndex !== -1) {
          this.cache.customers.data[customerIndex] = { 
            ...this.cache.customers.data[customerIndex], 
            ...data.updates 
          };
          this.saveToLocalStorage();
          return this.cache.customers.data[customerIndex];
        }
        return null;
        
      case 'getPayments':
        return [...this.cache.payments.data];
        
      case 'addPayment':
        const newPayment: Payment = {
          ...data,
          id: this.generatePaymentId()
        };
        this.cache.payments.data.push(newPayment);
        this.saveToLocalStorage();
        return newPayment;
        
      case 'getLogbook':
        return [...this.cache.logbook.data].reverse();
        
      default:
        throw new Error(`Unsupported offline operation: ${action}`);
    }
  }

  private generateCustomerId(): string {
    const existingIds = this.cache.customers.data.map(c => parseInt(c.customerID) || 0);
    const maxId = Math.max(0, ...existingIds);
    return String(maxId + 1);
  }

  private generatePaymentId(): string {
    const existingIds = this.cache.payments.data.map(p => {
      const match = p.id.match(/PAY(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxId = Math.max(0, ...existingIds);
    return `PAY${String(maxId + 1).padStart(3, '0')}`;
  }

  public initializeSampleData() {
    this.cache.customers = {
      data: [
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
      ],
      timestamp: Date.now()
    };

    this.cache.payments = {
      data: [
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
      ],
      timestamp: Date.now()
    };

    this.cache.logbook = {
      data: [
        {
          id: 'LOG001',
          timestampISO: '2025-08-29T09:00:00Z',
          action: 'PAYMENT_ADDED',
          actorEmail: 'admin@vinaya.com',
          detailsJSON: '{\\\"CustomerID\\\":\\\"1\\\",\\\"Amount\\\":400}',
          entryHash: 'hash1'
        }
      ],
      timestamp: Date.now()
    };

    this.saveToLocalStorage();
  }

  // Public API methods with enhanced caching and offline support
  
  public async getCustomers(): Promise<Customer[]> {
    // Return cached data if valid and offline
    if (!this.syncStatus.isOnline && this.cache.customers.data.length > 0) {
      return [...this.cache.customers.data];
    }

    // Return cached data if still valid
    if (this.isCacheValid(this.cache.customers)) {
      return [...this.cache.customers.data];
    }

    // Fetch fresh data
    return await this.makeRequestWithRetry('getCustomers');
  }

  public async addCustomer(customer: Omit<Customer, 'customerID'>): Promise<Customer> {
    return await this.makeRequestWithRetry('addCustomer', customer);
  }

  public async updateCustomer(customerID: string, updates: Partial<Customer>): Promise<Customer | null> {
    return await this.makeRequestWithRetry('updateCustomer', { customerID, updates });
  }

  public async deleteCustomer(customerID: string): Promise<boolean> {
    const result = await this.makeRequestWithRetry('deleteCustomer', { customerID });
    return result === true;
  }

  public async getPayments(): Promise<Payment[]> {
    if (!this.syncStatus.isOnline && this.cache.payments.data.length > 0) {
      return [...this.cache.payments.data];
    }

    if (this.isCacheValid(this.cache.payments)) {
      return [...this.cache.payments.data];
    }

    return await this.makeRequestWithRetry('getPayments');
  }

  public async addPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    return await this.makeRequestWithRetry('addPayment', payment);
  }

  public async getLogbook(): Promise<LogEntry[]> {
    if (!this.syncStatus.isOnline && this.cache.logbook.data.length > 0) {
      return [...this.cache.logbook.data];
    }

    if (this.isCacheValid(this.cache.logbook)) {
      return [...this.cache.logbook.data];
    }

    return await this.makeRequestWithRetry('getLogbook');
  }

  public async syncAll(): Promise<void> {
    if (this.syncStatus.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.syncStatus.syncInProgress = true;
    
    try {
      // Process any pending operations first
      await this.processPendingOperations();
      
      // Force refresh all caches
      await Promise.all([
        this.makeRequestWithRetry('getCustomers'),
        this.makeRequestWithRetry('getPayments'),
        this.makeRequestWithRetry('getLogbook')
      ]);
      
      this.syncStatus.lastSync = new Date();
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  // Configuration and status methods
  
  public setWebAppUrl(url: string) {
    this.WEB_APP_URL = url;
    localStorage.setItem('sheets_web_app_url', url);
  }

  public getSheetUrls() {
    return this.SHEET_URLS;
  }

  public isConfigured(): boolean {
    return this.WEB_APP_URL && !this.WEB_APP_URL.includes('YOUR_DEPLOYMENT_ID');
  }

  public getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  public getLastSyncTime(): Date | null {
    return this.syncStatus.lastSync;
  }

  public getCacheStatus() {
    return {
      customers: {
        count: this.cache.customers.data.length,
        lastUpdate: new Date(this.cache.customers.timestamp),
        isValid: this.isCacheValid(this.cache.customers)
      },
      payments: {
        count: this.cache.payments.data.length,
        lastUpdate: new Date(this.cache.payments.timestamp),
        isValid: this.isCacheValid(this.cache.payments)
      },
      logbook: {
        count: this.cache.logbook.data.length,
        lastUpdate: new Date(this.cache.logbook.timestamp),
        isValid: this.isCacheValid(this.cache.logbook)
      }
    };
  }

  public clearCache() {
    this.cache = {
      customers: { data: [], timestamp: 0 },
      payments: { data: [], timestamp: 0 },
      logbook: { data: [], timestamp: 0 },
      lastSync: 0
    };
    this.saveToLocalStorage();
  }

  public exportCustomersCSV(): string {
    const headers = [
      'CustomerID', 'Name', 'Phone', 'TenderName', 'StartDate',
      'Principal', 'DisbursedAmount', 'Interest', 'DurationMonths',
      'InstallmentType', 'TotalInstallments', 'InstallmentAmount',
      'PaidInstallments', 'RemainingInstallments', 'CollectedAmount',
      'RemainingAmount', 'NextDueDate', 'Status', 'Notes'
    ];
    
    const csvData = this.cache.customers.data.map(customer => [
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

  // Cleanup method
  public destroy() {
    this.eventListeners.forEach(cleanup => cleanup());
    this.eventListeners = [];
  }
}

export default EnhancedGoogleSheetsService;
