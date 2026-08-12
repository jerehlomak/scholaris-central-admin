'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import { MobileMenuContext } from '@/context/MobileMenuContext'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { admin, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        if (!loading && !admin) {
            router.push('/login')
        }
    }, [admin, loading, router])

    if (loading) {
        return (
            <div className="flex h-screen overflow-hidden">
                <div className="hidden md:block w-64 shrink-0 border-r border-sidebar-border p-4 space-y-3">
                    <Skeleton className="h-10 w-full" />
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                    ))}
                </div>
                <div className="flex-1 p-6 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    if (!admin) return null

    return (
        <MobileMenuContext.Provider value={{ isMobileMenuOpen, setIsMobileMenuOpen }}>
            <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 md:ml-64 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </MobileMenuContext.Provider>
    )
}
