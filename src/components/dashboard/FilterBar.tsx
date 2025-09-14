import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, Filter, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  installmentFilter: string;
  onInstallmentFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateFilter: Date | undefined;
  onDateFilterChange: (date: Date | undefined) => void;
  onExport: () => void;
  onSync?: () => void;
  syncing?: boolean;
}

export const FilterBar = ({
  searchTerm,
  onSearchChange,
  installmentFilter,
  onInstallmentFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  onExport,
  onSync,
  syncing = false
}: FilterBarProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row gap-4 mb-6 p-4 bg-card rounded-lg border">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers by name, phone, or ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={installmentFilter} onValueChange={onInstallmentFilterChange}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="DAY">Day-wise</SelectItem>
            <SelectItem value="MONTH">Monthly</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-40 justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, "PPP") : "Due date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={(date) => {
                onDateFilterChange(date);
                setIsCalendarOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button onClick={onExport} variant="outline" className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
        
        {onSync && (
          <Button 
            onClick={onSync} 
            variant="outline" 
            className="w-full sm:w-auto"
            disabled={syncing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync to Sheets'}
          </Button>
        )}
      </div>
    </div>
  );
};