import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Mail, Loader2, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';

const forgotPasswordSchema = z.object({
  email: z.string().email('Must be a valid email'),
});

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await apiClient.auth.forgotPassword(values.email);
      setSubmitted(true);
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/10 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Reset your password</h1>
          <p className="text-white/40 text-sm mt-2">
            {submitted
              ? "Check your inbox for the reset link"
              : "Enter your email and we'll send you a reset link"
            }
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Email sent!</h3>
              <p className="text-white/40 text-sm mb-6">
                If an account exists with that email, you'll receive password reset instructions shortly.
              </p>
              <Button
                onClick={() => { setSubmitted(false); form.reset(); }}
                variant="outline"
                className="border-white/[0.06] text-white/50 hover:text-white rounded-xl"
              >
                Try another email
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/50 text-xs font-medium">Email address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <Input
                            type="email"
                            placeholder="you@company.com"
                            className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 pl-10 h-11 rounded-xl"
                            disabled={loading}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/Login"
              className="text-sm text-white/30 hover:text-white/60 transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
