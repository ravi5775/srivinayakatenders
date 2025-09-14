import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, CreditCard, Eye } from 'lucide-react';
import { Customer } from '@/types/loan';
import { format } from 'date-fns';

interface CustomerTableProps {
  customers: Customer[];
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onAddPayment: (customer: Customer) => void;
  onViewDetails: (customer: Customer) => void;
}

export const CustomerTable = ({
  customers,
  onEditCustomer,
  onDeleteCustomer,
  onAddPayment,
  onViewDetails
}: CustomerTableProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-success text-success-foreground';
      case 'COMPLETED': return 'bg-info text-info-foreground';
      case 'PAUSED': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRowClass = (customer: Customer) => {
    const today = new Date().toISOString().split('T')[0];
    if (customer.nextDueDate === today) return 'bg-warning/10 border-l-4 border-l-warning';
    if (customer.nextDueDate < today && customer.status === 'ACTIVE') return 'bg-destructive/10 border-l-4 border-l-destructive';
    if (customer.status === 'COMPLETED') return 'bg-success/10 border-l-4 border-l-success';
    return 'hover:bg-muted/50';
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Tender Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Installment</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead>Next Due</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.customerID} className={getRowClass(customer)}>
              <TableCell>
                <div>
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-muted-foreground">{customer.phone}</div>
                  <div className="text-xs text-muted-foreground">{customer.customerID}</div>
                </div>
              </TableCell>
              <TableCell>{customer.tenderName}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {customer.installmentType === 'DAY' ? 'Daily' : 'Monthly'}
                </Badge>
              </TableCell>
              <TableCell>₹{customer.installmentAmount.toLocaleString('en-IN')}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">₹{customer.remainingAmount.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-muted-foreground">
                    {customer.remainingInstallments} installments
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {customer.nextDueDate ? format(new Date(customer.nextDueDate), 'dd MMM yyyy') : '-'}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(customer.status)}>
                  {customer.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(customer)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddPayment(customer)}
                    disabled={customer.status !== 'ACTIVE'}
                  >
                    <CreditCard className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditCustomer(customer)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteCustomer(customer.customerID)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};