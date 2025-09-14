import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Customer, Payment } from '@/types/loan';

interface PaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payment: Omit<Payment, 'id'>) => void;
  customer: Customer | null;
}

export const PaymentForm = ({ isOpen, onClose, onSubmit, customer }: PaymentFormProps) => {
  const [formData, setFormData] = useState({
    dateOfPayment: new Date().toISOString().split('T')[0],
    amountPaid: '',
    paymentMode: 'Cash' as 'Cash' | 'UPI' | 'BankTransfer',
    notes: ''
  });
  
  const [previewData, setPreviewData] = useState({
    installmentsCovered: 0,
    newRemainingAmount: 0,
    newNextDueDate: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    if (customer && formData.amountPaid) {
      const amountPaid = parseFloat(formData.amountPaid);
      const installmentsCovered = amountPaid / customer.installmentAmount;
      const newRemainingAmount = customer.remainingAmount - amountPaid;
      
      // Calculate new next due date
      const newPaidInstallments = customer.paidInstallments + installmentsCovered;
      const startDate = new Date(customer.startDate);
      let newNextDueDate = '';
      
      if (newPaidInstallments < customer.totalInstallments) {
        if (customer.installmentType === 'DAY') {
          const nextDate = new Date(startDate);
          nextDate.setDate(nextDate.getDate() + Math.floor(newPaidInstallments));
          newNextDueDate = nextDate.toISOString().split('T')[0];
        } else {
          const nextDate = new Date(startDate);
          nextDate.setMonth(nextDate.getMonth() + Math.floor(newPaidInstallments));
          newNextDueDate = nextDate.toISOString().split('T')[0];
        }
      }
      
      setPreviewData({
        installmentsCovered: Math.round(installmentsCovered * 100) / 100,
        newRemainingAmount: Math.max(0, newRemainingAmount),
        newNextDueDate
      });
    }
  }, [customer, formData.amountPaid]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer || !formData.amountPaid || !formData.dateOfPayment) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const payment: Omit<Payment, 'id'> = {
      customerID: customer.customerID,
      name: customer.name,
      tenderName: customer.tenderName,
      dateOfPayment: formData.dateOfPayment,
      amountPaid: parseFloat(formData.amountPaid),
      installmentsCovered: previewData.installmentsCovered,
      newNextDueDate: previewData.newNextDueDate,
      paymentMode: formData.paymentMode,
      notes: formData.notes
    };

    onSubmit(payment);
    onClose();
    
    // Reset form
    setFormData({
      dateOfPayment: new Date().toISOString().split('T')[0],
      amountPaid: '',
      paymentMode: 'Cash',
      notes: ''
    });
    
    toast({
      title: "Payment Recorded",
      description: `Payment of ₹${formData.amountPaid} has been recorded for ${customer.name}`,
    });
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for {customer.name} - {customer.tenderName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer ID:</span>
                <span className="font-medium">{customer.customerID}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Installment Amount:</span>
                <span className="font-medium">₹{customer.installmentAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining Amount:</span>
                <span className="font-medium">₹{customer.remainingAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Due Date:</span>
                <span className="font-medium">{customer.nextDueDate}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfPayment">Payment Date *</Label>
              <Input
                id="dateOfPayment"
                required
                type="date"
                value={formData.dateOfPayment}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfPayment: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amountPaid">Amount Paid *</Label>
              <Input
                id="amountPaid"
                required
                type="number"
                min="0"
                step="0.01"
                value={formData.amountPaid}
                onChange={(e) => setFormData(prev => ({ ...prev, amountPaid: e.target.value }))}
                placeholder="Enter payment amount"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <Select
                value={formData.paymentMode}
                onValueChange={(value: 'Cash' | 'UPI' | 'BankTransfer') => 
                  setFormData(prev => ({ ...prev, paymentMode: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BankTransfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Payment notes (optional)"
              />
            </div>
          </form>
        </div>

        {/* Payment Preview */}
        {formData.amountPaid && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Payment Preview</CardTitle>
              <CardDescription>Review the payment impact before confirming</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Installments Covered:</span>
                <span className="font-medium">{previewData.installmentsCovered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Remaining Amount:</span>
                <span className="font-medium">₹{previewData.newRemainingAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Next Due Date:</span>
                <span className="font-medium">{previewData.newNextDueDate || 'Completed'}</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={(e) => handleSubmit(e)} disabled={!formData.amountPaid}>
            Record Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};