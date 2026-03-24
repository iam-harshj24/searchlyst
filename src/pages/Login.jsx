import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Mail, Lock, Loader2, AlertCircle, User, Chrome, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { loginSchema, registerSchema } from '@/validations/auth';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isSignupParam = searchParams.get('signup') === 'true' || searchParams.has('signup');
  const nameParam = searchParams.get('name') || searchParams.get('fullName') || '';
  const emailParam = searchParams.get('email') || '';

  const { login, sendOtp, verifyOtp, loginWithGoogle, forgotPassword, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(isSignupParam);
  // 'form' = login/signup form | 'otp' = OTP verification step | 'forgot-password' | 'reset-password'
  const [step, setStep] = useState('form');
  const [pendingEmail, setPendingEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  // OTP digit state
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(''));
  const otpRefs = useRef([]);
  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const fromAdmin = location.state?.from === 'admin';
  const fromPath = location.state?.from;

  useEffect(() => {
    if (fromAdmin && location.state?.message) {
      toast.info(location.state.message);
    }
  }, [fromAdmin, location.state?.message]);

  // Clean up cooldown interval on unmount
  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const form = useForm({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
    defaultValues: {
      name: nameParam,
      email: emailParam,
      password: '',
    },
  });

  const startResendCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN_SEC);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);

    if (isRegister) {
      const result = await sendOtp(values.email, values.password, values.name);
      if (result.success && result.otpSent) {
        setPendingEmail(values.email);
        setStep('otp');
        setOtpDigits(Array(OTP_LENGTH).fill(''));
        startResendCooldown();
        toast.success('Verification code sent! Check your inbox.');
      } else {
        const msg = result.error?.message || 'Registration failed. Please try again.';
        setError(msg);
        toast.error(msg);
      }
    } else {
      const result = await login(values.email, values.password);
      if (result.success) {
        toast.success('Login successful!');
        if (result.user?.role === 'admin') {
          navigate('/AdminPanel');
        } else {
          navigate(fromPath && fromPath !== '/Login' ? fromPath : '/Dashboard');
        }
      } else {
        setError(result.error?.message || 'Login failed. Please check your credentials.');
        toast.error('Login failed');
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error('Google login failed');
      return;
    }

    setLoading(true);
    setError('');
    const result = await loginWithGoogle(credentialResponse.credential);
    if (result.success) {
      toast.success('Google login successful!');
      navigate('/Dashboard');
    } else {
      const message = result.error?.message || 'Google login failed.';
      setError(message);
      toast.error('Google login failed');
    }
    setLoading(false);
  };

  // ── OTP digit handlers ───────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtpDigits(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIdx]?.focus();
  };

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join('');
    if (otp.length < OTP_LENGTH) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await verifyOtp(pendingEmail, otp);
    if (result.success) {
      toast.success('Account created successfully! Welcome to Searchlyst.');
      navigate(fromPath && fromPath !== '/Login' ? fromPath : '/Dashboard');
    } else {
      const msg = result.message || result.error?.message || 'Verification failed.';
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    const formValues = form.getValues();
    const result = await sendOtp(formValues.email || pendingEmail, formValues.password, formValues.name);
    if (result.success && result.otpSent) {
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      otpRefs.current[0]?.focus();
      startResendCooldown();
      toast.success('A new code has been sent to your email.');
    } else {
      const msg = result.error?.message || 'Failed to resend code. Please try again.';
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    if (e) e.preventDefault();
    const email = form.getValues('email') || pendingEmail;
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await forgotPassword(email);
    if (result.success) {
      setPendingEmail(email);
      setStep('reset-password');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setNewPassword('');
      toast.success(result.message || 'Reset code sent to your email.');
    } else {
      setError(result.error?.message || 'Failed to send reset code.');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    const otp = otpDigits.join('');
    if (otp.length < OTP_LENGTH) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await resetPassword(pendingEmail, otp, newPassword);
    if (result.success) {
      toast.success('Password reset successfully! Please log in.');
      setStep('form');
      setIsRegister(false);
      form.setValue('password', '');
    } else {
      setError(result.error?.message || 'Password reset failed.');
    }
    setLoading(false);
  };

  // ── OTP Verification Screen ──────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center text-white">Verify Your Email</CardTitle>
            <CardDescription className="text-center text-gray-400">
              We sent a 6-digit code to <span className="text-white font-medium">{pendingEmail}</span>. It expires in 10 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* OTP digit inputs */}
            <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  disabled={loading}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <Button
              onClick={handleVerifyOtp}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-11"
              disabled={loading || otpDigits.join('').length < OTP_LENGTH}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : 'Verify & Create Account'}
            </Button>

            <div className="text-center space-y-3">
              <button
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                className="flex items-center gap-1.5 mx-auto text-sm text-red-400 hover:text-red-300 transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </button>
              <button
                onClick={() => { setStep('form'); setError(''); setOtpDigits(Array(OTP_LENGTH).fill('')); }}
                className="block text-sm text-gray-400 hover:text-white transition-colors mx-auto"
              >
                ← Back to sign up
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Forgot Password Screen ───────────────────────────────────────────────
  if (step === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center text-white">Reset Password</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Enter your email address and we'll send a 6-digit code to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <Form {...form}>
              <form onSubmit={handleForgotPassword} className="space-y-4">
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

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-11"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending code...
                    </>
                  ) : 'Send Reset Code'}
                </Button>
              </form>
            </Form>

            <div className="text-center space-y-3">
              <button
                onClick={() => { setStep('form'); setError(''); }}
                className="block text-sm text-gray-400 hover:text-white transition-colors mx-auto"
              >
                ← Back to login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Reset Password OTP + New Password Screen ─────────────────────────────
  if (step === 'reset-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center text-white">Create New Password</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Enter the 6-digit code sent to <span className="text-white font-medium">{pendingEmail}</span> along with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Reset Code</label>
                <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-2xl font-bold rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                      disabled={loading}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                onClick={handleResetPassword}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-11"
                disabled={loading || otpDigits.join('').length < OTP_LENGTH || newPassword.length < 8}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : 'Reset Password'}
              </Button>
            </div>

            <div className="text-center space-y-3">
              <button
                onClick={() => { setStep('form'); setError(''); setOtpDigits(Array(OTP_LENGTH).fill('')); setNewPassword(''); }}
                className="block text-sm text-gray-400 hover:text-white transition-colors mx-auto"
              >
                ← Back to login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Login / Signup Form ──────────────────────────────────────────────────
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
            {fromAdmin
              ? 'Log in with admin credentials to access the admin panel'
              : isRegister
                ? 'Sign up to get started'
                : 'Enter your credentials to access your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isRegister && (
            <div className="mb-4 space-y-3">
              {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                <div className="flex justify-center">
                  <GoogleLogin onSuccess={handleGoogleLogin} onError={() => toast.error('Google login failed')} />
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-gray-800 border-gray-700 text-gray-300"
                  disabled
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  Google login unavailable
                </Button>
              )}
              <div className="relative text-center text-xs uppercase text-gray-500">
                <span className="bg-gray-900 px-2 relative z-10">or continue with email</span>
                <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-700 -z-0" />
              </div>
            </div>
          )}

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
                    {isRegister ? 'Sending code...' : 'Logging in...'}
                  </>
                ) : (
                  isRegister ? 'Continue' : 'Login'
                )}
              </Button>
            </form>
          </Form>

          {!isRegister && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { setStep('forgot-password'); setError(''); }}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <div className="mt-6 text-center space-y-4">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                form.reset({ name: nameParam, email: emailParam, password: '' });
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
