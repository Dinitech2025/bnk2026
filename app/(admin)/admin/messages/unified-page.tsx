'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Plus,
  Search,
  Filter,
  Send,
  Loader2,
  RefreshCw,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  User,
  Check,
  CheckCheck,
  Pencil,
  Quote,
  ShoppingBag,
  Star,
  TrendingUp,
  FileText,
  Package
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

interface UnifiedMessage {
  id: string
  subject: string
  content: string
  type: string
  priority: string
  status: string
  sentAt: string
  createdAt: string
  fromUserId: string
  toUserId: string
  clientEmail?: string | null
  clientName?: string | null
  conversationId?: string | null
  readAt?: string | null
  source: 'MESSAGE' | 'QUOTE'
  relatedQuoteId?: string | null
  quoteStatus?: string | null
  productName?: string | null
  serviceName?: string | null
}

interface UnifiedConversation {
  id: string
  clientName: string
  clientEmail: string
  messages: UnifiedMessage[]
  lastMessage: UnifiedMessage
  lastMessageAt: string
  unreadCount: number
  type: 'MESSAGE' | 'QUOTE' | 'MIXED'
  relatedQuoteId?: string | null
  quoteStatus?: string | null
}

interface Stats {
  totalConversations: number
  messageConversations: number
  quoteConversations: number
  mixedConversations: number
  unreadCount: number
}

const MESSAGE_TYPES = {
  GENERAL: 'Général',
  SUPPORT: 'Support',
  ORDER: 'Commande',
  SUBSCRIPTION: 'Abonnement',
  PAYMENT: 'Paiement',
  QUOTE: 'Devis',
  CUSTOM: 'Personnalisé',
}

const MESSAGE_PRIORITIES = {
  LOW: { label: 'Basse', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  HIGH: { label: 'Haute', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  URGENT: { label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-200' },
}

const QUOTE_STATUSES = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  NEGOTIATING: { label: 'En négociation', color: 'bg-blue-100 text-blue-700' },
  PRICE_PROPOSED: { label: 'Prix proposé', color: 'bg-purple-100 text-purple-700' },
  ACCEPTED: { label: 'Accepté', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejeté', color: 'bg-red-100 text-red-700' },
}

export default function UnifiedMessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<UnifiedConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    search: '',
  })

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom()
    }
  }, [selectedConversation?.messages])

  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/messages/unified?limit=100')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
        setStats(data.stats)

        // Si une conversation est sélectionnée, la mettre à jour
        if (selectedConversation) {
          const updatedConversation = data.conversations.find(
            (c: UnifiedConversation) => c.id === selectedConversation.id
          )
          if (updatedConversation) {
            setSelectedConversation(updatedConversation)
          }
        }
      } else {
        toast.error('Erreur lors du chargement des conversations')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    
    // Actualiser toutes les 30 secondes
    const interval = setInterval(fetchConversations, 30000)
    return () => clearInterval(interval)
  }, [])

  const sendReply = async () => {
    if (!selectedConversation || !replyMessage.trim()) return

    setIsSending(true)
    try {
      const response = await fetch('/api/admin/messages/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: replyMessage.trim(),
          type: selectedConversation.type === 'QUOTE' ? 'QUOTE' : 'GENERAL',
          relatedQuoteId: selectedConversation.relatedQuoteId,
        }),
      })

      if (response.ok) {
        setReplyMessage('')
        await fetchConversations()
        toast.success('Message envoyé')
      } else {
        toast.error('Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur de connexion')
    } finally {
      setIsSending(false)
    }
  }

  const getConversationIcon = (conversation: UnifiedConversation) => {
    switch (conversation.type) {
      case 'QUOTE':
        return <Quote className="h-4 w-4 text-purple-500" />
      case 'MESSAGE':
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'MIXED':
        return <FileText className="h-4 w-4 text-indigo-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getMessageIcon = (message: UnifiedMessage) => {
    if (message.source === 'QUOTE') {
      if (message.productName) {
        return <ShoppingBag className="h-3 w-3 text-purple-500" />
      } else if (message.serviceName) {
        return <Star className="h-3 w-3 text-purple-500" />
      }
      return <Quote className="h-3 w-3 text-purple-500" />
    }
    return <MessageSquare className="h-3 w-3 text-blue-500" />
  }

  const filteredConversations = conversations.filter(conversation => {
    if (filters.type !== 'all' && conversation.type !== filters.type.toUpperCase()) return false
    if (filters.search && !conversation.clientName.toLowerCase().includes(filters.search.toLowerCase()) && 
        !conversation.clientEmail.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-[1800px] mx-auto p-6">
        {/* Header avec statistiques */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Messages & Conversations</h1>
              <p className="text-sm text-slate-500">
                Gestion unifiée des messages et conversations de devis
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={fetchConversations}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="rounded-xl"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              
              <Button
                onClick={() => router.push('/admin/messages/new')}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau message
              </Button>
            </div>
          </div>

          {/* Statistiques */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalConversations}</p>
                    <p className="text-xs text-blue-600">Total conversations</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3">
                  <Quote className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold text-purple-900">{stats.quoteConversations}</p>
                    <p className="text-xs text-purple-600">Conversations devis</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <Mail className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">{stats.messageConversations}</p>
                    <p className="text-xs text-green-600">Messages classiques</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-200">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-indigo-500" />
                  <div>
                    <p className="text-2xl font-bold text-indigo-900">{stats.mixedConversations}</p>
                    <p className="text-xs text-indigo-600">Conversations mixtes</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl border border-red-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-red-900">{stats.unreadCount}</p>
                    <p className="text-xs text-red-600">Non lus</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des conversations */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm border-slate-200 rounded-2xl overflow-hidden h-[700px]">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-100">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-slate-600" />
                  Conversations ({filteredConversations.length})
                </CardTitle>
                
                {/* Filtres */}
                <div className="space-y-3 mt-4">
                  <Input
                    placeholder="Rechercher un client..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="rounded-xl border-slate-200"
                  />
                  
                  <Select
                    value={filters.type}
                    onValueChange={(value) => setFilters({ ...filters, type: value })}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Type de conversation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="message">Messages</SelectItem>
                      <SelectItem value="quote">Devis</SelectItem>
                      <SelectItem value="mixed">Mixtes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="overflow-y-auto h-[500px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-500">
                      <MessageSquare className="h-8 w-8 mr-2" />
                      Aucune conversation
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-slate-200 text-slate-600 font-medium">
                              {conversation.clientName[0]?.toUpperCase() || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-900 truncate">
                                  {conversation.clientName}
                                </p>
                                {getConversationIcon(conversation)}
                              </div>
                              
                              <div className="flex items-center gap-1">
                                {conversation.unreadCount > 0 && (
                                  <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                                <span className="text-xs text-slate-400">
                                  {format(new Date(conversation.lastMessageAt), 'HH:mm')}
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-sm text-slate-600 truncate mb-2">
                              {conversation.lastMessage.content}
                            </p>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {MESSAGE_TYPES[conversation.lastMessage.type as keyof typeof MESSAGE_TYPES] || conversation.lastMessage.type}
                              </Badge>
                              
                              {conversation.quoteStatus && (
                                <Badge className={`text-xs ${QUOTE_STATUSES[conversation.quoteStatus as keyof typeof QUOTE_STATUSES]?.color || 'bg-gray-100 text-gray-700'}`}>
                                  {QUOTE_STATUSES[conversation.quoteStatus as keyof typeof QUOTE_STATUSES]?.label || conversation.quoteStatus}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Zone de conversation */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="bg-white shadow-sm border-slate-200 rounded-2xl overflow-hidden h-[700px]">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
                          {selectedConversation.clientName[0]?.toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {selectedConversation.clientName}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {selectedConversation.clientEmail}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getConversationIcon(selectedConversation)}
                      
                      {selectedConversation.relatedQuoteId && (
                        <Button
                          onClick={() => router.push(`/admin/quotes/${selectedConversation.relatedQuoteId}`)}
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                        >
                          <Quote className="h-4 w-4 mr-2" />
                          Voir le devis
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0 flex flex-col h-[580px]">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/50 to-white">
                    {selectedConversation.messages.map((message, index) => {
                      const isFromAdmin = message.fromUserId !== selectedConversation.messages[0]?.toUserId
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isFromAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isFromAdmin ? 'order-2' : 'order-1'}`}>
                            <div className={`flex items-start gap-3 ${isFromAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                              {/* Avatar */}
                              <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
                                <AvatarFallback className={`text-xs font-medium ${
                                  isFromAdmin 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {isFromAdmin ? 'AD' : (selectedConversation.clientName[0] || 'C')}
                                </AvatarFallback>
                              </Avatar>
                              
                              {/* Message bubble */}
                              <div className={`space-y-1 ${isFromAdmin ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block p-3 rounded-2xl shadow-sm ${
                                  isFromAdmin
                                    ? 'bg-blue-500 text-white rounded-br-md'
                                    : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                                }`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    {getMessageIcon(message)}
                                    {message.source === 'QUOTE' && (
                                      <span className="text-xs opacity-75">
                                        {message.productName || message.serviceName || 'Devis'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm leading-relaxed">{message.content}</p>
                                </div>
                                
                                <div className={`flex items-center gap-2 text-xs text-slate-400 ${
                                  isFromAdmin ? 'justify-end' : 'justify-start'
                                }`}>
                                  <span>
                                    {format(new Date(message.sentAt), 'dd/MM à HH:mm')}
                                  </span>
                                  
                                  {message.source === 'QUOTE' && message.quoteStatus && (
                                    <>
                                      <span>•</span>
                                      <Badge className={`text-xs ${QUOTE_STATUSES[message.quoteStatus as keyof typeof QUOTE_STATUSES]?.color || 'bg-gray-100 text-gray-700'}`}>
                                        {QUOTE_STATUSES[message.quoteStatus as keyof typeof QUOTE_STATUSES]?.label || message.quoteStatus}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Zone de saisie */}
                  <div className="p-4 border-t border-slate-100 bg-white">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <Textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Tapez votre réponse..."
                          className="resize-none rounded-xl border-slate-200 focus:border-blue-400 pr-12"
                          rows={2}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              sendReply()
                            }
                          }}
                        />
                      </div>
                      <Button
                        onClick={sendReply}
                        disabled={isSending || !replyMessage.trim()}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6 self-end"
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white shadow-sm border-slate-200 rounded-2xl overflow-hidden h-[700px]">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <MessageSquare className="h-16 w-16 mx-auto text-slate-300" />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-600">
                        Sélectionnez une conversation
                      </h3>
                      <p className="text-sm text-slate-400">
                        Choisissez une conversation dans la liste pour commencer à discuter
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



