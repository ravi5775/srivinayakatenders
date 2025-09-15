import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Settings, Languages, Palette, Key, Database, Download, Upload } from 'lucide-react';
import { backupDataToZip, restoreFromZip } from '@/services/backupService';
interface AdminSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSettings = ({ isOpen, onClose }: AdminSettingsProps) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { updateCredentials } = useAuth();
  const { toast } = useToast();

  const [credentialsForm, setCredentialsForm] = useState({
    currentEmail: '',
    newEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleCredentialsUpdate = async () => {
    if (credentialsForm.newPassword !== credentialsForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (credentialsForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    const success = await updateCredentials(
      credentialsForm.currentEmail,
      credentialsForm.currentPassword,
      credentialsForm.newEmail,
      credentialsForm.newPassword
    );

    if (success) {
      toast({
        title: "Success",
        description: t('settings.credentialsUpdated'),
      });
      setCredentialsForm({
        currentEmail: '',
        newEmail: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      onClose();
    } else {
      toast({
        title: "Error",
        description: "Failed to update credentials. Please check current credentials.",
        variant: "destructive",
      });
    }
  };

  const handleCredentialsChange = (field: string, value: string) => {
    setCredentialsForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('settings.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Languages className="h-4 w-4" />
                {t('settings.language')}
              </CardTitle>
              <CardDescription>
                Choose your preferred language for the interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={language} onValueChange={(value: 'en' | 'te') => setLanguage(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-4 w-4" />
                {t('settings.theme')}
              </CardTitle>
              <CardDescription>
                Choose between light and dark theme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={theme} onValueChange={(value: 'light' | 'dark') => setTheme(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('settings.light')}</SelectItem>
                  <SelectItem value="dark">{t('settings.dark')}</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Credentials Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="h-4 w-4" />
                {t('settings.changeCredentials')}
              </CardTitle>
              <CardDescription>
                Update your login email and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentEmail">{t('settings.currentEmail')}</Label>
                  <Input
                    id="currentEmail"
                    type="email"
                    value={credentialsForm.currentEmail}
                    onChange={(e) => handleCredentialsChange('currentEmail', e.target.value)}
                    placeholder="current@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newEmail">{t('settings.newEmail')}</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={credentialsForm.newEmail}
                    onChange={(e) => handleCredentialsChange('newEmail', e.target.value)}
                    placeholder="new@email.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('settings.currentPassword')}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={credentialsForm.currentPassword}
                  onChange={(e) => handleCredentialsChange('currentPassword', e.target.value)}
                  placeholder="Current password"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={credentialsForm.newPassword}
                    onChange={(e) => handleCredentialsChange('newPassword', e.target.value)}
                    placeholder="New password (min 6 chars)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('settings.confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={credentialsForm.confirmPassword}
                    onChange={(e) => handleCredentialsChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleCredentialsUpdate}
                className="w-full"
                disabled={!credentialsForm.currentEmail || !credentialsForm.currentPassword || !credentialsForm.newEmail || !credentialsForm.newPassword || !credentialsForm.confirmPassword}
              >
                {t('settings.updateCredentials')}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            {t('form.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};