import { ReactNode } from 'react'

interface PageHeaderProps {
    title: string
    subtitle?: string
    actions?: ReactNode
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div>
                <h2 className="text-xl font-bold text-foreground">{title}</h2>
                {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    )
}
