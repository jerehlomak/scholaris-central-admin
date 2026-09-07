'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, ShieldCheck, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import AuthLayout from '@/components/shared/AuthLayout'
import { SkcoolyWordmark } from '@/components/shared/SkcoolyWordmark'

// Same fallback lib/api.ts already uses — without it, a missing
// NEXT_PUBLIC_API_URL silently becomes the literal string "undefined" in
// the fetch URL below, which the browser resolves as a path on this Next.js
// server itself (not the backend), returning its own 404 HTML page instead
// of JSON.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

export default function LoginPage() {
    const { login } = useAuth()
    const [step, setStep] = useState<1 | 2>(1)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [otp, setOtp] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleLoginStep1 = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) return toast.error('Email and password required')
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return toast.error('Please enter a valid email address')
        
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/central/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Login failed')
            
            if (data.requireOtp) {
                toast.success(data.message)
                setStep(2)
            } else {
                toast.error('Unexpected response from server')
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLoginStep2 = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!otp) return toast.error('Please enter the verification code')
        
        if (!/^\d{6}$/.test(otp)) return toast.error('OTP must be exactly 6 digits')
        
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/central/auth/login/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Verification failed')
            
            if (data.token) {
                localStorage.setItem('centralAdminToken', data.token)
                localStorage.setItem('centralAdmin', JSON.stringify(data.admin))
                toast.success('Login successful!')
                window.location.href = '/'
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            variant="primary"
            eyebrow="Central Admin"
            heading="Run your platform from one place"
            subheading="Manage schools, billing, subscriptions, and support — all from a single secure dashboard."
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-md bg-card/70 backdrop-blur-2xl border border-border/60 rounded-[2rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative z-10"
            >

                <div className="relative z-10">
                    <div className="text-center mb-6 flex flex-col items-center">
                        <SkcoolyWordmark size="lg" className="mb-3" />
                        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                            {step === 1 ? 'Central Admin' : 'Two-Factor Auth'}
                        </h1>
                        <p className="text-muted-foreground font-medium">
                            {step === 1 ? 'Secure platform management' : 'Enter the code sent to your email'}
                        </p>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleLoginStep1} className="space-y-6">
                            <div className="space-y-4">
                                <div className="relative" suppressHydrationWarning>
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                                    <Input
                                        type="email"
                                        placeholder="Admin Email"
                                        className="w-full h-auto bg-muted/50 border-border pl-12 pr-4 py-3.5 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        suppressHydrationWarning
                                    />
                                </div>
                                <div className="relative" suppressHydrationWarning>
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                                    <Input
                                        type={showPw ? 'text' : 'password'}
                                        placeholder="Password"
                                        className="w-full h-auto bg-muted/50 border-border pl-12 pr-12 py-3.5 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        suppressHydrationWarning
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(!showPw)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full group h-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3.5 font-semibold shadow-lg shadow-primary/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                            >
                                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            </Button>

                            <div className="text-center mt-6">
                                <Link href="/register" className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
                                    Create Master Admin Account
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleLoginStep2} className="space-y-6">
                            <div className="relative">
                                <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                                <Input
                                    type="text"
                                    placeholder="Enter 6-digit code"
                                    className="w-full h-auto bg-muted/50 border-border pl-12 pr-4 py-3.5 rounded-xl text-center tracking-widest text-lg font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                    required
                                />
                            </div>

                            <div className="flex space-x-3">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setStep(1)}
                                    className="flex-1 h-auto bg-muted hover:bg-muted/80 text-foreground rounded-xl py-3.5 font-medium transition-all"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="flex-[2] h-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3.5 font-semibold shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                                >
                                    {loading ? 'Verifying...' : 'Verify Code'}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </AuthLayout>
    )
}
