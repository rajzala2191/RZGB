import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  resetPasswordForEmail,
  signOut,
  updateUserPassword,
  verifyRecoveryOtp,
} from '@/services/authService';
import LoginView from '@/features/auth/presentational/LoginView';

const OTP_LENGTH = Number(import.meta.env.VITE_EMAIL_OTP_LENGTH || 6);

export default function LoginContainer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentUser, userRole } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(location.state?.error || '');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [step, setStep] = useState('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);

  const mapOtpError = (err, fallback) => {
    const message = (err?.message || '').toLowerCase();
    if (
      message.includes('rate limit') ||
      message.includes('too many') ||
      message.includes('security purposes') ||
      message.includes('only request this after')
    ) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (message.includes('invalid login credentials') || message.includes('user not found')) {
      return 'No account found for this email address.';
    }
    return err?.message || fallback;
  };

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (window.location.hash.includes('type=invite')) {
      navigate(`/create-password${window.location.hash}`, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (showForgotPassword) return;
    if (currentUser && userRole) {
      if (userRole === 'super_admin') navigate('/platform-admin', { replace: true });
      else if (userRole === 'admin') navigate('/control-centre', { replace: true });
      else if (userRole === 'client') navigate('/client-dashboard', { replace: true });
      else if (userRole === 'supplier') navigate('/supplier-hub', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [currentUser, userRole, navigate, showForgotPassword]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: loginError } = await login(email, password);

      if (loginError) {
        setError(loginError.message || 'Invalid email or password');
        toast({
          title: 'Login Failed',
          description: loginError.message || 'Please check your credentials and try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Welcome Back',
          description: 'Successfully logged in to RZ Portal.',
        });
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      const { error: resetError } = await resetPasswordForEmail(
        forgotEmail.trim().toLowerCase(),
      );
      if (resetError) throw resetError;
      setStep('otp');
      setResendCooldown(60);
    } catch (err) {
      setForgotError(
        mapOtpError(err, 'Failed to send code. Please check the email address.'),
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (text.length === OTP_LENGTH) {
      setOtp(text.split(''));
      otpRefs.current[OTP_LENGTH - 1]?.focus();
    }
    e.preventDefault();
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const token = otp.join('');
    if (token.length < OTP_LENGTH) {
      setForgotError(`Please enter the complete ${OTP_LENGTH}-digit code.`);
      return;
    }
    setForgotError('');
    setForgotLoading(true);
    try {
      const { error: verifyError } = await verifyRecoveryOtp({
        email: forgotEmail.trim().toLowerCase(),
        token,
      });
      if (verifyError) throw verifyError;
      setStep('password');
    } catch (err) {
      setForgotError(mapOtpError(err, 'Invalid or expired code. Please try again.'));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e?.preventDefault();
    if (newPassword.length < 8) {
      setForgotError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setForgotError('');
    setForgotLoading(true);
    try {
      const { error: updateError } = await updateUserPassword(newPassword);
      if (updateError) throw updateError;
      await signOut();
      setStep('done');
    } catch (err) {
      setForgotError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotFlow = () => {
    setStep('email');
    setForgotEmail('');
    setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setForgotLoading(false);
    setForgotError('');
    setResendCooldown(0);
  };

  const handleForgotFieldChange = (e, field = 'email') => {
    if (field === 'newPassword') setNewPassword(e.target.value);
    else if (field === 'confirmPassword') setConfirmPassword(e.target.value);
    else setForgotEmail(e.target.value);
  };

  return (
    <LoginView
      email={email}
      password={password}
      loading={loading}
      error={error}
      showForgotPassword={showForgotPassword}
      onEmailChange={(e) => setEmail(e.target.value)}
      onPasswordChange={(e) => setPassword(e.target.value)}
      onSubmit={handleLoginSubmit}
      onOpenForgotPassword={() => {
        resetForgotFlow();
        setShowForgotPassword(true);
      }}
      onCloseForgotPassword={() => {
        setShowForgotPassword(false);
      }}
      forgotPasswordProps={{
        step,
        email: forgotEmail,
        otp,
        newPassword,
        confirmPassword,
        showPassword,
        loading: forgotLoading,
        error: forgotError,
        resendCooldown,
        otpLength: OTP_LENGTH,
        otpRefs,
        onEmailChange: handleForgotFieldChange,
        onOtpChange: handleOtpChange,
        onOtpKeyDown: handleOtpKeyDown,
        onOtpPaste: handleOtpPaste,
        onSendOtp: handleSendOtp,
        onVerifyOtp: handleVerifyOtp,
        onSetPassword: handleSetPassword,
        onBackToEmail: () => {
          setStep('email');
          setForgotError('');
          setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
        },
        onToggleShowPassword: () => setShowPassword((v) => !v),
      }}
    />
  );
}
