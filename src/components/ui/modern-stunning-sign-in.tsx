"use client";

import * as React from "react";
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';

const RIG_OPTIONS = [
  { value: 'HR', label: 'HR (الموارد البشرية)' },
  { value: 'B2', label: 'B2' },
  { value: 'B3', label: 'B3' },
  { value: 'B5', label: 'B5' },
  { value: 'B6', label: 'B6' },
  { value: 'B7', label: 'B7' },
  { value: 'B8', label: 'B8' },
  { value: 'B9', label: 'B9' },
  { value: 'B10', label: 'B10' },
  { value: 'B11', label: 'B11' },
  { value: 'LAHEEB', label: 'ساحة اللهيب' },
];

const SignIn1 = () => {
  const [group, setGroup] = React.useState("HR");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!password) {
      setError("Please enter the password.");
      return;
    }
    
    setError("");
    setLoading(true);
    
    const email = `${group.toLowerCase()}@alloush.local`;

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    }
  };

  const getDisplayTitle = () => {
    if (group === 'HR') return 'HR Management';
    if (group === 'LAHEEB') return 'Laheeb Yard Supervisor';
    return `Rig ${group} Supervisor`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#2a241f] relative overflow-hidden w-full">
      
      {/* Background Image with Dark Overlay */}
      <img 
        src="https://cdn.21st.dev/assets/mirror/4a/4a0ed73b8ab76bd427aa70ab124329127f3df27cc7f31223a832ed7d28b3dda4.jpg" 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
      />
      <div className="absolute inset-0 bg-[#2a241f]/60 backdrop-blur-sm pointer-events-none" />

      {/* Centered Glass Card */}
      <div className="relative z-10 w-full max-w-sm rounded-[2rem] bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-8 flex flex-col items-center border border-white/10">
        
        {/* Logo Orb */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md mb-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.3)] border border-white/20">
          <span className="text-xl font-bold text-[#f4f0ea] tracking-widest">H&E</span>
        </div>
        
        {/* Dynamic Title */}
        <h2 className="text-2xl font-semibold text-[#f4f0ea] mb-8 text-center transition-all duration-300 h-8 w-full truncate drop-shadow-md">
          {getDisplayTitle()}
        </h2>
        
        {/* Form */}
        <div className="flex flex-col w-full gap-4" dir="ltr">
          <div className="w-full flex flex-col gap-4">
            
            {/* Group Selector Dropdown */}
            <div className="relative">
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 text-[#f4f0ea] text-sm focus:outline-none focus:border-[#d4b896]/50 focus:bg-black/40 transition-all appearance-none cursor-pointer shadow-inner"
              >
                {RIG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#2a241f] text-[#f4f0ea]">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-4 text-white/50 pointer-events-none" size={16} />
            </div>

            {/* Password Input with Eye Toggle */}
            <div className="relative">
              <input
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 text-[#f4f0ea] placeholder-white/40 text-sm focus:outline-none focus:border-[#d4b896]/50 focus:bg-black/40 transition-all pr-12 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-white/50 hover:text-[#f4f0ea] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-400 text-left w-full px-1 font-medium drop-shadow-sm" dir="ltr">{error}</div>
            )}
          </div>
          
          <hr className="opacity-10 border-white/20 my-1" />
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-[#d4b896] text-[#2a241f] font-bold px-5 py-3.5 rounded-xl shadow-[0_4px_14px_rgba(212,184,150,0.3)] hover:bg-[#c4a886] hover:shadow-[0_6px_20px_rgba(212,184,150,0.4)] transition-all text-sm disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            
            {/* Google Sign In */}
            <button className="w-full flex items-center justify-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3.5 font-medium text-[#f4f0ea] shadow-sm hover:bg-white/10 transition-all text-sm">
              <img
                src="https://cdn.21st.dev/assets/mirror/38/38146bfd9eff6dbf0d74771f2e625c70d87d3770e0d080dbb6e50db1d5403f46.svg"
                alt="Google"
                className="w-5 h-5 drop-shadow"
              />
              Continue with Google
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer Text */}
      <div className="relative z-10 mt-8 text-center">
        <p className="text-white/40 text-xs font-medium tracking-wide">
          H&E Associate · Management System
        </p>
      </div>
    </div>
  );
};

export { SignIn1 };
export default SignIn1;
