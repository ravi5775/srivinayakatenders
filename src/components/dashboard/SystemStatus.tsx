import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Shield,
  Activity
} from 'lucide-react';
import EnhancedGoogleSheetsService from '@/services/EnhancedGoogleSheetsService';
import { useToast } from '@/hooks/use-toast';

interface SystemStatusProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ isOpen, onClose }) => {
  const [syncStatus, setSyncStatus] = React.useState<any>(null);
  const [cacheStatus, setCacheStatus] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const sheetsService = EnhancedGoogleSheetsService.getInstance();

  React.useEffect(() => {
    if (isOpen) {
      updateStatus();
      const interval = setInterval(updateStatus, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const updateStatus = () => {
    setSyncStatus(sheetsService.getSyncStatus());
    setCacheStatus(sheetsService.getCacheStatus());
  };

  const handleForceSync = async () => {
    setLoading(true);
    try {
      await sheetsService.syncAll();
      updateStatus();
      toast({
        title: 'Success',
        description: 'Data synchronized successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to synchronize data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    sheetsService.clearCache();
    updateStatus();
    toast({
      title: 'Cache Cleared',
      description: 'Local cache has been cleared',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Status
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Database Status */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Database className="w-4 h-4" />
              Database Status
            </h3>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Local Database</span>
              </div>
              <Badge variant="default">Connected</Badge>
            </div>
          </div>

          {/* Data Summary */}
          <div className="space-y-3">
            <h3 className="font-semibold">Data Summary</h3>
            
            {cacheStatus && Object.entries(cacheStatus).map(([key, status]: [string, any]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="capitalize">{key}</span>
                </div>
                <Badge variant="secondary">{status.count} records</Badge>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleForceSync} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sync to Sheets
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleClearCache}
              disabled={loading}
            >
              Recover Data
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Close
            </Button>
          </div>

          {/* System Info */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">System Information</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Backend: MySQL Database</div>
              <div>Environment: Development</div>
              <div>Version: 1.0.0</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};