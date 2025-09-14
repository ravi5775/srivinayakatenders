import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, EyeOff, Shield, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export const EnhancedLoginForm = () => {
  const { login, isLocked, lockoutEndTime, remainingAttempts } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutCountdown, setLockoutCountdown] = useState<number>(0);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);

  // Lockout countdown timer
  useEffect(() => {
    if (isLocked && lockoutEndTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((lockoutEndTime.getTime() - new Date().getTime()) / 1000));
        setLockoutCountdown(remaining);
        
        if (remaining === 0) {
          clearInterval(interval);
          window.location.reload(); // Refresh to clear lockout state
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLocked, lockoutEndTime]);

  // Password strength checker
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[\d!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      toast({
        title: t('Error'),
        description: 'Please enter both email and password',
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(email, password);
      
      if (!result.success) {
        toast({
          title: t('login.invalidCredentials'),
          description: result.message || 'Login failed',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: t('Error'),
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoCredentials = () => {
    setEmail('admin@srivinayatender.com');
    setPassword('SriVinaya@2025');
  };

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return 'bg-destructive';
    if (passwordStrength < 75) return 'bg-warning';
    return 'bg-success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Very Weak';
    if (passwordStrength < 50) return 'Weak';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t('login.title')}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sri Vinaya Tender Management System
            </CardDescription>
          </div>
          
          {/* Security Status */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-muted-foreground">Secure Authentication</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Account Lockout Warning */}
          {isLocked && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Account temporarily locked</span>
                <Badge variant="destructive" className="ml-2">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatCountdown(lockoutCountdown)}
                </Badge>
              </AlertDescription>
            </Alert>
          )}

          {/* Remaining Attempts Warning */}
          {!isLocked && remainingAttempts < 3 && remainingAttempts > 0 && (
            <Alert className="border-warning/50 bg-warning/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Warning: {remainingAttempts} login attempts remaining
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@srivinayatender.com"
                disabled={isLocked || isLoading}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('login.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLocked || isLoading}
                  className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLocked || isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Password Strength:</span>
                    <span className={`font-medium ${
                      passwordStrength < 50 ? 'text-destructive' : 
                      passwordStrength < 75 ? 'text-warning' : 'text-success'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <Progress 
                    value={passwordStrength} 
                    className="h-1"
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200"
              disabled={isLocked || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </div>
              ) : (
                t('login.login')
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleDemoCredentials}
              disabled={isLocked || isLoading}
            >
              {t('login.demoCredentials')}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>🔒 Your session is secured with encryption</p>
            <p>⏱️ Auto-logout after 30 minutes of inactivity</p>
            <p>🛡️ Maximum 5 login attempts before temporary lockout</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};