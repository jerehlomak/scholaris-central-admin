'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { Users, Plus, ShieldAlert, Mail, Clock, Shield } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

export default function CompanyStaffPage() {
    const { admin } = useAuth()
    const [staff, setStaff] = useState<Array<{ id: string; name: string; email: string; role: string; isActive: boolean; lastLogin?: string }>>([])
    const [loading, setLoading] = useState(true)

    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STAFF', isActive: true })
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/staff')
            setStaff(data.staff || [])
        } catch { toast.error('Failed to load staff members') } finally { setLoading(false) }
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingId) {
                const payload = { ...form }
                if (!payload.password) delete (payload as { password?: string }).password
                await api.put(`/staff/${editingId}`, payload)
                toast.success('Staff member updated')
            } else {
                await api.post('/staff', form)
                toast.success('Staff member added')
            }
            setShowForm(false)
            setEditingId(null)
            setForm({ name: '', email: '', password: '', role: 'STAFF', isActive: true })
            loadData()
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || 'Failed to save staff member')
        }
    }

    const del = async (id: string) => {
        try {
            await api.delete(`/staff/${id}`)
            toast.success('Staff member removed')
            loadData()
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || 'Failed to remove staff')
        }
    }

    const confirmDelete = () => {
        if (!confirmDeleteId) return
        del(confirmDeleteId)
        setConfirmDeleteId(null)
    }

    const openEdit = (s: { id: string; name: string; email: string; role: string; isActive: boolean }) => {
        setEditingId(s.id)
        setForm({ name: s.name, email: s.email, password: '', role: s.role, isActive: s.isActive })
        setShowForm(true)
    }

    if (admin?.role !== 'SUPER_ADMIN') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
                <ShieldAlert className="w-16 h-16 text-red-500 mb-4 opacity-50" />
                <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
                <p className="text-muted-foreground max-w-md">Only Company Super Admins can manage internal staff accounts.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Company Staff" subtitle="Manage internal team access to Central Admin" />
            <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-foreground">Internal Team</h2>
                            <p className="text-xs text-muted-foreground">{staff.length} active members</p>
                        </div>
                    </div>

                    <Button onClick={() => { setEditingId(null); setForm({ name: '', email: '', password: '', role: 'STAFF', isActive: true }); setShowForm(true) }}
                        className="gap-2 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                        <Plus className="w-4 h-4" /> Add Member
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="p-6 space-y-4">
                                <div className="flex gap-4 items-center">
                                    <Skeleton className="w-12 h-12 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-2/3" />
                                        <Skeleton className="h-3 w-1/3" />
                                    </div>
                                </div>
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-3/4" />
                            </Card>
                        ))
                    ) : staff.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-muted-foreground">No staff found</div>
                    ) : staff.map((s, i) => (
                        <motion.div
                            key={s.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.3), ease: 'easeOut' }}
                        >
                            <Card className="p-6 flex flex-col relative overflow-hidden hover:border-primary/30 transition-all h-full">
                                {!s.isActive && (
                                    <div className="absolute top-0 right-0 bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1 rounded-bl-xl border-b border-l border-red-500/20">
                                        SUSPENDED
                                    </div>
                                )}
                                <div className="flex gap-4 items-center mb-4">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0 bg-gradient-to-br from-primary to-secondary">
                                        {s.name[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-foreground truncate">{s.name}</h3>
                                        <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider mt-1 ${s.role === 'SUPER_ADMIN' ? 'text-amber-400' : s.role === 'ADMIN' ? 'text-primary' : 'text-muted-foreground'
                                            }`}>
                                            <Shield className="w-3 h-3" /> {s.role}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="w-4 h-4 text-muted-foreground/70" />
                                        <span className="truncate">{s.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="w-4 h-4 text-muted-foreground/70" />
                                        <span>Last active: {s.lastLogin ? formatDate(s.lastLogin) : 'Never'}</span>
                                    </div>
                                </div>

                                <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border pt-4">
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="text-xs font-medium">
                                        Edit
                                    </Button>
                                    {s.id !== admin?.id ? (
                                        <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(s.id)}
                                            className="text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                            Remove
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" size="sm" disabled className="text-xs font-medium">
                                            Remove (You)
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Form Dialog */}
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1.5 block">Full Name *</Label>
                                <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1.5 block">Email Address *</Label>
                                <Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1.5 block">
                                    {editingId ? 'New Password (leave blank to keep)' : 'Temporary Password *'}
                                </Label>
                                <Input type="password" required={!editingId} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1.5 block">System Role *</Label>
                                <Select required value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STAFF">Staff (Limited Access)</SelectItem>
                                        <SelectItem value="ADMIN">Admin (Standard Access)</SelectItem>
                                        <SelectItem value="SUPER_ADMIN">Super Admin (Full Access)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {editingId && (
                                <div className="flex items-center gap-2 pt-2">
                                    <Switch id="isActive" checked={form.isActive} onCheckedChange={checked => setForm({ ...form, isActive: checked })} />
                                    <Label htmlFor="isActive" className="text-sm font-normal">Account Active</Label>
                                </div>
                            )}
                            <DialogFooter className="pt-2 sm:justify-stretch gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                                <Button type="submit" className="flex-1 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                                    {editingId ? 'Save Changes' : 'Invite Staff'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <ConfirmDialog
                    open={!!confirmDeleteId}
                    onOpenChange={open => { if (!open) setConfirmDeleteId(null) }}
                    title="Remove this staff member?"
                    description="They will lose access immediately."
                    confirmLabel="Remove"
                    destructive
                    onConfirm={confirmDelete}
                />

            </div>
        </div>
    )
}
