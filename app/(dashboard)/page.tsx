'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { PlatformStats, School } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    School as SchoolIcon, Users, GraduationCap,
    CreditCard, DollarSign, TicketCheck, Activity, AlertCircle, Wallet
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import StatCard from '@/components/shared/StatCard'
import StatusBadge from '@/components/shared/StatusBadge'

export default function OverviewPage() {
    const [stats, setStats] = useState<PlatformStats | null>(null)
    const [recentSchools, setRecentSchools] = useState<School[]>([])
    const [chartData, setChartData] = useState<Array<Record<string, unknown>>>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const [overviewRes, analyticsRes] = await Promise.all([
                    api.get('/overview'),
                    api.get('/analytics?months=6'),
                ])
                setStats(overviewRes.data.stats)
                setRecentSchools(overviewRes.data.recentSchools || [])
                setChartData(analyticsRes.data.monthlyData || [])
            } catch { /* handle */ } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) return (
        <div className="min-h-screen flex flex-col">
            <Header title="Platform Overview" subtitle="Live platform statistics" />
            <div className="p-6 flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="p-5 flex items-start gap-4">
                            <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3 w-1/2" />
                                <Skeleton className="h-6 w-2/3" />
                            </div>
                        </Card>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Platform Overview" subtitle="Live platform statistics and health metrics" />
            <div className="p-6 flex-1 space-y-6">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Schools" value={stats?.totalSchools ?? 0} icon={SchoolIcon} color="#3b82f6" subtitle="+2 this month" delay={0} />
                    <StatCard label="Active Schools" value={stats?.activeSchools ?? 0} icon={Activity} color="#10b981" delay={0.03} />
                    <StatCard label="Total Students" value={(stats?.totalStudents ?? 0).toLocaleString()} icon={Users} color="#8b5cf6" delay={0.06} />
                    <StatCard label="Total Staff" value={(stats?.totalTeachers ?? 0).toLocaleString()} icon={GraduationCap} color="#f59e0b" delay={0.09} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Active Plans" value={stats?.totalPlans ?? 0} icon={CreditCard} color="#06b6d4" delay={0.12} />
                    <StatCard label="Suspended" value={stats?.suspendedSchools ?? 0} icon={SchoolIcon} color="#ef4444" delay={0.15} />
                    <StatCard label="Monthly Revenue" value={formatCurrency(stats?.monthlyRevenue ?? 0)} icon={DollarSign} color="#10b981" subtitle="Rolling 30 days" delay={0.18} />
                    <StatCard label="Open Tickets" value={stats?.openTickets ?? 0} icon={TicketCheck} color="#f97316" delay={0.21} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatCard label="Total Receivables" value={formatCurrency((stats as unknown as { totalReceivables?: number })?.totalReceivables ?? 0)} icon={AlertCircle} color="#f59e0b" subtitle="Outstanding invoices" delay={0.24} />
                    <StatCard label="Wallet Liabilities" value={formatCurrency((stats as unknown as { walletLiabilities?: number })?.walletLiabilities ?? 0)} icon={Wallet} color="#8b5cf6" subtitle="Funds held in school wallets" delay={0.27} />
                </div>

                {/* Revenue + Growth Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    <Card className="p-4 w-full">
                        <h3 className="text-sm font-semibold mb-1 text-foreground">Monthly Revenue</h3>
                        <p className="text-xs text-muted-foreground mb-4">Last 6 months</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--popover-foreground))' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>

                    <Card className="p-4 w-full">
                        <h3 className="text-sm font-semibold mb-1 text-foreground">School Growth</h3>
                        <p className="text-xs text-muted-foreground mb-4">New schools per month</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="schoolGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--popover-foreground))' }} />
                                <Area type="monotone" dataKey="newSchools" stroke="#8b5cf6" strokeWidth={2} fill="url(#schoolGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>
                </div>

                {/* Recent Schools */}
                <Card className="overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                        <h3 className="text-sm font-semibold text-foreground">Recently Joined Schools</h3>
                    </div>
                    <div className="divide-y divide-border">
                        {recentSchools.length === 0 ? (
                            <p className="px-5 py-4 text-sm text-muted-foreground">No schools yet.</p>
                        ) : recentSchools.map((s, i) => (
                            <motion.div
                                key={s.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                className="flex items-center px-5 py-3 gap-4 hover:bg-muted/50 transition-colors"
                            >
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-white bg-gradient-to-br from-primary to-secondary">
                                    {s.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate text-foreground">{s.name}</p>
                                    <p className="text-xs text-muted-foreground">{s.email}</p>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs text-muted-foreground">{s.plan?.name || 'No Plan'}</p>
                                    <p className="text-xs text-muted-foreground/70">{formatDate(s.createdAt)}</p>
                                </div>
                                <StatusBadge status={s.status} />
                            </motion.div>
                        ))}
                    </div>
                </Card>

            </div>
        </div>
    )
}
