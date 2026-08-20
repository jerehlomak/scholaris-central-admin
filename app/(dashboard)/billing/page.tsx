'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import {
    Wallet, TrendingUp, Users, AlertTriangle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import StatCard from '@/components/shared/StatCard'

import { BillingAnalytics } from '@/types'

export default function BillingOverviewPage() {
    const [stats, setStats] = useState<BillingAnalytics | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            const { data } = await api.get('/billing/analytics')
            setStats(data)
        } catch (error) {
            console.error('Failed to load billing analytics:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Billing Overview" />

            <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-5 flex items-start gap-4">
                                    <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <>
                            <StatCard
                                label="Monthly Recurring Revenue"
                                value={formatCurrency(stats?.mrr || 0, 'NGN')}
                                icon={TrendingUp}
                                color="#5CB85C"
                                delay={0}
                            />
                            <StatCard
                                label="Annual Recurring Revenue"
                                value={formatCurrency(stats?.arr || 0, 'NGN')}
                                icon={Wallet}
                                color="#1E4DA6"
                                delay={0.05}
                            />
                            <StatCard
                                label="Active Subscriptions"
                                value={stats?.activeSubscriptions || 0}
                                icon={Users}
                                color="#8b5cf6"
                                delay={0.1}
                            />
                            <StatCard
                                label="Past Due Accounts"
                                value={stats?.pastDueAccounts || 0}
                                icon={AlertTriangle}
                                color="#ef4444"
                                delay={0.15}
                            />
                        </>
                    )}
                </div>

                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-lg font-bold text-foreground mb-4">Quick Limits Overview</h2>
                        {isLoading ? (
                            <Skeleton className="h-5 w-72" />
                        ) : (
                            <p className="text-muted-foreground">Total Schools Registered on Platform: <span className="font-bold text-foreground">{stats?.totalSchools || 0}</span></p>
                        )}
                    </CardContent>
                </Card>

            </main>
        </div>
    )
}
