import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authApi } from '@/lib/api';
import { Shield, Loader2 } from 'lucide-react';

interface LoginForm {
  username: string;
  password: string;
}

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const loginForm = useForm<LoginForm>();
  const registerForm = useForm<RegisterForm>();

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: LoginForm) => authApi.login(username, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error: any) => {
      setError(error.message || 'Login failed');
    }
  });

  const registerMutation = useMutation({
    mutationFn: ({ username, email, password }: Omit<RegisterForm, 'confirmPassword'>) => 
      authApi.register({ username, email, password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error: any) => {
      setError(error.message || 'Registration failed');
    }
  });

  const onLogin = (data: LoginForm) => {
    setError(null);
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterForm) => {
    setError(null);
    
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary-foreground" data-testid="logo-icon" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="app-title">CryptoGuard</h1>
          <p className="text-muted-foreground mt-2" data-testid="app-subtitle">
            Fraud Detection Multi-Agent System
          </p>
        </div>

        <Card data-testid="auth-card">
          <CardHeader>
            <CardTitle data-testid="auth-title">Access Control Panel</CardTitle>
            <CardDescription data-testid="auth-description">
              Sign in to monitor blockchain transactions and manage fraud detection agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4" data-testid="error-alert">
                <AlertDescription data-testid="error-message">{error}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2" data-testid="auth-tabs">
                <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4" data-testid="login-form">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" data-testid="label-username">Username</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Enter your username"
                      data-testid="input-username"
                      {...loginForm.register('username', { required: true })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" data-testid="label-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      data-testid="input-password"
                      {...loginForm.register('password', { required: true })}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4" data-testid="register-form">
                  <div className="space-y-2">
                    <Label htmlFor="register-username" data-testid="label-register-username">Username</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Choose a username"
                      data-testid="input-register-username"
                      {...registerForm.register('username', { required: true })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email" data-testid="label-register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      data-testid="input-register-email"
                      {...registerForm.register('email', { required: true })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password" data-testid="label-register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      data-testid="input-register-password"
                      {...registerForm.register('password', { required: true, minLength: 6 })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" data-testid="label-confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      data-testid="input-confirm-password"
                      {...registerForm.register('confirmPassword', { required: true })}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerMutation.isPending}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p data-testid="demo-info">
                Demo system for crypto transaction fraud detection
              </p>
              <p className="mt-1" data-testid="mongodb-info">
                Powered by MongoDB Atlas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
