'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { School, FeatureFlag } from '@/types'
import { Zap, Search, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/shared/StatusBadge'

export default function FeaturesPage() {
    const [schools, setSchools] = useState<School[]>([])
    const [selected, setSelected] = useState<School | null>(null)
    const [flags, setFlags] = useState<FeatureFlag[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

    useEffect(() => {
        api.get('/schools?limit=100').then(r => setSchools(r.data.schools))
    }, [])

    const selectSchool = async (school: School) => {
        setSelected(school)
        setLoading(true)
        try {
            const r = await api.get(`/features/${school.id}`)
            const loaded: FeatureFlag[] = r.data.flags
            setFlags(loaded)
            // Expand only the first module that has at least one enabled item
            const firstEnabled = loaded.find(f => f.enabled)?.module
            const initialExpanded = new Set<string>()
            if (firstEnabled) initialExpanded.add(firstEnabled)
            setExpandedModules(initialExpanded)
        } catch { toast.error('Failed to load menu subscriptions') }
        finally { setLoading(false) }
    }

    const toggle = async (permissionId: string, enabled: boolean) => {
        if (!selected) return
        setFlags(prev => prev.map(f => f.permissionId === permissionId ? { ...f, enabled } : f))
        try {
            await api.post(`/features/${selected.id}`, { permissionId, enabled })
        } catch {
            setFlags(prev => prev.map(f => f.permissionId === permissionId ? { ...f, enabled: !enabled } : f))
            toast.error('Failed to update subscription')
        }
    }

    const toggleModule = (moduleName: string) => {
        setExpandedModules(prev => {
            const next = new Set<string>()
            if (!prev.has(moduleName)) next.add(moduleName)
            return next
        })
    }

    const grouped = useMemo(() => {
        const map = new Map<string, FeatureFlag[]>()
        for (const f of flags) {
            if (!map.has(f.module)) map.set(f.module, [])
            map.get(f.module)!.push(f)
        }
        return Array.from(map.entries())
    }, [flags])

    const filtered = schools.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Menu Subscriptions" subtitle="Control which sidebar menus & submenus a school is subscribed to" />
            <div className="p-6 flex flex-col md:flex-row gap-5 h-full lg:h-[calc(100vh-4rem)]">

                {/* School list */}
                <Card className="w-full md:w-72 flex flex-col overflow-hidden flex-shrink-0">
                    <div className="p-4 border-b border-border">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border">
                            <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <Input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search schools…"
                                className="border-0 bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 text-xs" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-border">
                        {filtered.map(s => (
                            <button key={s.id} onClick={() => selectSchool(s)}
                                className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors ${selected?.id === s.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}>
                                <p className="text-sm font-medium truncate text-foreground">{s.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Menu subscription panel */}
                <Card className="flex-1 flex flex-col overflow-hidden">
                    {!selected ? (
                        <div className="flex-1 flex p-4 flex-col items-center justify-center gap-3 text-muted-foreground">
                            <Zap className="w-10 h-10 opacity-30" />
                            <p className="text-sm">Select a school to manage its menu subscriptions</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">{selected.name}</h3>
                                    <p className="text-xs text-muted-foreground">{selected.email}</p>
                                </div>
                                <StatusBadge status={selected.status} />
                            </div>

                            {loading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                                    {grouped.map(([moduleName, items], i) => {
                                        const enabledCount = items.filter(it => it.enabled).length
                                        const isExpanded = expandedModules.has(moduleName)
                                        return (
                                            <motion.div
                                                key={moduleName}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                                                className="rounded-xl border border-border overflow-hidden"
                                            >
                                                <button
                                                    onClick={() => toggleModule(moduleName)}
                                                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                                                        <span className="text-sm font-medium text-foreground">{moduleName}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{enabledCount}/{items.length} subscribed</span>
                                                </button>
                                                <AnimatePresence initial={false}>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 pt-1">
                                                                {items.map(it => (
                                                                    <div key={it.permissionId}
                                                                        className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-background">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className={cn('w-1.5 h-1.5 rounded-full', it.enabled ? 'bg-emerald-400' : 'bg-muted-foreground/40')} />
                                                                            <p className="text-xs text-foreground">{it.label}</p>
                                                                        </div>
                                                                        <Switch checked={it.enabled} onCheckedChange={checked => toggle(it.permissionId, checked)} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </div>
        </div>
    )
}
