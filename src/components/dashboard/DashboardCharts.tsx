import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Customer } from '@/types/loan';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface DashboardChartsProps {
  customers: Customer[];
}

export const DashboardCharts = ({ customers }: DashboardChartsProps) => {
  // Monthly collections data (mock data - in real app would come from payments)
  const monthlyCollectionsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Collections (₹)',
        data: [125000, 98000, 156000, 134000, 187000, 145000],
        backgroundColor: 'hsl(var(--primary) / 0.8)',
        borderColor: 'hsl(var(--primary))',
        borderWidth: 1,
      },
    ],
  };

  // Portfolio split data
  const dayCustomers = customers.filter(c => c.installmentType === 'DAY').length;
  const monthCustomers = customers.filter(c => c.installmentType === 'MONTH').length;
  
  const portfolioSplitData = {
    labels: ['Daily', 'Monthly'],
    datasets: [
      {
        data: [dayCustomers, monthCustomers],
        backgroundColor: [
          'hsl(var(--primary) / 0.8)',
          'hsl(var(--secondary) / 0.8)',
        ],
        borderColor: [
          'hsl(var(--primary))',
          'hsl(var(--secondary))',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '₹' + value.toLocaleString('en-IN');
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Collections</CardTitle>
          <CardDescription>Collection trends over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <Bar data={monthlyCollectionsData} options={chartOptions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Split</CardTitle>
          <CardDescription>Distribution of customers by installment type</CardDescription>
        </CardHeader>
        <CardContent>
          <Doughnut data={portfolioSplitData} options={doughnutOptions} />
        </CardContent>
      </Card>
    </div>
  );
};