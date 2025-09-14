import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GoogleSheetsIntegrationService from '@/services/GoogleSheetsIntegrationService';

interface Customer {
  customerID: string;
  name: string;
  phone: string;
  tenderName: string;
  startDate: string;
  principal: number;
  disbursedAmount: number;
  interest: number;
  durationMonths: number;
  installmentType: string;
  totalInstallments: number;
  installmentAmount: number;
  paidInstallments: number;
  remainingInstallments: number;
  collectedAmount: number;
  remainingAmount: number;
  nextDueDate: string;
  status: string;
  notes: string;
}

const EXISTING_CUSTOMERS: Customer[] = [
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
    installmentType: 'Daily',
    totalInstallments: 90,
    installmentAmount: 111.11,
    paidInstallments: 10,
    remainingInstallments: 80,
    collectedAmount: 1200,
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
    installmentType: 'Monthly',
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
    principal: 5500,
    disbursedAmount: 5000,
    interest: 500,
    durationMonths: 2,
    installmentType: 'Daily',
    totalInstallments: 60,
    installmentAmount: 91.67,
    paidInstallments: 1,
    remainingInstallments: 60,
    collectedAmount: 500,
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
    principal: 11000,
    disbursedAmount: 10000,
    interest: 1000,
    durationMonths: 3,
    installmentType: 'Daily',
    totalInstallments: 90,
    installmentAmount: 111.11,
    paidInstallments: 1,
    remainingInstallments: 89,
    collectedAmount: 1100,
    remainingAmount: 9900,
    nextDueDate: '2025-09-09',
    status: 'ACTIVE',
    notes: ''
  }
];

export function BulkImportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const { toast } = useToast();

  const handleBulkImport = async () => {
    setIsImporting(true);
    setProgress(0);
    setImportResults(null);

    try {
      const sheetsService = GoogleSheetsIntegrationService.getInstance();
      
      // Convert customer data to the format expected by Google Sheets
      const customersData = EXISTING_CUSTOMERS.map(customer => [
        customer.customerID,
        customer.name,
        customer.phone,
        customer.tenderName,
        customer.startDate,
        customer.principal,
        customer.disbursedAmount,
        customer.interest,
        customer.durationMonths,
        customer.installmentType,
        customer.totalInstallments,
        customer.installmentAmount,
        customer.paidInstallments,
        customer.collectedAmount,
        customer.remainingAmount,
        customer.remainingInstallments,
        customer.nextDueDate,
        customer.status,
        customer.notes
      ]);

      // Track progress
      setProgress(50);

      const results = await sheetsService.bulkAddCustomers(customersData);
      
      setProgress(100);
      setImportResults(results);

      if (results.success > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${results.success} customers to Google Sheets`,
        });
      }

      if (results.failed > 0) {
        toast({
          title: "Import Errors",
          description: `${results.failed} customers failed to import. Check the results for details.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Existing Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Existing Customer Data</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This will import {EXISTING_CUSTOMERS.length} existing customers to your Google Sheets.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-medium">Customers to Import:</h4>
            <div className="text-sm space-y-1">
              {EXISTING_CUSTOMERS.map((customer) => (
                <div key={customer.customerID} className="flex justify-between">
                  <span>{customer.name}</span>
                  <span className="text-muted-foreground">{customer.tenderName}</span>
                </div>
              ))}
            </div>
          </div>

          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {importResults && (
            <div className="space-y-2">
              <Alert className={importResults.failed === 0 ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div>✅ Success: {importResults.success} customers</div>
                    {importResults.failed > 0 && (
                      <div>❌ Failed: {importResults.failed} customers</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {importResults.errors.length > 0 && (
                <div className="text-sm space-y-1">
                  <div className="font-medium">Errors:</div>
                  {importResults.errors.map((error, index) => (
                    <div key={index} className="text-red-600">{error}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleBulkImport} 
              disabled={isImporting}
              className="flex-1"
            >
              {isImporting ? 'Importing...' : 'Start Import'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}