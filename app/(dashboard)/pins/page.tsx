'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { KeyRound, Plus, Hash, Clock, School as SchoolIcon, Layers, FileDown } from 'lucide-react'
import { formatDate } from '@/lib/utils'
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
import StatCard from '@/components/shared/StatCard'

interface PinBatch {
    id: string;
    batchNumber: string;
    quantity: number;
    _count?: { pins: number };
    pinType: string;
    admin?: { name: string };
    createdAt: string;
    school?: { name: string };
}

export default function PinManagerPage() {
    const [batches, setBatches] = useState<PinBatch[]>([])
    const [schools, setSchools] = useState<Array<{ id: string; name: string; status: string; }>>([])
    const [totalPins, setTotalPins] = useState(0)
    const [loading, setLoading] = useState(true)

    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ quantity: 100, pricePerPin: 0, schoolId: '', pinType: 'RESULT_CHECKING' })

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [bRes, sRes] = await Promise.all([
                api.get('/pins/batches'),
                api.get('/schools')
            ])
            setBatches(bRes.data.batches || [])
            setTotalPins(bRes.data.totalPins || 0)
            setSchools(sRes.data.schools || [])
        } catch { toast.error('Failed to load PIN data') } finally { setLoading(false) }
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await api.post('/pins/batches', {
                quantity: Number(form.quantity),
                pricePerPin: Number(form.pricePerPin),
                schoolId: form.schoolId || null,
                pinType: form.pinType
            })
            toast.success('PIN batch generated successfully!')
            setShowForm(false)
            setForm({ quantity: 100, pricePerPin: 0, schoolId: '', pinType: 'RESULT_CHECKING' })
            loadData()
        } catch { toast.error('Failed to generate PINs') }
    }

    const unassignedSchools = schools.filter(s => s.status === 'ACTIVE')

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="PIN Manager" subtitle={`${totalPins.toLocaleString()} total PINs generated`} />
            <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Total Batches" value={batches.length} icon={Layers} color="#6366f1" delay={0} />
                    <StatCard label="Total PINs" value={totalPins.toLocaleString()} icon={KeyRound} color="#10b981" delay={0.05} />
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.1, ease: 'easeOut' }}
                    >
                        <Card
                            onClick={() => setShowForm(true)}
                            className="p-6 h-full flex flex-col justify-center items-center text-center cursor-pointer hover:border-primary/50 transition-all bg-gradient-to-br from-primary/10 to-secondary/10"
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white mb-3 shadow-lg">
                                <Plus className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-foreground">Generate New Batch</h3>
                            <p className="text-sm text-muted-foreground mt-1">Create PINs for schools</p>
                        </Card>
                    </motion.div>
                </div>

                <Card className="overflow-hidden">
                    <div className="p-5 border-b border-border flex justify-between items-center">
                        <h2 className="font-bold text-foreground flex items-center gap-2">
                            <Hash className="w-4 h-4 text-primary" /> Recent PIN Batches
                        </h2>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-muted/20">
                                {['Batch Number', 'Quantity', 'Pin Type', 'Assigned To', 'Generated By', 'Date', 'Actions'].map(h => (
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
                            ) : batches.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No batches generated yet.</TableCell>
                                </TableRow>
                            ) : batches.map((b, i) => (
                                <motion.tr
                                    key={b.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    <TableCell className="font-mono text-primary font-semibold">{b.batchNumber}</TableCell>
                                    <TableCell className="text-foreground font-medium">{(b._count?.pins || b.quantity).toLocaleString()}</TableCell>
                                    <TableCell className="text-muted-foreground capitalize">{String(b.pinType || 'RESULT_CHECKING').replace('_', ' ').toLowerCase()}</TableCell>
                                    <TableCell>
                                        {b.school ? (
                                            <span className="flex items-center gap-2 text-sm text-foreground">
                                                <SchoolIcon className="w-3 h-3 text-secondary" /> {b.school.name}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground italic">Unassigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{b.admin?.name || 'System'}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        <span className="flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> {formatDate(b.createdAt)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Export CSV (Coming Soon)">
                                            <FileDown className="w-3.5 h-3.5" />
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
                            <DialogTitle>Generate PINs</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground -mt-2">Create a new batch of secure PIN codes.</p>

                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1.5 block">Quantity *</Label>
                                <Input required type="number" min="1" max="5000"
                                    value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1.5 block">PIN Type</Label>
                                <Select value={form.pinType} onValueChange={v => setForm(p => ({ ...p, pinType: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="RESULT_CHECKING">Result Checking</SelectItem>
                                        <SelectItem value="ADMISSION_APPLICATION">Admission Application</SelectItem>
                                        <SelectItem value="EMPLOYMENT">Employment Verification</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1.5 block">Assign to School (Optional)</Label>
                                <Select value={form.schoolId || 'NONE'} onValueChange={v => setForm(p => ({ ...p, schoolId: v === 'NONE' ? '' : v }))}>
                                    <SelectTrigger><SelectValue placeholder="-- Keep Unassigned --" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">-- Keep Unassigned --</SelectItem>
                                        {unassignedSchools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1.5 block">Value / Price per PIN (Optional)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
                                    <Input type="number" min="0" step="100"
                                        value={form.pricePerPin} onChange={e => setForm(p => ({ ...p, pricePerPin: Number(e.target.value) }))}
                                        className="pl-7" />
                                </div>
                            </div>

                            <DialogFooter className="pt-2 sm:justify-stretch gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                                <Button type="submit" className="flex-1 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">Generate</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    )
}
