import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { sendOtp, verifyOtpAndSetPassword, signInWithPassword, mapSupabaseUser } from '@/lib/auth';

type Step = 'form' | 'otp';
type Mode = 'login' | 'register';

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) { navigate('/dashboard', { replace: true }); return null; }

  const handleLogin = async () => {
    if (!email || !password) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      const u = await signInWithPassword(email, password);
      login(mapSupabaseUser(u));
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email || !password || !username) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      await sendOtp(email);
      toast.success('Verification code sent to your email');
      setStep('otp');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp) { toast.error('Enter the verification code'); return; }
    setLoading(true);
    try {
      const u = await verifyOtpAndSetPassword(email, otp, password, username);
      login(mapSupabaseUser(u));
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e.message || 'Verification failed');
      setLoading(false);
    }
  };

  const inp = "w-full bg-black/50 border border-amber-900/50 rounded px-3 py-2.5 text-amber-100 placeholder-amber-900/60 text-sm focus:outline-none focus:border-amber-600 transition-colors";
  const btn = "w-full py-3 rounded font-bold tracking-widest text-xs transition-colors disabled:opacity-50";

  return (
    <div className="min-h-screen bg-[#06090f] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1614851099511-773084f6911d?w=1600)', backgroundSize: 'cover' }}/>
      <div className="absolute inset-0 bg-gradient-to-b from-[#06090f] via-transparent to-[#06090f]"/>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold tracking-[0.15em] text-amber-400" style={{ fontFamily: 'Georgia,serif' }}>DUNGEON FORGE</h1>
            <p className="text-amber-700/60 tracking-[0.3em] text-[10px] uppercase mt-1">D&D 5e Virtual Tabletop</p>
          </Link>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-700 to-transparent mx-auto mt-4"/>
        </div>

        <div className="bg-[#0b0f1c] border border-amber-900/40 rounded-lg p-6">
          {/* Mode tabs */}
          {step === 'form' && (
            <div className="flex mb-5 border border-amber-900/30 rounded overflow-hidden">
              <button onClick={() => setMode('login')} className={`flex-1 py-2 text-xs font-bold tracking-widest transition-colors ${mode === 'login' ? 'bg-amber-900/40 text-amber-300' : 'text-amber-800 hover:text-amber-600'}`}>SIGN IN</button>
              <button onClick={() => setMode('register')} className={`flex-1 py-2 text-xs font-bold tracking-widest transition-colors ${mode === 'register' ? 'bg-amber-900/40 text-amber-300' : 'text-amber-800 hover:text-amber-600'}`}>REGISTER</button>
            </div>
          )}

          {step === 'otp' ? (
            <>
              <div className="text-center mb-5">
                <div className="text-amber-300 text-sm font-medium mb-1">Check your email</div>
                <div className="text-amber-700 text-xs">Enter the {4}-digit code sent to</div>
                <div className="text-amber-500 text-xs font-mono mt-0.5">{email}</div>
              </div>
              <div className="space-y-3">
                <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="0000" className={`${inp} text-center text-2xl tracking-[0.5em] font-mono`} maxLength={4} autoFocus onKeyDown={e => e.key === 'Enter' && handleVerify()}/>
                <button onClick={handleVerify} disabled={loading || otp.length < 4} className={`${btn} bg-amber-700/60 hover:bg-amber-600/70 border border-amber-600/50 text-amber-100`}>
                  {loading ? 'VERIFYING…' : 'VERIFY & CREATE ACCOUNT'}
                </button>
                <button onClick={() => setStep('form')} className="w-full text-amber-800 hover:text-amber-600 text-xs transition-colors py-1">← Back</button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {mode === 'register' && (
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className={inp}/>
              )}
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" className={inp} onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSendOtp())}/>
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" className={inp} onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSendOtp())}/>
              <button
                onClick={mode === 'login' ? handleLogin : handleSendOtp}
                disabled={loading}
                className={`${btn} bg-amber-800/60 hover:bg-amber-700/70 border border-amber-700/50 text-amber-100`}>
                {loading ? '…' : mode === 'login' ? 'ENTER THE REALM' : 'SEND VERIFICATION CODE'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-amber-900/40 text-[10px] mt-5">
          Continue as guest via session code on the <Link to="/" className="text-amber-800 hover:text-amber-600 transition-colors underline">home page</Link>
        </p>
      </div>
    </div>
  );
}
