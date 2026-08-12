'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useMobileMenu } from '@/context/MobileMenuContext'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    LayoutDashboard, School, CreditCard, BarChart3,
    Zap, Megaphone, TicketCheck, ClipboardList, LogOut,
    Shield, ChevronRight, Building2, Receipt, CircleDollarSign,
    FileText, Tag, Wallet, KeyRound, Users, LineChart, MessageSquare, TrendingUp
} from 'lucide-react'

export const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Branches', href: '/groups', icon: Building2 },
    { label: 'Schools', href: '/schools', icon: School },
    { label: 'School Leads', href: '/leads', icon: TrendingUp },
    { label: 'Billing Overview', href: '/billing', icon: Wallet },
    { label: 'Plans', href: '/billing/plans', icon: CreditCard },
    { label: 'Subscriptions', href: '/billing/subscriptions', icon: FileText },
    { label: 'Invoices', href: '/billing/invoices', icon: Receipt },
    { label: 'Payments', href: '/billing/payments', icon: CircleDollarSign },
    { label: 'Coupons', href: '/billing/coupons', icon: Tag },
    { label: 'Company Ledger', href: '/ledger', icon: LineChart },
    { label: 'PIN Manager', href: '/pins', icon: KeyRound },
    { label: 'Applications', href: '/applications', icon: ClipboardList },
    { label: 'Messages', href: '/messages', icon: MessageSquare },
    { label: 'Company Staff', href: '/staff', icon: Users },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Financial Analytics', href: '/analytics/financials', icon: TrendingUp },
    { label: 'Features', href: '/features', icon: Zap },
    { label: 'Announcements', href: '/announcements', icon: Megaphone },
    { label: 'Support Tickets', href: '/tickets', icon: TicketCheck },
    { label: 'Audit Logs', href: '/audit-logs', icon: ClipboardList },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname()
    const { admin, logout } = useAuth()

    const activeItem = navItems.reduce((best, item) => {
        if (pathname === item.href || pathname.startsWith(item.href + '/')) {
            if (!best || item.href.length > best.href.length) {
                return item
            }
        }
        return best
    }, null as typeof navItems[0] | null)

    return (
        <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary to-secondary">
                    <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="text-sm font-bold text-foreground">Skooly</p>
                    <p className="text-xs text-muted-foreground">Central Admin</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map(({ label, href, icon: Icon }) => {
                    const isActive = activeItem?.href === href
                    return (
                        <Link key={href} href={href}
                            onClick={onNavigate}
                            className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group"
                        >
                            {isActive && (
                                <motion.span
                                    layoutId="sidebar-active-pill"
                                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/10 border-l-2 border-primary"
                                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                />
                            )}
                            <Icon className={cn(
                                'relative w-4 h-4 flex-shrink-0',
                                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground transition-colors'
                            )} />
                            <span className={cn(
                                'relative flex-1',
                                isActive ? 'text-primary' : 'text-sidebar-foreground group-hover:text-foreground transition-colors'
                            )}>{label}</span>
                            {isActive && <ChevronRight className="relative w-3 h-3 text-primary" />}
                        </Link>
                    )
                })}
            </nav>

            {/* Admin info + logout */}
            <div className="px-4 py-4 border-t border-sidebar-border">
                <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm font-bold">
                            {admin?.name?.[0] || 'A'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">{admin?.name || 'Admin'}</p>
                        <p className="text-xs truncate text-muted-foreground">{admin?.role || 'SUPER_ADMIN'}</p>
                    </div>
                </div>
                <Button variant="ghost" onClick={logout}
                    className="w-full justify-start gap-2 px-3 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                    <LogOut className="w-4 h-4" />
                    Sign out
                </Button>
            </div>
        </div>
    )
}

export default function Sidebar() {
    const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu()

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col z-50 border-r border-sidebar-border">
                <SidebarNav />
            </aside>

            {/* Mobile sidebar */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border [&>button]:text-sidebar-foreground">
                    <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                    <SidebarNav onNavigate={() => setIsMobileMenuOpen(false)} />
                </SheetContent>
            </Sheet>
        </>
    )
}
