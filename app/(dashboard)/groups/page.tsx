'use client'

import { Fragment, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Plus, Building2, Copy, CheckCircle2, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

interface GroupAdmin {
    id: string
    name: string
    email: string
}

interface SchoolGroup {
    id: string
    name: string
    createdAt: string
    admins: GroupAdmin[]
    schools: { id: string; name: string; studentCount: number }[]
}

export default function GroupsPage() {
    const [groups, setGroups] = useState<SchoolGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
    const [form, setForm] = useState({ name: '', ownerName: '', ownerEmail: '', ownerPhone: '' })
    const [credentials, setCredentials] = useState<{ email: string; password: string; loginUrl: string } | null>(null)
    const [copied, setCopied] = useState(false)
    const [saving, setSaving] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await api.get('/groups')
            setGroups(res.data.groups)
        } catch {
            toast.error('Failed to load branches')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await api.post('/groups', form)
            toast.success('Branch created!')
            setShowCreate(false)
            setForm({ name: '', ownerName: '', ownerEmail: '', ownerPhone: '' })
            if (res.data.credentials) {
                setCredentials(res.data.credentials)
            }
            load()
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } }
            toast.error(err.response?.data?.message || 'Failed to create group')
        } finally {
            setSaving(false)
        }
    }

    const copyCreds = () => {
        if (!credentials) return
        const text = `Group Owner Dashboard: ${credentials.loginUrl}\nEmail: ${credentials.email}\nPassword: ${credentials.password}`
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
        toast.success('Credentials copied!')
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Branches" subtitle={`${groups.length} branch${groups.length !== 1 ? 'es' : ''} registered`} />
            <div className="p-6 space-y-5">

                {/* Toolbar */}
                <div className="flex justify-end">
                    <Button onClick={() => setShowCreate(true)} className="gap-2 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                        <Plus className="w-4 h-4" /> Create Group
                    </Button>
                </div>

                {/* Groups Table */}
                <Card className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-muted/20">
                                {['', 'Group Name', 'Owner', 'Owner Email', 'Branches', 'Created'].map(h => (
                                    <TableHead key={h} className="text-xs uppercase tracking-wider">{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 6 }).map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full max-w-[120px]" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : groups.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-4 py-12 text-center">
                                        <Building2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                                        <p className="text-muted-foreground text-sm">No branches found. Create the first one!</p>
                                    </TableCell>
                                </TableRow>
                            ) : groups.map((g, i) => (
                                <Fragment key={g.id}>
                                    <motion.tr
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                        className="border-b transition-colors hover:bg-muted/50"
                                    >
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setExpandedGroup(expandedGroup === g.id ? null : g.id)}
                                                className="h-7 w-7 text-muted-foreground"
                                                title={expandedGroup === g.id ? 'Collapse' : 'View branches'}
                                            >
                                                {expandedGroup === g.id
                                                    ? <ChevronUp className="w-4 h-4" />
                                                    : <ChevronDown className="w-4 h-4" />}
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary/25 to-secondary/25 text-foreground">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <p className="text-sm font-medium text-foreground">{g.name}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {g.admins?.[0]?.name || <span className="text-muted-foreground/60">—</span>}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {g.admins?.[0]?.email || <span className="text-muted-foreground/60">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="gap-1.5 bg-primary/10 text-primary border-primary/20 font-medium">
                                                <Users className="w-3 h-3" />
                                                {g.schools?.length || 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{formatDate(g.createdAt)}</TableCell>
                                    </motion.tr>
                                    {/* Expanded branches */}
                                    {expandedGroup === g.id && (
                                        <TableRow className="hover:bg-transparent bg-muted/10">
                                            <TableCell colSpan={6} className="px-8 py-4">
                                                {g.schools?.length ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {g.schools.map(s => (
                                                            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                                                                <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gradient-to-br from-primary/25 to-secondary/25 text-foreground">
                                                                    {s.name[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{s.studentCount} students</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground italic">No branches linked yet. Assign a school to this group when creating a school.</p>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </Card>

                {/* Create Group Dialog */}
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create Branch</DialogTitle>
                        </DialogHeader>
                        <p className="text-xs text-muted-foreground -mt-2">The owner will use these credentials to log in at the Group Owner Dashboard in the client app.</p>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Group Name *</Label>
                                <Input required value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Brightfield Schools" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1 block">Owner Full Name *</Label>
                                    <Input required value={form.ownerName}
                                        onChange={e => setForm(p => ({ ...p, ownerName: e.target.value }))}
                                        placeholder="John Doe" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1 block">Owner Phone (Optional)</Label>
                                    <Input value={form.ownerPhone}
                                        onChange={e => setForm(p => ({ ...p, ownerPhone: e.target.value }))}
                                        placeholder="+234 800 000 0000" />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Owner Email Address *</Label>
                                <Input type="email" required value={form.ownerEmail}
                                    onChange={e => setForm(p => ({ ...p, ownerEmail: e.target.value }))}
                                    placeholder="owner@schoolgroup.com" />
                                <p className="text-xs text-muted-foreground/70 mt-1">This will be used for newsletters and login credentials.</p>
                            </div>
                            <DialogFooter className="pt-2 sm:justify-stretch gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
                                <Button type="submit" disabled={saving} className="flex-1 gap-2 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                                    {saving && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                                    {saving ? 'Creating…' : 'Create Group'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Credentials Dialog */}
                <Dialog open={!!credentials} onOpenChange={open => { if (!open) setCredentials(null) }}>
                    <DialogContent className="max-w-md">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 mx-auto">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-center">Group Created!</DialogTitle>
                        </DialogHeader>
                        <p className="text-xs text-muted-foreground text-center -mt-2">
                            Share these credentials with the Group Owner. <span className="font-semibold text-amber-500">They won&apos;t be shown again.</span>
                        </p>

                        <div className="space-y-3 my-2">
                            {[
                                { label: 'Login URL', value: credentials?.loginUrl, color: 'text-blue-500' },
                                { label: 'Email', value: credentials?.email, color: 'text-foreground' },
                                { label: 'Generated Password', value: credentials?.password, color: 'text-emerald-500' },
                            ].map(({ label, value, color }) => (
                                <div key={label}>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{label}</p>
                                    <div className={`p-3 rounded-lg text-sm font-mono break-all bg-muted/40 border border-border ${color}`}>
                                        {value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <Button onClick={copyCreds} className="flex-1 gap-2">
                                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy All'}
                            </Button>
                            <Button onClick={() => setCredentials(null)} variant="secondary" className="flex-1">
                                Done
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
