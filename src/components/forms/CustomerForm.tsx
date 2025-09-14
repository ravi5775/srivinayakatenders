import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@/types/loan';

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customer: Omit<Customer, 'customerID'>) => void;
  editingCustomer?: Customer | null;
}

export const CustomerForm = ({ isOpen, onClose, onSubmit, editingCustomer }: CustomerFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    tenderName: '',
    startDate: '',
    principal: '',
    disbursedAmount: '',
    interest: '',
    durationMonths: '',
    installmentType: 'MONTH' as 'DAY' | 'MONTH',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (editingCustomer) {
      setFormData({
        name: editingCustomer.name,
        phone: editingCustomer.phone,
        tenderName: editingCustomer.tenderName,
        startDate: editingCustomer.startDate,
        principal: editingCustomer.principal.toString(),
        disbursedAmount: editingCustomer.disbursedAmount.toString(),
        interest: editingCustomer.interest.toString(),
        durationMonths: editingCustomer.durationMonths.toString(),
        installmentType: editingCustomer.installmentType,
        notes: editingCustomer.notes
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        tenderName: '',
        startDate: '',
        principal: '',
        disbursedAmount: '',
        interest: '',
        durationMonths: '',
        installmentType: 'MONTH',
        notes: ''
      });
    }
  }, [editingCustomer, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation based on plan type
    if (!formData.name || !formData.phone || !formData.principal || !formData.installmentType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.installmentType === 'MONTH' && (!formData.durationMonths || !formData.interest)) {
      toast({
        title: "Validation Error",
        description: "Duration and interest are required for monthly plans",
        variant: "destructive"
      });
      return;
    }

    const customer: Omit<Customer, 'customerID'> = {
      name: formData.name,
      phone: formData.phone,
      tenderName: formData.tenderName,
      startDate: formData.startDate,
      principal: parseFloat(formData.principal),
      disbursedAmount: parseFloat(formData.disbursedAmount || formData.principal),
      interest: parseFloat(formData.interest || '0'),
      durationMonths: parseInt(formData.durationMonths),
      installmentType: formData.installmentType,
      totalInstallments: 0,
      installmentAmount: 0,
      paidInstallments: 0,
      remainingInstallments: 0,
      collectedAmount: 0,
      remainingAmount: 0,
      nextDueDate: formData.startDate,
      status: 'ACTIVE',
      notes: formData.notes
    };

    onSubmit(customer);
    onClose();
    
    toast({
      title: editingCustomer ? "Customer Updated" : "Customer Added",
      description: `${formData.name} has been ${editingCustomer ? 'updated' : 'added'} successfully`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          <DialogDescription>
            {editingCustomer ? 'Update customer information' : 'Enter the details for the new customer'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="installmentType">Plan Type *</Label>
              <Select
                value={formData.installmentType}
                onValueChange={(value: 'DAY' | 'MONTH') => setFormData(prev => ({ 
                  ...prev, 
                  installmentType: value,
                  interest: value === 'DAY' ? '0' : prev.interest 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAY">Daily Plan (₹100/day, No Interest)</SelectItem>
                  <SelectItem value="MONTH">Monthly Plan (With Interest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="principal">Principal Amount *</Label>
              <Input
                id="principal"
                required
                type="number"
                min="0"
                step="0.01"
                value={formData.principal}
                onChange={(e) => setFormData(prev => ({ ...prev, principal: e.target.value }))}
                placeholder={formData.installmentType === 'DAY' ? 'e.g., 10000 (will pay ₹100 for 100 days)' : 'Enter principal amount'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="disbursedAmount">Disbursed Amount</Label>
              <Input
                id="disbursedAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.disbursedAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, disbursedAmount: e.target.value }))}
                placeholder="Same as principal if empty"
              />
            </div>
            
            {formData.installmentType === 'MONTH' && (
              <div className="space-y-2">
                <Label htmlFor="interest">Interest Amount *</Label>
                <Input
                  id="interest"
                  required={formData.installmentType === 'MONTH'}
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.interest}
                  onChange={(e) => setFormData(prev => ({ ...prev, interest: e.target.value }))}
                  placeholder="Enter interest amount"
                />
              </div>
            )}
            
            {formData.installmentType === 'MONTH' && (
              <div className="space-y-2">
                <Label htmlFor="durationMonths">Duration (Months) *</Label>
                <Input
                  id="durationMonths"
                  required={formData.installmentType === 'MONTH'}
                  type="number"
                  min="1"
                  value={formData.durationMonths}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationMonths: e.target.value }))}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="tenderName">Tender Name</Label>
              <Input
                id="tenderName"
                value={formData.tenderName}
                onChange={(e) => setFormData(prev => ({ ...prev, tenderName: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingCustomer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};