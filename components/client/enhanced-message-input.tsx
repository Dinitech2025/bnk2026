'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Send, 
  Paperclip, 
  Image, 
  Video, 
  File,
  X,
  Loader2,
  Smile
} from 'lucide-react'
import { toast } from 'sonner'

interface MediaFile {
  id: string
  file: File
  type: 'image' | 'video' | 'file'
  preview?: string
}

interface EnhancedMessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string, files?: MediaFile[]) => Promise<void>
  disabled?: boolean
  placeholder?: string
}

export function EnhancedMessageInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Tapez votre message..."
}: EnhancedMessageInputProps) {
  const [attachedFiles, setAttachedFiles] = useState<MediaFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  // Liste d'emojis populaires
  const popularEmojis = [
    '😊', '😂', '❤️', '👍', '👎', '😍', '😢', '😮', 
    '😡', '🤔', '👏', '🙏', '💪', '🔥', '⭐', '✅',
    '❌', '💯', '🎉', '🚀', '💰', '📝', '📞', '⏰'
  ]

  // Fermer le picker d'emoji en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  // Gérer la sélection de fichiers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      // Validation de la taille (max 4MB)
      if (file.size > 4 * 1024 * 1024) {
        toast.error(`Le fichier ${file.name} est trop volumineux (max 4MB)`)
        return
      }

      // Validation du type
      const allowedTypes = {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        video: ['video/mp4', 'video/webm', 'video/ogg'],
        file: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      }

      if (type !== 'file' && !allowedTypes[type].includes(file.type)) {
        toast.error(`Type de fichier non supporté: ${file.type}`)
        return
      }

      const mediaFile: MediaFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        type
      }

      // Créer une prévisualisation pour les images
      if (type === 'image') {
        const reader = new FileReader()
        reader.onload = (e) => {
          mediaFile.preview = e.target?.result as string
          setAttachedFiles(prev => [...prev, mediaFile])
        }
        reader.readAsDataURL(file)
      } else {
        setAttachedFiles(prev => [...prev, mediaFile])
      }
    })

    // Reset l'input
    event.target.value = ''
  }

  // Supprimer un fichier attaché
  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  // Insérer un emoji
  const insertEmoji = (emoji: string) => {
    onChange(value + emoji)
    setShowEmojiPicker(false)
  }

  // Gérer l'envoi
  const handleSend = async () => {
    if ((!value.trim() && attachedFiles.length === 0) || disabled) return

    try {
      await onSend(value, attachedFiles)
      onChange('')
      setAttachedFiles([])
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error)
    }
  }

  // Gérer les touches
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-3">
      {/* Fichiers attachés */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
          {attachedFiles.map((file) => (
            <div key={file.id} className="relative group">
              {file.type === 'image' && file.preview ? (
                <div className="relative">
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="w-16 h-16 object-cover rounded border"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-white rounded border p-2 pr-8 relative">
                  <File className="h-4 w-4 text-gray-500" />
                  <span className="text-sm truncate max-w-[100px]">{file.file.name}</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Zone de saisie */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[44px] max-h-[120px] resize-none pr-12"
          />
          
          {/* Bouton emoji */}
          <div className="absolute right-2 top-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          {/* Picker d'emoji */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-full right-0 mb-2 bg-white border rounded-lg shadow-lg p-3 z-50 w-64"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Emojis</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowEmojiPicker(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {popularEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-lg transition-colors"
                    onClick={() => insertEmoji(emoji)}
                    style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}
                    title={`Ajouter ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Boutons d'actions */}
        <div className="flex gap-1">
          {/* Bouton fichier général */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 w-11 p-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Bouton image */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 w-11 p-0"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            <Image className="h-4 w-4" />
          </Button>

          {/* Bouton vidéo */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 w-11 p-0"
            onClick={() => videoInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            <Video className="h-4 w-4" />
          </Button>

          {/* Bouton envoyer */}
          <Button
            onClick={handleSend}
            disabled={(!value.trim() && attachedFiles.length === 0) || disabled}
            className="h-11 px-4"
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Inputs cachés pour les fichiers */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.txt,.doc,.docx"
        onChange={(e) => handleFileSelect(e, 'file')}
      />
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(e, 'image')}
      />
      <input
        ref={videoInputRef}
        type="file"
        className="hidden"
        multiple
        accept="video/*"
        onChange={(e) => handleFileSelect(e, 'video')}
      />
    </div>
  )
}
