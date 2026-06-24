import React, { useState } from "react";
import { Leaf, Mail, Lock, User, Chrome, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface LoginScreenProps {
  onAuthSuccess?: () => void;
}

export default function LoginScreen({ onAuthSuccess }: LoginScreenProps) {
  const { signIn, signUp, signInWithGoogle, isAvailable } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      onAuthSuccess?.();
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      onAuthSuccess?.();
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAvailable) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="clay-card p-8 max-w-md w-full text-center space-y-4">
          <Leaf className="w-12 h-12 text-accent mx-auto" />
          <h1 className="text-2xl font-bold font-display text-fg">EcoTrack</h1>
          <p className="text-sm text-muted">Firebase not configured. The app runs in offline mode with localStorage.</p>
          <p className="text-xs text-muted">To enable authentication, set VITE_FIREBASE_* environment variables.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="clay-card p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-black shadow-hard-offset">
            <Leaf className="w-7 h-7 text-white fill-white/20" />
          </div>
          <h1 className="text-2xl font-bold font-display text-fg">EcoTrack</h1>
          <p className="text-sm text-muted mt-1">Track your carbon footprint</p>
        </div>

        <div className="flex mb-6 bg-surface-warm/30 rounded-xl p-1 border border-border">
          <button
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              !isSignUp ? "bg-accent text-white shadow-clay" : "text-fg-2 hover:text-fg"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              isSignUp ? "bg-accent text-white shadow-clay" : "text-fg-2 hover:text-fg"
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-fg-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2.5 border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-fg-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-fg-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-4 py-2.5 border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="clay-btn-interactive w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}</span>
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-surface text-muted font-medium">or</span>
          </div>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-2.5 bg-surface border border-border hover:bg-surface-warm/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Chrome className="w-4 h-4" />
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}
