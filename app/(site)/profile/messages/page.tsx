'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MessageSquare, 
  Clock, 
  CheckCheck, 
  AlertCircle,
  RefreshCw,
  Mail,
  User,
  Calendar,
  Search,
  Filter,
  Star,
  ShoppingBag,
  FileText,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import { EnhancedMessageInput } from '@/components/client/enhanced-message-input'
import { EnhancedQuoteMessageCard } from '@/components/client/enhanced-quote-message-card'

interface Message {
  id: string
  content: string
  sentAt: string
  isAdminReply: boolean
  isSystemMessage?: boolean
  sender?: {
    name?: string
    email: string
    role: string
  }
}

interface Conversation {
  id: string
  type: 'MESSAGE' | 'QUOTE' | 'MIXED'
  subject: string
  lastMessage: string
  lastMessageAt: string
  messages: Message[]
  unreadCount: number
  relatedQuoteId?: string
  quoteData?: {
    id: string
    status: string
    negotiationType: string
    proposedPrice?: number
    finalPrice?: number
    service?: {
      id: string
      name: string
      slug: string
      price?: number
      images?: Array<{ path: string; alt?: string }>
    }
    product?: {
      id: string
      name: string
      slug: string
      price?: number
      images?: Array<{ path: string; alt?: string }>
    }
  }
}

export default function ClientMessagesPage() {
  const { data: session, status } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Charger les conversations au montage du composant
  useEffect(() => {
    fetchConversations()
  }, [])

  // Sauvegarder la conversation sélectionnée dans localStorage
  useEffect(() => {
    if (selectedConversation) {
      localStorage.setItem('selectedConversationId', selectedConversation.id)
    }
  }, [selectedConversation])

  // Restaurer la conversation sélectionnée après chargement des conversations
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      const savedConversationId = localStorage.getItem('selectedConversationId')
      if (savedConversationId) {
        const savedConversation = conversations.find(conv => conv.id === savedConversationId)
        if (savedConversation) {
          setSelectedConversation(savedConversation)
        } else {
          // Si la conversation sauvegardée n'existe plus, sélectionner la première
          setSelectedConversation(conversations[0])
        }
      } else {
        // Première visite, sélectionner la première conversation
        setSelectedConversation(conversations[0])
      }
    }
  }, [conversations, selectedConversation])

  // Filtrer les conversations
  useEffect(() => {
    let filtered = [...conversations]

    // Filtre par terme de recherche
    if (searchTerm.trim()) {
      filtered = filtered.filter(conv => 
        conv.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par type
    if (filterType !== 'all') {
      filtered = filtered.filter(conv => conv.type === filterType)
    }

    // Filtre par statut (pour les devis)
    if (filterStatus !== 'all') {
      filtered = filtered.filter(conv => 
        conv.quoteData?.status === filterStatus
      )
    }

    setFilteredConversations(filtered)
  }, [conversations, searchTerm, filterType, filterStatus])

  // Récupérer les conversations
  const fetchConversations = async (showLoader = true) => {
    if (showLoader) setLoading(true)
    else setRefreshing(true)
    
    try {
      const response = await fetch('/api/profile/messages')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
        
        // Si une conversation est sélectionnée, la mettre à jour
        if (selectedConversation) {
          const updated = data.conversations.find((c: Conversation) => c.id === selectedConversation.id)
          if (updated) {
            setSelectedConversation(updated)
          } else {
            // Si la conversation n'existe plus, effacer la sélection
            setSelectedConversation(null)
            localStorage.removeItem('selectedConversationId')
          }
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des messages')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Traduire les statuts
  const translateStatus = (status: string) => {
    const translations: { [key: string]: string } = {
      'PENDING': 'En attente',
      'NEGOTIATING': 'En négociation',
      'ACCEPTED': 'Accepté',
      'REJECTED': 'Refusé',
      'COMPLETED': 'Terminé',
      'CANCELLED': 'Annulé',
      'PRICE_PROPOSED': 'Prix proposé',
      'QUOTE_REQUESTED': 'Devis demandé',
      'UNDER_REVIEW': 'En cours d\'examen',
      'APPROVED': 'Approuvé',
      'DECLINED': 'Décliné'
    }
    return translations[status] || status
  }

  // Traduire les types de conversation
  const translateType = (type: string) => {
    const translations: { [key: string]: string } = {
      'MESSAGE': 'Message',
      'QUOTE': 'Devis',
      'MIXED': 'Mixte'
    }
    return translations[type] || type
  }

  // Marquer une conversation comme lue
  const markAsRead = async (conversationId: string) => {
    try {
      if (conversationId === 'messages-general') {
        // Marquer les messages généraux comme lus
        await fetch('/api/profile/messages/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId })
        })
        
        // Actualiser les conversations pour mettre à jour les compteurs
        await fetchConversations(false)
      }
      // Pour les devis, le marquage comme lu est temporairement désactivé
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error)
    }
  }

  // Envoyer un message
  const sendMessage = async (message: string, files?: any[]) => {
    if (!message.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const endpoint = selectedConversation.type === 'QUOTE' && selectedConversation.relatedQuoteId
        ? `/api/quotes/${selectedConversation.relatedQuoteId}/messages`
        : '/api/profile/messages'

      console.log('📤 Envoi de message:', { endpoint, message, conversationId: selectedConversation.id })

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: message.trim(),
          conversationId: selectedConversation.id,
          attachments: files ? files.map(f => f.file.name) : []
        })
      })

      const data = await response.json()
      console.log('📥 Réponse API:', { status: response.status, data })

      if (response.ok) {
        setNewMessage('') // Vider le champ de saisie
        await fetchConversations(false)
        toast.success('Message envoyé')
      } else {
        console.error('❌ Erreur API:', data)
        toast.error(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi:', error)
      toast.error('Erreur de connexion')
    } finally {
      setSending(false)
    }
  }

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Hier'
    } else if (days < 7) {
      return `Il y a ${days} jours`
    } else {
      return date.toLocaleDateString('fr-FR')
    }
  }

  // Obtenir l'icône selon le type de conversation
  const getConversationIcon = (conversation: Conversation) => {
    switch (conversation.type) {
      case 'QUOTE':
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'MESSAGE':
        return <Mail className="h-4 w-4 text-green-500" />
      case 'MIXED':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  // Obtenir l'image du produit/service
  const getItemImage = (quoteData: any) => {
    const item = quoteData?.service || quoteData?.product
    if (item?.images && item.images.length > 0) {
      return item.images[0].path
    }
    return null
  }

  // Redirection si non connecté
  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Chargement...</div>
  }

  if (!session) {
    redirect('/login')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">Vos conversations avec l'équipe BoutikNaka</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Liste des conversations */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchConversations(false)}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            {/* Barre de recherche */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtres */}
            <div className="flex gap-2 mb-3">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="MESSAGE">Messages</SelectItem>
                  <SelectItem value="QUOTE">Devis</SelectItem>
                  <SelectItem value="MIXED">Mixtes</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="NEGOTIATING">En négociation</SelectItem>
                  <SelectItem value="ACCEPTED">Accepté</SelectItem>
                  <SelectItem value="REJECTED">Refusé</SelectItem>
                  <SelectItem value="PRICE_PROPOSED">Prix proposé</SelectItem>
                  <SelectItem value="QUOTE_REQUESTED">Devis demandé</SelectItem>
                  <SelectItem value="COMPLETED">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Statistiques */}
            <div className="flex gap-2 text-xs text-gray-500 mb-3">
              <span>{filteredConversations.length} conversation(s)</span>
              {searchTerm && <span>• Recherche: "{searchTerm}"</span>}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="space-y-1 max-h-[420px] overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>
                    {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                      ? 'Aucune conversation trouvée' 
                      : 'Aucune conversation'
                    }
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-l-4 transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-blue-50 border-l-blue-500'
                        : conversation.unreadCount > 0
                        ? 'border-l-orange-400 bg-orange-50/30'
                        : 'border-l-transparent'
                    }`}
                    onClick={() => {
                      setSelectedConversation(conversation)
                      if (conversation.unreadCount > 0) {
                        markAsRead(conversation.id)
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getConversationIcon(conversation)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm truncate ${
                            conversation.unreadCount > 0 ? 'font-bold' : 'font-medium'
                          }`}>
                            {conversation.subject}
                          </h4>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mb-1">
                          {conversation.lastMessage}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(conversation.lastMessageAt)}</span>
                          <Badge variant="outline" className="text-xs">
                            {translateType(conversation.type)}
                          </Badge>
                          {conversation.quoteData && (
                            <Badge 
                              variant={conversation.quoteData.status === 'ACCEPTED' ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {translateStatus(conversation.quoteData.status)}
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

        {/* Zone de conversation */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {getConversationIcon(selectedConversation)}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{selectedConversation.subject}</CardTitle>
                    <p className="text-sm text-gray-500">
                      Conversation {selectedConversation.type.toLowerCase()}
                    </p>
                  </div>
                  {selectedConversation.quoteData && (
                    <Badge variant="outline">
                      {selectedConversation.quoteData.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0 flex flex-col h-[580px]">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/50 to-white">
                  {selectedConversation.messages.map((message, index) => {
                    const isFromAdmin = message.isAdminReply
                    const isFromClient = !message.isAdminReply
                    const isSystemMessage = message.isSystemMessage || false
                    const isCounterProposal = message.content?.includes('💰 Nouvelle proposition de prix:') || false
                    const isInitialQuoteMessage = index === 0 && selectedConversation.type === 'QUOTE' && selectedConversation.quoteData

                    // Affichage enrichi pour le message initial de devis
                    if (isInitialQuoteMessage && selectedConversation.quoteData) {
                      return (
                        <EnhancedQuoteMessageCard
                          key={message.id}
                          quote={selectedConversation.quoteData}
                          sentAt={message.sentAt}
                          compact={false}
                        />
                      )
                    }

                    // Affichage normal pour les autres messages
                    return (
                      <div key={message.id} className={`flex ${isFromClient ? 'justify-end' : 'justify-start'} mb-2`}>
                        <div className={`max-w-[70%] ${isFromClient ? 'order-2' : 'order-1'}`}>
                          <div className={`flex items-start gap-3 ${isFromClient ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
                              <AvatarFallback className={`text-xs font-medium ${
                                isFromClient 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-slate-200 text-slate-600'
                              }`}>
                                {isFromClient ? (session.user?.name?.[0] || 'C') : 'EQ'}
                              </AvatarFallback>
                            </Avatar>
                            
                            {/* Message bubble */}
                            <div className={`space-y-1 ${isFromClient ? 'text-right' : 'text-left'}`}>
                              <div className={`inline-block p-3 rounded-2xl shadow-sm ${
                                isCounterProposal
                                  ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 text-orange-800'
                                  : isSystemMessage
                                  ? 'bg-green-50 border border-green-200 text-green-800'
                                  : isFromClient
                                  ? 'bg-blue-500 text-white rounded-br-md'
                                  : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  {isCounterProposal && (
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                      💰 Proposition
                                    </span>
                                  )}
                                  {isSystemMessage && !isCounterProposal && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                      Système
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm leading-relaxed">{message.content}</p>
                              </div>
                              
                              <div className={`flex items-center gap-2 text-xs text-slate-400 ${
                                isFromClient ? 'justify-end' : 'justify-start'
                              }`}>
                                <span>{formatDate(message.sentAt)}</span>
                                <CheckCheck className="h-3 w-3" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Zone de saisie améliorée */}
                <div className="p-4 border-t border-slate-100 bg-white">
                  <EnhancedMessageInput
                    value={newMessage}
                    onChange={setNewMessage}
                    onSend={sendMessage}
                    disabled={sending}
                    placeholder="Tapez votre message... (Shift+Entrée pour nouvelle ligne)"
                  />
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Sélectionnez une conversation</h3>
                <p>Choisissez une conversation dans la liste pour commencer à échanger</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
