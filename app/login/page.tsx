'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

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
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        setServerError('');
        try {
            // Sign in via Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (authError) throw new Error(authError.message);

            // Fetch profile for role info
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('name, role, avatar_initials')
                .eq('id', authData.user.id)
                .single();

            if (profileError) throw new Error('Profile not found. Contact admin.');

            setAuth({
                id: authData.user.id,
                email: authData.user.email ?? data.email,
                name: profile.name,
                role: profile.role,
                avatarInitials: profile.avatar_initials,
            });

            // Log successful login in audit (fire and forget)
            supabase.from('audit_logs').insert({
                user_id: authData.user.id,
                user_name: profile.name,
                user_role: profile.role,
                action: 'login_success',
                details: `Logged in from web client`,
                status: 'success',
            });

            router.push('/dashboard');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setServerError(message);

            try {
                await supabase.from('audit_logs').insert({
                    user_name: data.email,
                    user_role: 'unknown',
                    action: 'login_failed',
                    details: `Failed login attempt for ${data.email}`,
                    status: 'failed',
                });
            } catch { /* ignore errors on audit log */ }
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

                            {/* Remember */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                    <input {...register('remember')} type="checkbox" className="rounded border-slate-300 accent-indigo-600" />
                                    Remember me
                                </label>
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
