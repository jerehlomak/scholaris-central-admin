// ─── Central Admin Types ─────────────────────────────────────────────────────

export type CentralAdminRole = 'SUPER_ADMIN' | 'SUPPORT'
export type SchoolStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DELETED'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type AnnouncementType = 'INFO' | 'WARNING' | 'MAINTENANCE'

export interface CentralAdmin {
    id: string
    name: string
    email: string
    role: CentralAdminRole
    lastLogin?: string
    createdAt: string
}

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED'
export type BillingCycle = 'MONTHLY' | 'YEARLY'
export type InvoiceStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'FAILED' | 'SENT' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED'
export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'PAYSTACK' | 'FLUTTERWAVE' | 'STRIPE'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
export type DiscountType = 'PERCENTAGE' | 'FIXED'

export interface SubscriptionPlan {
    id: string
    name: string
    description?: string
    monthlyPrice: number
    yearlyPrice: number
    maxStudents: number
    maxTeachers: number
    maxClasses: number
    maxBranches: number
    storageLimit: number
    features: string[]
    isActive: boolean
    trialDays: number
    createdAt: string
    _count?: { schools: number }
}

export interface Coupon {
    id: string
    code: string
    discountType: DiscountType
    discountValue: number
    expiresAt?: string
    usageLimit?: number | null
    usedCount: number
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface Invoice {
    id: string
    schoolId: string
    subscriptionId?: string
    invoiceNumber: string
    title?: string
    amount: number
    currency: string
    taxAmount: number
    discountAmount?: number
    totalAmount: number
    amountPaid?: number
    amountDue?: number
    dueDate: string
    status: InvoiceStatus
    paidFromWallet?: boolean
    createdAt: string
    updatedAt: string
    school?: { name: string; schoolCode?: string }
}

export interface Payment {
    id: string
    invoiceId: string
    schoolId: string
    paymentMethod: PaymentMethod
    amount: number
    currency: string
    transactionId?: string | null
    status: PaymentStatus
    paidAt?: string | null
    createdAt: string
    updatedAt: string
    school?: { name: string }
    invoice?: { invoiceNumber: string }
}

export interface SchoolSubscription {
    id: string
    schoolId: string
    planId: string
    status: SubscriptionStatus
    billingCycle: BillingCycle
    startDate: string
    endDate?: string | null
    trialEnd?: string | null
    nextBillingDate?: string | null
    cancelledAt?: string | null
    suspendedAt?: string | null
    isActive: boolean
    autoRenew: boolean
    amountPaid: number
    currency: string
    createdAt: string
    updatedAt: string
    school?: { name: string; email: string }
    plan?: { name: string }
}

export interface BillingAnalytics {
    mrr: number
    arr: number
    activeSubscriptions: number
    pastDueAccounts: number
    totalSchools: number
}

export interface School {
    id: string
    schoolCode?: string
    name: string
    email: string
    phone?: string
    address?: string
    country?: string
    logoUrl?: string
    status: SchoolStatus
    planId?: string
    studentCount: number
    teacherCount: number
    adminEmail?: string
    suspendedAt?: string
    suspendReason?: string
    createdAt: string
    plan?: { name: string; monthlyPrice: number }
    subscription?: { isActive: boolean; endDate?: string }
}

export interface FeatureFlag {
    permissionId: string
    key: string
    label: string
    module: string
    dashboardType: 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF'
    enabled: boolean
}

export interface Announcement {
    id: string
    title: string
    body: string
    type: AnnouncementType
    targetGroup: string
    isPublished: boolean
    publishedAt?: string
    adminId: string
    createdAt: string
    admin?: { name: string }
}

export interface SupportTicket {
    id: string
    schoolId: string
    subject: string
    description: string
    status: TicketStatus
    priority: TicketPriority
    submittedBy: string
    resolvedAt?: string
    createdAt: string
    school?: { name: string; email: string }
    replies?: TicketReply[]
}

export interface TicketReply {
    id: string
    ticketId: string
    adminId: string
    message: string
    createdAt: string
    admin?: { name: string; email: string }
}

export interface AuditLog {
    id: string
    adminId?: string
    action: string
    entityType?: string
    entityId?: string
    metadata?: Record<string, unknown>
    ipAddress?: string
    createdAt: string
    admin?: { name: string; email: string }
}

export interface PlatformStats {
    totalSchools: number
    activeSchools: number
    suspendedSchools: number
    totalStudents: number
    totalTeachers: number
    totalPlans: number
    monthlyRevenue: number
    openTickets: number
}

export interface MonthlyData {
    month: string
    newSchools: number
    revenue: number
    totalStudents: number
    totalTeachers: number
}

export interface PlatformTransaction {
    id: string
    reference: string
    type: 'INCOME' | 'EXPENSE'
    category: string
    amount: number
    currency: string
    description?: string
    schoolId?: string
    adminId?: string
    date: string
    createdAt: string
    updatedAt: string
    school?: { name: string }
    admin?: { name: string }
}

