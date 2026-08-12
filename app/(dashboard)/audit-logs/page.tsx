'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { AuditLog } from '@/types'
import { formatDate } from '@/lib/utils'
import { ClipboardList, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

const ACTION_COLORS: Record<string, string> = {
    CREATE: 'text-emerald-400 bg-emerald-500/10',
    SUSPEND: 'text-red-400 bg-red-500/10',
    ACTIVATE: 'text-blue-400 bg-blue-500/10',
    DELETE: 'text-red-500 bg-red-500/15',
    UPDATE: 'text-amber-400 bg-amber-500/10',
    ENABLE: 'text-emerald-400 bg-emerald-500/10',
    DISABLE: 'text-slate-400 bg-slate-500/10',
    REPLY: 'text-purple-400 bg-purple-500/10',
}

const getActionColor = (action: string) => {
    const key = Object.keys(ACTION_COLORS).find(k => action.startsWith(k))
    return key ? ACTION_COLORS[key] : 'text-slate-400 bg-slate-500/10'
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [entityType, setEntityType] = useState('')
    const [page, setPage] = useState(1)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const params = new URLSearchParams({ page: String(page), limit: '50' })
                if (search) params.set('action', search)
                if (entityType) params.set('entityType', entityType)
                const r = await api.get(`/audit-logs?${params}`)
                setLogs(r.data.logs || [])
                setTotal(r.data.total || 0)
            } catch { } finally { setLoading(false) }
        }
        load()
    }, [page, search, entityType])

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Audit Logs" subtitle={`${total} events recorded`} />
            <div className="p-6 space-y-5">

                {/* Toolbar */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border max-w-xs">
                        <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                            placeholder="Filter by action…"
                            className="border-0 bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 text-sm w-48" />
                    </div>
                    <Select value={entityType || 'ALL'} onValueChange={v => { setEntityType(v === 'ALL' ? '' : v); setPage(1) }}>
                        <SelectTrigger className="w-44 bg-muted/40">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            <SelectItem value="School">School</SelectItem>
                            <SelectItem value="SubscriptionPlan">Plan</SelectItem>
                            <SelectItem value="SchoolFeature">Feature</SelectItem>
                            <SelectItem value="SchoolDashboard">Dashboard</SelectItem>
                            <SelectItem value="SupportTicket">Ticket</SelectItem>
                            <SelectItem value="Announcement">Announcement</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Log Table */}
                <Card className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-muted/20">
                                {['Timestamp', 'Action', 'Entity', 'Admin', 'IP Address'].map(h => (
                                    <TableHead key={h} className="text-xs uppercase tracking-wider">{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 5 }).map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full max-w-[120px]" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="px-4 py-12 text-center">
                                        <ClipboardList className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">No audit logs found.</p>
                                    </TableCell>
                                </TableRow>
                            ) : logs.map((log, i) => (
                                <motion.tr
                                    key={log.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`border-0 ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-xs text-foreground">{log.entityType || '—'}</p>
                                        {log.entityId && <p className="text-xs text-muted-foreground/70 truncate max-w-[120px]">{log.entityId}</p>}
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm text-foreground">{log.admin?.name || '—'}</p>
                                        <p className="text-xs text-muted-foreground">{log.admin?.email}</p>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{log.ipAddress || '—'}</TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>

                    {total > 50 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                            <p className="text-xs text-muted-foreground">Page {page} of {Math.ceil(total / 50)}</p>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                                <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 50 >= total}>Next</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
