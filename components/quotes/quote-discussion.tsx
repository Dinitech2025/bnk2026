'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { 
  MessageSquare, 
  Send, 
  DollarSign, 
  Check, 
  X, 
  Clock, 
  User, 
  Shield,
  AlertCircle,
  ShoppingCart,
  Calendar,
  Package,
  Paperclip,
  FileText,
  Image as ImageIcon
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from '@/components/ui/use-toast'
import { useSession } from 'next-auth/react'
import { useTypingIndicator } from '@/lib/hooks/use-typing-indicator'

interface QuoteMessage {
  id: string
  message: string
  proposedPrice?: number
  attachments?: string[]
  createdAt: string
  sender: {
    id: string
    name: string
    role: string
  }
}

interface Quote {
  id: string
  title: string
  description: string
  status: 'PENDING' | 'NEGOTIATING' | 'PRICE_PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'COMPLETED'
  budget?: number
  proposedPrice?: number
  finalPrice?: number
  attachments?: string[]
  createdAt: string
  updatedAt: string
  expiresAt?: string
  service: {
    id: string
    name: string
    slug: string
    description: string
    price?: number
    pricingType?: string
    images: { path: string; alt?: string }[]
  }
  user: {
    id: string
    name: string
    email: string
  }
  messages: QuoteMessage[]
}

interface QuoteDiscussionProps {
  quoteId: string
  onStatusChange?: (newStatus: string) => void
}

const statusConfig = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  NEGOTIATING: { label: 'En discussion', color: 'bg-blue-100 text-blue-800' },
  PRICE_PROPOSED: { label: 'Prix proposé', color: 'bg-purple-100 text-purple-800' },
  ACCEPTED: { label: 'Accepté', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejeté', color: 'bg-red-100 text-red-800' },
  EXPIRED: { label: 'Expiré', color: 'bg-gray-100 text-gray-800' },
  COMPLETED: { label: 'Terminé', color: 'bg-green-100 text-green-800' }
}

export function QuoteDiscussion({ quoteId, onStatusChange }: QuoteDiscussionProps) {
  const { data: session } = useSession()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Hook pour les indicateurs de frappe
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator({
    quoteId,
    isAdmin: false
  })

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'STAFF'
  const isOwner = quote?.user.id === session?.user?.id

  useEffect(() => {
    fetchQuote()
  }, [quoteId])

  useEffect(() => {
    scrollToBottom()
  }, [quote?.messages])

  // Polling pour récupérer les nouveaux messages en temps réel
  useEffect(() => {
    if (!quote) return

    const pollMessages = async () => {
      try {
        const response = await fetch(`/api/quotes/${quoteId}`)
        if (response.ok) {
          const data = await response.json()
          // Mettre à jour seulement si il y a de nouveaux messages
          if (data.messages.length !== quote.messages.length) {
            setQuote(data)
          }
        }
      } catch (error) {
        // Ignorer les erreurs de polling pour éviter les toasts répétés
        console.error('Erreur lors du polling des messages:', error)
      }
    }

    // Polling toutes les 3 secondes si la conversation est active
    const isActiveConversation = quote.status === 'PENDING' || quote.status === 'NEGOTIATING' || quote.status === 'PRICE_PROPOSED'
    
    if (isActiveConversation) {
      const interval = setInterval(pollMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [quoteId, quote?.messages.length, quote?.status])

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  const fetchQuote = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/quotes/${quoteId}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du devis')
      }
      
      const data = await response.json()
      setQuote(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      toast({
        title: "Erreur",
        description: "Impossible de charger le devis",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  // Fonction pour déterminer le type de fichier par URL
  const getFileTypeFromUrl = (url: string) => {
    const fileName = url.split('/').pop()?.toLowerCase() || ''
    
    if (fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      return 'image'
    }
    if (fileName.match(/\.(mp4|webm|ogg|mov|avi)$/)) {
      return 'video'
    }
    if (fileName.match(/\.(pdf)$/)) {
      return 'pdf'
    }
    if (fileName.match(/\.(doc|docx)$/)) {
      return 'document'
    }
    return 'other'
  }

  // Composant pour afficher les fichiers joints
  const AttachmentDisplay = ({ attachment, isAdmin }: { attachment: string, isAdmin: boolean }) => {
    const fileType = getFileTypeFromUrl(attachment)
    const fileName = attachment.split('/').pop() || 'Fichier joint'
    
    switch (fileType) {
      case 'image':
        return (
          <div className="mt-3">
            <div className={`relative rounded-lg overflow-hidden max-w-xs ${
              isAdmin ? 'border-2 border-blue-300' : 'border-2 border-gray-200'
            }`}>
              <img
                src={attachment}
                alt={fileName}
                className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(attachment, '_blank')}
              />
              <div className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2`}>
                <p className="text-xs truncate">{fileName}</p>
              </div>
            </div>
          </div>
        )
      
      case 'video':
        return (
          <div className="mt-3">
            <div className={`relative rounded-lg overflow-hidden max-w-xs ${
              isAdmin ? 'border-2 border-blue-300' : 'border-2 border-gray-200'
            }`}>
              <video
                controls
                className="w-full h-auto max-h-64"
                preload="metadata"
              >
                <source src={attachment} />
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
              <div className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2`}>
                <p className="text-xs truncate">{fileName}</p>
              </div>
            </div>
          </div>
        )
      
      case 'pdf':
        return (
          <div className={`mt-3 flex items-center gap-2 p-3 rounded-lg border ${
            isAdmin ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <FileText className={`h-5 w-5 ${isAdmin ? 'text-blue-600' : 'text-red-600'}`} />
            <div className="flex-1">
              <p className="text-sm font-medium">{fileName}</p>
              <p className="text-xs text-gray-500">Document PDF</p>
            </div>
            <a 
              href={attachment} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`text-sm px-3 py-1 rounded-md hover:underline ${
                isAdmin ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
                          >
                📄 Consulter
              </a>
          </div>
        )
      
      case 'document':
        return (
          <div className={`mt-3 flex items-center gap-2 p-3 rounded-lg border ${
            isAdmin ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <FileText className={`h-5 w-5 ${isAdmin ? 'text-blue-600' : 'text-blue-600'}`} />
            <div className="flex-1">
              <p className="text-sm font-medium">{fileName}</p>
              <p className="text-xs text-gray-500">Document Word</p>
            </div>
            <a 
              href={attachment} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`text-sm px-3 py-1 rounded-md hover:underline ${
                isAdmin ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
                          >
                📋 Voir document
              </a>
          </div>
        )
      
      default:
        return (
          <div className={`mt-3 flex items-center gap-2 p-3 rounded-lg border ${
            isAdmin ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <FileText className={`h-5 w-5 ${isAdmin ? 'text-blue-600' : 'text-gray-600'}`} />
            <div className="flex-1">
              <p className="text-sm font-medium">{fileName}</p>
              <p className="text-xs text-gray-500">Fichier joint</p>
            </div>
            <a 
              href={attachment} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`text-sm px-3 py-1 rounded-md hover:underline ${
                isAdmin ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
                          >
                📄 Consulter
              </a>
          </div>
        )
    }
  }

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!newMessage.trim() && files.length === 0) {
      return
    }

    // Créer un message temporaire pour affichage immédiat
    const tempMessage = {
      id: 'temp-' + Date.now(),
      message: newMessage.trim(),
      proposedPrice: undefined,
      attachments: [],
      createdAt: new Date().toISOString(),
      sender: {
        id: session?.user?.id || 'temp',
        name: session?.user?.name || 'Vous',
        role: 'USER'
      }
    }

    // Ajouter le message temporaire immédiatement
    setQuote(prev => {
      if (!prev) return prev
      return {
        ...prev,
        messages: [...prev.messages, tempMessage]
      }
    })

    // Réinitialiser le formulaire immédiatement
    const messageToSend = newMessage.trim()
    const filesToSend = [...files]
    
    setNewMessage('')
    setFiles([])
    setSending(true)

    try {
      // Upload files first if any
      let attachments: string[] = []
      if (filesToSend.length > 0) {
        const formData = new FormData()
        filesToSend.forEach(file => {
          formData.append('files', file)
        })
        formData.append('type', 'quote')

        const uploadResponse = await fetch('/api/upload-imagekit', {
          method: 'POST',
          body: formData
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          attachments = uploadResult.urls || []
        }
      }

      const response = await fetch(`/api/quotes/${quoteId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          proposedPrice: undefined,
          attachments
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message')
      }

      const newMessage = await response.json()

      // Remplacer le message temporaire par le vrai message
      setQuote(prev => {
        if (!prev) return prev
        return {
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === tempMessage.id ? newMessage : msg
          )
        }
      })
      
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé",
      })
    } catch (err) {
      // Supprimer le message temporaire en cas d'erreur
      setQuote(prev => {
        if (!prev) return prev
        return {
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== tempMessage.id)
        }
      })
      
      // Restaurer le formulaire
      setNewMessage(messageToSend)
      setFiles(filesToSend)
      
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi')
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const updateQuoteStatus = async (newStatus: string) => {
    setUpdating(true)

    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          finalPrice: newStatus === 'ACCEPTED' ? quote?.proposedPrice : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      await fetchQuote()
      onStatusChange?.(newStatus)
      
      toast({
        title: "Statut mis à jour",
        description: newStatus === 'ACCEPTED' ? "Vous avez accepté le devis !" : "Statut mis à jour avec succès",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  const addToCart = async () => {
    if (!quote?.proposedPrice) return
    
    setUpdating(true)
    
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ACCEPTED',
          finalPrice: quote.proposedPrice
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout au panier')
      }

      await fetchQuote()
      onStatusChange?.('ACCEPTED')
      
      toast({
        title: "Ajouté au panier !",
        description: "Le service a été ajouté à votre panier avec le prix négocié",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout au panier')
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter au panier",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Chargement du devis...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!quote) {
    return null
  }

  const isClientMessage = (message: QuoteMessage) => {
    return message.sender.role === 'USER'
  }

  const isAdminMessage = (message: QuoteMessage) => {
    return message.sender.role === 'ADMIN' || message.sender.role === 'STAFF'
  }

  return (
    <div className="space-y-6">
      {/* En-tête du devis */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Devis #{quote.id.slice(-8).toUpperCase()}</h2>
            <p className="text-gray-600 mt-1">
              Créé le {format(new Date(quote.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
            </p>
          </div>
          <Badge className={statusConfig[quote.status].color}>
            {statusConfig[quote.status].label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Colonne de gauche - Conversation élargie */}
        <div className="xl:col-span-3 space-y-6">
          {/* Messages/Conversation */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation
              </CardTitle>
              <CardDescription>
                Échangez avec notre équipe pour finaliser votre devis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Créer un message virtuel pour la demande initiale + messages réels */}
                {(() => {
                  // Message virtuel de la demande initiale
                  const initialMessage = {
                    id: 'initial-request',
                    message: quote.description,
                    proposedPrice: quote.budget,
                    attachments: quote.attachments || [],
                    createdAt: quote.createdAt,
                    sender: {
                      id: quote.user.id,
                      name: quote.user.name,
                      role: 'USER'
                    }
                  }
                  
                  // Combiner le message initial avec les messages réels
                  const allMessages = [initialMessage, ...quote.messages]
                  
                  return allMessages.length > 0 ? (
                    <div 
                      ref={messagesContainerRef}
                      className="space-y-4 max-h-[60vh] overflow-y-auto p-4 bg-gray-50 rounded-lg scroll-smooth"
                    >
                      {allMessages.map((message, index) => (
                        <div
                          key={message.id}
                          className={`flex ${isClientMessage(message) ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                        >
                          <div className={`flex items-start gap-3 max-w-lg ${
                            isClientMessage(message) ? 'flex-row-reverse' : 'flex-row'
                          }`}>
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-medium ${
                              isClientMessage(message) ? 'bg-blue-500' : 'bg-gray-500'
                            }`}>
                              {isClientMessage(message) ? '👤' : '👨‍💼'}
                            </div>
                            
                            {/* Message bubble */}
                            <div
                              className={`px-4 py-3 rounded-2xl shadow-sm ${
                                isClientMessage(message)
                                  ? 'bg-blue-500 text-white rounded-br-sm'
                                  : index === 0 
                                    ? 'bg-green-50 text-gray-800 rounded-bl-sm border border-green-200'
                                    : 'bg-white text-gray-800 rounded-bl-sm border'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium ${
                                  isClientMessage(message) ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {isClientMessage(message) ? (index === 0 ? 'Demande initiale' : 'Vous') : 'Équipe BNK'}
                                </span>
                                {index === 0 && (
                                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                    Demande de devis
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {message.message}
                              </p>
                              
                              {/* Budget initial (seulement pour la demande initiale) */}
                              {index === 0 && message.proposedPrice && (
                                <div className="mt-3 p-3 rounded-lg bg-green-100 border border-green-200">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-800">
                                      Budget indicatif: <PriceWithConversion price={message.proposedPrice} />
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Fichiers joints */}
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="space-y-2">
                                  {message.attachments.map((attachment, attachmentIndex) => (
                                    <AttachmentDisplay 
                                      key={attachmentIndex} 
                                      attachment={attachment} 
                                      isAdmin={isAdminMessage(message)} 
                                    />
                                  ))}
                                </div>
                              )}
                              
                              {/* Prix proposé (pour les messages de négociation) */}
                              {message.proposedPrice && (
                                <div className={`mt-3 p-3 rounded-lg ${
                                  isClientMessage(message) ? 'bg-blue-600' : 'bg-gray-100'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                      Prix proposé: <PriceWithConversion price={message.proposedPrice} />
                                    </span>
                                  </div>
                                </div>
                              )}
                              <div className={`text-xs mt-2 ${
                                isClientMessage(message) ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {format(new Date(message.createdAt), 'dd MMM à HH:mm', { locale: fr })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-lg">
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun message</h3>
                      <p className="text-gray-500 mb-4">La conversation n'a pas encore commencé</p>
                      <p className="text-sm text-gray-400">Envoyez le premier message pour démarrer l'échange</p>
                    </div>
                  )
                })()}
                
                {/* Formulaire de réponse */}
                {(quote.status === 'PENDING' || quote.status === 'NEGOTIATING' || quote.status === 'PRICE_PROPOSED') && (
                  <div className="border-t pt-6 mt-6">
                    <div className="space-y-4">
                      <Label htmlFor="clientMessage" className="text-base font-medium flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">👤</span>
                        </div>
                        Votre message
                      </Label>
                      
                      {/* Indicateur de frappe */}
                      {typingUsers.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span>
                            {typingUsers.length === 1 
                              ? `${typingUsers[0].userName} est en train de taper...`
                              : `${typingUsers.length} personnes sont en train de taper...`
                            }
                          </span>
                        </div>
                      )}
                      
                      {/* Zone de fichiers joints */}
                      {files.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-600">Fichiers joints :</Label>
                          <div className="space-y-1">
                            {files.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                                <div className="flex items-center gap-2">
                                  {getFileIcon(file)}
                                  <span className="text-sm">{file.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="relative">
                        <Textarea
                          id="clientMessage"
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value)
                            startTyping()
                          }}
                          onBlur={stopTyping}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage(e)
                            } else {
                              startTyping()
                            }
                          }}
                          placeholder="Tapez votre message..."
                          rows={4}
                          className="resize-none pr-24 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-base"
                          disabled={sending}
                        />
                        <div className="absolute bottom-3 right-3 flex gap-1">
                          {/* Bouton upload */}
                          <div>
                            <Input
                              type="file"
                              multiple
                              onChange={handleFileChange}
                              className="hidden"
                              id="message-file-upload"
                              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.webm,.ogg,.mov,.avi"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => document.getElementById('message-file-upload')?.click()}
                              className="h-10 w-10 p-0 hover:bg-gray-100"
                              disabled={sending}
                            >
                              <Paperclip className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Bouton envoi */}
                          <Button
                            onClick={() => sendMessage()}
                            disabled={sending || (!newMessage.trim() && files.length === 0)}
                            size="sm"
                            className="h-10 w-10 p-0 bg-blue-500 hover:bg-blue-600"
                          >
                            {sending ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                          <span>Vos messages apparaîtront en bleu</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-400 rounded-full" />
                          <span>Réponses de l'équipe en gris</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-3 w-3" />
                          <span>Joignez des fichiers avec le trombone</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar droite - Informations compactes */}
        <div className="xl:col-span-1 space-y-6">
          {/* Informations du service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{quote.service.name}</h4>
                <p className="text-sm text-gray-600 line-clamp-3">{quote.service.description}</p>
              </div>
              
              {quote.service.price && (
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Prix de base:</span>
                    <span className="font-semibold">
                      <PriceWithConversion price={quote.service.price} />
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations de prix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Prix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quote.budget && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Budget initial:</span>
                  <span className="font-medium">
                    <PriceWithConversion price={quote.budget} />
                  </span>
                </div>
              )}
              
              {quote.proposedPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Prix proposé:</span>
                  <span className="font-semibold text-lg">
                    <PriceWithConversion price={quote.proposedPrice} />
                  </span>
                </div>
              )}
              
              {quote.finalPrice && (
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-sm text-gray-600">Prix final:</span>
                  <span className="font-bold text-lg text-green-600">
                    <PriceWithConversion price={quote.finalPrice} />
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 