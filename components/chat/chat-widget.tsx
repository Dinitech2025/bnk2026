'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MessageCircle, X, Minimize2, Maximize2, Image as ImageIcon, File, Video,
  Paperclip, Smile, Quote, CheckCheck, Check, Loader2, ExternalLink, ChevronDown, Package
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MediaFile {
  file: File
  preview: string
  type: 'image' | 'video' | 'file'
}

interface Message {
  id: string
  content: string
  sentAt: string
  isFromClient: boolean
  attachments?: string[]
  relatedQuoteId?: string | null
}

interface Quote {
  id: string
  subject: string
  status: string
  createdAt: string
  product?: {
    name: string
    images?: Array<{ path: string }>
  }
  service?: {
    name: string
    images?: Array<{ path: string }>
  }
  quoteData?: any
}

interface Order {
  id: string
  orderNumber: string
  status: string
  createdAt: string
  total: number
}

export function ChatWidget() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [activeTab, setActiveTab] = useState<'messages' | 'quotes' | 'orders'>('messages')
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)
  const lastMessageIdRef = useRef<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [attachedFiles, setAttachedFiles] = useState<MediaFile[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [guestEmail, setGuestEmail] = useState<string | null>(null)

  const popularEmojis = ['😊', '👍', '❤️', '😂', '🎉', '👏', '🙏', '💯', '🔥', '✨', '👋', '💪']

  // Générer ou récupérer l'email invité
  useEffect(() => {
    if (!session?.user) {
      let email = localStorage.getItem('guestChatEmail')
      if (!email) {
        email = `guest_${Date.now()}@temp.com`
        localStorage.setItem('guestChatEmail', email)
      }
      setGuestEmail(email)
    }
  }, [session?.user])

  // Cacher le widget sur certaines pages
  const shouldHideWidget = pathname?.startsWith('/admin') || pathname?.startsWith('/auth')

  if (shouldHideWidget) {
    return null
  }

  // Fermeture du sélecteur d'émojis au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Charger les messages pour les invités
  useEffect(() => {
    if (session?.user || !guestEmail || !isOpen) return

    const loadGuestMessages = async () => {
      try {
        const response = await fetch(`/api/public/messages?clientEmail=${encodeURIComponent(guestEmail)}`, { 
          cache: 'no-store' 
        })
        if (response.ok) {
          const data = await response.json()
          const loadedMessages = data.messages?.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            sentAt: msg.sentAt,
            isFromClient: msg.isFromClient,
            attachments: msg.attachments || []
          })) || []
          setMessages(loadedMessages)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des messages invité:', error)
      }
    }

    loadGuestMessages()
    const interval = setInterval(loadGuestMessages, 5000)
    return () => clearInterval(interval)
  }, [session?.user, guestEmail, isOpen])

  // Charger le nombre de messages non lus
  useEffect(() => {
    if (!session?.user) return

    const loadUnreadCount = async () => {
      try {
        const response = await fetch('/api/profile/messages', { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          const generalConv = data.conversations?.find((c: any) => c.id === 'messages-general')
          setUnreadCount(generalConv?.unreadCount || 0)
        }
      } catch (error) {
        console.error('Erreur lors du chargement du nombre de messages non lus:', error)
      }
    }

    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [session?.user])

  // Charger les conversations au clic (optimisé)
  useEffect(() => {
    if (!isOpen || !session?.user) return

    const loadConversations = async () => {
      setIsLoadingConversations(true)
      try {
        const response = await fetch('/api/profile/messages', { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          const conversations = data.conversations || []
          const generalConversation = conversations.find((conv: any) => conv.id === 'messages-general')
          
          setConversationId('messages-general')
          
          if (generalConversation && generalConversation.messages.length > 0) {
            const loadedMessages = generalConversation.messages.map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              sentAt: msg.sentAt,
              isFromClient: msg.isFromCurrentUser === true, // Message de l'utilisateur actuel (aligné à droite)
              attachments: msg.attachments || [],
              relatedQuoteId: msg.relatedQuoteId || null
            }))
            setMessages(loadedMessages)
            setLastMessageId(loadedMessages[loadedMessages.length - 1]?.id || null)
            lastMessageIdRef.current = loadedMessages[loadedMessages.length - 1]?.id || null
            setUnreadCount(generalConversation.unreadCount || 0)
          } else {
            setMessages([])
            setLastMessageId(null)
            lastMessageIdRef.current = null
            setUnreadCount(0)
          }

          // Charger TOUS les devis
          const quoteConversations = conversations.filter((conv: any) => conv.type === 'QUOTE')
          const allQuotes = quoteConversations.map((conv: any) => ({
            id: conv.id,
            subject: conv.subject || `Devis: ${conv.quoteData?.product?.name || conv.quoteData?.service?.name || 'Article'}`,
            status: conv.quoteStatus || 'PENDING',
            createdAt: conv.lastMessageAt || conv.createdAt || new Date().toISOString(),
            product: conv.quoteData?.product,
            service: conv.quoteData?.service,
            quoteData: conv.quoteData
          }))
          allQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          setQuotes(allQuotes)

          // Charger les commandes depuis les messages
          const allGeneralMessages = generalConversation?.messages || []
          const orderMessages = allGeneralMessages.filter((msg: any) => msg.relatedOrderId)
          const orderIds = [...new Set(orderMessages.map((msg: any) => msg.relatedOrderId).filter(Boolean))]
          
          if (orderIds.length > 0) {
            const ordersFromMessages = orderIds.map((orderId: string) => {
              const orderMessage = orderMessages.find((msg: any) => msg.relatedOrderId === orderId)
              return {
                id: orderId,
                orderNumber: orderId.substring(0, 8).toUpperCase(),
                status: 'PROCESSING',
                createdAt: orderMessage?.sentAt || new Date().toISOString(),
                total: 0
              }
            })
            ordersFromMessages.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            setOrders(ordersFromMessages)
          } else {
            setOrders([])
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error)
      } finally {
        setIsLoadingConversations(false)
      }
    }

    loadConversations()
  }, [isOpen, session?.user])

  // Récupérer les nouveaux messages
  const fetchNewMessages = useCallback(async (forceRefresh = false) => {
    if (!session?.user) return

    try {
      const apiUrl = '/api/profile/messages'
      const response = await fetch(apiUrl, { cache: 'no-store' })
      
      if (!response.ok) return

      const data = await response.json()
      const conversations = data.conversations || []
      
      if (conversationId === 'messages-general') {
        const generalConv = conversations.find((c: any) => c.id === 'messages-general')
        if (generalConv) {
          const newMessages = generalConv.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            sentAt: msg.sentAt,
            isFromClient: msg.isFromCurrentUser === true, // Message de l'utilisateur actuel (aligné à droite)
            attachments: msg.attachments || [],
            relatedQuoteId: msg.relatedQuoteId || null
          }))

          if (forceRefresh || newMessages.length > messages.length) {
            setMessages(newMessages)
            if (newMessages.length > 0) {
              setLastMessageId(newMessages[newMessages.length - 1].id)
              lastMessageIdRef.current = newMessages[newMessages.length - 1].id
            }
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
          }

          setUnreadCount(generalConv.unreadCount || 0)
        }

        // Mettre à jour les devis
        const quoteConversations = conversations.filter((conv: any) => conv.type === 'QUOTE')
        const allQuotes = quoteConversations.map((conv: any) => ({
          id: conv.id,
          subject: conv.subject || `Devis: ${conv.quoteData?.product?.name || conv.quoteData?.service?.name || 'Article'}`,
          status: conv.quoteStatus || 'PENDING',
          createdAt: conv.lastMessageAt || conv.createdAt || new Date().toISOString(),
          product: conv.quoteData?.product,
          service: conv.quoteData?.service,
          quoteData: conv.quoteData
        }))
        allQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setQuotes(allQuotes)
      } else if (conversationId?.startsWith('quote-')) {
        const quoteId = conversationId.replace('quote-', '')
        const quoteConv = conversations.find((c: any) => c.id === `quote-${quoteId}`)
        if (quoteConv) {
          const quoteMessages = quoteConv.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            sentAt: msg.sentAt,
            isFromClient: !msg.isAdminReply,
            attachments: msg.attachments || []
          }))
          if (forceRefresh || quoteMessages.length > messages.length) {
            setMessages(quoteMessages)
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
          }
        }
      } else if (conversationId?.startsWith('order-')) {
        // Pour les commandes, filtrer les messages liés
        const generalConv = conversations.find((c: any) => c.id === 'messages-general')
        if (generalConv) {
          const orderId = conversationId.replace('order-', '')
          const orderMessages = generalConv.messages
            .filter((msg: any) => msg.relatedOrderId === orderId)
            .map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              sentAt: msg.sentAt,
              isFromClient: !msg.isAdminReply,
              attachments: msg.attachments || []
            }))
          if (forceRefresh || orderMessages.length > messages.length) {
            setMessages(orderMessages)
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error)
    }
  }, [session?.user, conversationId, messages.length])

  // Actualisation automatique toutes les 5 secondes
  useEffect(() => {
    if (!isOpen || !session?.user) return
    const interval = setInterval(() => fetchNewMessages(), 5000)
    return () => clearInterval(interval)
  }, [isOpen, session?.user, fetchNewMessages])

  // Scroll automatique
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [messages])

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachedFiles.length === 0) || isLoading) return

    setIsLoading(true)
    try {
      if (session?.user) {
        // Utiliser l'API profile pour les utilisateurs connectés (garantit le bon fromUserId)
        let response: Response
        
        if (attachedFiles.length > 0) {
          // Utiliser FormData si on a des pièces jointes
          const formData = new FormData()
          formData.append('message', newMessage || 'Fichier(s) joint(s)')
          formData.append('conversationId', conversationId || 'messages-general')
          
          attachedFiles.forEach((media, index) => {
            formData.append(`file_${index}`, media.file)
          })
          
          response = await fetch('/api/profile/messages', {
            method: 'POST',
            body: formData,
          })
        } else {
          // Utiliser JSON si pas de pièces jointes
          response = await fetch('/api/profile/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: newMessage || 'Fichier(s) joint(s)',
              conversationId: conversationId || 'messages-general'
            }),
          })
        }

        if (response.ok) {
          setNewMessage('')
          setAttachedFiles([])
          await fetchNewMessages(true)
          
          await fetch('/api/profile/messages/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId: 'messages-general' })
          })
          
          toast.success('Message envoyé')
        } else {
          throw new Error('Erreur lors de l\'envoi')
        }
      } else {
        // Pour les invités
        const response = await fetch('/api/public/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: 'Message du chat',
            content: newMessage,
            clientEmail: guestEmail || 'guest@example.com',
            clientName: 'Visiteur',
            type: 'GENERAL'
          }),
        })

        if (response.ok) {
          setNewMessage('')
          toast.success('Message envoyé')
          // Recharger les messages
          setTimeout(async () => {
            const response = await fetch(`/api/public/messages?clientEmail=${encodeURIComponent(guestEmail || '')}`, { 
              cache: 'no-store' 
            })
            if (response.ok) {
              const data = await response.json()
              const loadedMessages = data.messages?.map((msg: any) => ({
                id: msg.id,
                content: msg.content,
                sentAt: msg.sentAt,
                isFromClient: msg.isFromClient,
                attachments: msg.attachments || []
              })) || []
              setMessages(loadedMessages)
              setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
            }
          }, 500)
        } else {
          throw new Error('Erreur lors de l\'envoi')
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'envoi du message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileSelect = (type: 'file' | 'image' | 'video', files: FileList | null) => {
    if (!files) return

    Array.from(files).forEach((file) => {
      if (attachedFiles.length >= 3) {
        toast.error('Maximum 3 fichiers')
        return
      }

      if (file.size > 4 * 1024 * 1024) {
        toast.error('Fichier trop volumineux (max 4MB)')
        return
      }

      const mediaFile: MediaFile = {
        file,
        preview: URL.createObjectURL(file),
        type
      }
      setAttachedFiles(prev => [...prev, mediaFile])
    })
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const closeChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  const getQuoteStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      PRICE_PROPOSED: 'Prix proposé',
      ACCEPTED: 'Accepté',
      REJECTED: 'Refusé',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé'
    }
    return labels[status] || status
  }

  const canReplyToQuote = (status: string) => {
    const closedStatuses = ['ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']
    return !closedStatuses.includes(status)
  }

  const canReplyToOrder = (status: string) => {
    const closedStatuses = ['DELIVERED', 'CANCELLED', 'COMPLETED', 'REFUNDED']
    return !closedStatuses.includes(status)
  }

  const openQuoteConversation = (quoteId: string) => {
    setConversationId(`quote-${quoteId}`)
    setActiveTab('messages')
    fetchNewMessages(true)
  }

  const openOrderConversation = (orderId: string) => {
    setConversationId(`order-${orderId}`)
    setActiveTab('messages')
    fetchNewMessages(true)
  }

  const getUserAvatar = (isFromClient: boolean) => {
    if (isFromClient) {
      return session?.user?.image || undefined
    }
    return undefined
  }

  const getUserInitials = (isFromClient: boolean) => {
    if (isFromClient) {
      const name = session?.user?.name || 'U'
      return name.charAt(0).toUpperCase()
    }
    return 'A'
  }

  const canReplyToCurrentConversation = useMemo(() => {
    if (!conversationId || conversationId === 'messages-general') return true
    
    if (conversationId.startsWith('quote-')) {
      const quoteId = conversationId.replace('quote-', '')
      const quote = quotes.find(q => q.id === quoteId || q.id === `quote-${quoteId}`)
      return quote ? canReplyToQuote(quote.status) : true
    }
    
    if (conversationId.startsWith('order-')) {
      const orderId = conversationId.replace('order-', '')
      const order = orders.find(o => o.id === orderId)
      return order ? canReplyToOrder(order.status) : true
    }
    
    return true
  }, [conversationId, quotes, orders])

  // Bouton flottant fermé
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-2 border-white z-50"
      >
        <MessageCircle className="h-6 w-6 text-white" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center border-2 border-white p-0">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? 'h-16' : 'h-[600px]'
    }`}>
      <Card className="w-[420px] h-full flex flex-col shadow-2xl border-0 overflow-hidden bg-gradient-to-b from-white to-gray-50/50">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Support BoutikNaka
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-[10px] h-4 px-1.5 border-0">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-7 w-7 p-0 text-white hover:bg-white/20 rounded-lg"
            >
              {isMinimized ? (
                <Maximize2 className="h-3.5 w-3.5" />
              ) : (
                <Minimize2 className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeChat}
              className="h-7 w-7 p-0 text-white hover:bg-white/20 rounded-lg"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
              {/* Onglets TOUJOURS VISIBLES ET FIXES EN HAUT - NE SHRINK PAS */}
              <div className="border-b bg-white px-4 py-2 flex-shrink-0">
                <div className="grid w-full grid-cols-3 bg-gray-100/50 p-1 rounded-lg h-9 gap-1">
                  <button
                    onClick={() => setActiveTab('messages')}
                    className={`text-xs font-medium rounded transition-all ${
                      activeTab === 'messages'
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Messages
                    {unreadCount > 0 && (
                      <Badge className="ml-1.5 bg-red-500 text-white text-[10px] h-4 px-1.5 border-0">
                        {unreadCount}
                      </Badge>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('quotes')}
                    disabled={!session?.user}
                    className={`text-xs font-medium rounded transition-all ${
                      activeTab === 'quotes'
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    } ${!session?.user ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Devis ({session?.user ? quotes.length : 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    disabled={!session?.user}
                    className={`text-xs font-medium rounded transition-all ${
                      activeTab === 'orders'
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    } ${!session?.user ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Commandes ({session?.user ? orders.length : 0})
                  </button>
                </div>
              </div>

              {/* Pour les utilisateurs connectés */}
              {session?.user && (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Messages */}
                  {activeTab === 'messages' && (
                    <div className="flex-1 flex flex-col min-h-0">
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/30 to-white min-h-0">
                      {isLoadingConversations ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="bg-gradient-to-br from-blue-100 to-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="h-8 w-8 text-blue-400" />
                          </div>
                          <p className="text-sm text-gray-600 font-medium mb-1">Aucun message</p>
                          <p className="text-xs text-gray-400">Envoyez votre premier message</p>
                        </div>
                      ) : (
                        messages.map((message, index) => {
                          const isFromClient = message.isFromClient
                          const showAvatar = index === 0 || messages[index - 1].isFromClient !== isFromClient

                          return (
                            <div key={message.id} className={`flex gap-2 ${isFromClient ? 'justify-end' : 'justify-start'}`}>
                              {!isFromClient && showAvatar && (
                                <Avatar className="h-8 w-8 border-2 border-blue-100 flex-shrink-0">
                                  <AvatarImage src={getUserAvatar(isFromClient)} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs">
                                    {getUserInitials(isFromClient)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {!isFromClient && !showAvatar && <div className="w-8 flex-shrink-0" />}

                              <div className={`flex flex-col max-w-[75%] ${isFromClient ? 'items-end' : 'items-start'}`}>
                                <div className={`rounded-2xl px-3 py-2 ${
                                  isFromClient 
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-sm' 
                                    : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm shadow-sm'
                                }`}>
                                  <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                                  {message.attachments && message.attachments.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {message.attachments.map((att, i) => (
                                        <div key={i} className="flex items-center gap-1 text-xs opacity-80">
                                          <Paperclip className="h-3 w-3" />
                                          <span>{att}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 px-1">
                                  {format(new Date(message.sentAt), 'HH:mm', { locale: fr })}
                                </span>
                                {message.relatedQuoteId && (
                                  <Link 
                                    href={`/profile/quotes/${message.relatedQuoteId.replace('quote-', '')}`}
                                    className="text-[10px] text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-1"
                                  >
                                    <Quote className="h-3 w-3" />
                                    Voir le devis
                                  </Link>
                                )}
                              </div>

                              {isFromClient && showAvatar && (
                                <Avatar className="h-8 w-8 border-2 border-blue-100 flex-shrink-0">
                                  <AvatarImage src={getUserAvatar(isFromClient)} />
                                  <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white text-xs">
                                    {getUserInitials(isFromClient)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {isFromClient && !showAvatar && <div className="w-8 flex-shrink-0" />}
                            </div>
                          )
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Zone de saisie */}
                    {!canReplyToCurrentConversation ? (
                      <div className="border-t bg-gray-50 p-4 text-center">
                        <p className="text-sm text-gray-500">Cette conversation est fermée, vous ne pouvez plus répondre</p>
                      </div>
                    ) : (
                      <div className="border-t bg-white p-4 space-y-3">
                        {attachedFiles.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {attachedFiles.map((file, index) => (
                              <div key={index} className="relative group">
                                <div className="w-16 h-16 rounded-lg border border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center">
                                  {file.type === 'image' ? (
                                    <img src={file.preview} alt="" className="w-full h-full object-cover" />
                                  ) : file.type === 'video' ? (
                                    <Video className="h-6 w-6 text-gray-400" />
                                  ) : (
                                    <File className="h-6 w-6 text-gray-400" />
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full opacity-0 group-hover:opacity-100"
                                  onClick={() => removeFile(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Textarea
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="Tapez votre message... (Enter pour envoyer)"
                              disabled={isLoading || !canReplyToCurrentConversation}
                              className="min-h-[60px] max-h-[150px] resize-none pr-20 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm"
                            />
                            
                            <div className="absolute right-2 bottom-2">
                              <div className="relative">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 w-9 p-0 hover:bg-gray-100 rounded-lg"
                                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                  disabled={isLoading || !canReplyToCurrentConversation}
                                >
                                  <Smile className="h-4 w-4 text-gray-600" />
                                </Button>
                                {showEmojiPicker && (
                                  <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-xl p-2 z-50">
                                    <div className="grid grid-cols-6 gap-1">
                                      {popularEmojis.map((emoji, i) => (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={() => addEmoji(emoji)}
                                          className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-[60px] w-11 p-0 border-gray-300 hover:bg-gray-50"
                                disabled={isLoading || !canReplyToCurrentConversation}
                              >
                                <Paperclip className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer" disabled={!canReplyToCurrentConversation}>
                                <File className="mr-2 h-4 w-4" /><span>Fichier</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => imageInputRef.current?.click()} className="cursor-pointer" disabled={!canReplyToCurrentConversation}>
                                <ImageIcon className="mr-2 h-4 w-4" /><span>Image</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => videoInputRef.current?.click()} className="cursor-pointer" disabled={!canReplyToCurrentConversation}>
                                <Video className="mr-2 h-4 w-4" /><span>Vidéo</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleFileSelect('file', e.target.files)} />
                        <input ref={imageInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect('image', e.target.files)} />
                        <input ref={videoInputRef} type="file" className="hidden" accept="video/*" onChange={(e) => handleFileSelect('video', e.target.files)} />
                      </div>
                    )}
                    </div>
                  )}

                  {/* Devis - SANS ESPACE */}
                  {activeTab === 'quotes' && (
                    <div className="flex-1 overflow-y-auto">
                    {quotes.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12 px-4">
                        <div className="bg-gradient-to-br from-purple-100 to-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Quote className="h-8 w-8 text-purple-400" />
                        </div>
                        <p className="text-sm font-medium mb-1">Aucun devis</p>
                        <p className="text-xs">Vos devis apparaîtront ici</p>
                      </div>
                    ) : (
                      <div className="px-2 pb-2 pt-2 space-y-2">
                        {quotes.map((quote) => {
                          const productImage = quote.product?.images?.[0]?.path || quote.service?.images?.[0]?.path
                          const canReply = canReplyToQuote(quote.status)
                          
                          return (
                            <div
                              key={quote.id}
                              className={`group p-3 border-2 rounded-xl transition-all cursor-pointer bg-white ${
                                canReply 
                                  ? 'border-gray-200 hover:border-blue-300 hover:shadow-lg' 
                                  : 'border-gray-100 opacity-75'
                              }`}
                              onClick={() => {
                                if (canReply) {
                                  openQuoteConversation(quote.id.replace('quote-', ''))
                                }
                              }}
                            >
                              <div className="flex items-start gap-3">
                                {productImage && (
                                  <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-gray-200 flex-shrink-0">
                                    <img 
                                      src={productImage} 
                                      alt={quote.product?.name || quote.service?.name || 'Article'}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                      {quote.subject}
                                    </p>
                                    <Badge className={`text-xs flex-shrink-0 ${
                                      quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 border-green-300' :
                                      quote.status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-300' :
                                      quote.status === 'PRICE_PROPOSED' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                      'bg-gray-100 text-gray-700 border-gray-300'
                                    }`}>
                                      {getQuoteStatusLabel(quote.status)}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    {format(new Date(quote.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                                  </p>
                                  {canReply ? (
                                    <div className="flex items-center gap-1 text-xs text-blue-600 font-medium group-hover:text-blue-700">
                                      <span>Ouvrir la conversation</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                      <span>Conversation fermée</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    </div>
                  )}

                  {/* Commandes - SANS ESPACE */}
                  {activeTab === 'orders' && (
                    <div className="flex-1 overflow-y-auto">
                    {orders.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12 px-4">
                        <div className="bg-gradient-to-br from-green-100 to-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Package className="h-8 w-8 text-green-400" />
                        </div>
                        <p className="text-sm font-medium mb-1">Aucune commande</p>
                        <p className="text-xs">Vos commandes apparaîtront ici</p>
                      </div>
                    ) : (
                      <div className="px-2 pb-2 pt-2 space-y-2">
                        {orders.map((order) => {
                          const canReply = canReplyToOrder(order.status)
                          
                          return (
                            <div
                              key={order.id}
                              className={`group p-3 border-2 rounded-xl transition-all cursor-pointer bg-white ${
                                canReply 
                                  ? 'border-gray-200 hover:border-blue-300 hover:shadow-lg' 
                                  : 'border-gray-100 opacity-75'
                              }`}
                              onClick={() => {
                                if (canReply) {
                                  openOrderConversation(order.id)
                                }
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className="text-sm font-semibold text-gray-900">
                                      Commande #{order.orderNumber}
                                    </p>
                                    <Badge className={`text-xs flex-shrink-0 ${
                                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-700 border-green-300' :
                                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-700 border-red-300' :
                                      order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                      'bg-gray-100 text-gray-700 border-gray-300'
                                    }`}>
                                      {order.status}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    {format(new Date(order.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })} • {order.total} Ar
                                  </p>
                                  {canReply ? (
                                    <div className="flex items-center gap-1 text-xs text-blue-600 font-medium group-hover:text-blue-700">
                                      <span>Ouvrir la conversation</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                      <span>Conversation fermée</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    </div>
                  )}
                </div>
              )}

              {/* Pour les invités */}
              {!session?.user && (
                <div className="flex-1 flex flex-col">
                  {/* Messages pour invités */}
                  {activeTab === 'messages' && (
                    <div className="flex-1 flex flex-col">
                      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/30 to-white">
                        {messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="bg-gradient-to-br from-blue-100 to-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                              <MessageCircle className="h-8 w-8 text-blue-400" />
                            </div>
                            <p className="text-sm text-gray-600 font-medium mb-1">Besoin d'aide ?</p>
                            <p className="text-xs text-gray-400">Envoyez-nous un message</p>
                          </div>
                        ) : (
                          <>
                            {messages.map((message, index) => {
                              const isFromClient = message.isFromClient
                              const showAvatar = index === 0 || messages[index - 1].isFromClient !== isFromClient

                              return (
                                <div key={message.id} className={`flex gap-2 ${isFromClient ? 'justify-end' : 'justify-start'}`}>
                                  {!isFromClient && showAvatar && (
                                    <Avatar className="h-8 w-8 border-2 border-blue-100 flex-shrink-0">
                                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs">
                                        A
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                  {!isFromClient && !showAvatar && <div className="w-8 flex-shrink-0" />}

                                  <div className={`flex flex-col max-w-[75%] ${isFromClient ? 'items-end' : 'items-start'}`}>
                                    <div className={`rounded-2xl px-3 py-2 ${
                                      isFromClient 
                                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-sm' 
                                        : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm shadow-sm'
                                    }`}>
                                      <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                                      {format(new Date(message.sentAt), 'HH:mm', { locale: fr })}
                                    </span>
                                  </div>

                                  {isFromClient && showAvatar && (
                                    <Avatar className="h-8 w-8 border-2 border-blue-100 flex-shrink-0">
                                      <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white text-xs">
                                        I
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                  {isFromClient && !showAvatar && <div className="w-8 flex-shrink-0" />}
                                </div>
                              )
                            })}
                            <div ref={messagesEndRef} />
                          </>
                        )}
                      </div>

                      {/* Zone de saisie pour invités */}
                      <div className="border-t bg-white p-4">
                        <div className="flex gap-2">
                          <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Tapez votre message... (Enter pour envoyer)"
                            disabled={isLoading}
                            className="min-h-[60px] max-h-[150px] resize-none text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Devis et Commandes pour invités - Message de connexion */}
                  {(activeTab === 'quotes' || activeTab === 'orders') && (
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50/30 to-white">
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="bg-gradient-to-br from-blue-100 to-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            {activeTab === 'quotes' ? (
                              <Quote className="h-8 w-8 text-blue-400" />
                            ) : (
                              <Package className="h-8 w-8 text-blue-400" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 font-medium mb-1">Connectez-vous</p>
                          <p className="text-xs text-gray-400 mb-4">
                            Pour accéder à vos {activeTab === 'quotes' ? 'devis' : 'commandes'}
                          </p>
                          <Link href="/auth/signin">
                            <Button size="sm" className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                              Se connecter
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
