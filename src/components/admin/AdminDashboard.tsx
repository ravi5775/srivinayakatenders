import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Download, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { getDashboardStats, fetchMasters, fetchPayments, fetchLogbook, exportAllDataToXlsx } from '@/services/supabaseService';
import { MasterTable } from './MasterTable';
import { PaymentTable } from './PaymentTable';
import { LogbookTable } from './LogbookTable';
import { AddMasterDialog } from './AddMasterDialog';
import { AddPaymentDialog } from './AddPaymentDialog';
import { BulkImportDialog } from './BulkImportDialog';
import { toast } from 'sonner';

export const AdminDashboard: React.FC = () => {
  const { user, profile, signOut } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMasters: 0,
    totalPayments: 0,
    totalOutstanding: 0,
  });

  const [masters, setMasters] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  const [showAddMaster, setShowAddMaster] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, mastersData, paymentsData, logsData] = await Promise.all([
        getDashboardStats(),
        fetchMasters(),
        fetchPayments(),
        fetchLogbook(),
      ]);

      setStats(statsData);
      setMasters(mastersData);
      setPayments(paymentsData);
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = async () => {
    try {
      toast.info('Preparing export...');
      await exportAllDataToXlsx();
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const refreshData = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Sri Vinaya Admin</h1>
                  <p className="text-sm text-muted-foreground">Loan Management System</p>
                </div>
              </div>
              <Badge variant="secondary">Admin Panel</Badge>
            </div>

            <div className="flex items-center space-x-2">
              <BulkImportDialog />
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
              <Button onClick={() => setShowAddMaster(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Borrower
              </Button>
              <Button onClick={() => setShowAddPayment(true)} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
              <Button onClick={signOut} variant="ghost" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Borrowers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{stats.totalMasters}</div>
              <p className="text-xs text-muted-foreground">Active loan accounts</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">₹{stats.totalPayments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Payments received</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">₹{stats.totalOutstanding.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Amount pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Manage borrowers, payments, and view system logs</CardDescription>
                </div>
              </div>
              <TabsList className="grid w-full grid-cols-4 lg:w-fit">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="borrowers">Borrowers</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="logs">Activity Logs</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Borrowers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {masters.slice(0, 5).map((master) => (
                          <div key={master.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{master.borrower_name}</p>
                              <p className="text-sm text-muted-foreground">
                                ₹{master.loan_amount?.toLocaleString()}
                              </p>
                            </div>
                            <Badge variant={master.status === 'active' ? 'default' : 'secondary'}>
                              {master.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {payments.slice(0, 5).map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{payment.master?.borrower_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-green-600">₹{payment.amount?.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">{payment.payment_method}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="borrowers">
                <MasterTable data={masters} onDataChange={refreshData} />
              </TabsContent>

              <TabsContent value="payments">
                <PaymentTable data={payments} onDataChange={refreshData} />
              </TabsContent>

              <TabsContent value="logs">
                <LogbookTable data={logs} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Dialogs */}
      <AddMasterDialog 
        open={showAddMaster} 
        onOpenChange={setShowAddMaster}
        onSuccess={refreshData}
      />
      <AddPaymentDialog 
        open={showAddPayment} 
        onOpenChange={setShowAddPayment}
        onSuccess={refreshData}
        masters={masters}
      />
    </div>
  );
};