import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addPayment } from '@/services/supabaseService';
import { toast } from 'sonner';

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  masters: any[];
}

export const AddPaymentDialog: React.FC<AddPaymentDialogProps> = ({ open, onOpenChange, onSuccess, masters }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    master_id: '',
    amount: '',
    payment_method: 'cash',
    note: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addPayment({
        master_id: parseInt(formData.master_id),
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        note: formData.note || undefined,
      });

      toast.success('Payment added successfully');
      onSuccess();
      onOpenChange(false);
      setFormData({
        master_id: '',
        amount: '',
        payment_method: 'cash',
        note: '',
      });
    } catch (error) {
      toast.error('Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="borrower">Borrower *</Label>
            <Select value={formData.master_id} onValueChange={(value) => setFormData(prev => ({ ...prev, master_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select borrower" />
              </SelectTrigger>
              <SelectContent>
                {masters.map((master) => (
                  <SelectItem key={master.id} value={master.id.toString()}>
                    {master.borrower_name} (₹{master.outstanding_balance?.toLocaleString()} pending)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="method">Payment Method</Label>
            <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="note">Note</Label>
            <Input
              id="note"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};