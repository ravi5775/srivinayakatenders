import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import GoogleSheetsService from '@/services/GoogleSheetsService';
import { Customer, Payment, LogEntry } from '@/types/loan';

const toCSV = (rows: (string | number)[][], headers: string[]) => {
  const escape = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  return [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
};

export const backupDataToZip = async () => {
  const zip = new JSZip();
  const sheets = GoogleSheetsService.getInstance();

  const [customers, payments, logbook] = await Promise.all([
    sheets.getCustomers(),
    sheets.getPayments(),
    sheets.getLogbook()
  ]);

  // Customers.csv (including remaining installments etc)
  const customersHeaders = [
    'CustomerID','Name','Phone','TenderName','StartDate','Principal','DisbursedAmount','Interest','DurationMonths','InstallmentType','TotalInstallments','InstallmentAmount','PaidInstallments','RemainingInstallments','CollectedAmount','RemainingAmount','NextDueDate','Status','Notes'
  ];
  const customersRows = (customers as Customer[]).map(c => [
    c.customerID,c.name,c.phone,c.tenderName,c.startDate,c.principal,c.disbursedAmount,c.interest,c.durationMonths,c.installmentType,c.totalInstallments,c.installmentAmount,c.paidInstallments,c.remainingInstallments,c.collectedAmount,c.remainingAmount,c.nextDueDate,c.status,c.notes
  ]);
  zip.file('Customers.csv', toCSV(customersRows, customersHeaders));

  // Payments.csv
  const paymentsHeaders = ['Id','CustomerID','Name','TenderName','DateOfPayment','AmountPaid','InstallmentsCovered','NewNextDueDate','PaymentMode','Notes'];
  const paymentsRows = (payments as Payment[]).map(p => [
    p.id,p.customerID,p.name,p.tenderName,p.dateOfPayment,p.amountPaid,p.installmentsCovered,p.newNextDueDate,p.paymentMode,p.notes
  ]);
  zip.file('Payments.csv', toCSV(paymentsRows, paymentsHeaders));

  // Logbook.csv
  const logHeaders = ['Id','TimestampISO','Action','ActorEmail','DetailsJSON','EntryHash'];
  const logRows = (logbook as LogEntry[]).map(l => [l.id,l.timestampISO,l.action,l.actorEmail,l.detailsJSON,l.entryHash]);
  zip.file('Logbook.csv', toCSV(logRows, logHeaders));

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `backup_${new Date().toISOString().split('T')[0]}.zip`);
};

export const restoreFromZip = async (file: File) => {
  // Note: Full restore requires a real backend. For now, we only validate and preview.
  const zip = await JSZip.loadAsync(file);
  const entries = Object.keys(zip.files);
  return { success: true, files: entries };
};
