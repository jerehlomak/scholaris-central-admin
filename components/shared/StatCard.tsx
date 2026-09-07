'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
    label: string
    value: string | number
    icon: React.ElementType
    color?: string
    subtitle?: string
    delay?: number
}

export default function StatCard({ label, value, icon: Icon, color = '#1E4DA6', subtitle, delay = 0 }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay, ease: 'easeOut' }}
        >
            <Card className="hover:border-primary/30 transition-colors duration-300">
                <CardContent className="p-5 flex items-start gap-4">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}22`, border: `1px solid ${color}44` }}
                    >
                        <Icon className="w-6 h-6" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
