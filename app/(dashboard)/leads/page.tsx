'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { format } from 'date-fns'
import {
    Mail, Phone, MapPin, Calendar, CheckCircle2, Search, Filter,
    Building2, User
} from 'lucide-react'
import { toast } from 'sonner'
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

interface Lead {
    id: string
    schoolName: string
    contactPerson: string
    phoneNumber: string
    emailAddress: string
    stateLga: string
    preferredPlan?: { name: string }
    notes: string
    status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST'
    createdAt: string
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    const loadLeads = async () => {
        setLoading(true)
        try {
            const r = await api.get('/leads', { params: { status: statusFilter } })
            setLeads(r.data.leads)
        } catch {
            toast.error('Failed to load leads')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadLeads()
    }, [statusFilter])

    const updateStatus = async (id: string, status: string) => {
        try {
            await api.put(`/leads/${id}/status`, { status })
            toast.success(`Status updated to ${status}`)
            loadLeads()
        } catch {
            toast.error('Failed to update status')
        }
    }

    const filteredLeads = leads.filter(l =>
        l.schoolName.toLowerCase().includes(search.toLowerCase()) ||
        l.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        l.emailAddress.toLowerCase().includes(search.toLowerCase())
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            case 'CONTACTED': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            case 'QUALIFIED': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
            case 'CONVERTED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'LOST': return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="School Leads" subtitle="Manage incoming school inquiries and conversion pipeline" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
                {/* Filters */}
                <Card className="flex flex-col md:flex-row gap-4 justify-between items-center p-4">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl w-full md:max-w-sm bg-muted/40 border border-border">
                        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by school, contact or email…"
                            className="border-0 bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <Select value={statusFilter || 'ALL'} onValueChange={v => setStatusFilter(v === 'ALL' ? '' : v)}>
                            <SelectTrigger className="w-full md:w-44 bg-muted/40">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                <SelectItem value="NEW">New Inquiries</SelectItem>
                                <SelectItem value="CONTACTED">Contacted</SelectItem>
                                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                                <SelectItem value="CONVERTED">Converted</SelectItem>
                                <SelectItem value="LOST">Lost</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {/* Leads Table */}
                <Card className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-muted/20">
                                {['School & Contact', 'Location & Plan', 'Status', 'Date', 'Actions'].map((h, i) => (
                                    <TableHead key={h} className={`text-xs uppercase tracking-wider ${i === 4 ? 'text-right' : ''}`}>{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 5 }).map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full max-w-[140px]" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filteredLeads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                            <Building2 className="w-12 h-12 opacity-20" />
                                            <p className="font-semibold text-base">No leads found</p>
                                            <p className="text-sm">When schools express interest, they will appear here.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredLeads.map((lead, i) => (
                                <motion.tr
                                    key={lead.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                    className="border-b transition-colors hover:bg-muted/50 group"
                                >
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{lead.schoolName}</span>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <User className="w-3 h-3" /> {lead.contactPerson}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10">
                                                    <a href={`mailto:${lead.emailAddress}`}>
                                                        <Mail className="w-3.5 h-3.5" />
                                                    </a>
                                                </Button>
                                                <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10">
                                                    <a href={`tel:${lead.phoneNumber}`}>
                                                        <Phone className="w-3.5 h-3.5" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm text-foreground">
                                                <MapPin className="w-3.5 h-3.5 text-rose-500/70" /> {lead.stateLga || 'Not specified'}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-500">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> {lead.preferredPlan?.name || 'No Plan Selected'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`${getStatusColor(lead.status)} font-medium uppercase tracking-wider text-[10px]`}>
                                            {lead.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                            <Calendar className="w-3.5 h-3.5 opacity-50" />
                                            {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Select value={lead.status} onValueChange={v => updateStatus(lead.id, v)}>
                                            <SelectTrigger className="w-36 h-8 text-xs ml-auto">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NEW">New</SelectItem>
                                                <SelectItem value="CONTACTED">Contacted</SelectItem>
                                                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                                                <SelectItem value="CONVERTED">Converted</SelectItem>
                                                <SelectItem value="LOST">Lost</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    )
}
