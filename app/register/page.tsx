'use client'

import { useState } from 'react'
import { Eye, EyeOff, UserPlus, Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import AuthLayout from '@/components/shared/AuthLayout'
import { SkcoolyWordmark } from '@/components/shared/SkcoolyWordmark'

// Same fallback lib/api.ts already uses — see login/page.tsx for why this
// matters (a missing env var otherwise silently 404s against this Next.js
// server instead of the backend).
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

export default function RegisterPage() {
    const router = useRouter()
    const [step, setStep] = useState<1 | 2>(1)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [otp, setOtp] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSetupStep1 = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !email) return toast.error('Name and email required')
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return toast.error('Please enter a valid email address')
        
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/central/auth/setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Setup failed')
            
            toast.success(data.message)
            setStep(2)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSetupStep2 = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!otp || !password || !confirmPassword) return toast.error('All fields are required')
        
        if (!/^\d{6}$/.test(otp)) return toast.error('OTP must be exactly 6 digits')
        if (password !== confirmPassword) return toast.error('Passwords do not match')
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;
        if (!passwordRegex.test(password)) {
            return toast.error('Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.');
        }
        
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/central/auth/setup/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, password })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Verification failed')
            
            toast.success('Admin account created successfully! Please login.')
            router.push('/login')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            variant="primary"
            eyebrow="Master Setup"
            heading="Set up your master admin account"
            subheading="This creates the first Super Admin for Skcooly Central — the account with full platform control."
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
                            {step === 1 ? 'Master Setup' : 'Verify & Secure'}
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm">
                            {step === 1 ? 'Initialize the central admin account' : 'Enter OTP and create your password'}
                        </p>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleSetupStep1} className="space-y-5">
                            <div className="space-y-4">
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                                    <Input
                                        type="text"
                                        placeholder="Full Name"
                                        className="w-full h-auto bg-muted/50 border-border pl-12 pr-4 py-3.5 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                                    <Input
                                        type="email"
                                        placeholder="Master Email Address"
                                        className="w-full h-auto bg-muted/50 border-border pl-12 pr-4 py-3.5 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full group h-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3.5 font-semibold shadow-lg shadow-primary/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                            >
                                <span>{loading ? 'Validating...' : 'Continue to Verification'}</span>
                                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            </Button>

                            <div className="text-center mt-6">
                                <Link href="/login" className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSetupStep2} className="space-y-5">
                            <div className="relative">
                                <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                                <Input
                                    type="text"
                                    placeholder="6-digit OTP Code"
                                    className="w-full h-auto bg-muted/50 border-border pl-12 pr-4 py-3.5 rounded-xl tracking-widest text-lg font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                                <Input
                                    type={showPw ? 'text' : 'password'}
                                    placeholder="Secure Password"
                                    className="w-full h-auto bg-muted/50 border-border pl-12 pr-12 py-3.5 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                                <Input
                                    type={showPw ? 'text' : 'password'}
                                    placeholder="Confirm Password"
                                    className="w-full h-auto bg-muted/50 border-border pl-12 pr-12 py-3.5 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex space-x-3 pt-2">
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
                                    disabled={loading || otp.length !== 6 || !password || !confirmPassword}
                                    className="flex-[2] h-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3.5 font-semibold shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                                >
                                    {loading ? 'Creating...' : 'Create Account'}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </AuthLayout>
    )
}
