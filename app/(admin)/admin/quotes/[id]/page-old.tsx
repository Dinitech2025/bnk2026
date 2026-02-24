'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { 
  MessageSquare, 
  User, 
  Calendar, 
  DollarSign, 
  ArrowLeft, 
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { useTypingIndicator } from '@/lib/hooks/use-typing-indicator'

interface Quote {
  id: string
  status: string
  description: string
  budget: number | null
  finalPrice: number | null
  proposedPrice: number | null
  attachments?: string[]
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
  }
  service: {
    id: string
    name: string
    slug: string
    price: number | null
    pricingType: string
    description: string | null
  }
  messages: Array<{
    id: string
    message: string
    attachments?: string[]
    isAdminReply: boolean
    createdAt: string
    sender: {
      id: string
      name: string | null
      email: string
      role: string
    }
  }>
}

const statusLabels = {
  PENDING: 'En attente',
  NEGOTIATING: 'En négociation',
  PRICE_PROPOSED: 'Prix proposé',
  ACCEPTED: 'Accepté',
  REJECTED: 'Rejeté',
  EXPIRED: 'Expiré'
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  NEGOTIATING: 'bg-blue-100 text-blue-800',
  PRICE_PROPOSED: 'bg-purple-100 text-purple-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800'
}

export default function AdminQuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [proposedPrice, setProposedPrice] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Hook pour les indicateurs de frappe
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator({
    quoteId: params.id as string,
    isAdmin: true
  })

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch(`/api/admin/quotes/${params.id}`)
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération du devis')
        }
        const result = await response.json()
        setQuote(result)
        if (result.proposedPrice) {
          setProposedPrice(result.proposedPrice.toString())
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchQuote()
    }
  }, [params.id])

  // Polling pour récupérer les nouveaux messages en temps réel
  useEffect(() => {
    if (!quote) return

    const pollMessages = async () => {
      try {
        const response = await fetch(`/api/admin/quotes/${params.id}`)
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
  }, [params.id, quote?.messages.length, quote?.status])

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
            <video
              controls
              className="max-w-xs rounded-lg"
              style={{ maxHeight: '200px' }}
            >
              <source src={attachment} />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
            <p className="text-xs text-gray-500 mt-1">{fileName}</p>
          </div>
        )
      case 'pdf':
        return (
          <div className="mt-3">
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg max-w-xs">
              <FileText className="h-5 w-5 text-red-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 truncate">{fileName}</p>
                <p className="text-xs text-red-600">Document PDF</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(attachment, '_blank')}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                📄 Consulter
              </Button>
            </div>
          </div>
        )
      case 'document':
        return (
          <div className="mt-3">
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-xs">
              <FileText className="h-5 w-5 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-800 truncate">{fileName}</p>
                <p className="text-xs text-blue-600">Document</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(attachment, '_blank')}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                📋 Voir document
              </Button>
            </div>
          </div>
        )
      default:
        return (
          <div className="mt-3">
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-w-xs">
              <FileText className="h-5 w-5 text-gray-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
                <p className="text-xs text-gray-600">Fichier joint</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(attachment, '_blank')}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                📋 Voir document
              </Button>
            </div>
          </div>
        )
    }
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim() && files.length === 0) return

    // Afficher immédiatement le message en cours d'envoi
    const tempMessage = {
      id: 'temp-' + Date.now(),
      message: replyMessage,
      attachments: [],
      isAdminReply: true,
      createdAt: new Date().toISOString(),
      sender: {
        id: 'temp',
        name: 'Administrateur',
        email: '',
        role: 'ADMIN'
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
    const messageToSend = replyMessage
    const filesToSend = [...files]
    setReplyMessage('')
    setFiles([])

    // Scroll immédiatement
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 50)

    setSending(true)
    try {
      let attachments: string[] = []
      
      // Upload des fichiers si nécessaire
      if (filesToSend.length > 0) {
        const formData = new FormData()
        filesToSend.forEach(file => {
          formData.append('files', file)
        })
        formData.append('type', 'quotes')

        const uploadResponse = await fetch('/api/upload-imagekit', {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          throw new Error('Erreur lors de l\'upload des fichiers')
        }

        const uploadResult = await uploadResponse.json()
        attachments = uploadResult.urls || []
      }

      const response = await fetch(`/api/admin/quotes/${params.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          attachments: attachments
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

      // Scroll final
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      }, 100)
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de l\'envoi du message')
      
      // Supprimer le message temporaire en cas d'erreur
      setQuote(prev => {
        if (!prev) return prev
        return {
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== tempMessage.id)
        }
      })
      
      // Restaurer le formulaire
      setReplyMessage(messageToSend)
      setFiles(filesToSend)
    } finally {
      setSending(false)
    }
  }

  const handleProposePrice = async () => {
    if (!proposedPrice.trim()) return

    setSending(true)
    try {
      const response = await fetch(`/api/admin/quotes/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposedPrice: parseFloat(proposedPrice),
          status: 'PRICE_PROPOSED'
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la proposition de prix')
      }

      // Recharger les données
      const updatedQuote = await fetch(`/api/admin/quotes/${params.id}`)
      const result = await updatedQuote.json()
      setQuote(result)
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de la proposition de prix')
    } finally {
      setSending(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    setSending(true)
    try {
      const response = await fetch(`/api/admin/quotes/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut')
      }

      // Recharger les données
      const updatedQuote = await fetch(`/api/admin/quotes/${params.id}`)
      const result = await updatedQuote.json()
      setQuote(result)
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de la mise à jour du statut')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Détail du devis</h1>
          <p className="text-gray-600 mt-2">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Détail du devis</h1>
          <p className="text-red-600 mt-2">Erreur: {error}</p>
        </div>
      </div>
    )
  }

  if (!quote) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/admin/quotes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux devis
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Détail du devis</h1>
          <p className="text-gray-600 mt-1">
            Créé le {format(new Date(quote.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche - SEULEMENT la conversation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Messages/Conversation - SEULE À GAUCHE */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation
              </CardTitle>
              <CardDescription>
                Échangez avec le client pour finaliser le devis
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
                    attachments: quote.attachments || [],
                    isAdminReply: false,
                    createdAt: quote.createdAt,
                    sender: {
                      id: quote.user.id,
                      name: quote.user.name,
                      email: quote.user.email,
                      role: 'USER'
                    }
                  }
                  
                  // Combiner le message initial avec les messages réels
                  const allMessages = [initialMessage, ...quote.messages]
                  
                  return allMessages.length > 0 ? (
                    <div ref={scrollRef} className="space-y-4 max-h-96 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                      {allMessages.map((message, index) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isAdminReply ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                        >
                          <div className={`flex items-start gap-3 max-w-xs lg:max-w-md ${
                            message.isAdminReply ? 'flex-row-reverse' : 'flex-row'
                          }`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                              message.isAdminReply ? 'bg-blue-500' : 'bg-gray-500'
                            }`}>
                              {message.isAdminReply ? '👨‍💼' : '👤'}
                            </div>
                            
                            {/* Message bubble */}
                            <div
                              className={`px-4 py-3 rounded-2xl shadow-sm ${
                                message.isAdminReply
                                  ? 'bg-blue-500 text-white rounded-br-sm'
                                  : index === 0 
                                    ? 'bg-green-50 text-gray-800 rounded-bl-sm border border-green-200'
                                    : 'bg-white text-gray-800 rounded-bl-sm border'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium ${
                                  message.isAdminReply ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {message.isAdminReply ? 'Administrateur' : index === 0 ? 'Demande initiale' : (quote.user.name || quote.user.email)}
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
                              {index === 0 && quote.budget && (
                                <div className="mt-3 p-3 rounded-lg bg-green-100 border border-green-200">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-800">
                                      Budget indicatif: <PriceWithConversion price={quote.budget} />
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Fichiers joints de la demande initiale */}
                              {index === 0 && quote.attachments && quote.attachments.length > 0 && (
                                <div className="space-y-2">
                                  {quote.attachments.map((attachment, attachmentIndex) => (
                                    <AttachmentDisplay 
                                      key={attachmentIndex} 
                                      attachment={attachment} 
                                      isAdmin={false} 
                                    />
                                  ))}
                                </div>
                              )}
                              
                              {/* Fichiers joints des messages */}
                              {index > 0 && message.attachments && message.attachments.length > 0 && (
                                <div className="space-y-2">
                                  {message.attachments.map((attachment, attachmentIndex) => (
                                    <AttachmentDisplay 
                                      key={attachmentIndex} 
                                      attachment={attachment} 
                                      isAdmin={message.isAdminReply} 
                                    />
                                  ))}
                                </div>
                              )}
                              
                              <div className={`text-xs mt-2 ${
                                message.isAdminReply ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {format(new Date(message.createdAt), 'dd MMM à HH:mm', { locale: fr })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun message</h3>
                      <p className="text-gray-500 mb-4">La conversation n'a pas encore commencé</p>
                      <p className="text-sm text-gray-400">Envoyez le premier message pour démarrer l'échange</p>
                    </div>
                  )
                })()}
                
                {/* Formulaire de réponse */}
                <div className="border-t pt-4 mt-4">
                  <div className="space-y-3">
                    <Label htmlFor="replyMessage" className="text-sm font-medium flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">👨‍💼</span>
                      </div>
                      Répondre au client
                    </Label>
                    
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
                    
                    {/* Indicateur de frappe */}
                    {typingUsers.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
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
                    
                    <div className="relative">
                      <Textarea
                        id="replyMessage"
                        value={replyMessage}
                        onChange={(e) => {
                          setReplyMessage(e.target.value)
                          startTyping()
                        }}
                        onBlur={stopTyping}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendReply()
                          } else {
                            startTyping()
                          }
                        }}
                        placeholder="Tapez votre message..."
                        rows={3}
                        className="resize-none pr-24 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        disabled={sending}
                      />
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        {/* Bouton upload */}
                        <div>
                          <Input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            id="admin-file-upload"
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.webm,.ogg,.mov,.avi"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => document.getElementById('admin-file-upload')?.click()}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            disabled={sending}
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Bouton envoi */}
                        <Button
                          onClick={handleSendReply}
                          disabled={sending || (!replyMessage.trim() && files.length === 0)}
                          size="sm"
                          className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600"
                        >
                          {sending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span>Vos messages apparaîtront en bleu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        <span>Messages du client en blanc</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-2 w-2" />
                        <span>Joignez des fichiers avec le trombone</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar droite - TOUTES les autres sections */}
        <div className="space-y-6">
          {/* Statut et actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Badge className={statusColors[quote.status as keyof typeof statusColors]}>
                    {statusLabels[quote.status as keyof typeof statusLabels]}
                  </Badge>
                  <span>Actions</span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {quote.status === 'PENDING' && (
                  <Button
                    onClick={() => handleUpdateStatus('NEGOTIATING')}
                    disabled={sending}
                    size="sm"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Prendre en charge
                  </Button>
                )}
                {(quote.status === 'PENDING' || quote.status === 'NEGOTIATING') && (
                  <Button
                    onClick={() => handleUpdateStatus('REJECTED')}
                    disabled={sending}
                    variant="destructive"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                )}
                {quote.status === 'PRICE_PROPOSED' && (
                  <Button
                    onClick={() => handleUpdateStatus('ACCEPTED')}
                    disabled={sending}
                    variant="default"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marquer comme accepté
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{quote.user.name || 'Nom non renseigné'}</p>
                    <p className="text-sm text-gray-600">{quote.user.email}</p>
                  </div>
                </div>
                
                {quote.user.phone && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Téléphone:</span>
                    <span className="text-sm">{quote.user.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">
                      Membre depuis {format(new Date(quote.createdAt), 'MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service demandé */}
          <Card>
            <CardHeader>
              <CardTitle>Service demandé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{quote.service.name}</h3>
                  {quote.service.description && (
                    <p className="text-gray-600 mt-1">{quote.service.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type de tarification:</span>
                    <p className="text-gray-600">{quote.service.pricingType}</p>
                  </div>
                  {quote.service.price && (
                    <div>
                      <span className="font-medium">Prix de base:</span>
                      <p className="text-gray-600"><PriceWithConversion price={quote.service.price} /></p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demande initiale */}
          <Card>
            <CardHeader>
              <CardTitle>Demande initiale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <span className="font-medium">Message:</span>
                  <p className="text-gray-700 mt-1 whitespace-pre-wrap">{quote.description}</p>
                </div>
                
                {quote.budget && (
                  <div>
                    <span className="font-medium">Budget indicatif:</span>
                    <p className="text-gray-700 mt-1 font-semibold"><PriceWithConversion price={quote.budget} /></p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Résumé financier */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé financier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quote.budget && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Budget client:</span>
                    <span className="text-sm font-medium"><PriceWithConversion price={quote.budget} /></span>
                  </div>
                )}
                
                {quote.proposedPrice && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Prix proposé:</span>
                    <span className="text-sm font-medium text-blue-600"><PriceWithConversion price={quote.proposedPrice} /></span>
                  </div>
                )}
                
                {quote.finalPrice && (
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-sm font-medium">Prix final:</span>
                    <span className="text-sm font-bold text-green-600"><PriceWithConversion price={quote.finalPrice} /></span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Proposition de prix */}
          {(quote.status === 'PENDING' || quote.status === 'NEGOTIATING' || quote.status === 'PRICE_PROPOSED') && (
            <Card>
              <CardHeader>
                <CardTitle>Proposer un prix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="proposedPrice">Prix proposé (Ar)</Label>
                    <Input
                      id="proposedPrice"
                      type="number"
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      placeholder="Entrez le prix proposé"
                    />
                  </div>
                  <Button
                    onClick={handleProposePrice}
                    disabled={sending || !proposedPrice.trim()}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Proposer ce prix
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 