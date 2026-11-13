"use client";

import * as React from "react";
import { useState } from "react";
import { supabase } from '@/lib/supabase';

const SignIn1 = () => {
  const [email, setEmail] = React.useState("hr@alloush.local");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    
    setError("");
    setLoading(true);
    
    // Auto-append @alloush.local if they just type "hr" or "b2"
    let finalEmail = email.trim();
    if (!finalEmail.includes('@')) {
      finalEmail = `${finalEmail.toLowerCase()}@alloush.local`;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: finalEmail,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    }
    // No need to set state or redirect. App.tsx listens to onAuthStateChange.
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden w-full">
      {/* Centered glass card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-r from-muted/50 to-background backdrop-blur-sm shadow-2xl p-8 flex flex-col items-center border border-border">
        {/* Logo */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-6 shadow-lg">
          <span className="text-xl font-bold text-foreground">H&E</span>
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
          H&E Associate
        </h2>
        
        {/* Form */}
        <div className="flex flex-col w-full gap-4">
          <div className="w-full flex flex-col gap-3">
            <input
              placeholder="Email or Username (e.g. hr)"
              type="text"
              value={email}
              className="w-full px-5 py-3 rounded-xl bg-input text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              className="w-full px-5 py-3 rounded-xl bg-input text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <div className="text-sm text-destructive text-left">{error}</div>
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
