'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { MonthlyData } from '@/types'
import { TrendingUp, School, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import StatCard from '@/components/shared/StatCard'

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

export default function AnalyticsPage() {
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
    const [planDistribution, setPlanDistribution] = useState<Array<{ name: string; _count: { schools: number } }>>([])
    const [months, setMonths] = useState('6')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const r = await api.get(`/analytics?months=${months}`)
                setMonthlyData(r.data.monthlyData || [])
                setPlanDistribution(r.data.planDistribution || [])
            } catch { } finally { setLoading(false) }
        }
        load()
    }, [months])

    const totalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0)
    const totalNewSchools = monthlyData.reduce((s, d) => s + d.newSchools, 0)
    const pieData = planDistribution.map(p => ({ name: p.name, value: p._count?.schools || 0 }))

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Platform Analytics" subtitle="Growth trends and revenue metrics" />
            <div className="p-6 space-y-6">

                {/* Period selector */}
                <div className="flex items-center gap-3">
                    {['3', '6', '12'].map(m => (
                        <Button
                            key={m}
                            variant="ghost"
                            onClick={() => setMonths(m)}
                            className={
                                months === m
                                    ? 'bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90 hover:text-white'
                                    : 'text-muted-foreground'
                            }
                        >
                            {m} Months
                        </Button>
                    ))}
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard label="Period Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} color="#10b981" delay={0} />
                    <StatCard label="New Schools" value={totalNewSchools} icon={School} color="#3b82f6" delay={0.05} />
                    <StatCard
                        label="Avg Revenue/School"
                        value={totalNewSchools ? formatCurrency(totalRevenue / totalNewSchools) : '$0'}
                        icon={TrendingUp}
                        color="#8b5cf6"
                        delay={0.1}
                    />
                </div>

                {loading ? (
                    <div className="space-y-5">
                        <Skeleton className="h-64 w-full rounded-xl" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Skeleton className="h-64 w-full rounded-xl" />
                            <Skeleton className="h-64 w-full rounded-xl" />
                        </div>
                        <Skeleton className="h-56 w-full rounded-xl" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-5"
                    >
                        {/* Revenue Area Chart */}
                        <Card className="p-5">
                            <h3 className="text-sm font-semibold mb-4 text-foreground">Revenue Over Time</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#rev)" name="Revenue ($)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* School + Student Growth Bar */}
                            <Card className="p-5">
                                <h3 className="text-sm font-semibold mb-4 text-foreground">School Growth</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                                        <Bar dataKey="newSchools" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="New Schools" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>

                            {/* Plan Distribution Pie */}
                            <Card className="p-5">
                                <h3 className="text-sm font-semibold mb-4 text-foreground">Plan Distribution</h3>
                                {pieData.length === 0 ? (
                                    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No plan data</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                                                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                                            <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </Card>
                        </div>

                        {/* Student Growth */}
                        <Card className="p-5">
                            <h3 className="text-sm font-semibold mb-4 text-foreground">Cumulative Student Growth</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="stud" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                                    <Area type="monotone" dataKey="totalStudents" stroke="#10b981" strokeWidth={2} fill="url(#stud)" name="Students" />
                                    <Area type="monotone" dataKey="totalTeachers" stroke="#f59e0b" strokeWidth={2} fill="none" name="Teachers" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
