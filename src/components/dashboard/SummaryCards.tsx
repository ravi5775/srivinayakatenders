import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import { DashboardSummary } from '@/types/loan';
import { useLanguage } from '@/contexts/LanguageContext';

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export const SummaryCards = ({ summary }: SummaryCardsProps) => {
  const { t } = useLanguage();
  const cards = [
    {
      title: t('dashboard.totalGiven'),
      value: `₹${summary.totalGiven.toLocaleString('en-IN')}`,
      icon: DollarSign,
      trend: '+12.5%',
      trendUp: true
    },
    {
      title: t('dashboard.totalCollected'),
      value: `₹${summary.totalCollected.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      trend: '+8.2%',
      trendUp: true
    },
    {
      title: t('dashboard.outstanding'),
      value: `₹${summary.totalOutstanding.toLocaleString('en-IN')}`,
      icon: TrendingDown,
      trend: '-5.1%',
      trendUp: false
    },
    {
      title: t('dashboard.totalProfit'),
      value: `₹${summary.totalProfit.toLocaleString('en-IN')}`,
      icon: Users,
      trend: '+15.3%',
      trendUp: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
            <p className={`text-xs ${card.trendUp ? 'text-success' : 'text-destructive'} flex items-center mt-1`}>
              {card.trendUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {card.trend} {t('dashboard.fromLastMonth')}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};