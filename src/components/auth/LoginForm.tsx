import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('Form submitted with:', { email, password: password ? '***' : 'empty' });

    try {
      const success = await login(email, password);
      console.log('Login result:', success);
      
      if (!success) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Use: admin@srivinayatender.com / admin123",
          variant: "destructive"
        });
      } else {
        console.log('Login successful');
        toast({
          title: "Login Successful",
          description: "Welcome to Sri Vinaya Tender Admin Panel",
        });
        // Small delay to ensure state propagation
        setTimeout(() => {
          setLoading(false);
        }, 100);
        return;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Sri Vinaya Tender</CardTitle>
          <CardDescription>Admin Login Portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@srivinayatender.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full mt-2" 
              onClick={() => {
                setEmail('admin@srivinayatender.com');
                setPassword('admin123');
              }}
            >
              Use Demo Credentials
            </Button>
            <div className="text-xs text-muted-foreground text-center mt-4 p-2 bg-muted/50 rounded">
              <strong>Demo credentials:</strong><br />
              Email: admin@srivinayatender.com<br />
              Password: admin123
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};