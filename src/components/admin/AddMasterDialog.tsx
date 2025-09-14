import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createMaster } from '@/services/supabaseService';
import { toast } from 'sonner';

interface AddMasterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddMasterDialog: React.FC<AddMasterDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    borrower_name: '',
    borrower_phone: '',
    borrower_email: '',
    loan_amount: '',
    interest_rate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createMaster({
        borrower_name: formData.borrower_name,
        borrower_phone: formData.borrower_phone || undefined,
        borrower_email: formData.borrower_email || undefined,
        loan_amount: parseFloat(formData.loan_amount),
        interest_rate: parseFloat(formData.interest_rate) || 0,
      });

      toast.success('Borrower added successfully');
      onSuccess();
      onOpenChange(false);
      setFormData({
        borrower_name: '',
        borrower_phone: '',
        borrower_email: '',
        loan_amount: '',
        interest_rate: '',
      });
    } catch (error) {
      toast.error('Failed to add borrower');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Borrower</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.borrower_name}
              onChange={(e) => setFormData(prev => ({ ...prev, borrower_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.borrower_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, borrower_phone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.borrower_email}
              onChange={(e) => setFormData(prev => ({ ...prev, borrower_email: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="amount">Loan Amount *</Label>
            <Input
              id="amount"
              type="number"
              value={formData.loan_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, loan_amount: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="rate">Interest Rate (%)</Label>
            <Input
              id="rate"
              type="number"
              step="0.1"
              value={formData.interest_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, interest_rate: e.target.value }))}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Borrower'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};