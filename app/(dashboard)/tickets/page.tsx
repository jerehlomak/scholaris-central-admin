'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { SupportTicket } from '@/types'
import { TicketCheck, MessageSquare, ChevronRight } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import StatusBadge from '@/components/shared/StatusBadge'

export default function TicketsPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('')
    const [page, setPage] = useState(1)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' })
            if (statusFilter) params.set('status', statusFilter)
            if (priorityFilter) params.set('priority', priorityFilter)
            const r = await api.get(`/tickets?${params}`)
            setTickets(r.data.tickets || [])
            setTotal(r.data.total || 0)
        } catch { toast.error('Failed to load tickets') } finally { setLoading(false) }
    }, [page, statusFilter, priorityFilter])

    useEffect(() => { load() }, [load])

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Support Tickets" subtitle={`${total} tickets total`} />
            <div className="p-6 space-y-5">

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={statusFilter || 'ALL'} onValueChange={v => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1) }}>
                        <SelectTrigger className="w-40 bg-muted/40">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={priorityFilter || 'ALL'} onValueChange={v => { setPriorityFilter(v === 'ALL' ? '' : v); setPage(1) }}>
                        <SelectTrigger className="w-40 bg-muted/40">
                            <SelectValue placeholder="All Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Priority</SelectItem>
                            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />Open: {tickets.filter(t => t.status === 'OPEN').length}
                        <span className="w-2 h-2 rounded-full bg-amber-500 ml-2" />In Progress: {tickets.filter(t => t.status === 'IN_PROGRESS').length}
                        <span className="w-2 h-2 rounded-full bg-emerald-500 ml-2" />Resolved: {tickets.filter(t => t.status === 'RESOLVED').length}
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Card key={i} className="p-4 flex items-center gap-4">
                                <div className="flex-1 min-w-0 space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-3 w-2/3" />
                                    <Skeleton className="h-3 w-1/4" />
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : tickets.length === 0 ? (
                    <Card className="p-12 text-center text-muted-foreground">
                        <TicketCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No tickets found.</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {tickets.map((t, i) => (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                            >
                                <Link href={`/tickets/${t.id}`}>
                                    <Card className="p-4 flex items-center gap-4 hover:border-primary/30 transition-all cursor-pointer">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="text-sm font-semibold text-foreground">{t.subject}</h3>
                                                <StatusBadge status={t.status} />
                                                <StatusBadge status={t.priority} />
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                                <span>{t.school?.name}</span>
                                                <span>·</span>
                                                <span>{t.submittedBy}</span>
                                                <span>·</span>
                                                <span>{formatRelativeTime(t.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {t.replies && t.replies.length > 0 && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    {t.replies.length}
                                                </div>
                                            )}
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {total > 20 && (
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</p>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                            <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>Next</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
