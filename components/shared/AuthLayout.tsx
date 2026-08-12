'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Shield, School, Wallet, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthLayoutProps {
    variant: 'primary' | 'secondary'
    eyebrow: string
    heading: string
    subheading: string
    children: ReactNode
}

export default function AuthLayout({ variant, eyebrow, heading, subheading, children }: AuthLayoutProps) {
    const isPrimary = variant === 'primary'

    return (
        <div className="force-light min-h-screen flex bg-background">
            {/* Branding panel */}
            <div className={cn(
                'hidden lg:flex flex-col justify-between w-[45%] xl:w-[40%] p-12 relative overflow-hidden text-white',
                isPrimary
                    ? 'bg-gradient-to-br from-primary via-primary to-secondary'
                    : 'bg-gradient-to-br from-secondary via-secondary to-primary'
            )}>
                {/* Dot pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:22px_22px]" />
                {/* Soft glow orbs */}
                <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-[100px]" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-black/10 blur-[100px]" />
                {/* Ghost decorative icons */}
                <School className="absolute top-[18%] right-[12%] w-16 h-16 text-white/10" />
                <Wallet className="absolute bottom-[28%] right-[20%] w-12 h-12 text-white/10" />
                <BarChart3 className="absolute bottom-[15%] left-[10%] w-14 h-14 text-white/10" />

                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="relative z-10 flex items-center gap-3"
                >
                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold leading-tight">Skooly</p>
                        <p className="text-xs text-white/70 leading-tight">Central Admin</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="relative z-10 max-w-md"
                >
                    <span className="inline-block text-[11px] font-bold tracking-widest uppercase text-white/70 mb-4">{eyebrow}</span>
                    <h2 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight mb-4">{heading}</h2>
                    <p className="text-white/80 text-[15px] leading-relaxed">{subheading}</p>
                </motion.div>

                <p className="relative z-10 text-xs text-white/50">© {new Date().getFullYear()} Skooly. All rights reserved.</p>
            </div>

            {/* Form panel */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
                <div className="absolute inset-0 z-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-50 lg:hidden" />
                <div className="w-full max-w-md relative z-10">
                    {children}
                </div>
            </div>
        </div>
    )
}
