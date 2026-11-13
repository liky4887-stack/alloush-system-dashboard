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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden w-full">
      {/* Centered glass card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-r from-muted/50 to-background backdrop-blur-sm shadow-2xl p-8 flex flex-col items-center border border-border">
        {/* Logo */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-6 shadow-lg">
          <span className="text-xl font-bold text-foreground">H&E</span>
        </div>
        
        {/* Dynamic Title */}
        <h2 className="text-2xl font-semibold text-foreground mb-6 text-center transition-all duration-300 h-8 w-full truncate">
          {getDisplayTitle()}
        </h2>
        
        {/* Form */}
        <div className="flex flex-col w-full gap-4" dir="ltr">
          <div className="w-full flex flex-col gap-3">
            
            {/* Group Selector Dropdown */}
            <div className="relative">
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                {RIG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-3.5 text-muted-foreground pointer-events-none" size={16} />
            </div>

            {/* Password Input with Eye Toggle */}
            <div className="relative">
              <input
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-input text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="text-sm text-destructive text-left w-full px-1" dir="ltr">{error}</div>
            )}
          </div>
          
          <hr className="opacity-10 border-border" />
          
          <div>
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-medium px-5 py-3 rounded-full shadow hover:bg-primary/90 transition mb-3 text-sm disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            
            {/* Google Sign In (Visual only for now) */}
            <button className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground rounded-full px-5 py-3 font-medium shadow hover:bg-secondary/80 transition mb-2 text-sm">
              <img
                src="https://cdn.21st.dev/assets/mirror/38/38146bfd9eff6dbf0d74771f2e625c70d87d3770e0d080dbb6e50db1d5403f46.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SignIn1 };
export default SignIn1;
