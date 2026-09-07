'use client'

import { useState, Suspense } from 'react'
import { ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/components/shared/AuthLayout'
import { SkcoolyWordmark } from '@/components/shared/SkcoolyWordmark'

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!token) {
            toast.error('Invalid or missing reset token.')
            return
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match.')
            return
        }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters.')
            return
        }

        setLoading(true)
        try {
            await api.post('/auth/reset-password', { token, password })
            toast.success('Password reset successfully. You can now log in.')
            router.push('/login')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reset password. The link might have expired.')
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="text-center py-6">
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Invalid Link</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    This password reset link is invalid or has expired.
                </p>
                <Link href="/forgot-password" className="text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors">
                    Request a new link
                </Link>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <Label htmlFor="password" className="block text-sm font-semibold text-foreground mb-1.5">New Password</Label>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full h-auto px-4 py-3.5 pr-12 rounded-xl text-[15px] font-medium bg-muted/50 border-border focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-0 shadow-sm"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary transition-colors p-1">
                        {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <div>
                <Label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground mb-1.5">Confirm New Password</Label>
                <div className="relative">
                    <Input
                        id="confirmPassword"
                        type={showPw ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full h-auto px-4 py-3.5 pr-12 rounded-xl text-[15px] font-medium bg-muted/50 border-border focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-0 shadow-sm"
                    />
                </div>
            </div>

            <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-[15px] font-bold text-secondary-foreground bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed mt-2"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin" />
                        Resetting...
                    </span>
                ) : 'Reset Password'}
            </Button>
        </form>
    )
}

export default function ResetPasswordPage() {
    return (
        <AuthLayout
            variant="secondary"
            eyebrow="Recovery"
            heading="Choose a new password"
            subheading="Pick something strong — you'll use this to sign back into Central Admin."
        >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="bg-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border p-8 sm:p-10"
                >
                    <div className="flex flex-col items-center mb-6">
                        <div className="mb-3 relative">
                            <SkcoolyWordmark size="lg" />
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mb-4">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[11px] font-bold tracking-wider uppercase">Recovery</span>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Set New Password</h1>
                        <p className="text-sm text-muted-foreground mt-1.5 font-medium text-center">
                            Enter your new password below.
                        </p>
                    </div>

                    <Suspense fallback={<div className="text-center py-6 text-muted-foreground">Loading...</div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </motion.div>
        </AuthLayout>
    )
}
