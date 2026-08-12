'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { School, SubscriptionPlan } from '@/types'
import { formatDate } from '@/lib/utils'
import { Plus, Search, Ban, CheckCircle, Trash2, ChevronRight, Filter } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import StatusBadge from '@/components/shared/StatusBadge'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

type ConfirmAction = { type: 'suspend' | 'delete'; id: string } | null

export default function SchoolsPage() {
    const [schools, setSchools] = useState<School[]>([])
    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [page, setPage] = useState(1)
    const [showCreate, setShowCreate] = useState(false)
    const [credentials, setCredentials] = useState<{ email: string, password: string, loginUrl: string } | null>(null)
    const [isBranch, setIsBranch] = useState(false)
    const [allSchools, setAllSchools] = useState<{ id: string; name: string }[]>([])
    const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', country: 'Nigeria', planId: '', adminEmail: '', groupId: '', parentId: '' })
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), limit: '15' })
            if (search) params.set('search', search)
            if (statusFilter) params.set('status', statusFilter)
            const res = await api.get(`/schools?${params}`)
            setSchools(res.data.schools)
            setTotal(res.data.total)
        } catch { toast.error('Failed to load schools') } finally { setLoading(false) }
    }, [page, search, statusFilter])

    useEffect(() => { load() }, [load])
    useEffect(() => {
        api.get('/plans').then(r => setPlans(r.data.plans))
        api.get('/groups').then(r => setGroups(r.data.groups))
        api.get('/schools?limit=500').then(r => setAllSchools(r.data.schools))
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await api.post('/schools', form)
            toast.success('School created!')
            setShowCreate(false)
            setForm({ name: '', email: '', phone: '', address: '', country: 'Nigeria', planId: '', adminEmail: '', groupId: '', parentId: '' })
            setIsBranch(false)
            if (res.data.credentials) {
                setCredentials(res.data.credentials)
            }
            load()
        } catch { toast.error('Failed to create school') }
    }

    const suspend = async (id: string) => {
        try { await api.post(`/schools/${id}/suspend`, { reason: 'Admin action' }); toast.success('School suspended'); load() }
        catch { toast.error('Failed') }
    }

    const activate = async (id: string) => {
        try { await api.post(`/schools/${id}/activate`); toast.success('School activated'); load() }
        catch { toast.error('Failed') }
    }

    const del = async (id: string) => {
        try { await api.delete(`/schools/${id}`); toast.success('School deleted'); load() }
        catch { toast.error('Failed') }
    }

    const confirmPending = () => {
        if (!confirmAction) return
        if (confirmAction.type === 'suspend') suspend(confirmAction.id)
        else del(confirmAction.id)
        setConfirmAction(null)
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Schools Management" subtitle={`${total} schools on the platform`} />
            <div className="p-6 space-y-5">

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl max-w-sm bg-muted/40 border border-border">
                        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                            placeholder="Search by name or email…"
                            className="border-0 bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <Select value={statusFilter || 'ALL'} onValueChange={v => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1) }}>
                            <SelectTrigger className="w-40 bg-muted/40">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={() => setShowCreate(true)} className="gap-2 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                        <Plus className="w-4 h-4" />
                        Add School
                    </Button>
                </div>

                {/* Table */}
                <Card className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-muted/20">
                                {['School', 'Plan', 'Students', 'Teachers', 'Status', 'Joined', 'Actions'].map(h => (
                                    <TableHead key={h} className="text-xs uppercase tracking-wider">{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 7 }).map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full max-w-[120px]" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : schools.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No schools found.</TableCell>
                                </TableRow>
                            ) : schools.map((s, i) => (
                                <motion.tr
                                    key={s.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 bg-gradient-to-br from-primary/25 to-secondary/25 text-foreground">
                                                {s.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{s.name}</p>
                                                <p className="text-xs text-muted-foreground">{s.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{s.plan?.name || <span className="text-muted-foreground/60">—</span>}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{s.studentCount.toLocaleString()}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{s.teacherCount}</TableCell>
                                    <TableCell><StatusBadge status={s.status} /></TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="View">
                                                <Link href={`/schools/${s.id}`}>
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </Link>
                                            </Button>
                                            {s.status === 'ACTIVE' ? (
                                                <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: 'suspend', id: s.id })}
                                                    className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/15" title="Suspend">
                                                    <Ban className="w-3.5 h-3.5" />
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="icon" onClick={() => activate(s.id)}
                                                    className="h-7 w-7 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/15" title="Activate">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: 'delete', id: s.id })}
                                                className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/15" title="Delete">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                    {/* Pagination */}
                    {total > 15 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                            <p className="text-xs text-muted-foreground">Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}</p>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                                <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total}>Next</Button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Create Dialog */}
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Add New School</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-3">
                            {[
                                { label: 'School Name', key: 'name', type: 'text', req: true },
                                { label: 'Email', key: 'email', type: 'email', req: true },
                                { label: 'Phone', key: 'phone', type: 'text', req: false },
                                { label: 'Address', key: 'address', type: 'text', req: false },
                                { label: 'Admin Email', key: 'adminEmail', type: 'email', req: false },
                            ].map(f => (
                                <div key={f.key}>
                                    <Label className="text-xs text-muted-foreground mb-1 block">{f.label}{f.req && ' *'}</Label>
                                    <Input type={f.type} required={f.req}
                                        value={form[f.key as keyof typeof form]}
                                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                </div>
                            ))}
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Subscription Plan</Label>
                                <Select value={form.planId || 'NONE'} onValueChange={v => setForm(p => ({ ...p, planId: v === 'NONE' ? '' : v }))}>
                                    <SelectTrigger><SelectValue placeholder="No Plan" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">No Plan</SelectItem>
                                        {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (₦{p.monthlyPrice}/mo)</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">School Group (Optional)</Label>
                                <Select value={form.groupId || 'NONE'} onValueChange={v => setForm(p => ({ ...p, groupId: v === 'NONE' ? '' : v }))}>
                                    <SelectTrigger><SelectValue placeholder="Independent School (No Group)" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">Independent School (No Group)</SelectItem>
                                        {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <input type="checkbox" id="isBranch" checked={isBranch} onChange={e => setIsBranch(e.target.checked)} />
                                <Label htmlFor="isBranch" className="text-sm font-normal">This is a Branch School</Label>
                            </div>
                            {isBranch && (
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1 block">Main School *</Label>
                                    <Select required value={form.parentId} onValueChange={v => setForm(p => ({ ...p, parentId: v }))}>
                                        <SelectTrigger><SelectValue placeholder="Select Main School" /></SelectTrigger>
                                        <SelectContent>
                                            {allSchools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <DialogFooter className="pt-2 sm:justify-stretch gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
                                <Button type="submit" className="flex-1 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">Create School</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Credentials Dialog */}
                <Dialog open={!!credentials} onOpenChange={open => { if (!open) setCredentials(null) }}>
                    <DialogContent className="max-w-md">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 mx-auto">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-center">School Created Successfully!</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground text-center -mt-2">
                            Here are the admin login credentials for this school. <br />
                            <strong>Save this password securely — it will only be shown once!</strong>
                        </p>

                        <div className="space-y-4 my-2">
                            <div>
                                <Label className="block text-xs text-muted-foreground mb-1 border-b border-border pb-1">Admin Login URL</Label>
                                <div className="flex bg-primary/5 rounded-lg border border-primary/20 p-3 text-sm font-mono break-all font-medium select-all text-foreground">
                                    {credentials?.loginUrl}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label className="block text-xs text-muted-foreground mb-1 border-b border-border pb-1">Email</Label>
                                    <p className="text-sm font-medium text-foreground">{credentials?.email}</p>
                                </div>
                                <div className="col-span-2">
                                    <Label className="block text-xs text-muted-foreground mb-1 border-b border-emerald-500/20 pb-1">One-Time Password</Label>
                                    <p className="text-lg font-mono font-bold text-emerald-400 tracking-wider select-all">{credentials?.password}</p>
                                </div>
                            </div>
                        </div>

                        <Button onClick={() => setCredentials(null)} variant="secondary" className="w-full">
                            I have saved these credentials
                        </Button>
                    </DialogContent>
                </Dialog>

                {/* Suspend/Delete confirmation */}
                <ConfirmDialog
                    open={!!confirmAction}
                    onOpenChange={open => { if (!open) setConfirmAction(null) }}
                    title={confirmAction?.type === 'delete' ? 'Mark school as deleted?' : 'Suspend this school?'}
                    confirmLabel={confirmAction?.type === 'delete' ? 'Delete' : 'Suspend'}
                    destructive
                    onConfirm={confirmPending}
                />

            </div>
        </div>
    )
}
