import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Get client IP for logging
export const getClientIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get client IP:', error);
    return null;
  }
};

// Master (Borrower/Loan) operations
export const createMaster = async (payload: {
  borrower_name: string;
  borrower_phone?: string;
  borrower_email?: string;
  loan_amount: number;
  interest_rate?: number;
  start_date?: string;
  end_date?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  const ip = await getClientIP();
  const userAgent = navigator.userAgent;

  const { data, error } = await supabase.rpc('rpc_create_master', {
    p_borrower_name: payload.borrower_name,
    p_borrower_phone: payload.borrower_phone || null,
    p_borrower_email: payload.borrower_email || null,
    p_loan_amount: payload.loan_amount,
    p_interest_rate: payload.interest_rate || 0,
    p_start_date: payload.start_date || null,
    p_end_date: payload.end_date || null,
    p_user_id: user?.id,
    p_device_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) throw error;
  return data;
};

// Add payment
export const addPayment = async (payload: {
  master_id: number;
  amount: number;
  payment_method?: string;
  note?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  const ip = await getClientIP();
  const userAgent = navigator.userAgent;

  const { data, error } = await supabase.rpc('rpc_add_payment', {
    p_master_id: payload.master_id,
    p_amount: payload.amount,
    p_payment_method: payload.payment_method || 'cash',
    p_note: payload.note || null,
    p_user_id: user?.id,
    p_device_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) throw error;
  return data;
};

// Update master
export const updateMaster = async (masterId: number, updates: Record<string, any>) => {
  const { data: { user } } = await supabase.auth.getUser();
  const ip = await getClientIP();
  const userAgent = navigator.userAgent;

  const { error } = await supabase.rpc('rpc_update_master', {
    p_master_id: masterId,
    p_updates: updates,
    p_user_id: user?.id,
    p_device_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) throw error;
};

// Delete master
export const deleteMaster = async (masterId: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  const ip = await getClientIP();
  const userAgent = navigator.userAgent;

  const { error } = await supabase.rpc('rpc_delete_master', {
    p_master_id: masterId,
    p_user_id: user?.id,
    p_device_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) throw error;
};

// Fetch data functions
export const fetchMasters = async (limit: number = 100, offset: number = 0) => {
  const { data, error } = await supabase
    .from('master')
    .select(`
      *,
      payments:payments(*)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
};

export const fetchPayments = async (masterId?: number, limit: number = 100, offset: number = 0) => {
  let query = supabase
    .from('payments')
    .select(`
      *,
      master:master(borrower_name)
    `)
    .order('payment_date', { ascending: false });

  if (masterId) {
    query = query.eq('master_id', masterId);
  }

  const { data, error } = await query.range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
};

export const fetchLogbook = async (limit: number = 100, offset: number = 0) => {
  const { data, error } = await supabase
    .from('logbook')
    .select(`
      *,
      master:master(borrower_name)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
};

// Dashboard statistics
export const getDashboardStats = async () => {
  const [mastersResult, paymentsResult, totalOutstandingResult] = await Promise.all([
    supabase.from('master').select('*', { count: 'exact', head: true }),
    supabase.from('payments').select('amount'),
    supabase.from('master').select('outstanding_balance'),
  ]);

  const totalMasters = mastersResult.count || 0;
  const totalPayments = paymentsResult.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const totalOutstanding = totalOutstandingResult.data?.reduce((sum, m) => sum + (m.outstanding_balance || 0), 0) || 0;

  return {
    totalMasters,
    totalPayments,
    totalOutstanding,
  };
};

// Export all data to Excel
export const exportAllDataToXlsx = async () => {
  try {
    // Fetch all data in parallel
    const [mastersData, paymentsData, logsData] = await Promise.all([
      supabase.from('master').select('*'),
      supabase.from('payments').select(`
        *,
        master:master(borrower_name)
      `),
      supabase.from('logbook').select(`
        *,
        master:master(borrower_name)
      `),
    ]);

    if (mastersData.error) throw mastersData.error;
    if (paymentsData.error) throw paymentsData.error;
    if (logsData.error) throw logsData.error;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Master sheet
    const wsMaster = XLSX.utils.json_to_sheet(mastersData.data || []);
    XLSX.utils.book_append_sheet(wb, wsMaster, 'Master');

    // Payments sheet
    const wsPayments = XLSX.utils.json_to_sheet(paymentsData.data || []);
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments');

    // Logbook sheet
    const wsLogbook = XLSX.utils.json_to_sheet(logsData.data || []);
    XLSX.utils.book_append_sheet(wb, wsLogbook, 'Logbook');

    // Generate and download
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const filename = `srivinaya_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename);

    return { success: true };
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};