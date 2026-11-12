import { useState } from 'react';
import { Loader2, ShieldCheck, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthPanelProps {
  onClose: () => void;
}

export default function AuthPanel({ onClose }: AuthPanelProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    const result = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    setBusy(false);
    if (result.error) {
      setMessage('تعذر إتمام العملية. تحقق من البيانات وحاول مرة أخرى.');
      return;
    }

    if (mode === 'signup') {
      setMessage('تم إنشاء الحساب. إذا طلب النظام تأكيد البريد، تحقق من بريدك ثم سجّل الدخول.');
      setMode('signin');
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors" aria-label="إغلاق">
            <X size={18} />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <div>
              <h2 className="font-bold text-white">بوابة HR</h2>
              <p className="text-[11px] text-zinc-500">صلاحية تعديل وجهات الطلبات</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex gap-1 p-1 rounded-lg bg-zinc-800">
            <button type="button" onClick={() => setMode('signin')} className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${mode === 'signin' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>
              تسجيل الدخول
            </button>
            <button type="button" onClick={() => setMode('signup')} className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${mode === 'signup' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>
              إنشاء حساب
            </button>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs text-zinc-400">البريد الإلكتروني</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-zinc-400">كلمة المرور</span>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </label>

          {message && <p className="text-xs leading-5 text-amber-300">{message}</p>}

          <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
            {busy && <Loader2 size={15} className="animate-spin" />}
            {mode === 'signin' ? 'دخول HR' : 'إنشاء الحساب'}
          </button>
        </form>
      </div>
    </div>
  );
}
