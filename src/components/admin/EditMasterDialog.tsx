import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateMaster } from '@/services/supabaseService';
import { toast } from 'sonner';

interface EditMasterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  master: any;
  onSuccess: () => void;
}

export const EditMasterDialog: React.FC<EditMasterDialogProps> = ({ open, onOpenChange, master, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    borrower_name: master?.borrower_name || '',
    borrower_phone: master?.borrower_phone || '',
    borrower_email: master?.borrower_email || '',
    status: master?.status || 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateMaster(master.id, formData);
      toast.success('Borrower updated successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to update borrower');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Borrower</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.borrower_name}
              onChange={(e) => setFormData(prev => ({ ...prev, borrower_name: e.target.value }))}
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
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};