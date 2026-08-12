'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { SupportTicket, TicketReply } from '@/types'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { Send, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import StatusBadge from '@/components/shared/StatusBadge'

export default function TicketDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [ticket, setTicket] = useState<SupportTicket | null>(null)
    const [loading, setLoading] = useState(true)
    const [reply, setReply] = useState('')
    const [newStatus, setNewStatus] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!id) return
        api.get(`/tickets/${id}`)
            .then(r => { setTicket(r.data.ticket); setNewStatus(r.data.ticket.status) })
            .catch(() => toast.error('Failed to load ticket'))
            .finally(() => setLoading(false))
    }, [id])

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reply.trim()) return
        setSubmitting(true)
        try {
            await api.post(`/tickets/${id}/reply`, { message: reply, status: newStatus })
            toast.success('Reply sent!')
            setReply('')
            const r = await api.get(`/tickets/${id}`)
            setTicket(r.data.ticket)
        } catch { toast.error('Failed to send reply') }
        finally { setSubmitting(false) }
    }

    if (loading) return (
        <div className="min-h-screen flex flex-col">
            <Header title="Support Tickets" subtitle="Loading ticket…" />
            <div className="p-6 max-w-3xl mx-auto w-full space-y-5">
                <Skeleton className="h-4 w-32" />
                <Card className="p-5 space-y-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                </Card>
                <Card className="p-5 space-y-3">
                    <Skeleton className="h-24 w-full" />
                </Card>
            </div>
        </div>
    )

    if (!ticket) return <div className="p-6 text-muted-foreground">Ticket not found.</div>

    const replies = (ticket.replies as TicketReply[]) || []

    return (
        <div className="min-h-screen flex flex-col">
            <Header title={ticket.subject} subtitle={`${ticket.school?.name} · ${ticket.submittedBy}`} />
            <div className="p-6 max-w-3xl mx-auto w-full space-y-5">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 text-muted-foreground hover:text-primary -ml-3">
                    <ArrowLeft className="w-4 h-4" /> Back to Tickets
                </Button>

                {/* Ticket info */}
                <Card className="p-5">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <StatusBadge status={ticket.status} />
                        <StatusBadge status={ticket.priority} />
                        <span className="text-xs text-muted-foreground">Submitted {formatRelativeTime(ticket.createdAt)}</span>
                    </div>
                    <h2 className="text-base font-semibold mb-2 text-foreground">{ticket.subject}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{ticket.description}</p>
                </Card>

                {/* Replies */}
                {replies.length > 0 && (
                    <ScrollArea className={replies.length > 4 ? 'h-[420px] pr-3' : ''}>
                        <div className="space-y-3">
                            {replies.map((r, i) => (
                                <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                >
                                    <Card className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                                {r.admin?.name?.[0] || 'A'}
                                            </div>
                                            <span className="text-sm font-medium text-foreground">{r.admin?.name || 'Admin'}</span>
                                            <span className="text-xs text-muted-foreground">· {formatDate(r.createdAt)}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{r.message}</p>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </ScrollArea>
                )}

                {/* Reply form */}
                <Card className="p-5">
                    <h3 className="text-sm font-semibold mb-3 text-foreground">Reply to Ticket</h3>
                    <form onSubmit={handleReply} className="space-y-3">
                        <Textarea
                            rows={4} required value={reply}
                            onChange={e => setReply(e.target.value)}
                            placeholder="Type your response…"
                            className="resize-none"
                        />
                        <div className="flex items-center gap-3">
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button type="submit" disabled={submitting} className="gap-2 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                                <Send className="w-4 h-4" />
                                {submitting ? 'Sending…' : 'Send Reply'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    )
}
