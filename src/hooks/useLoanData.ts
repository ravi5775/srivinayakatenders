import { useState, useEffect } from 'react';
import { Customer, Payment, DashboardSummary } from '@/types/loan';
import GoogleSheetsService from '@/services/GoogleSheetsService';

// Initialize Google Sheets service with sample data
const sheetsService = GoogleSheetsService.getInstance();

export const useLoanData = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data from Google Sheets service on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [customersData, paymentsData] = await Promise.all([
          sheetsService.getCustomers(),
          sheetsService.getPayments()
        ]);
        setCustomers(customersData);
        setPayments(paymentsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const calculateCustomerMetrics = (customer: Customer): Customer => {
    // Calculate total payable (Principal + Interest)
    const totalPayable = customer.principal + customer.interest;
    
    // Calculate total installments based on type
    const totalInstallments = customer.installmentType === 'MONTH' 
      ? customer.durationMonths 
      : customer.durationMonths * 30;
    
    // Calculate installment amount
    const installmentAmount = Math.round((totalPayable / totalInstallments) * 100) / 100;
    
    // Calculate remaining amounts
    const remainingAmount = totalPayable - customer.collectedAmount;
    const remainingInstallments = totalInstallments - customer.paidInstallments;
    
    // Calculate next due date
    const startDate = new Date(customer.startDate);
    let nextDueDate = customer.startDate;
    
    if (customer.paidInstallments > 0) {
      if (customer.installmentType === 'DAY') {
        const nextDate = new Date(startDate);
        nextDate.setDate(startDate.getDate() + Math.floor(customer.paidInstallments));
        nextDueDate = nextDate.toISOString().split('T')[0];
      } else {
        const nextDate = new Date(startDate);
        nextDate.setMonth(startDate.getMonth() + Math.floor(customer.paidInstallments));
        nextDueDate = nextDate.toISOString().split('T')[0];
      }
    }
    
    return {
      ...customer,
      totalInstallments,
      installmentAmount,
      remainingAmount,
      remainingInstallments,
      nextDueDate
    };
  };

  const addCustomer = async (customerData: Omit<Customer, 'customerID'>) => {
    setLoading(true);
    try {
      const newCustomer = await sheetsService.addCustomer(customerData);
      setCustomers(prev => [...prev, newCustomer]);
    } catch (error) {
      console.error('Error adding customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (customerID: string, updates: Partial<Customer>) => {
    setLoading(true);
    try {
      const updatedCustomer = await sheetsService.updateCustomer(customerID, updates);
      if (updatedCustomer) {
        setCustomers(prev => prev.map(customer => 
          customer.customerID === customerID ? updatedCustomer : customer
        ));
      }
    } catch (error) {
      console.error('Error updating customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async (paymentData: Omit<Payment, 'id'>) => {
    setLoading(true);
    try {
      const customer = customers.find(c => c.customerID === paymentData.customerID);
      if (!customer) throw new Error('Customer not found');
      
      // Calculate installments covered based on current installment amount
      const installmentsCovered = Math.round((paymentData.amountPaid / customer.installmentAmount) * 100) / 100;
      
      // Calculate next due date
      const startDate = new Date(customer.startDate);
      let newNextDueDate = customer.nextDueDate;
      
      if (customer.installmentType === 'DAY') {
        const nextDate = new Date(customer.nextDueDate);
        nextDate.setDate(nextDate.getDate() + Math.floor(installmentsCovered));
        newNextDueDate = nextDate.toISOString().split('T')[0];
      } else {
        const nextDate = new Date(customer.nextDueDate);
        nextDate.setMonth(nextDate.getMonth() + Math.floor(installmentsCovered));
        newNextDueDate = nextDate.toISOString().split('T')[0];
      }
      
      // Use the new recordPayment method that handles both payment and customer update
      const result = await sheetsService.recordPayment(
        customer.customerID,
        paymentData.amountPaid,
        installmentsCovered,
        newNextDueDate
      );
      
      if (result.success) {
        // Refresh data from the service
        const [updatedCustomers, updatedPayments] = await Promise.all([
          sheetsService.getCustomers(),
          sheetsService.getPayments()
        ]);
        
        setCustomers(updatedCustomers);
        setPayments(updatedPayments);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDashboardSummary = (): DashboardSummary => {
    // Use disbursed amount for total given (actual amount given to customers)
    const totalGiven = customers.reduce((sum, c) => sum + c.disbursedAmount, 0);
    const totalCollected = customers.reduce((sum, c) => sum + c.collectedAmount, 0);
    const totalOutstanding = customers.reduce((sum, c) => sum + c.remainingAmount, 0);
    // Profit is the interest portion that will be collected
    const totalProfit = customers.reduce((sum, c) => sum + c.interest, 0);
    
    const today = new Date().toISOString().split('T')[0];
    const dueToday = customers.filter(c => c.nextDueDate === today && c.status === 'ACTIVE');
    const overdue = customers.filter(c => c.nextDueDate < today && c.status === 'ACTIVE');
    
    return {
      totalGiven,
      totalCollected,
      totalOutstanding,
      totalProfit,
      dueToday,
      overdue,
      recentPayments: payments.slice(-5).reverse()
    };
  };

  return {
    customers,
    payments,
    loading,
    addCustomer,
    updateCustomer,
    recordPayment,
    getDashboardSummary
  };
};