import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, SubscriptionTier, Theme } from '../types';
import { TeuGlobalLogo, RestartIcon, SunIcon, MoonIcon } from './icons/Icons';
import { INITIAL_SUBSCRIPTION_FEATURES } from '../constants';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/resendService';


interface LoginProps {
  onLogin: (user: User) => void;
  allUsers: any[]; // Using any to access password for auth simulation
  onSubscriptionRequest: (email: string, password: string, tier: SubscriptionTier) => void;
  onInitiatePasswordReset: (email: string) => Promise<string | null>;
  onFinalizePasswordReset: (email: string, code: string, newPassword: string) => boolean;
  watermark?: string;
  theme?: Theme;
  toggleTheme?: () => void;
}

const SubscriptionRequestModal: React.FC<{
    onClose: () => void;
    onSubmit: (email: string, password: string, tier: SubscriptionTier) => void;
}> = ({ onClose, onSubmit }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [tier, setTier] = useState<SubscriptionTier>('Basic');
    const [error, setError] = useState('');
    const [step, setStep] = useState<'details' | 'verify'>('details');
    const [verificationCode, setVerificationCode] = useState('');
    const [sentCode, setSentCode] = useState('');

    const subscriptionTiers = Object.keys(INITIAL_SUBSCRIPTION_FEATURES) as SubscriptionTier[];

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        try {
            const code = await sendVerificationEmail(email);
            setSentCode(code);
            setStep('verify');
        } catch (err) {
            setError('Failed to send verification code. Please try again.');
        }
    };
    
    const handleVerifyAndSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (verificationCode === sentCode) {
            onSubmit(email, password, tier);
            onClose();
        } else {
            setError('Invalid verification code. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-light-surface/60 dark:bg-dark-surface/60 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-md p-6 border border-white/20" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">Request Subscription</h3>
                {step === 'details' && (
                    <>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                            Your request will be submitted to an administrator for approval after email verification.
                        </p>
                        <form onSubmit={handleRequestCode} className="space-y-4">
                            <div>
                                <label htmlFor="req-email" className="block text-sm font-medium mb-1">Email Address</label>
                                <input id="req-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 bg-light-bg/40 dark:bg-dark-bg/40 border border-accent dark:border-dark-border rounded-md focus:ring-2 focus:ring-accent focus:border-transparent"/>
                            </div>
                            <div>
                                <label htmlFor="req-password" className="block text-sm font-medium mb-1">Desired Password</label>
                                <input id="req-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 bg-light-bg/40 dark:bg-dark-bg/40 border border-accent dark:border-dark-border rounded-md focus:ring-2 focus:ring-accent focus:border-transparent"/>
                            </div>
                            <div>
                                <label htmlFor="req-tier" className="block text-sm font-medium mb-1">Desired Tier</label>
                                <select id="req-tier" value={tier} onChange={e => setTier(e.target.value as SubscriptionTier)} className="w-full p-2 bg-light-bg/40 dark:bg-dark-bg/40 border border-accent dark:border-dark-border rounded-md">
                                    {subscriptionTiers.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200/50 dark:bg-dark-border/50 rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary-blue dark:bg-accent text-white rounded-md btn-hover-themed transition-all">Send Verification Code</button>
                            </div>
                        </form>
                    </>
                )}
                {step === 'verify' && (
                     <>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                            A verification code has been sent to <strong>{email}</strong>. Please enter it below.
                        </p>
                        <form onSubmit={handleVerifyAndSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="verify-code" className="block text-sm font-medium mb-1">Verification Code</label>
                                <input id="verify-code" type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} required className="w-full p-2 bg-light-bg/40 dark:bg-dark-bg/40 border border-accent dark:border-dark-border rounded-md focus:ring-2 focus:ring-accent focus:border-transparent"/>
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setStep('details')} className="px-4 py-2 bg-gray-200/50 dark:bg-dark-border/50 rounded-md transition-colors">Back</button>
                                <button type="submit" className="px-4 py-2 bg-primary-blue dark:bg-accent text-white rounded-md btn-hover-themed transition-all">Verify & Submit Request</button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

const PasswordResetModal: React.FC<{
    onClose: () => void;
    onInitiate: (email: string) => Promise<string | null>;
    onFinalize: (email: string, code: string, newPassword: string) => boolean;
}> = ({ onClose, onInitiate, onFinalize }) => {
    const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        const sentCode = await onInitiate(email);
        if (sentCode) {
            setMessage(`If an account exists for ${email}, a reset code has been sent.`);
            setStep('verify');
        } else {
             setError('No account found with that email address.');
        }
    };

    const handleVerifyCode = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setStep('reset');
    };

    const handleResetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        const success = onFinalize(email, code, newPassword);
        if (success) {
            alert('Password reset successfully. You can now log in with your new password.');
            onClose();
        } else {
            setError('Invalid or expired code. Please try again.');
            setStep('email');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-light-surface/60 dark:bg-dark-surface/60 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-md p-6 border border-white/20" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">Reset Password</h3>
                {message && <p className="text-sm text-green-600 dark:text-green-400 mb-4">{message}</p>}
                {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
                
                {step === 'email' && (
                    <form onSubmit={handleSendCode} className="space-y-4">
                         <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Enter your email to receive a password reset code.</p>
                        <div>
                            <label htmlFor="reset-email" className="block text-sm font-medium mb-1">Email</label>
                            <input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 bg-light-bg/40 dark:bg-dark-bg/40 border border-accent dark:border-dark-border rounded-md"/>
                        </div>
                         <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200/50 dark:bg-dark-border/50 rounded-md">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary-blue dark:bg-accent text-white rounded-md btn-hover-themed transition-all">Send Code</button>
                        </div>
                    </form>
                )}

                {step === 'verify' && (
                    <form onSubmit={handleVerifyCode} className="space-y-4">
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Enter the code sent to your email.</p>
                        <div>
                            <label htmlFor="reset-code" className="block text-sm font-medium mb-1">Reset Code</label>
                            <input id="reset-code" type="text" value={code} onChange={e => setCode(e.target.value)} required className="w-full p-2 bg-light-bg/40 dark:bg-dark-bg/40 border border-accent dark:border-dark-border rounded-md"/>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setStep('email')} className="px-4 py-2 bg-gray-200/50 dark:bg-dark-border/50 rounded-md">Back</button>
                            <button type="submit" className="px-4 py-2 bg-primary-blue dark:bg-accent text-white rounded-md btn-hover-themed transition-all">Verify</button>
                        </div>
                    </form>
                )}

                {step === 'reset' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Enter your new password.</p>
                        <div>
                            <label htmlFor="new-password" className="block text-sm font-medium mb-1">New Password</label>
                            <input id="new-password" type="password" value={email} onChange={e => setNewPassword(e.target.value)} required className="w-full p-2 bg-light-bg/40 dark:bg-dark-bg/40 border border-accent dark:border-dark-border rounded-md"/>
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">Confirm New Password</label>
                            <input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full p-2 bg-light-bg/40 dark:bg-dark-bg/40 border border-accent dark:border-dark-border rounded-md"/>
                        </div>
                         <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setStep('verify')} className="px-4 py-2 bg-gray-200/50 dark:bg-dark-border/50 rounded-md">Back</button>
                            <button type="submit" className="px-4 py-2 bg-primary-blue dark:bg-accent text-white rounded-md btn-hover-themed transition-all">Reset Password</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};


const Login: React.FC<LoginProps> = ({ onLogin, allUsers, onSubscriptionRequest, onInitiatePasswordReset, onFinalizePasswordReset, watermark, theme, toggleTheme }) => {
  const [email, setEmail] = useState('admin@teuglobal.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCaptcha = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let newCaptcha = '';
    for (let i = 0; i < 6; i++) {
        newCaptcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(newCaptcha);
    return newCaptcha;
  }, []);

  const drawCaptcha = useCallback((text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.4)';
    const textColor = isDark ? '#F1F5F9' : '#0F172A';
    const noiseColor = isDark ? '#334155' : '#E2E8F0';

    // Background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Noise lines
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = noiseColor;
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
    }
    
    // Text
    ctx.font = 'bold 30px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < text.length; i++) {
        const x = canvas.width / (text.length + 1) * (i + 1);
        const y = canvas.height / 2;
        const angle = Math.random() * 0.5 - 0.25; 
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = textColor;
        ctx.fillText(text[i], 0, 0);
        ctx.restore();
    }
  }, []);

  useEffect(() => {
    const newCaptcha = generateCaptcha();
    drawCaptcha(newCaptcha);
  }, [generateCaptcha, drawCaptcha]);
  
  useEffect(() => {
    const observer = new MutationObserver(() => drawCaptcha(captcha));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [captcha, drawCaptcha]);

  const handleRefreshCaptcha = () => {
    const newCaptcha = generateCaptcha();
    drawCaptcha(newCaptcha);
    setCaptchaInput('');
  };
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (captchaInput.toLowerCase() !== captcha.toLowerCase()) {
        setError('Invalid CAPTCHA.');
        handleRefreshCaptcha();
        return;
    }

    const user = allUsers.find(u => u.email === email && u.password === password);
    if (user) {
      if (user.subscriptionExpires) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        
        if (user.subscriptionExpires < todayStr) {
            setError('Your subscription has expired. Please contact an administrator.');
            handleRefreshCaptcha();
            return;
        }
      }
      const { password, ...userToLogin } = user;
      onLogin(userToLogin);
    } else {
      setError('Invalid email or password.');
      handleRefreshCaptcha();
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg animate-fade-in overflow-hidden">
      {/* Watermark */}
      <div className="watermark-bg" style={{ backgroundImage: `url(${watermark})` }}></div>

      {/* Theme Toggle Button */}
      {toggleTheme && (
        <div className="absolute top-6 right-6 z-50">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="relative group h-12 w-12 flex items-center justify-center rounded-full bg-light-surface/60 dark:bg-dark-surface/60 backdrop-blur-md border border-accent dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg hover-themed"
            >
              <span className={`transition-transform duration-500 ease-in-out ${theme === Theme.Dark ? 'rotate-0 scale-100' : 'rotate-180 scale-100'}`}>
                {theme === Theme.Dark ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
              </span>
              <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900 text-white px-2 py-1 text-xs rounded-md invisible group-hover:visible transition-opacity opacity-0 group-hover:opacity-100 z-20">
                {`Switch to ${theme === Theme.Dark ? 'Light' : 'Dark'} Mode`}
              </span>
            </button>
        </div>
      )}

      <div className="relative z-10 w-full max-w-md p-8 space-y-8 bg-light-surface/60 dark:bg-dark-surface/60 backdrop-blur-lg rounded-lg shadow-2xl border border-accent dark:border-dark-border hover-themed transition-all duration-300">
        <div className="text-center">
            <TeuGlobalLogo className="w-auto h-24 mx-auto" />
            <h2 className="mt-6 text-2xl font-bold text-center text-light-text-primary dark:text-dark-text-primary">
              <span className="font-bold text-orange-500">TRADE EXPEDITORS INC.</span>
              </h2>
              <span className="mt-6 text-2xl font-bold text-center Font-bold text-blue-500"> DBA TEU GLOBAL</span>
            
            <p className="mt-2 text-sm text-center text-light-text-secondary dark:text-dark-text-secondary">
                AI HTS Assistant.
            </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-2 text-sm bg-light-bg/40 dark:bg-dark-bg/40 backdrop-blur-sm border border-accent dark:border-dark-border rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all hover-themed"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-2" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 text-sm bg-light-bg/40 dark:bg-dark-bg/40 backdrop-blur-sm border border-accent dark:border-dark-border rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all hover-themed"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
                <label htmlFor="captcha" className="sr-only">CAPTCHA</label>
                <div className="flex items-center gap-2">
                    <canvas 
                        ref={canvasRef} 
                        width="150" 
                        height="40" 
                        className="rounded-md border border-accent dark:border-dark-border shadow-sm backdrop-blur-sm"
                        aria-label={`CAPTCHA code: ${captcha.split('').join(' ')}`}
                    ></canvas>
                    <button type="button" onClick={handleRefreshCaptcha} className="p-2 rounded-md hover:bg-light-border dark:hover:bg-dark-border transition-all hover-themed" aria-label="Refresh CAPTCHA">
                        <RestartIcon className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary"/>
                    </button>
                    <input
                        id="captcha"
                        name="captcha"
                        type="text"
                        required
                        className="w-36 px-3 py-2 text-sm bg-light-bg/40 dark:bg-dark-bg/40 backdrop-blur-sm border border-accent dark:border-dark-border rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all hover-themed"
                        placeholder="Enter code"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        autoComplete="off"
                    />
                </div>
            </div>
          </div>
          {error && <p className="text-sm text-center text-red-500 font-bold">{error}</p>}

           <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => setIsResetModalOpen(true)} className="font-medium text-primary-blue dark:text-accent hover:underline transition-all">
                    Forgot your password?
                </button>
            </div>
          
          <div>
            <button
              type="submit"
              className="group relative flex justify-center w-full px-4 py-2.5 text-sm font-black uppercase tracking-widest text-white bg-primary-blue/90 dark:bg-accent/90 border border-transparent rounded-md transition-all btn-hover-themed"
            >
              Sign in
            </button>
          </div>
        </form>
         <div className="text-center text-sm">
            <button onClick={() => setIsRequestModalOpen(true)} className="font-medium text-primary-blue dark:text-accent hover:underline transition-all">
                Need an account? Request Access
            </button>
        </div>
      </div>
      {isRequestModalOpen && (
        <SubscriptionRequestModal 
            onClose={() => setIsRequestModalOpen(false)}
            onSubmit={onSubscriptionRequest}
        />
      )}
      {isResetModalOpen && (
        <PasswordResetModal
            onClose={() => setIsResetModalOpen(false)}
            onInitiate={onInitiatePasswordReset}
            onFinalize={onFinalizePasswordReset}
        />
      )}
       {/* Powered By Footer Attribution - Fixed Bottom Right of Main Content */}
                    <div className="absolute bottom-2 right-4 z-50 text-[10px] font-black uppercase tracking-widest pointer-events-none transition-all duration-300">
                        <div className="px-3 py-1.5 rounded-lg bg-white/40 dark:bg-black/20 backdrop-blur-md border border-accent/20 text-zinc-500 dark:text-zinc-400 shadow-sm">
                            Powered By Junaid Abbasi
                        </div>
                    </div>
    </div>
  );
};

export default Login;