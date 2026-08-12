'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { LineChart, Plus, ArrowUpRight, ArrowDownRight, Building2, Search, Filter } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { PlatformTransaction, School } from '@/types'
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
import StatCard from '@/components/shared/StatCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

export default function PlatformLedgerPage() {
    const [transactions, setTransactions] = useState<PlatformTransaction[]>([])
    const [totals, setTotals] = useState({ INCOME: 0, EXPENSE: 0 })
    const [net, setNet] = useState(0)
    const [loading, setLoading] = useState(true)

    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({
        type: 'INCOME', category: 'SUBSCRIPTION', amount: '', description: '', schoolId: '', reference: ''
    })
    const [schools, setSchools] = useState<School[]>([])
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [lRes, sRes] = await Promise.all([
                api.get('/ledger'),
                api.get('/schools')
            ])
            setTransactions(lRes.data.transactions || [])
            setTotals(lRes.data.totals || { INCOME: 0, EXPENSE: 0 })
            setNet(lRes.data.net || 0)
            setSchools(sRes.data.schools || [])
        } catch { toast.error('Failed to load ledger data') } finally { setLoading(false) }
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await api.post('/ledger', {
                ...form,
                amount: Number(form.amount)
            })
            toast.success('Transaction recorded successfully')
            setShowForm(false)
            setForm({ type: 'INCOME', category: 'SUBSCRIPTION', amount: '', description: '', schoolId: '', reference: '' })
            loadData()
        } catch { toast.error('Failed to record transaction') }
    }

    const del = async (id: string) => {
        try {
            await api.delete(`/ledger/${id}`)
            toast.success('Transaction removed')
            loadData()
        } catch { toast.error('Failed to delete transaction') }
    }

    const confirmDelete = () => {
        if (!confirmDeleteId) return
        del(confirmDeleteId)
        setConfirmDeleteId(null)
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Company Ledger" subtitle="Platform-wide income and expense tracking" />
            <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Total Income" value={formatCurrency(totals.INCOME, 'NGN')} icon={ArrowUpRight} color="#10b981" delay={0} />
                    <StatCard label="Total Expenses" value={formatCurrency(totals.EXPENSE, 'NGN')} icon={ArrowDownRight} color="#ef4444" delay={0.05} />
                    <StatCard label="Net Profitability" value={formatCurrency(net, 'NGN')} icon={LineChart} color={net >= 0 ? '#10b981' : '#ef4444'} delay={0.1} />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl w-64 bg-muted/40 border border-border">
                            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <Input placeholder="Search transactions..."
                                className="border-0 bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 text-sm" />
                        </div>
                        <Button variant="outline" size="icon" className="text-muted-foreground">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button onClick={() => setShowForm(true)} className="gap-2 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                        <Plus className="w-4 h-4" /> Add Transaction
                    </Button>
                </div>

                <Card className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-muted/20">
                                {['Reference', 'Category', 'Amount', 'School / Client', 'Date', 'Actions'].map(h => (
                                    <TableHead key={h} className="text-xs uppercase tracking-wider">{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 6 }).map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full max-w-[120px]" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No transactions recorded yet.</TableCell>
                                </TableRow>
                            ) : transactions.map((tx, i) => (
                                <motion.tr
                                    key={tx.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {tx.reference}
                                        {tx.description && <p className="text-[10px] text-muted-foreground/70 mt-1 max-w-[150px] truncate">{tx.description}</p>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={tx.type === 'INCOME'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-400 border-red-500/20'}>
                                            {tx.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={`font-bold ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency || 'NGN')}
                                    </TableCell>
                                    <TableCell>
                                        {tx.school ? (
                                            <span className="flex items-center gap-2 text-sm text-foreground">
                                                <Building2 className="w-3 h-3 text-muted-foreground" /> {tx.school.name}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground italic">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{formatDate(new Date(tx.date))}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(tx.id)}
                                            className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                            Void
                                        </Button>
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                </Card>

                {/* Create Dialog */}
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Record Transaction</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground -mt-2">Manually log a platform-wide income or expense.</p>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1.5 block">Type *</Label>
                                    <Select required value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INCOME">Income</SelectItem>
                                            <SelectItem value="EXPENSE">Expense</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1.5 block">Category *</Label>
                                    <Select required value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {form.type === 'INCOME' ? (
                                                <>
                                                    <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                                                    <SelectItem value="PIN_SALES">PIN Sales</SelectItem>
                                                    <SelectItem value="SETUP_FEE">Setup Fee</SelectItem>
                                                    <SelectItem value="OTHER">Other Income</SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="HOSTING">Hosting Server</SelectItem>
                                                    <SelectItem value="MARKETING">Marketing/Ads</SelectItem>
                                                    <SelectItem value="SALARY">Staff Salary</SelectItem>
                                                    <SelectItem value="OTHER">Other Expense</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground mb-1.5 block">Amount (NGN) *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
                                    <Input required type="number" min="0" step="0.01"
                                        value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                        className="pl-7" />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground mb-1.5 block">School / Client (Optional)</Label>
                                <Select value={form.schoolId || 'NONE'} onValueChange={v => setForm(p => ({ ...p, schoolId: v === 'NONE' ? '' : v }))}>
                                    <SelectTrigger><SelectValue placeholder="-- None --" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">-- None --</SelectItem>
                                        {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground mb-1.5 block">Description (Optional)</Label>
                                <Input type="text" placeholder="e.g. AWS Invoice Jan 2026"
                                    value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                            </div>

                            <DialogFooter className="pt-2 sm:justify-stretch gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                                <Button type="submit" className={`flex-1 text-white hover:opacity-90 ${form.type === 'INCOME' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                                    Record {form.type === 'INCOME' ? 'Income' : 'Expense'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <ConfirmDialog
                    open={!!confirmDeleteId}
                    onOpenChange={open => { if (!open) setConfirmDeleteId(null) }}
                    title="Void this transaction?"
                    description="Are you sure you want to delete this transaction from the ledger? This action cannot be reversed."
                    confirmLabel="Void"
                    destructive
                    onConfirm={confirmDelete}
                />

            </div>
        </div>
    )
}
