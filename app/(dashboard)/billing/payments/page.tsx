'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CircleDollarSign, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

import { Payment } from '@/types'

const STATUS_CLASSES: Record<string, string> = {
    COMPLETED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    REFUNDED: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    FAILED: 'bg-red-500/10 text-red-500 border-red-500/20',
}
const DEFAULT_STATUS_CLASS = 'bg-slate-500/10 text-slate-500 border-slate-500/20'

export default function PaymentsManagementPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const load = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/billing/payments')
            setPayments(data.payments)
        } catch {
            toast.error('Failed to load payments')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const filtered = payments.filter(p =>
        p.school?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.invoice?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Payments" subtitle="Track all incoming platform transactions" />
            <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full">

                <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl w-full md:max-w-96 bg-muted/40 border border-border">
                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search school, transaction ID or invoice #..."
                        className="border-0 bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 text-sm" />
                </div>

                <Card className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-muted/20">
                                {['Txn ID', 'School', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                                    <TableHead key={h} className="text-xs uppercase tracking-wider">{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 6 }).map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full max-w-[100px]" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-sm">
                                        <CircleDollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        No payments found.
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map((pay, i) => (
                                <motion.tr
                                    key={pay.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    <TableCell className="font-mono text-xs text-muted-foreground">{pay.transactionId || 'MANUAL'}</TableCell>
                                    <TableCell>
                                        <p className="text-foreground font-medium text-sm">{pay.school?.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono">{pay.invoice?.invoiceNumber}</p>
                                    </TableCell>
                                    <TableCell className="font-semibold text-foreground text-sm">{formatCurrency(pay.amount, pay.currency)}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs font-semibold">{pay.paymentMethod.replace('_', ' ')}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={STATUS_CLASSES[pay.status] || DEFAULT_STATUS_CLASS}>
                                            {pay.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{pay.paidAt ? formatDate(new Date(pay.paidAt)) : '-'}</TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </main>
        </div>
    )
}
