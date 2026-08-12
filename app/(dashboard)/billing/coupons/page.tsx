'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Tag, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import ConfirmDialog from '@/components/shared/ConfirmDialog'

import { Coupon, DiscountType } from '@/types'

export default function CouponsManagementPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; code: string } | null>(null)
    const [form, setForm] = useState<{
        code: string;
        discountType: DiscountType;
        discountValue: number;
        expiresAt: string;
        usageLimit: number;
    }>({ code: '', discountType: 'PERCENTAGE', discountValue: 0, expiresAt: '', usageLimit: 0 })

    const load = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/billing/coupons')
            setCoupons(data.coupons)
        } catch { toast.error('Failed to load coupons') } finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const payload = {
                ...form,
                usageLimit: form.usageLimit > 0 ? form.usageLimit : null,
                expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null
            }
            await api.post('/billing/coupons', payload)
            toast.success('Coupon created!')
            setShowForm(false)
            load()
        } catch { toast.error('Failed to create coupon') }
    }

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/billing/coupons/${id}`)
            toast.success('Coupon deleted')
            load()
        } catch { toast.error('Failed to delete coupon') }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Coupons" subtitle="Manage discount codes for subscriptions" />

            <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full">

                <div className="flex justify-end">
                    <Button
                        onClick={() => { setForm({ code: '', discountType: 'PERCENTAGE', discountValue: 0, expiresAt: '', usageLimit: 0 }); setShowForm(true) }}
                        className="gap-2 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                        <Plus className="w-4 h-4" />Create Coupon
                    </Button>
                </div>

                <Card className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-muted/20">
                                {['Code', 'Discount', 'Usage', 'Expires', 'Status', 'Actions'].map((h, i) => (
                                    <TableHead key={h} className={`text-xs uppercase tracking-wider ${i === 5 ? 'text-right' : ''}`}>{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 6 }).map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full max-w-[100px]" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : coupons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-sm">
                                        <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        No coupons found.
                                    </TableCell>
                                </TableRow>
                            ) : coupons.map((c, i) => (
                                <motion.tr
                                    key={c.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    <TableCell className="font-mono font-bold text-foreground text-sm">{c.code}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% off` : `$${c.discountValue} off`}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {c.usedCount} / {c.usageLimit || '∞'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{c.expiresAt ? formatDate(new Date(c.expiresAt)) : 'Never'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={c.isActive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' : 'border-red-500/30 bg-red-500/10 text-red-500'}>
                                            {c.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: c.id, code: c.code })}
                                            className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                </Card>

                {/* Form Modal */}
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create Coupon</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Coupon Code</Label>
                                <Input required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                    className="uppercase" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
                                    <Select value={form.discountType} onValueChange={v => setForm(p => ({ ...p, discountType: v as DiscountType }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                            <SelectItem value="FIXED">Fixed Amount ($)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1 block">Value</Label>
                                    <Input required type="number" min="1" max={form.discountType === 'PERCENTAGE' ? "100" : undefined} value={form.discountValue || ''} onChange={e => setForm(p => ({ ...p, discountValue: Number(e.target.value) }))} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1 block">Usage Limit (0 for ∞)</Label>
                                    <Input type="number" min="0" value={form.usageLimit} onChange={e => setForm(p => ({ ...p, usageLimit: Number(e.target.value) }))} />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1 block">Expiry Date (Optional)</Label>
                                    <Input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} />
                                </div>
                            </div>
                            <DialogFooter className="pt-2 sm:justify-stretch gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                                <Button type="submit" className="flex-1 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">Create</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <ConfirmDialog
                    open={!!deleteTarget}
                    onOpenChange={open => { if (!open) setDeleteTarget(null) }}
                    title={`Delete coupon ${deleteTarget?.code ?? ''}?`}
                    confirmLabel="Delete"
                    destructive
                    onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); setDeleteTarget(null) }}
                />
            </main>
        </div>
    )
}
