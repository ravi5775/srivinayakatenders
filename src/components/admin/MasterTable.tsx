import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Search, Edit, Trash2, Eye, Phone, Mail } from 'lucide-react';
import { updateMaster, deleteMaster } from '@/services/supabaseService';
import { EditMasterDialog } from './EditMasterDialog';
import { toast } from 'sonner';

interface MasterTableProps {
  data: any[];
  onDataChange: () => void;
}

export const MasterTable: React.FC<MasterTableProps> = ({ data, onDataChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaster, setSelectedMaster] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const filteredData = data.filter(master =>
    master.borrower_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    master.borrower_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    master.borrower_phone?.includes(searchTerm)
  );

  const handleEdit = (master: any) => {
    setSelectedMaster(master);
    setShowEditDialog(true);
  };

  const handleDelete = (master: any) => {
    setSelectedMaster(master);
    setShowDeleteDialog(true);
  };

  const handleViewDetails = (master: any) => {
    setSelectedMaster(master);
    setShowDetailsDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedMaster) return;

    try {
      await deleteMaster(selectedMaster.id);
      toast.success('Borrower deleted successfully');
      onDataChange();
      setShowDeleteDialog(false);
      setSelectedMaster(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete borrower');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'closed': return 'secondary';
      case 'defaulted': return 'destructive';
      case 'pending': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search borrowers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Loan Amount</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((master) => (
              <TableRow key={master.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{master.borrower_name}</p>
                    <p className="text-sm text-muted-foreground">ID: {master.id}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {master.borrower_phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1" />
                        {master.borrower_phone}
                      </div>
                    )}
                    {master.borrower_email && (
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-1" />
                        {master.borrower_email}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>₹{master.loan_amount?.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`font-medium ${master.outstanding_balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    ₹{master.outstanding_balance?.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(master.status)}>
                    {master.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {master.start_date ? new Date(master.start_date).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(master)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(master)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(master)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No borrowers found
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {selectedMaster && (
        <EditMasterDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          master={selectedMaster}
          onSuccess={() => {
            onDataChange();
            setShowEditDialog(false);
            setSelectedMaster(null);
          }}
        />
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Borrower Details</DialogTitle>
            <DialogDescription>Complete information for {selectedMaster?.borrower_name}</DialogDescription>
          </DialogHeader>
          {selectedMaster && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {selectedMaster.borrower_name}</p>
                  <p><strong>Phone:</strong> {selectedMaster.borrower_phone || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedMaster.borrower_email || 'N/A'}</p>
                  <p><strong>Status:</strong> <Badge variant={getStatusColor(selectedMaster.status)}>{selectedMaster.status}</Badge></p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Loan Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Loan Amount:</strong> ₹{selectedMaster.loan_amount?.toLocaleString()}</p>
                  <p><strong>Outstanding:</strong> ₹{selectedMaster.outstanding_balance?.toLocaleString()}</p>
                  <p><strong>Interest Rate:</strong> {selectedMaster.interest_rate}%</p>
                  <p><strong>Start Date:</strong> {selectedMaster.start_date ? new Date(selectedMaster.start_date).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>End Date:</strong> {selectedMaster.end_date ? new Date(selectedMaster.end_date).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Borrower</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedMaster?.borrower_name}"? This action cannot be undone and will also delete all associated payments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <DialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </DialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};