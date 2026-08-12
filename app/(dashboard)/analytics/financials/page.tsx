'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid,
} from 'recharts'
import {
    TrendingUp, AlertCircle, Wallet, DollarSign,
    Mail, Phone, RefreshCw, Send
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import StatCard from '@/components/shared/StatCard'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthData { month: string; revenue: number }
interface Debtor {
    id: string; name: string; email: string; phone: string; amountDue: number
}
interface FinancialsData {
    monthlyData: MonthData[]
    debtorSchools: Debtor[]
}
interface OverviewStats {
    monthlyRevenue: number
    totalReceivables: number
    walletLiabilities: number
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FinancialAnalyticsPage() {
    const [financials, setFinancials] = useState<FinancialsData | null>(null)
    const [overview, setOverview] = useState<OverviewStats | null>(null)
    const [months, setMonths] = useState(6)
    const [loading, setLoading] = useState(true)
    const [sendingReminderId, setSendingReminderId] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [finRes, ovRes] = await Promise.all([
                api.get(`/analytics/financials?months=${months}`),
                api.get('/overview'),
            ])
            setFinancials(finRes.data)
            setOverview(ovRes.data.stats)
        } catch {
            toast.error('Failed to load financial analytics')
        } finally {
            setLoading(false)
        }
    }, [months])

    useEffect(() => { load() }, [load])

    const sendReminder = async (schoolId: string, schoolName: string) => {
        setSendingReminderId(schoolId)
        try {
            // Find the relevant invoice to send reminder for
            const invoicesRes = await api.get(`/invoices?schoolId=${schoolId}&status=UNPAID,OVERDUE`)
            const invoices: Array<{ id: string }> = invoicesRes.data.invoices || []
            if (invoices.length === 0) {
                toast.error('No outstanding invoices found to send a reminder for.')
                return
            }
            await api.post(`/invoices/${invoices[0].id}/reminder`)
            toast.success(`Reminder sent to ${schoolName}`)
        } catch {
            toast.error('Failed to send reminder')
        } finally {
            setSendingReminderId(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header title="Financial Analytics" subtitle="Revenue, receivables & wallet liabilities" />
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                        ))}
                    </div>
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        )
    }

    const totalRevenue = financials?.monthlyData.reduce((s, m) => s + m.revenue, 0) ?? 0

    return (
        <div className="min-h-screen flex flex-col">
            <Header
                title="Financial Analytics"
                subtitle="Platform revenue, receivables and wallet liabilities"
            />

            <div className="p-6 flex-1 space-y-6">

                {/* ── KPI Row ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        label="Revenue (Last 30 Days)"
                        value={formatCurrency(overview?.monthlyRevenue ?? 0)}
                        icon={DollarSign}
                        color="#10b981"
                        subtitle="Completed payments in rolling 30-day window"
                        delay={0}
                    />
                    <StatCard
                        label="Total Receivables"
                        value={formatCurrency(overview?.totalReceivables ?? 0)}
                        icon={AlertCircle}
                        color="#f59e0b"
                        subtitle="Outstanding unpaid & overdue invoices"
                        delay={0.05}
                    />
                    <StatCard
                        label="Wallet Liabilities"
                        value={formatCurrency(overview?.walletLiabilities ?? 0)}
                        icon={Wallet}
                        color="#8b5cf6"
                        subtitle="Total balance held across all school wallets"
                        delay={0.1}
                    />
                </div>

                {/* ── Revenue Chart ── */}
                <Card className="p-5">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                Revenue Over Time
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {months}-month rolling window · Total: {formatCurrency(totalRevenue)}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {[3, 6, 12].map(m => (
                                <Button
                                    key={m}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setMonths(m)}
                                    className={
                                        months === m
                                            ? 'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary border border-primary/30'
                                            : 'text-muted-foreground'
                                    }
                                >
                                    {m}M
                                </Button>
                            ))}
                            <Button size="icon" variant="ghost" onClick={load} className="h-8 w-8 text-muted-foreground">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={financials?.monthlyData ?? []}>
                            <defs>
                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                            tickFormatter={v => {
                                const n = v as number
                                if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
                                if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
                                return `$${n}`
                            }}
                            />
                            <Tooltip
                                contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                                formatter={(v) => [formatCurrency(v as number), 'Revenue']}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                {/* ── Debtors Table ── */}
                <Card className="overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                Top Debtors — Outstanding Receivables
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Schools with unpaid or overdue invoices, sorted by amount owed</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {financials?.debtorSchools.length ?? 0} Schools
                        </span>
                    </div>

                    {financials?.debtorSchools.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <TrendingUp className="w-7 h-7 text-emerald-400" />
                            </div>
                            <p className="text-sm font-medium text-foreground">All Clear!</p>
                            <p className="text-xs text-muted-foreground">No outstanding receivables from any school.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent bg-muted/20">
                                    {['School', 'Contact', 'Amount Due', 'Actions'].map(h => (
                                        <TableHead key={h} className="text-xs uppercase tracking-wider">{h}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {financials?.debtorSchools.map((debtor, i) => (
                                    <motion.tr
                                        key={debtor.id}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                        className="border-b transition-colors hover:bg-muted/50"
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                                    style={{ background: `hsl(${(i * 47) % 360}, 60%, 45%)` }}>
                                                    {debtor.name[0]}
                                                </div>
                                                <span className="font-medium text-sm text-foreground">{debtor.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                                                    <Mail className="w-3 h-3" />{debtor.email || '—'}
                                                </p>
                                                <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                                                    <Phone className="w-3 h-3" />{debtor.phone || '—'}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-amber-400 text-base">
                                                {formatCurrency(debtor.amountDue)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                id={`send-reminder-${debtor.id}`}
                                                size="sm"
                                                variant="outline"
                                                onClick={() => sendReminder(debtor.id, debtor.name)}
                                                disabled={sendingReminderId === debtor.id}
                                                className="gap-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:text-primary"
                                            >
                                                {sendingReminderId === debtor.id
                                                    ? <RefreshCw className="w-3 h-3 animate-spin" />
                                                    : <Send className="w-3 h-3" />}
                                                {sendingReminderId === debtor.id ? 'Sending…' : 'Send Reminder'}
                                            </Button>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>

            </div>
        </div>
    )
}
