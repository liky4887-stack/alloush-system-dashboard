import { Globe, LogIn, LogOut, ShieldCheck, Wifi } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

interface HeaderProps {
  session: Session | null;
  isHr: boolean;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export default function Header({ session, isHr, onOpenAuth, onSignOut }: HeaderProps) {
  return (
    <header className="relative flex flex-col items-center pt-8 pb-4 px-6 select-none">
      <div className="absolute top-6 left-0 right-0 flex justify-between items-center px-4 sm:px-0" dir="ltr">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 text-xs font-medium text-zinc-300 hover:bg-zinc-700/70 transition-colors">
          <Globe size={12} className="text-emerald-400" />
          English
        </button>
        {session ? (
          <button onClick={onSignOut} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 text-xs font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors" dir="rtl">
            <LogOut size={12} />
            خروج
          </button>
        ) : (
          <button onClick={onOpenAuth} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-800/60 bg-emerald-900/30 text-xs font-medium text-emerald-400 hover:bg-emerald-800/40 transition-colors" dir="rtl">
            <LogIn size={12} />
            دخول HR
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4 mt-5">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-800/60 bg-emerald-900/30 text-xs font-medium text-emerald-400">
          <Wifi size={12} />
          <span>متصل</span>
          <span className="opacity-60">ومتزامن</span>
        </div>
        {session && (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${isHr ? 'border-emerald-800/60 bg-emerald-900/30 text-emerald-400' : 'border-zinc-700 bg-zinc-800/60 text-zinc-400'}`}>
            <ShieldCheck size={12} />
            {isHr ? 'HR مفعل' : 'حساب موظف'}
          </div>
        )}
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white" dir="rtl">
          منظومة السيد علوش
        </h1>
        <p className="text-sm text-zinc-400 tracking-widest uppercase font-light">
          Mr. Alloush&apos;s System
        </p>
      </div>

      <div className="mt-5 w-24 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-70" />
    </header>
  );
}
