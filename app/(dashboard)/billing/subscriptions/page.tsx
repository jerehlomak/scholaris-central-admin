'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { FileText, Search, Ban, ArrowUpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

import { SchoolSubscription } from '@/types'

const STATUS_CLASSES: Record<string, string> = {
    ACTIVE: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
    TRIAL: 'border-purple-500/30 bg-purple-500/10 text-purple-500',
    PAST_DUE: 'border-orange-500/30 bg-orange-500/10 text-orange-500',
}
const DEFAULT_STATUS_CLASS = 'border-red-500/30 bg-red-500/10 text-red-500'

export default function SubscriptionsManagementPage() {
    const [subscriptions, setSubscriptions] = useState<SchoolSubscription[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [cancelId, setCancelId] = useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/billing/subscriptions')
            setSubscriptions(data.subscriptions)
        } catch {
            toast.error('Failed to load subscriptions')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const handleCancel = async (id: string) => {
        try {
            await api.patch(`/billing/subscriptions/${id}/cancel`)
            toast.success('Subscription cancelled')
            load()
        } catch {
            toast.error('Failed to cancel subscription')
        }
    }

    const filtered = subscriptions.filter(s =>
        s.school?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.plan?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Subscriptions Management" subtitle="View and manage school billing subscriptions" />

            <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full">

                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl w-full md:max-w-96 bg-muted/40 border border-border">
                        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search school or plan..."
                            className="border-0 bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 text-sm" />
                    </div>
                </div>

                <Card className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-muted/20">
                                {['School', 'Plan', 'Status', 'Billing Cycle', 'Next Billing', 'Actions'].map((h, i) => (
                                    <TableHead key={h} className={`text-xs uppercase tracking-wider ${i === 5 ? 'text-right' : ''}`}>{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 6 }).map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full max-w-[120px]" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-sm">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        No subscriptions found.
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map((sub, i) => (
                                <motion.tr
                                    key={sub.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    <TableCell>
                                        <p className="font-medium text-foreground text-sm">{sub.school?.name}</p>
                                        <p className="text-xs text-muted-foreground">{sub.school?.email}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-500 font-medium">
                                            {sub.plan?.name || 'Unknown'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={STATUS_CLASSES[sub.status] || DEFAULT_STATUS_CLASS}>
                                            {sub.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground capitalize">{sub.billingCycle?.toLowerCase()}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {sub.nextBillingDate ? formatDate(new Date(sub.nextBillingDate)) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" title="Change Plan"
                                                className="h-7 w-7 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10">
                                                <ArrowUpCircle className="w-3.5 h-3.5" />
                                            </Button>
                                            {sub.status !== 'CANCELLED' && (
                                                <Button variant="ghost" size="icon" onClick={() => setCancelId(sub.id)} title="Cancel Subscription"
                                                    className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10">
                                                    <Ban className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                </Card>

                <ConfirmDialog
                    open={!!cancelId}
                    onOpenChange={open => { if (!open) setCancelId(null) }}
                    title="Cancel this subscription?"
                    description="This will suspend their access."
                    confirmLabel="Cancel Subscription"
                    destructive
                    onConfirm={() => { if (cancelId) handleCancel(cancelId); setCancelId(null) }}
                />
            </main>
        </div>
    )
}
