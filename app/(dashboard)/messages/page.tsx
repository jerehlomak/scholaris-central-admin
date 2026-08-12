'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import axios from 'axios'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
    MessageSquare, Send, Plus,
    School as SchoolIcon, Lock, Unlock, CheckCheck
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

// Messaging uses a shared (non-central) endpoint, so we use a separate base
const MSG_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1')

function msgApi(method: 'get' | 'post' | 'put', path: string, data?: unknown) {
    // Attach central admin token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('centralAdminToken') : null
    return axios({
        method,
        url: `${MSG_BASE}/messaging${path}`,
        data,
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
}

interface Message {
    id: string
    senderType: 'ADMIN' | 'SCHOOL'
    senderName: string
    content: string
    readAt: string | null
    createdAt: string
}

interface Conversation {
    id: string
    subject: string
    isClosed: boolean
    lastMessageAt: string
    unreadCount: number
    school: { name: string; schoolCode?: string }
    messages: Message[]
}

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConv, setActiveConv] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [schools, setSchools] = useState<Array<{ id: string; name: string; status: string }>>([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [input, setInput] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [newForm, setNewForm] = useState({ schoolId: '', subject: 'General Inquiry', content: '' })
    const bottomRef = useRef<HTMLDivElement>(null)

    const loadConversations = useCallback(async () => {
        setLoading(true)
        try {
            const [convRes, schRes] = await Promise.all([
                msgApi('get', ''),
                api.get('/schools')
            ])
            setConversations(convRes.data.conversations || [])
            setSchools(schRes.data.schools || [])
        } catch { toast.error('Failed to load messages') }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { loadConversations() }, [loadConversations])

    const openConversation = async (conv: Conversation) => {
        setActiveConv(conv)
        try {
            const res = await msgApi('get', `/${conv.id}`)
            setMessages(res.data.messages || [])
            // lower unread badge instantly
            setConversations(prev => prev.map(c =>
                c.id === conv.id ? { ...c, unreadCount: 0 } : c
            ))
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
        } catch { toast.error('Failed to load messages') }
    }

    const sendReply = async () => {
        if (!input.trim() || !activeConv) return
        setSending(true)
        try {
            const res = await msgApi('post', `/${activeConv.id}/reply`, { content: input.trim() })
            setMessages(prev => [...prev, res.data.message])
            setInput('')
            setConversations(prev => prev.map(c =>
                c.id === activeConv.id ? { ...c, lastMessageAt: new Date().toISOString() } : c
            ))
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
        } catch { toast.error('Failed to send') }
        finally { setSending(false) }
    }

    const handleNewConversation = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newForm.schoolId || !newForm.content.trim()) return
        try {
            await msgApi('post', '', newForm)
            toast.success('Conversation started')
            setShowNew(false)
            setNewForm({ schoolId: '', subject: 'General Inquiry', content: '' })
            loadConversations()
        } catch { toast.error('Failed to start conversation') }
    }

    const toggleClose = async (convId: string) => {
        try {
            const res = await msgApi('put', `/${convId}/toggle`)
            setActiveConv(prev => prev ? { ...prev, isClosed: res.data.conversation.isClosed } : null)
            setConversations(prev => prev.map(c =>
                c.id === convId ? { ...c, isClosed: res.data.conversation.isClosed } : c
            ))
        } catch { toast.error('Failed to update') }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header title="Messages" subtitle="Direct communication with schools" />
            <div className="flex-1 flex overflow-hidden p-6 gap-6 max-w-7xl mx-auto w-full">

                {/* Left pane: Conversation list */}
                <Card className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h2 className="font-bold text-foreground flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" /> Conversations
                        </h2>
                        <Button variant="ghost" size="icon" onClick={() => setShowNew(true)}
                            className="h-7 w-7 bg-primary/10 text-primary hover:bg-primary/20">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                        <div className="divide-y divide-border">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : conversations.length === 0 ? (
                                <p className="text-center py-12 text-muted-foreground text-sm">No conversations yet.</p>
                            ) : conversations.map(conv => (
                                <button key={conv.id} onClick={() => openConversation(conv)}
                                    className={`w-full text-left p-4 transition-colors hover:bg-muted/50 ${activeConv?.id === conv.id ? 'bg-primary/10 border-l-2 border-primary' : ''}`}>
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <SchoolIcon className="w-3 h-3 text-secondary flex-shrink-0" />
                                            <span className="text-xs font-semibold text-foreground truncate">
                                                {conv.school?.name || 'Unknown'}
                                            </span>
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <span className="flex-shrink-0 text-[10px] font-bold text-primary-foreground bg-primary rounded-full px-1.5 py-0.5">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-medium text-muted-foreground truncate">{conv.subject}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-[10px] text-muted-foreground/70 truncate max-w-[140px]">
                                            {conv.messages?.[0]?.content || '—'}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground/70 flex-shrink-0">
                                            {formatDate(conv.lastMessageAt)}
                                        </span>
                                    </div>
                                    {conv.isClosed && (
                                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-400">
                                            <Lock className="w-2.5 h-2.5" /> Closed
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Right pane: Message thread */}
                <Card className="flex-1 flex flex-col overflow-hidden">
                    {!activeConv ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                            <MessageSquare className="w-12 h-12 opacity-20" />
                            <p className="text-sm">Select a conversation to view messages</p>
                            <Button onClick={() => setShowNew(true)} className="gap-2 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                                <Plus className="w-4 h-4" /> New Conversation
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Thread header */}
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-foreground">{activeConv.subject}</h3>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <SchoolIcon className="w-3 h-3 text-secondary" />
                                        {activeConv.school?.name}
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => toggleClose(activeConv.id)}
                                    className={`gap-2 text-xs font-semibold ${activeConv.isClosed ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-400'}`}>
                                    {activeConv.isClosed ? <><Unlock className="w-3 h-3" /> Reopen</> : <><Lock className="w-3 h-3" /> Close</>}
                                </Button>
                            </div>

                            {/* Messages scroll area */}
                            <ScrollArea className="flex-1 min-h-0">
                                <div className="p-4 space-y-3">
                                    {messages.map(msg => {
                                        const isAdmin = msg.senderType === 'ADMIN'
                                        return (
                                            <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${isAdmin
                                                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                    : 'bg-muted text-foreground rounded-bl-sm'}`}>
                                                    {!isAdmin && (
                                                        <p className="text-[10px] font-bold text-secondary mb-1">{msg.senderName}</p>
                                                    )}
                                                    <p className="leading-relaxed">{msg.content}</p>
                                                    <div className={`flex items-center gap-1 mt-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                        <span className={`text-[10px] ${isAdmin ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isAdmin && msg.readAt && <CheckCheck className="w-3 h-3 text-primary-foreground/70" />}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={bottomRef} />
                                </div>
                            </ScrollArea>

                            {/* Input box */}
                            {!activeConv.isClosed ? (
                                <div className="p-4 border-t border-border flex items-end gap-3">
                                    <Textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                                        placeholder="Type a message… (Enter to send)"
                                        rows={2}
                                        className="flex-1 resize-none"
                                    />
                                    <Button onClick={sendReply} disabled={sending || !input.trim()} size="icon"
                                        className="bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90 flex-shrink-0">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-4 border-t border-border text-center text-sm text-amber-400">
                                    <Lock className="w-4 h-4 inline mr-1" /> This conversation is closed.
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </div>

            {/* New Conversation Dialog */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>New Conversation</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleNewConversation} className="space-y-4">
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">School *</Label>
                            <Select required value={newForm.schoolId} onValueChange={v => setNewForm(p => ({ ...p, schoolId: v }))}>
                                <SelectTrigger><SelectValue placeholder="-- Select a school --" /></SelectTrigger>
                                <SelectContent>
                                    {schools.filter(s => s.status === 'ACTIVE').map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Subject</Label>
                            <Input type="text" value={newForm.subject}
                                onChange={e => setNewForm(p => ({ ...p, subject: e.target.value }))} />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">First Message *</Label>
                            <Textarea required rows={4} value={newForm.content}
                                onChange={e => setNewForm(p => ({ ...p, content: e.target.value }))}
                                placeholder="Type your message to the school..."
                                className="resize-none" />
                        </div>
                        <DialogFooter className="pt-2 sm:justify-stretch gap-3">
                            <Button type="button" variant="ghost" onClick={() => setShowNew(false)} className="flex-1">Cancel</Button>
                            <Button type="submit" className="flex-1 bg-gradient-to-br from-primary to-secondary text-white hover:opacity-90">
                                Send Message
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
