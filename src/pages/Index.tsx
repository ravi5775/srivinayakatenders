import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, LogOut, BarChart3, Users, Settings, RefreshCw, Database, Activity, Download, Eye } from 'lucide-react';
import lordVinayakaLogo from '@/assets/lord-vinayaka-logo.png';
import { useAuth } from '@/hooks/useAuth';
import { useLoanData } from '@/hooks/useLoanData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { EnhancedLoginForm } from '@/components/auth/EnhancedLoginForm';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { CustomerTable } from '@/components/dashboard/CustomerTable';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { CustomerForm } from '@/components/forms/CustomerForm';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { AdminSettings } from '@/components/settings/AdminSettings';
import { SystemStatus } from '@/components/dashboard/SystemStatus';
import { UserDetailsDialog } from '@/components/dashboard/UserDetailsDialog';

import { TenderManager } from '@/components/tenders/TenderManager';
import { Customer } from '@/types/loan';
import EnhancedGoogleSheetsService from '@/services/EnhancedGoogleSheetsService';

const Index = () => {
  const { isAuthenticated, adminEmail, logout } = useAuth();
  const { customers, payments, loading, addCustomer, updateCustomer, recordPayment, getDashboardSummary } = useLoanData();
  const { t } = useLanguage();
  const { toast } = useToast();
  const sheetsService = EnhancedGoogleSheetsService.getInstance();
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [installmentFilter, setInstallmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<Date>();
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTenderType, setSelectedTenderType] = useState<'DailyPlan' | 'MonthlyPlan' | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tenders'>('dashboard');
  const [syncing, setSyncing] = useState(false);

  // Filter customers based on search and filters
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.phone.includes(searchTerm) ||
                           customer.customerID.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesInstallment = installmentFilter === 'ALL' || customer.installmentType === installmentFilter;
      const matchesStatus = statusFilter === 'ALL' || customer.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter) {
        const filterDate = dateFilter.toISOString().split('T')[0];
        matchesDate = customer.nextDueDate === filterDate;
      }
      
      return matchesSearch && matchesInstallment && matchesStatus && matchesDate;
    });
  }, [customers, searchTerm, installmentFilter, statusFilter, dateFilter]);

  const dashboardSummary = getDashboardSummary();

  // Event handlers
  const handleAddCustomer = (tenderType?: 'DailyPlan' | 'MonthlyPlan') => {
    setEditingCustomer(null);
    setSelectedTenderType(tenderType || null);
    setIsCustomerFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setSelectedTenderType(null);
    setIsCustomerFormOpen(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (confirm(t('message.deleteConfirm'))) {
      updateCustomer(customerId, { status: 'PAUSED' });
    }
  };

  const handleAddPayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsPaymentFormOpen(true);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsUserDetailsOpen(true);
  };

  const handleCustomerSubmit = async (customerData: Omit<Customer, 'customerID'>) => {
    const dataWithTender = selectedTenderType 
      ? { ...customerData, tenderName: selectedTenderType, installmentType: selectedTenderType === 'DailyPlan' ? 'DAY' as const : 'MONTH' as const }
      : customerData;
      
    if (editingCustomer) {
      await updateCustomer(editingCustomer.customerID, dataWithTender);
    } else {
      await addCustomer(dataWithTender);
    }
  };

  const handleExportCSV = () => {
    const csvData = filteredCustomers.map(customer => ({
      CustomerID: customer.customerID,
      Name: customer.name,
      Phone: customer.phone,
      TenderName: customer.tenderName,
      Principal: customer.principal,
      RemainingAmount: customer.remainingAmount,
      NextDueDate: customer.nextDueDate,
      Status: customer.status
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportTransactions = () => {
    // Create transaction data with payment history
    const transactionData = customers.flatMap(customer => {
      const customerPayments = payments.filter(p => p.customerID === customer.customerID);
      
      // Add loan taken record
      const loanRecord = {
        CustomerID: customer.customerID,
        CustomerName: customer.name,
        Phone: customer.phone,
        TransactionType: 'Loan Taken',
        Amount: customer.principal,
        Date: customer.startDate || new Date().toISOString().split('T')[0],
        TenderName: customer.tenderName,
        RemainingAmount: customer.remainingAmount,
        Status: customer.status
      };

      // Add payment records
      const paymentRecords = customerPayments.map(payment => ({
        CustomerID: customer.customerID,
        CustomerName: customer.name,
        Phone: customer.phone,
        TransactionType: 'Payment Received',
        Amount: payment.amountPaid,
        Date: payment.dateOfPayment,
        TenderName: customer.tenderName,
        RemainingAmount: '',
        Status: 'Paid'
      }));

      return [loanRecord, ...paymentRecords];
    });

    const csv = [
      'Customer ID,Customer Name,Phone,Transaction Type,Amount,Date,Tender Name,Remaining Amount,Status',
      ...transactionData.map(row => 
        `${row.CustomerID},${row.CustomerName},${row.Phone},${row.TransactionType},${row.Amount},${row.Date},${row.TenderName},${row.RemainingAmount},${row.Status}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleSyncToSheets = async () => {
    setSyncing(true);
    try {
      await sheetsService.syncAll();
      toast({
        title: t('Success'),
        description: 'Data synced to Google Sheets successfully',
      });
    } catch (error) {
      toast({
        title: t('Error'),
        description: 'Failed to sync data to Google Sheets',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  console.log('Index - Auth state:', { isAuthenticated, adminEmail });

  if (!isAuthenticated) {
    return <EnhancedLoginForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={lordVinayakaLogo} 
                alt="Lord Vinayaka" 
                className="h-10 w-10 rounded-lg object-contain"
              />
            <div>
              <h1 className="text-2xl font-bold text-primary">{t('header.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('header.subtitle')}</p>
            </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveTab('dashboard')}
                  className={activeTab === 'dashboard' ? 'bg-primary/10' : ''}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveTab('tenders')}
                  className={activeTab === 'tenders' ? 'bg-primary/10' : ''}
                >
                  Tenders
                </Button>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">{t('header.welcome')}, </span>
                <span className="font-medium">{adminEmail}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsStatusOpen(true)}>
                <Activity className="h-4 w-4 mr-2" />
                System Status
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                {t('header.settings')}
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('header.logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' ? (
          <>
            {/* Summary Cards */}
            <SummaryCards summary={dashboardSummary} />

            {/* Charts */}
            <DashboardCharts customers={filteredCustomers} />

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">{t('dashboard.customers')} ({filteredCustomers.length})</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportTransactions}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Transactions
                </Button>
                <Button onClick={() => handleAddCustomer()}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('dashboard.addCustomer')}
                </Button>
              </div>
            </div>

            {/* Filters */}
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              installmentFilter={installmentFilter}
              onInstallmentFilterChange={setInstallmentFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              onExport={handleExportCSV}
              onSync={handleSyncToSheets}
              syncing={syncing}
            />

            {/* Customer Table */}
            <CustomerTable
              customers={filteredCustomers}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onAddPayment={handleAddPayment}
              onViewDetails={handleViewDetails}
            />
          </>
        ) : (
          <TenderManager 
            customers={customers}
            onAddCustomer={handleAddCustomer}
          />
        )}

        {/* Forms */}
        <CustomerForm
          isOpen={isCustomerFormOpen}
          onClose={() => setIsCustomerFormOpen(false)}
          onSubmit={handleCustomerSubmit}
          editingCustomer={editingCustomer}
        />

        <PaymentForm
          isOpen={isPaymentFormOpen}
          onClose={() => setIsPaymentFormOpen(false)}
          onSubmit={recordPayment}
          customer={selectedCustomer}
        />

        <AdminSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        <SystemStatus
          isOpen={isStatusOpen}
          onClose={() => setIsStatusOpen(false)}
        />

        <UserDetailsDialog
          isOpen={isUserDetailsOpen}
          onClose={() => setIsUserDetailsOpen(false)}
          customer={selectedCustomer}
          payments={payments}
        />

      </main>
    </div>
  );
};

export default Index;
