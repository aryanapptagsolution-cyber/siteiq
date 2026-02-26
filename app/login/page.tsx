'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';

const loginSchema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
    remember: z.boolean().optional(),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: 'admin@siteiq.com', password: 'demo1234' },
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        setServerError('');
        try {
            const res = await authApi.login({ email: data.email, password: data.password });
            setAuth(res.user, res.token);
            router.push('/dashboard');
        } catch {
            setServerError('Invalid credentials. Demo: admin@siteiq.com / demo1234 (or planner / analyst / viewer @siteiq.com)');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left — Brand Panel */}
            <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-indigo-600 to-indigo-800 flex-col items-center justify-center relative overflow-hidden">
                {/* Watermark bolt */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5">
                    <Zap className="w-[600px] h-[600px] text-white" strokeWidth={0.5} />
                </div>
                <div className="relative z-10 text-center px-12">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-white text-3xl font-bold tracking-tight">SiteIQ</span>
                    </div>
                    <h1 className="text-white text-4xl font-bold leading-tight mb-4">
                        Charger Site<br />Intelligence Platform
                    </h1>
                    <p className="text-indigo-200 text-lg leading-relaxed">
                        Powered by precision scoring<br />&amp; real-time analytics
                    </p>
                    <div className="mt-12 grid grid-cols-3 gap-4 text-center">
                        {[['30K+', 'Sites Analyzed'], ['99.9%', 'Uptime SLA'], ['4 Roles', 'RBAC Access']].map(([val, lbl]) => (
                            <div key={lbl} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                                <p className="text-white text-2xl font-bold">{val}</p>
                                <p className="text-indigo-200 text-xs mt-1">{lbl}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right — Auth Card */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-2xl p-10">
                        {/* Logo */}
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-slate-900 text-xl font-bold">SiteIQ</span>
                            <span className="ml-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">EV Deploy</span>
                        </div>

                        <h2 className="text-slate-900 text-3xl font-bold mb-1">Welcome back</h2>
                        <p className="text-slate-500 text-sm mb-8">Sign in to your workspace</p>

                        {serverError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
                                {serverError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Email */}
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="Email address"
                                    className="w-full pl-11 pr-4 h-12 bg-white border border-slate-200 rounded-full text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-500 pl-4">{errors.email.message}</p>}
                            </div>

                            {/* Password */}
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    className="w-full pl-11 pr-12 h-12 bg-white border border-slate-200 rounded-full text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                {errors.password && <p className="mt-1 text-xs text-red-500 pl-4">{errors.password.message}</p>}
                            </div>

                            {/* Remember / Forgot */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                    <input {...register('remember')} type="checkbox" className="rounded border-slate-300 accent-indigo-600" />
                                    Remember me
                                </label>
                                <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Forgot password?</a>
                            </div>

                            {/* CTA */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                {isLoading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Sign In <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-3 my-2">
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-xs text-slate-400">or continue with</span>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>

                            {/* SSO */}
                            <button
                                type="button"
                                className="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg flex items-center justify-center gap-3 transition-colors"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with SSO
                            </button>
                        </form>

                        <p className="mt-8 text-center text-xs text-slate-400">
                            Internal tool — authorized users only
                        </p>
                    </div>

                    {/* Status badge */}
                    <div className="mt-4 flex justify-end">
                        <div className="flex items-center gap-2 bg-white text-slate-600 text-xs px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Systems Operational
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
