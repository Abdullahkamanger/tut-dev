'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBlogs } from '../../context/BlogContext';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [githubLoading, setGithubLoading] = useState<boolean>(false);
  
  const { login } = useBlogs() as {
    login: (user: any, token: string) => void;
  };
  
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Map Auth.js error codes to user-friendly messages
        let errorMessage = "Invalid email or password";
        
        if (result.error.includes("No user found with this email")) {
          errorMessage = "No account found with this email address";
        } else if (result.error.includes("Invalid email or password")) {
          errorMessage = "Incorrect password. Please try again.";
        } else if (result.error === "CredentialsSignin") {
          errorMessage = "Invalid credentials. Please check your email and password.";
        }

        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      toast.success('Successfully logged in!');
      // After successful login, redirect
      router.push('/');
      router.refresh();
    } catch (err: any) {
      toast.error('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setGithubLoading(true);
    try {
      await signIn('github', { callbackUrl: '/' });
    } catch (error) {
      toast.error('GitHub sign in failed');
      setGithubLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Pick up where you left off
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-white"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-white"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <p className="text-center text-slate-500 dark:text-slate-400 mt-8">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-600 dark:text-indigo-400 font-bold">
            Sign Up
          </Link>
        </p>

        <p className="text-center text-slate-500 dark:text-slate-400 mt-3">
          Forgot your password?{' '}
          <Link href="/forgot-password" className="text-indigo-600 dark:text-indigo-400 font-bold">
            Reset your password here
          </Link>
        </p>

        <div className="mt-6">
          <button
            onClick={handleGithubSignIn}
            disabled={githubLoading}
            className="w-full flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-600 rounded-xl py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {githubLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              'Sign in with Github'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;