'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { School, SubscriptionPlan } from '@/types'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Ban, CheckCircle, Zap, Pencil, X, Save, Plus, ChevronRight, GraduationCap, Users, BookOpenCheck, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import StatusBadge from '@/components/shared/StatusBadge'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

type ConfirmAction = 'suspend' | 'resetPassword' | null
type DashboardType = 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF'
type SchoolDashboard = { dashboardType: DashboardType; enabled: boolean }

const DASHBOARD_META: Record<DashboardType, { label: string; icon: typeof GraduationCap }> = {
    STUDENT: { label: 'Student Dashboard', icon: GraduationCap },
    PARENT: { label: 'Parent Dashboard', icon: Users },
    TEACHER: { label: 'Teacher Dashboard', icon: BookOpenCheck },
    STAFF: { label: 'Staff / Admin Dashboard', icon: ShieldCheck },
}

export default function SchoolDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [school, setSchool] = useState<School | null>(null)
    const [adminUser, setAdminUser] = useState<{ email: string, loginUrl: string } | null>(null)
    const [resetCreds, setResetCreds] = useState<{ email: string, password: string, loginUrl: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState(false)
    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
    const [dashboards, setDashboards] = useState<SchoolDashboard[]>([])
    const [dashboardsLoading, setDashboardsLoading] = useState(true)
    const [editForm, setEditForm] = useState({
        name: '', email: '', phone: '', address: '', country: 'Nigeria', adminEmail: '', planId: '',
        studentCount: 0, teacherCount: 0, groupId: '', schoolCode: ''
    })

    const load = useCallback(async () => {
        try {
            const [schoolRes, credsRes] = await Promise.all([
                api.get(`/schools/${id}`),
                api.get(`/schools/${id}/credentials`).catch(() => ({ data: { admin: null } }))
            ])
            const s = schoolRes.data.school
            setSchool(s)
            setEditForm({
                name: s.name || '',
                email: s.email || '',
                phone: s.phone || '',
                address: s.address || '',
                country: s.country || 'Nigeria',
                adminEmail: s.adminEmail || '',
                planId: s.planId || '',
                studentCount: s.studentCount || 0,
                teacherCount: s.teacherCount || 0,
                groupId: s.groupId || '',
                schoolCode: s.schoolCode || ''
            })
            if (credsRes.data?.admin) {
                setAdminUser({ email: credsRes.data.admin.email, loginUrl: credsRes.data.loginUrl })
            }
        } catch { toast.error('Failed to load school') } finally { setLoading(false) }
    }, [id])

    useEffect(() => { if (id) load() }, [id, load])
    useEffect(() => {
        api.get('/plans').then(r => setPlans(r.data.plans || []))
        api.get('/groups').then(r => setGroups(r.data.groups || []))
    }, [])
    useEffect(() => {
        if (!id) return
        setDashboardsLoading(true)
        api.get(`/schools/${id}/dashboards`)
            .then(r => setDashboards(r.data.dashboards || []))
            .catch(() => toast.error('Failed to load dashboard access'))
            .finally(() => setDashboardsLoading(false))
    }, [id])

    const toggleDashboard = async (dashboardType: DashboardType, enabled: boolean) => {
        setDashboards(prev => prev.map(d => d.dashboardType === dashboardType ? { ...d, enabled } : d))
        try {
            await api.put(`/schools/${id}/dashboards`, { dashboardType, enabled })
            toast.success(`${DASHBOARD_META[dashboardType].label} ${enabled ? 'enabled' : 'disabled'}`)
        } catch {
            setDashboards(prev => prev.map(d => d.dashboardType === dashboardType ? { ...d, enabled: !enabled } : d))
            toast.error('Failed to update dashboard access')
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await api.put(`/schools/${id}`, {
                ...editForm,
                groupId: editForm.groupId || null,
                planId: editForm.planId || null,
            })
            toast.success('School updated successfully!')
            setIsEditing(false)
            load()
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } }
            toast.error(err.response?.data?.message || 'Failed to save changes')
        } finally {
            setSaving(false)
        }
    }

    const handleResetPassword = async () => {
        try {
            const res = await api.post(`/schools/${id}/credentials/reset`)
            setResetCreds(res.data.credentials)
            toast.success('Password reset successfully')
        } catch { toast.error('Failed to reset password') }
    }

    const suspend = async () => {
        try { await api.post(`/schools/${id}/suspend`, { reason: 'Admin action' }); toast.success('Suspended'); load() }
        catch { toast.error('Failed') }
    }

    const activate = async () => {
        try { await api.post(`/schools/${id}/activate`); toast.success('Activated'); load() }
        catch { toast.error('Failed') }
    }

    const confirmPending = () => {
        if (confirmAction === 'suspend') suspend()
        else if (confirmAction === 'resetPassword') handleResetPassword()
        setConfirmAction(null)
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    )

    if (!school) return <div className="p-6 text-muted-foreground">School not found.</div>

    return (
        <div className="min-h-screen flex flex-col">
            <Header title={school.name} subtitle={school.email} />
            <div className="p-6 max-w-4xl mx-auto w-full space-y-5">
                {/* Toolbar */}
                <div className="flex items-center gap-3 flex-wrap">
                    <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-sm text-muted-foreground hover:text-foreground px-2">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <div className="flex-1" />

                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                                <X className="w-4 h-4" /> Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}
                                className="gap-2 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                                {saving ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                                <Pencil className="w-3.5 h-3.5" /> Edit
                            </Button>
                            {school.status === 'ACTIVE' ? (
                                <Button variant="outline" onClick={() => setConfirmAction('suspend')}
                                    className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500">
                                    <Ban className="w-4 h-4" /> Suspend
                                </Button>
                            ) : (
                                <Button variant="outline" onClick={activate}
                                    className="gap-2 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500">
                                    <CheckCircle className="w-4 h-4" /> Activate
                                </Button>
                            )}
                            <Button asChild variant="outline" className="gap-2 border-blue-500/30 text-blue-500 hover:bg-blue-500/10 hover:text-blue-500">
                                <Link href={`/features?school=${id}`}>
                                    <Zap className="w-4 h-4" /> Features
                                </Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Students', value: school.studentCount.toLocaleString() },
                        { label: 'Teachers', value: school.teacherCount },
                        { label: 'Plan', value: (school as unknown as { plan?: { name: string } }).plan?.name || 'None' },
                        { label: 'Status', value: school.status },
                    ].map((c, i) => (
                        <motion.div
                            key={c.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: i * 0.05, ease: 'easeOut' }}
                        >
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                                    {c.label === 'Status' ? (
                                        <StatusBadge status={c.value as string} />
                                    ) : (
                                        <p className="text-xl font-bold text-foreground">{c.value}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Dashboard Access (RBAC Layer 1) */}
                <Card>
                    <CardContent className="p-5">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-foreground">Dashboard Access</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Control which portals are available to this school</p>
                        </div>
                        {dashboardsLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {dashboards.map(d => {
                                    const meta = DASHBOARD_META[d.dashboardType]
                                    const Icon = meta.icon
                                    return (
                                        <div key={d.dashboardType} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                                            <div className="flex items-center gap-2.5">
                                                <Icon className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm font-medium text-foreground">{meta.label}</span>
                                            </div>
                                            <Switch checked={d.enabled} onCheckedChange={(v) => toggleDashboard(d.dashboardType, v)} />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Edit / View Panel */}
                <Card>
                    <CardContent className="p-5">
                        <h3 className="text-sm font-semibold mb-4 text-foreground">
                            {isEditing ? 'Edit School Details' : 'School Information'}
                        </h3>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1 block">School Name *</Label>
                                        <Input value={editForm.name}
                                            onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1 block">Email Address *</Label>
                                        <Input type="email" value={editForm.email}
                                            onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label className="text-xs text-muted-foreground mb-1 block">School ID (Code) *</Label>
                                        <Input value={editForm.schoolCode}
                                            onChange={e => setEditForm(p => ({ ...p, schoolCode: e.target.value.toUpperCase() }))}
                                            placeholder="e.g. SKL-A1B2C3" />
                                        <p className="text-[10px] text-muted-foreground mt-1">This ID is heavily required for parent/student logins.</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1 block">Phone</Label>
                                        <Input value={editForm.phone}
                                            onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1 block">Country</Label>
                                        <Input value={editForm.country}
                                            onChange={e => setEditForm(p => ({ ...p, country: e.target.value }))} />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label className="text-xs text-muted-foreground mb-1 block">Address</Label>
                                        <Input value={editForm.address}
                                            onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1 block">Admin Login Email</Label>
                                        <Input type="email" value={editForm.adminEmail}
                                            onChange={e => setEditForm(p => ({ ...p, adminEmail: e.target.value }))}
                                            placeholder="The email used to log into the school admin dashboard" />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1 block">Subscription Plan</Label>
                                        <Select value={editForm.planId || 'NONE'} onValueChange={v => setEditForm(p => ({ ...p, planId: v === 'NONE' ? '' : v }))}>
                                            <SelectTrigger><SelectValue placeholder="No Plan" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NONE">No Plan</SelectItem>
                                                {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (₦{p.monthlyPrice}/mo)</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1 block">Branch</Label>
                                        <Select value={editForm.groupId || 'NONE'} onValueChange={v => setEditForm(p => ({ ...p, groupId: v === 'NONE' ? '' : v }))}>
                                            <SelectTrigger><SelectValue placeholder="Independent (No Group)" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NONE">Independent (No Group)</SelectItem>
                                                {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1 block">Student Count</Label>
                                        <Input type="number" min="0" value={editForm.studentCount}
                                            onChange={e => setEditForm(p => ({ ...p, studentCount: Number(e.target.value) }))} />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1 block">Teacher Count</Label>
                                        <Input type="number" min="0" value={editForm.teacherCount}
                                            onChange={e => setEditForm(p => ({ ...p, teacherCount: Number(e.target.value) }))} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {/* School ID — highlighted at the top */}
                                <div className="col-span-2">
                                    <p className="text-xs text-muted-foreground mb-1">School ID (required for login)</p>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30">
                                        <span className="text-base font-mono font-bold text-primary tracking-widest select-all">
                                            {(school as unknown as { schoolCode?: string }).schoolCode || '—'}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto py-0.5 px-1.5 text-xs text-muted-foreground hover:text-primary"
                                            onClick={() => {
                                                const code = (school as unknown as { schoolCode?: string }).schoolCode
                                                if (code) {
                                                    navigator.clipboard.writeText(code);
                                                    setCopied(true);
                                                    setTimeout(() => setCopied(false), 2000);
                                                }
                                            }}
                                            title="Copy School ID">
                                            {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : 'Copy'}
                                        </Button>
                                    </div>
                                </div>
                                {[
                                    { label: 'Email', value: school.email },
                                    { label: 'Phone', value: school.phone || '—' },
                                    { label: 'Address', value: school.address || '—' },
                                    { label: 'Country', value: school.country || '—' },
                                    { label: 'Admin Email', value: (school as unknown as { adminEmail?: string }).adminEmail || '—' },
                                    { label: 'Joined', value: formatDate(school.createdAt) },
                                ].map(f => (
                                    <div key={f.label}>
                                        <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                                        <p className="text-sm text-foreground">{f.value}</p>
                                    </div>
                                ))}
                                {school.suspendReason && (
                                    <div className="col-span-2 mt-2 p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                                        <p className="text-xs text-red-500 font-medium">Suspension Reason</p>
                                        <p className="text-sm text-muted-foreground">{school.suspendReason}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Branches Section */}
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-foreground">School Branches</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toast.info('To create a branch, go back to Schools Management and click Add School, then check "This is a Branch School".')}
                                className="gap-1.5 border-blue-500/30 text-blue-500 hover:bg-blue-500/10 hover:text-blue-500">
                                <Plus className="w-3.5 h-3.5" /> Create Branch
                            </Button>
                        </div>
                        {(school as any).parent ? (
                            <div className="mb-4 p-4 rounded-xl border border-border bg-muted/40">
                                <p className="text-xs text-muted-foreground mb-1">This is a branch school. Main School:</p>
                                <Link href={`/schools/${(school as any).parent.id}`} className="text-sm text-blue-500 hover:underline">
                                    {(school as any).parent.name} ({(school as any).parent.schoolCode})
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {(school as any).branchSchools?.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(school as any).branchSchools.map((b: any) => (
                                            <Link href={`/schools/${b.id}`} key={b.id} className="p-3 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 transition-colors flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{b.name}</p>
                                                    <p className="text-xs text-muted-foreground">{b.schoolCode} • {b.status}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No branch schools created yet.</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Admin Access */}
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-foreground">Admin Access</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmAction('resetPassword')}
                                disabled={!adminUser}
                                className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10 hover:text-blue-500 disabled:opacity-50">
                                Reset Password
                            </Button>
                        </div>

                        {adminUser ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Admin Login URL</p>
                                    <a href={adminUser.loginUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline break-all">
                                        {adminUser.loginUrl}
                                    </a>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Admin Email</p>
                                    <p className="text-sm font-mono break-words whitespace-normal text-foreground">{adminUser.email}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No admin account provisioned for this school.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Reset Credentials Dialog */}
                <Dialog open={!!resetCreds} onOpenChange={open => { if (!open) setResetCreds(null) }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-center">Password Reset Successful</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground text-center -mt-2">
                            <strong>Save this password — it will only be shown once!</strong>
                        </p>
                        <div className="space-y-4 my-2">
                            <div>
                                <Label className="block text-xs text-muted-foreground mb-1 border-b border-border pb-1">Email</Label>
                                <p className="text-sm font-medium text-foreground">{resetCreds?.email}</p>
                            </div>
                            <div>
                                <Label className="block text-xs text-muted-foreground mb-1 border-b border-primary/20 pb-1">New Password</Label>
                                <p className="text-lg font-mono font-bold text-primary tracking-wider select-all">{resetCreds?.password}</p>
                            </div>
                        </div>
                        <Button onClick={() => setResetCreds(null)} variant="secondary" className="w-full">
                            I have saved the new password
                        </Button>
                    </DialogContent>
                </Dialog>

                {/* Suspend / Reset password confirmation */}
                <ConfirmDialog
                    open={!!confirmAction}
                    onOpenChange={open => { if (!open) setConfirmAction(null) }}
                    title={confirmAction === 'resetPassword' ? 'Reset the admin password?' : 'Suspend this school?'}
                    confirmLabel={confirmAction === 'resetPassword' ? 'Reset' : 'Suspend'}
                    destructive={confirmAction === 'suspend'}
                    onConfirm={confirmPending}
                />

            </div>
        </div>
    )
}
