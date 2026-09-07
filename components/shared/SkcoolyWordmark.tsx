/**
 * SkcoolyWordmark.tsx — text-only logo mark for Central Admin.
 *
 * Mirrors client/src/components/shared/SkcoolyWordmark.tsx (same navy/gold
 * treatment) so the two apps read as one brand — this is its own component
 * rather than a shared import because the two are separate repos (Vite/React
 * vs Next.js). public/logo.png is the old Skcooly Plus mark — wrong colors
 * (blue/green, not navy/gold) and "SKCOOLY PLUS" baked into the image — so
 * this replaces it on every auth page. Placeholder until a real designed
 * logo exists; don't build further on top of it.
 */
const NAVY = '#15316B'
const GOLD = '#F5B800'

export function SkcoolyWordmark({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
    const textSize = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl'
    const barWidth = size === 'lg' ? 'w-10' : size === 'sm' ? 'w-6' : 'w-8'

    return (
        <div className={`inline-flex flex-col items-center ${className}`}>
            <span className={`font-extrabold tracking-tight leading-none ${textSize}`} style={{ color: NAVY }}>
                Skcooly
            </span>
            <span className={`h-[3px] ${barWidth} mt-1.5 rounded-full`} style={{ backgroundColor: GOLD }} />
        </div>
    )
}
