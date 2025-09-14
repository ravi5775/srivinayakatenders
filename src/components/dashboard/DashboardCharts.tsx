import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Customer } from '@/types/loan';
import { useLanguage } from '@/contexts/LanguageContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface DashboardChartsProps {
  customers: Customer[];
}

export const DashboardCharts = ({ customers }: DashboardChartsProps) => {
  const { t } = useLanguage();
  // Resolve theme colors from CSS variables for canvas visibility
  const root = getComputedStyle(document.documentElement);
  const primary = `hsl(${root.getPropertyValue('--primary').trim()})`;
  const secondary = `hsl(${root.getPropertyValue('--secondary').trim()})`;
  const foreground = `hsl(${root.getPropertyValue('--foreground').trim()})`;
  const grid = `hsl(${root.getPropertyValue('--muted-foreground').trim()} / 0.2)`;

  // Monthly collections data (mock data)
  const monthlyCollectionsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: t('charts.collectionsLabel'),
        data: [125000, 98000, 156000, 134000, 187000, 145000],
        backgroundColor: primary,
        borderColor: primary,
        borderWidth: 1,
      },
    ],
  };

  // Portfolio split data
  const dayCustomers = customers.filter(c => c.installmentType === 'DAY').length;
  const monthCustomers = customers.filter(c => c.installmentType === 'MONTH').length;
  
  const portfolioSplitData = {
    labels: [t('filter.daily'), t('filter.monthly')],
    datasets: [
      {
        data: [dayCustomers, monthCustomers],
        backgroundColor: [primary, secondary],
        borderColor: [primary, secondary],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: foreground },
      },
    },
    scales: {
      x: {
        ticks: { color: foreground },
        grid: { color: grid },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: foreground,
          callback: function(value: any) {
            return '₹' + Number(value).toLocaleString('en-IN');
          }
        },
        grid: { color: grid },
      }
    }
  } as const;

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: foreground },
      },
    },
  } as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.monthlyCollections')}</CardTitle>
          <CardDescription>{t('charts.collectionsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Bar data={monthlyCollectionsData} options={chartOptions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('charts.portfolioSplit')}</CardTitle>
          <CardDescription>{t('charts.portfolioDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Doughnut data={portfolioSplitData} options={doughnutOptions} />
        </CardContent>
      </Card>
    </div>
  );
};