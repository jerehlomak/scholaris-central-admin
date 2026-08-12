'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, Check, Users, GraduationCap, BookOpen, Building2, HardDrive, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

import { SubscriptionPlan } from '@/types'

const PLAN_COLORS = ['#3b82f6', '#8b5cf6', '#10b981']
export default function PlansPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [availableModules, setAvailableModules] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editing, setEditing] = useState<SubscriptionPlan | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [form, setForm] = useState({
        name: '', description: '', monthlyPrice: 0, yearlyPrice: 0, priceLabel: '',
        maxStudents: 200, maxTeachers: 20, maxClasses: 15, maxBranches: 1, storageLimit: 1024,
        trialDays: 0, features: [] as string[]
    })

    const load = async () => {
        setLoading(true)
        try { 
            let r, m;
            try {
                r = await api.get('/billing/plans');
            } catch (err: any) {
                console.error('Error fetching plans:', err);
                toast.error(`Failed to load plans: ${err.message}`);
                throw err;
            }
            try {
                m = await api.get('/permissions/modules');
            } catch (err: any) {
                console.error('Error fetching modules:', err);
                toast.error(`Failed to load modules: ${err.message}`);
                throw err;
            }

            setPlans(r.data.plans || []) 
            setAvailableModules(m.data.modules || [])
        }
        catch (e: any) { 
            console.error('Global load error:', e) 
        } finally { 
            setLoading(false) 
        }
    }

    useEffect(() => { load() }, [])

    const openCreate = () => {
        setEditing(null)
        setForm({ name: '', description: '', monthlyPrice: 0, yearlyPrice: 0, priceLabel: '', maxStudents: 200, maxTeachers: 20, maxClasses: 15, maxBranches: 1, storageLimit: 1024, trialDays: 0, features: [] })
        setShowForm(true)
    }

    const openEdit = (p: SubscriptionPlan) => {
        setEditing(p)
        setForm({
            name: p.name, description: p.description || '',
            monthlyPrice: p.monthlyPrice, yearlyPrice: p.yearlyPrice,
            priceLabel: p.priceLabel || '',
            maxStudents: p.maxStudents, maxTeachers: p.maxTeachers,
            maxClasses: p.maxClasses, maxBranches: p.maxBranches, storageLimit: p.storageLimit,
            trialDays: p.trialDays, features: p.features
        })
        setShowForm(true)
    }

    const toggleFeature = (f: string) => {
        setForm(prev => ({
            ...prev,
            features: prev.features.includes(f) ? prev.features.filter(x => x !== f) : [...prev.features, f],
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            if (editing) { await api.put(`/billing/plans/${editing.id}`, form); toast.success('Plan updated!') }
            else { await api.post('/billing/plans', form); toast.success('Plan created!') }
            setShowForm(false); load()
        } catch { toast.error('Failed to save plan') }
        finally { setIsSubmitting(false) }
    }

    const delPlan = async (id: string) => {
        try { await api.delete(`/billing/plans/${id}`); toast.success('Plan deactivated'); load() }
        catch { toast.error('Failed') }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Pricing Plans" subtitle="Manage SaaS plan offerings" />
            <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">

                <div className="flex justify-end">
                    <Button onClick={openCreate} className="gap-2 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                        <Plus className="w-4 h-4" />New Plan
                    </Button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="p-5 space-y-4">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {plans.map((p, i) => {
                            const color = PLAN_COLORS[i % PLAN_COLORS.length]
                            return (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.3), ease: 'easeOut' }}
                                >
                                    <Card className="p-5 relative overflow-hidden hover:border-primary/30 transition-colors duration-300">
                                        {/* Glow top accent */}
                                        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl opacity-80" style={{ background: color }} />

                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
                                                <p className="text-sm text-muted-foreground mt-0.5">{p.description || 'No description'}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="h-7 w-7 text-muted-foreground hover:text-primary">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/15">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="mb-4 flex flex-col">
                                            <div>
                                                <span className="text-3xl font-bold" style={{ color }}>{formatCurrency(p.monthlyPrice)}</span>
                                                <span className="text-muted-foreground text-sm">/month</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                or {formatCurrency(p.yearlyPrice)}/year
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-5">
                                            {[
                                                { icon: Users, label: `${p.maxStudents.toLocaleString()} students` },
                                                { icon: GraduationCap, label: `${p.maxTeachers} teachers` },
                                                { icon: BookOpen, label: `${p.maxClasses} classes` },
                                                { icon: Building2, label: `${p.maxBranches} branch(es)` },
                                                { icon: HardDrive, label: `${p.storageLimit} MB storage` },
                                            ].map(({ icon: Icon, label }, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Icon className="w-4 h-4 text-muted-foreground opacity-70" />{label}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {Array.isArray(p.features) && p.features.map((f: string) => (
                                                <Badge key={f} variant="outline" className="border-primary/20 bg-primary/10 text-primary capitalize font-normal">{f}</Badge>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                                            <span>{p._count?.schools ?? 0} schools</span>
                                            <Badge variant="outline" className={p.isActive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}>
                                                {p.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </div>
                )}

                {/* Plan Form Modal */}
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Plan Name', key: 'name', type: 'text' },
                                    { label: 'Trial Days', key: 'trialDays', type: 'number' },
                                    { label: 'Monthly Price (NGN)', key: 'monthlyPrice', type: 'number' },
                                    { label: 'Yearly Price (NGN)', key: 'yearlyPrice', type: 'number' },
                                    { label: 'Price Label (e.g. Contact Us)', key: 'priceLabel', type: 'text' },
                                ].map((f, idx) => (
                                    <div key={idx}>
                                        <Label className="text-xs text-muted-foreground mb-1.5 block">{f.label}</Label>
                                        <Input type={f.type} value={form[f.key as keyof typeof form] as string | number}
                                            onChange={e => setForm(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))} />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-5 gap-4">
                                {[
                                    { label: 'Max Students', key: 'maxStudents' },
                                    { label: 'Max Teachers', key: 'maxTeachers' },
                                    { label: 'Max Classes', key: 'maxClasses' },
                                    { label: 'Max Branches', key: 'maxBranches' },
                                    { label: 'Storage (MB)', key: 'storageLimit' },
                                ].map((f, idx) => (
                                    <div key={idx}>
                                        <Label className="text-[10px] text-muted-foreground mb-1.5 block truncate">{f.label}</Label>
                                        <Input type="number" value={form[f.key as keyof typeof form] as number}
                                            onChange={e => setForm(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                                            className="px-2 text-sm" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1.5 block">Description</Label>
                                <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                            </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block">Enabled Features</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableModules.map(f => (
                                            <button key={f} type="button" onClick={() => toggleFeature(f)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.features.includes(f)
                                                    ? 'border-primary/50 bg-primary/10 text-primary'
                                                    : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/30'
                                                    }`}>
                                                {form.features.includes(f) && <Check className="w-3 h-3" />}
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            <DialogFooter className="pt-2 sm:justify-stretch gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1" disabled={isSubmitting}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                        </span>
                                    ) : editing ? 'Update Plan' : 'Create Plan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <ConfirmDialog
                    open={!!deleteId}
                    onOpenChange={open => { if (!open) setDeleteId(null) }}
                    title="Deactivate this plan?"
                    confirmLabel="Deactivate"
                    destructive
                    onConfirm={() => { if (deleteId) delPlan(deleteId); setDeleteId(null) }}
                />
            </div>
        </div>
    )
}
