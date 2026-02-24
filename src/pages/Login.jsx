import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Mail, Lock, Loader2, AlertCircle, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { loginSchema, registerSchema } from '@/validations/auth';

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const form = useForm({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);

    let result;
    if (isRegister) {
      result = await register(values.email, values.password, values.name);
    } else {
      result = await login(values.email, values.password);
    }
    
    if (result.success) {
      toast.success(isRegister ? 'Account created!' : 'Login successful!');
      if (result.user?.role === 'admin') {
        navigate('/AdminPanel');
      } else {
        navigate('/Dashboard');
      }
    } else {
      setError(result.error?.message || (isRegister ? 'Registration failed.' : 'Login failed. Please check your credentials.'));
      toast.error(isRegister ? 'Registration failed' : 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center text-white">{isRegister ? 'Create Account' : 'Welcome Back'}</CardTitle>
          <CardDescription className="text-center text-gray-400">
            {isRegister ? 'Sign up to get started' : 'Enter your credentials to access your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              {isRegister && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <Input
                            placeholder="John Doe"
                            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                            disabled={loading}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <Input
                          type="email"
                          placeholder="user@example.com"
                          className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                          disabled={loading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                          disabled={loading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white h-11"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isRegister ? 'Creating Account...' : 'Logging in...'}
                  </>
                ) : (
                  isRegister ? 'Sign Up' : 'Login'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center space-y-4">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                form.reset();
              }}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </button>
            
            <div className="block">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
