'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Receipt, Search, Plus, Send, BellRing, Wallet, X } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

import { Invoice, School } from '@/types'

const STATUS_CLASSES: Record<string, string> = {
    PAID: 'bg-emerald-500/10 text-emerald-500',
    PARTIALLY_PAID: 'bg-amber-500/10 text-amber-500',
    DRAFT: 'bg-slate-500/10 text-slate-500',
}
const DEFAULT_STATUS_CLASS = 'bg-blue-500/10 text-blue-500'

export default function InvoicesManagementPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [schools, setSchools] = useState<School[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modals
    const [showCreate, setShowCreate] = useState(false)
    const [showPayment, setShowPayment] = useState<Invoice | null>(null)
    const [showReminder, setShowReminder] = useState<Invoice | null>(null)
    const [sendTarget, setSendTarget] = useState<Invoice | null>(null)

    // Create Form State
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        schoolId: '',
        title: '',
        dueDate: '',
        items: [{ itemName: '', quantity: 1, unitPrice: 0 }]
    })

    const load = async () => {
        setLoading(true)
        try {
            const [invRes, schRes] = await Promise.all([
                api.get('/invoices'),
                api.get('/schools')
            ])
            setInvoices(invRes.data.invoices || [])
            setSchools(schRes.data.schools || [])
        } catch {
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    // Actions
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.schoolId || !formData.dueDate || !formData.title || formData.items.length === 0) {
            return toast.error('Please fill all required fields')
        }
        setSubmitting(true)
        try {
            await api.post('/invoices', formData)
            toast.success('Invoice created successfully')
            setShowCreate(false)
            setFormData({ schoolId: '', title: '', dueDate: '', items: [{ itemName: '', quantity: 1, unitPrice: 0 }] })
            load()
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message || 'Failed to create invoice')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSend = async (id: string) => {
        try {
            await api.post(`/invoices/${id}/send`)
            toast.success('Invoice sent')
            load()
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message || 'Failed to send invoice')
        }
    }

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!showPayment) return
        const amount = new FormData(e.currentTarget as HTMLFormElement).get('amount') as string
        setSubmitting(true)
        try {
            await api.post(`/invoices/${showPayment.id}/payment`, { amount: Number(amount) })
            toast.success('Payment recorded')
            setShowPayment(null)
            load()
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message || 'Failed to record payment')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSendReminder = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!showReminder) return
        const message = new FormData(e.currentTarget as HTMLFormElement).get('message') as string
        setSubmitting(true)
        try {
            await api.post(`/invoices/${showReminder.id}/reminder`, { message })
            toast.success('Reminder sent')
            setShowReminder(null)
            load()
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message || 'Failed to send reminder')
        } finally {
            setSubmitting(false)
        }
    }

    const filtered = invoices.filter(i =>
        i.school?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen flex flex-col pb-20">
            <Header title="Invoices" subtitle="Manage billing and receivables across all schools" />
            <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full">

                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl w-full md:max-w-96 bg-muted/40 border border-border">
                        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search school or invoice #..."
                            className="border-0 bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 text-sm" />
                    </div>
                    <Button onClick={() => setShowCreate(true)} className="gap-2 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                        <Plus className="w-4 h-4" /> Create Invoice
                    </Button>
                </div>

                <Card className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-muted/20">
                                {['Invoice #', 'School', 'Due Date', 'Total', 'Due', 'Status', 'Actions'].map((h, i) => (
                                    <TableHead key={h} className={`text-xs uppercase tracking-wider whitespace-nowrap ${i === 6 ? 'text-right' : ''}`}>{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 7 }).map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full max-w-[100px]" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="px-6 py-12 text-center text-muted-foreground text-sm">
                                        <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        No invoices found.
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map((inv, i) => (
                                <motion.tr
                                    key={inv.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                    className="border-b transition-colors hover:bg-muted/50 whitespace-nowrap"
                                >
                                    <TableCell>
                                        <div className="font-mono text-xs text-foreground">{inv.invoiceNumber}</div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5">{inv.title}</div>
                                    </TableCell>
                                    <TableCell className="text-foreground font-medium text-sm">{inv.school?.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{formatDate(new Date(inv.dueDate))}</TableCell>
                                    <TableCell className="font-semibold text-foreground text-sm">{formatCurrency(inv.totalAmount, inv.currency)}</TableCell>
                                    <TableCell className="font-semibold text-red-500 text-sm">{formatCurrency(inv.amountDue ?? 0, inv.currency)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`border-0 text-[10px] font-bold uppercase tracking-wider ${STATUS_CLASSES[inv.status] || DEFAULT_STATUS_CLASS}`}>
                                            {inv.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {inv.status === 'DRAFT' && (
                                                <Button variant="ghost" size="icon" onClick={() => setSendTarget(inv)} title="Send Invoice"
                                                    className="h-7 w-7 text-blue-500 hover:bg-blue-500/10">
                                                    <Send className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                            {(inv.status === 'SENT' || inv.status === 'PARTIALLY_PAID' || inv.status === 'OVERDUE') && (
                                                <Button variant="ghost" size="icon" onClick={() => setShowReminder(inv)} title="Send Reminder"
                                                    className="h-7 w-7 text-amber-500 hover:bg-amber-500/10">
                                                    <BellRing className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                            {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                                                <Button variant="ghost" size="icon" onClick={() => setShowPayment(inv)} title="Record Manual Payment"
                                                    className="h-7 w-7 text-emerald-500 hover:bg-emerald-500/10">
                                                    <Wallet className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </main>

            {/* CREATE MODAL */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Invoice</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-sm font-medium text-muted-foreground">Target School</Label>
                                <Select required value={formData.schoolId} onValueChange={v => setFormData({ ...formData, schoolId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select a school..." /></SelectTrigger>
                                    <SelectContent>
                                        {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.schoolCode})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-muted-foreground">Invoice Title</Label>
                                <Input required type="text" placeholder="e.g. Platform Subscription" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                                <Input required type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-foreground">Line Items</h3>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(f => ({ ...f, items: [...f.items, { itemName: '', quantity: 1, unitPrice: 0 }] }))}
                                    className="text-xs font-semibold text-primary hover:text-primary bg-primary/5 hover:bg-primary/10">
                                    + Add Item
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {formData.items.map((item, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <Input required type="text" placeholder="Description" value={item.itemName} onChange={e => {
                                            const newItems = [...formData.items]; newItems[i].itemName = e.target.value; setFormData({ ...formData, items: newItems })
                                        }} className="flex-1" />
                                        <Input required type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => {
                                            const newItems = [...formData.items]; newItems[i].quantity = Number(e.target.value); setFormData({ ...formData, items: newItems })
                                        }} className="w-20" />
                                        <Input required type="number" min="0" placeholder="Price" value={item.unitPrice} onChange={e => {
                                            const newItems = [...formData.items]; newItems[i].unitPrice = Number(e.target.value); setFormData({ ...formData, items: newItems })
                                        }} className="w-32" />
                                        {formData.items.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => setFormData(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))}
                                                className="text-red-500 hover:bg-red-500/10 flex-shrink-0"><X className="w-4 h-4" /></Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting} className="bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                                {submitting ? 'Creating...' : 'Create Draft'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* PAYMENT MODAL */}
            <Dialog open={!!showPayment} onOpenChange={open => { if (!open) setShowPayment(null) }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground -mt-2">Amount Due: <span className="font-bold text-red-500">{formatCurrency(showPayment?.amountDue ?? 0, 'NGN')}</span></p>
                    <form onSubmit={handleRecordPayment} className="space-y-4">
                        <div>
                            <Label className="text-sm text-muted-foreground mb-1 block">Payment Amount Received</Label>
                            <Input name="amount" type="number" required min="1" max={showPayment?.amountDue ?? undefined} defaultValue={showPayment?.amountDue ?? undefined}
                                className="text-lg font-bold" />
                        </div>
                        <Button type="submit" disabled={submitting} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                            {submitting ? 'Saving...' : 'Confirm Payment'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* REMINDER MODAL */}
            <Dialog open={!!showReminder} onOpenChange={open => { if (!open) setShowReminder(null) }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Send Reminder</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground -mt-2">Sending to <strong>{showReminder?.school?.name}</strong> for invoice {showReminder?.invoiceNumber}</p>
                    <form onSubmit={handleSendReminder} className="space-y-4">
                        <div>
                            <Label className="text-sm text-muted-foreground mb-1 block">Custom Message (optional)</Label>
                            <Textarea name="message" rows={3} placeholder="Please remember to settle your outstanding balance..." />
                        </div>
                        <Button type="submit" disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                            {submitting ? 'Sending...' : 'Send Reminder'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* SEND CONFIRMATION */}
            <ConfirmDialog
                open={!!sendTarget}
                onOpenChange={open => { if (!open) setSendTarget(null) }}
                title={`Send invoice ${sendTarget?.invoiceNumber ?? ''} to the school now?`}
                confirmLabel="Send"
                onConfirm={() => { if (sendTarget) handleSend(sendTarget.id); setSendTarget(null) }}
            />

        </div>
    )
}
