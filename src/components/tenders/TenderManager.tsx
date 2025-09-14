import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, DollarSign, Users, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Customer } from '@/types/loan';

interface TenderManagerProps {
  customers: Customer[];
  onAddCustomer: (tenderType: 'DailyPlan' | 'MonthlyPlan') => void;
}

export const TenderManager = ({ customers, onAddCustomer }: TenderManagerProps) => {
  const { t } = useLanguage();
  
  const dailyCustomers = customers.filter(c => c.installmentType === 'DAY');
  const monthlyCustomers = customers.filter(c => c.installmentType === 'MONTH');

  const calculateTenderStats = (tenderCustomers: Customer[]) => {
    return {
      totalCustomers: tenderCustomers.length,
      activeCustomers: tenderCustomers.filter(c => c.status === 'ACTIVE').length,
      totalGiven: tenderCustomers.reduce((sum, c) => sum + c.disbursedAmount, 0),
      totalCollected: tenderCustomers.reduce((sum, c) => sum + c.collectedAmount, 0),
      totalOutstanding: tenderCustomers.reduce((sum, c) => sum + c.remainingAmount, 0),
      dueToday: tenderCustomers.filter(c => {
        const today = new Date().toISOString().split('T')[0];
        return c.nextDueDate === today && c.status === 'ACTIVE';
      }).length
    };
  };

  const dailyStats = calculateTenderStats(dailyCustomers);
  const monthlyStats = calculateTenderStats(monthlyCustomers);

  const TenderCard = ({ 
    title, 
    description, 
    stats, 
    customers, 
    tenderType,
    gradientClass 
  }: {
    title: string;
    description: string;
    stats: ReturnType<typeof calculateTenderStats>;
    customers: Customer[];
    tenderType: 'DailyPlan' | 'MonthlyPlan';
    gradientClass: string;
  }) => (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 opacity-5 ${gradientClass}`} />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {tenderType === 'DailyPlan' ? <Calendar className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button 
            onClick={() => onAddCustomer(tenderType)}
            size="sm"
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Customer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
              <Users className="h-5 w-5" />
              {stats.totalCustomers}
            </div>
            <p className="text-sm text-muted-foreground">Total Customers</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-success">
              <Badge variant="outline" className="text-success border-success">
                {stats.activeCustomers}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-warning">
              {stats.dueToday}
            </div>
            <p className="text-sm text-muted-foreground">Due Today</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary">
              <DollarSign className="h-4 w-4" />
              ₹{stats.totalGiven.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">Total Given</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-success/5 border border-success/10">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-success">
              <DollarSign className="h-4 w-4" />
              ₹{stats.totalCollected.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">Collected</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-warning/5 border border-warning/10">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-warning">
              <DollarSign className="h-4 w-4" />
              ₹{stats.totalOutstanding.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </div>
        </div>

        {customers.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Recent Customers</h4>
            <div className="space-y-2">
              {customers.slice(0, 3).map(customer => (
                <div key={customer.customerID} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{customer.name}</span>
                    <Badge 
                      variant={customer.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {customer.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ₹{customer.remainingAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
              {customers.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{customers.length - 3} more customers
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Tender Management</h2>
        <p className="text-muted-foreground">
          Manage your daily and monthly tender plans separately with dedicated dashboards
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="daily">
            {t('filter.daily')} ({dailyCustomers.length})
          </TabsTrigger>
          <TabsTrigger value="monthly">
            {t('filter.monthly')} ({monthlyCustomers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TenderCard
              title={t('filter.daily')}
              description="Daily installment collection with 30-day cycles"
              stats={dailyStats}
              customers={dailyCustomers}
              tenderType="DailyPlan"
              gradientClass="bg-gradient-to-br from-primary to-primary/50"
            />
            <TenderCard
              title={t('filter.monthly')}
              description="Monthly installment collection with flexible terms"
              stats={monthlyStats}
              customers={monthlyCustomers}
              tenderType="MonthlyPlan"
              gradientClass="bg-gradient-to-br from-info to-info/50"
            />
          </div>
        </TabsContent>

        <TabsContent value="daily">
          <TenderCard
            title={`${t('filter.daily')} - Detailed View`}
            description="Complete overview of all daily plan customers and collections"
            stats={dailyStats}
            customers={dailyCustomers}
            tenderType="DailyPlan"
            gradientClass="bg-gradient-to-br from-primary to-primary/50"
          />
        </TabsContent>

        <TabsContent value="monthly">
          <TenderCard
            title={`${t('filter.monthly')} - Detailed View`}
            description="Complete overview of all monthly plan customers and collections"
            stats={monthlyStats}
            customers={monthlyCustomers}
            tenderType="MonthlyPlan"
            gradientClass="bg-gradient-to-br from-info to-info/50"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};