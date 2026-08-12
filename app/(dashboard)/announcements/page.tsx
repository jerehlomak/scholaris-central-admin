'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { Announcement } from '@/types'
import { Plus, Send, Trash2, Globe } from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

const TYPE_COLORS: Record<string, string> = {
    INFO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    WARNING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    MAINTENANCE: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

export default function AnnouncementsPage() {
    const [items, setItems] = useState<Announcement[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ title: '', body: '', type: 'INFO', targetGroup: 'ALL', isPublished: false })
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const r = await api.get('/announcements')
            setItems(r.data.announcements || [])
            setTotal(r.data.total || 0)
        } catch { toast.error('Failed to load announcements') } finally { setLoading(false) }
    }, [])

    useEffect(() => { load() }, [load])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await api.post('/announcements', form)
            toast.success('Announcement published!')
            setShowForm(false)
            setForm({ title: '', body: '', type: 'INFO', targetGroup: 'ALL', isPublished: false })
            load()
        } catch { toast.error('Failed to create announcement') }
    }

    const del = async (id: string) => {
        try { await api.delete(`/announcements/${id}`); toast.success('Deleted'); load() }
        catch { toast.error('Failed') }
    }

    const publish = async (id: string) => {
        try { await api.put(`/announcements/${id}`, { isPublished: true }); toast.success('Published!'); load() }
        catch { toast.error('Failed') }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Global Announcements" subtitle={`${total} announcements total`} />
            <div className="p-6 space-y-5">

                <div className="flex justify-end">
                    <Button onClick={() => setShowForm(true)} className="gap-2 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                        <Plus className="w-4 h-4" /> New Announcement
                    </Button>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-28 w-full rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.length === 0 && (
                            <Card className="p-8 text-center text-muted-foreground">
                                <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No announcements yet. Create one to broadcast to all schools.</p>
                            </Card>
                        )}
                        {items.map((a, i) => (
                            <motion.div
                                key={a.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                            >
                                <Card className="p-5 flex gap-4 hover:border-primary/30 transition-all">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h3 className="text-sm font-semibold text-foreground">{a.title}</h3>
                                            <Badge variant="outline" className={TYPE_COLORS[a.type] || TYPE_COLORS.INFO}>{a.type}</Badge>
                                            <Badge variant="outline" className="text-muted-foreground">{a.targetGroup}</Badge>
                                            {a.isPublished && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Published</Badge>}
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{a.body}</p>
                                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground/70">
                                            <span>By {a.admin?.name || 'Admin'}</span>
                                            <span>{formatRelativeTime(a.createdAt)}</span>
                                            {a.publishedAt && <span>Published {formatDate(a.publishedAt)}</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 flex-shrink-0">
                                        {!a.isPublished && (
                                            <Button variant="outline" size="sm" onClick={() => publish(a.id)}
                                                className="gap-1.5 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-400">
                                                <Send className="w-3 h-3" /> Publish
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => setDeleteId(a.id)}
                                            className="gap-1.5 text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-400">
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Create Dialog */}
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>New Announcement</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Title *</Label>
                                <Input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Message *</Label>
                                <Textarea required rows={4} value={form.body}
                                    onChange={e => setForm(p => ({ ...p, body: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
                                    <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['INFO', 'WARNING', 'MAINTENANCE'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1 block">Target</Label>
                                    <Select value={form.targetGroup} onValueChange={v => setForm(p => ({ ...p, targetGroup: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['ALL', 'BASIC', 'PRO', 'ENTERPRISE'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox checked={form.isPublished}
                                    onCheckedChange={checked => setForm(p => ({ ...p, isPublished: checked === true }))} />
                                <span className="text-sm text-muted-foreground">Publish immediately</span>
                            </label>
                            <DialogFooter className="pt-2 sm:justify-stretch gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                                <Button type="submit" className="flex-1 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">Create</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete confirmation */}
                <ConfirmDialog
                    open={!!deleteId}
                    onOpenChange={open => { if (!open) setDeleteId(null) }}
                    title="Delete this announcement?"
                    confirmLabel="Delete"
                    destructive
                    onConfirm={() => { if (deleteId) del(deleteId); setDeleteId(null) }}
                />
            </div>
        </div>
    )
}
