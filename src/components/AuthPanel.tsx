import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Lock, User } from 'lucide-react';

export default function AuthPanel({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let email = '';
    const upper = username.trim().toUpperCase();
    if (upper === 'HR') email = 'hr@alloush.local';
    else if (/^B(1[0-1]|[2-9])$/.test(upper)) email = upper.toLowerCase() + '@alloush.local';
    else {
      setError('رقم الحفارة غير صحيح (B2 to B11 or HR)');
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('كلمة المرور غير صحيحة');
      setLoading(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleLogin} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 w-full max-w-sm space-y-4">
        <h2 className="text-xl font-bold text-white text-center mb-6">تسجيل الدخول</h2>
        
        {error && <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">{error}</div>}

        <div className="relative">
          <User className="absolute right-3 top-3 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="رقم الحفارة (B2-B11) أو HR"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-10 pl-3 text-white focus:outline-none focus:border-emerald-500 text-right"
            dir="rtl"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute right-3 top-3 text-zinc-500" size={18} />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-10 pl-3 text-white focus:outline-none focus:border-emerald-500 text-right"
            dir="rtl"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'دخول'}
        </button>
      </form>
    </div>
  );
}
