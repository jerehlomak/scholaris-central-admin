'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { ClipboardList, Eye, CheckCircle, XCircle, Clock, School as SchoolIcon, Filter, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import StatCard from '@/components/shared/StatCard'

interface Application {
    id: string;
    applicantName: string;
    applicantEmail: string;
    applicationType: string;
    status: string;
    createdAt: string;
    school: { name: string };
}

export default function CentralApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')

    const loadApplications = useCallback(async () => {
        setLoading(true)
        try {
            // This endpoint needs to exist on the backend for central admins
            const response = await api.get('/applications/all')
            setApplications(response.data.applications || [])
        } catch (error) {
            console.error('Failed to load applications:', error)
            // Fallback for demo if endpoint doesn't exist yet
            setApplications([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadApplications()
    }, [loadApplications])

    const filteredApplications = applications.filter(app => {
        const matchesSearch = app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.school.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'REJECTED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Incoming Applications" subtitle="Review and track student & staff applications across all schools" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                        label="Total Applications"
                        value={applications.length}
                        icon={ClipboardList}
                        color="#1E4DA6"
                        delay={0}
                    />
                    <StatCard
                        label="Pending Review"
                        value={applications.filter(a => a.status === 'PENDING').length}
                        icon={Clock}
                        color="#f59e0b"
                        delay={0.05}
                    />
                    <StatCard
                        label="Approved"
                        value={applications.filter(a => a.status === 'APPROVED').length}
                        icon={CheckCircle}
                        color="#10b981"
                        delay={0.1}
                    />
                    <StatCard
                        label="Rejected"
                        value={applications.filter(a => a.status === 'REJECTED').length}
                        icon={XCircle}
                        color="#f43f5e"
                        delay={0.15}
                    />
                </div>

                {/* Filters */}
                <Card className="flex flex-col md:flex-row gap-4 items-center justify-between p-4">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl w-full md:max-w-sm bg-muted/40 border border-border">
                        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name or school…"
                            className="border-0 bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-44 bg-muted/40">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {/* Table */}
                <Card className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-muted/20">
                                {['Applicant Name', 'School', 'Type', 'Status', 'Date Submitted', 'Actions'].map((h, i) => (
                                    <TableHead key={h} className={`text-xs uppercase tracking-wider ${i === 5 ? 'text-right' : ''}`}>{h}</TableHead>
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
                            ) : filteredApplications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-sm">
                                        No applications found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : filteredApplications.map((app, i) => (
                                <motion.tr
                                    key={app.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    <TableCell className="font-medium text-foreground">{app.applicantName}</TableCell>
                                    <TableCell>
                                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <SchoolIcon className="w-3 h-3 text-blue-500" /> {app.school.name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {app.applicationType === 'ADMISSION_APPLICATION' ? 'Student' : 'Staff'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`${getStatusColor(app.status)} font-medium uppercase tracking-wider text-[10px]`}>
                                            {app.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="w-3 h-3" /> {formatDate(app.createdAt)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="View Details">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    )
}
