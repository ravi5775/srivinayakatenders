import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Phone, CreditCard, TrendingUp, Clock, CheckCircle, Printer } from 'lucide-react';
import { Customer, Payment } from '@/types/loan';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  payments: Payment[];
}

export const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  isOpen,
  onClose,
  customer,
  payments
}) => {
  const { t } = useLanguage();
  if (!customer) return null;

  const customerPayments = payments.filter(p => p.customerID === customer.customerID);
  const totalPaid = customerPayments.reduce((sum, payment) => sum + payment.amountPaid, 0);

  const handlePrint = () => window.print();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('details.customerDetails')} - {customer.name}
            </span>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              {t('actions.print')}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('details.customerInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <strong>{t('table.customerID')}:</strong> {customer.customerID}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <strong>{t('form.phone')}:</strong> {customer.phone}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <strong>{t('form.startDate')}:</strong> {format(new Date(customer.startDate), 'PPP')}
              </div>
              <div className="flex items-center gap-2">
                <strong>{t('table.status')}:</strong>
                <Badge variant={
                  customer.status === 'ACTIVE' ? 'default' :
                  customer.status === 'COMPLETED' ? 'secondary' : 'destructive'
                }>
                  {customer.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Loan Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('details.loanSummary')}</CardTitle>
              <CardDescription>{customer.tenderName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('form.principal')}</p>
                  <p className="font-semibold">₹{customer.principal.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('summary.totalCollected') || 'Total Collected'}</p>
                  <p className="font-semibold text-green-600">₹{customer.collectedAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('table.remainingAmount')}</p>
                  <p className="font-semibold text-orange-600">₹{customer.remainingAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('table.nextDueDate')}</p>
                  <p className="font-semibold">{format(new Date(customer.nextDueDate), 'PP')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('details.installmentDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('form.installmentType')}</p>
                  <p className="font-semibold">{customer.installmentType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('table.installmentAmount')}</p>
                  <p className="font-semibold">₹{customer.installmentAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('details.paidInstallments')}</p>
                  <p className="font-semibold text-green-600">{customer.paidInstallments}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('details.remainingInstallments')}</p>
                  <p className="font-semibold text-orange-600">{customer.remainingInstallments}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>{t('details.progress')}</span>
                  <span>{Math.round((customer.paidInstallments / customer.totalInstallments) * 100)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(customer.paidInstallments / customer.totalInstallments) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History Logbook */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t('details.paymentLogbook')}
              </CardTitle>
              <CardDescription>
                {customerPayments.length} {t('details.payments')} • {t('details.total')}: ₹{totalPaid.toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customerPayments.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {customerPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium">₹{payment.amountPaid.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(payment.dateOfPayment), 'PPP')}
                          </p>
                          {payment.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {payment.paymentMode}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {payment.installmentsCovered} {t('table.installments')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('details.noPayments')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {customer.notes && (
          <>
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('details.notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{customer.notes}</p>
              </CardContent>
            </Card>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};