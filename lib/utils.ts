import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'NGN') {
    return new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', { style: 'currency', currency }).format(amount)
}

export function formatDate(date: string | Date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date) {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return formatDate(date)
}

export const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    SUSPENDED: 'bg-red-500/20 text-red-400 border-red-500/30',
    PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    DELETED: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    OPEN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    IN_PROGRESS: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    RESOLVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    CLOSED: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    MEDIUM: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
}
