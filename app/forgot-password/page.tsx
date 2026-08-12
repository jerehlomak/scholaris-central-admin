'use client'

import { useState } from 'react'
import { ShieldCheck, ArrowLeft, Mail } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/api'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/components/shared/AuthLayout'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.post('/auth/forgot-password', { email })
            setSubmitted(true)
            toast.success('Recovery link sent!')
        } catch {
            // Even if it fails, we don't want to expose if an email exists
            setSubmitted(true)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            variant="secondary"
            eyebrow="Recovery"
            heading="Account recovery, made simple"
            subheading="We'll send a secure link to your admin email so you can get back in safely."
        >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="bg-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border p-8 sm:p-10"
                >
                    <div className="flex flex-col items-center mb-6">
                        <div className="mb-3 relative">
                            <Image
                                src="/logo.png"
                                alt="Skooly Plus Logo"
                                width={160}
                                height={60}
                                className="object-contain"
                                priority
                            />
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mb-4">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[11px] font-bold tracking-wider uppercase">Recovery</span>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Forgot Password</h1>
                        <p className="text-sm text-muted-foreground mt-1.5 font-medium text-center">
                            Enter your admin email and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <Label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5">Email address</Label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="admin@skooly.com"
                                        className="w-full h-auto pl-12 pr-4 py-3.5 rounded-xl text-[15px] font-medium bg-muted/50 border-border focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-0"
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
                                        Sending...
                                    </span>
                                ) : 'Send Reset Link'}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">Check your email</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.
                            </p>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors"
                            >
                                Try another email
                            </button>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-border">
                        <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </div>
                </motion.div>
        </AuthLayout>
    )
}
