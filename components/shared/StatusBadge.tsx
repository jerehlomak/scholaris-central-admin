import { Badge } from '@/components/ui/badge'
import { STATUS_COLORS, cn } from '@/lib/utils'

interface StatusBadgeProps {
    status: string
    className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
    const colorClasses = STATUS_COLORS[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    return (
        <Badge variant="outline" className={cn(colorClasses, 'font-medium', className)}>
            {status}
        </Badge>
    )
}
