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
  uploading?: boolean
}

interface EnhancedMessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string, files?: MediaFile[]) => Promise<void>
  disabled?: boolean
  placeholder?: string
}

export default function EnhancedMessageInput({
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

  const emojis = [
    '😀', '😊', '😂', '🥰', '😍', '🤔', '👍', '👎', 
    '❤️', '🎉', '✅', '❌', '💰', '📝', '📞', '✨',
    '🔥', '💯', '🚀', '⭐', '💡', '🎯', '🏆', '💪'
  ]

  // Fermer le sélecteur d'emojis en cliquant à l'extérieur
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

  const handleFileSelect = (files: FileList | null, type: 'image' | 'video' | 'file') => {
    if (!files) return

    Array.from(files).forEach(file => {
      // Vérifications de taille et type
      const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024 // 50MB pour vidéo, 10MB pour autres
      
      if (file.size > maxSize) {
        toast.error(`Fichier trop volumineux (max ${maxSize / 1024 / 1024}MB)`)
        return
      }

      const mediaFile: MediaFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        type,
        uploading: false
      }

      // Créer une preview pour les images
      if (type === 'image' && file.type.startsWith('image/')) {
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
  }

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleSend = async () => {
    if ((!value.trim() && attachedFiles.length === 0) || disabled) return

    try {
      setIsUploading(true)
      await onSend(value, attachedFiles)
      onChange('')
      setAttachedFiles([])
      setShowEmojiPicker(false)
    } catch (error) {
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setIsUploading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const insertEmoji = (emoji: string) => {
    onChange(value + emoji)
    setShowEmojiPicker(false)
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  return (
    <div className="space-y-3">
      {/* Fichiers attachés */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border">
          {attachedFiles.map((file) => (
            <div key={file.id} className="relative group">
              {file.type === 'image' && file.preview ? (
                <div className="relative">
                  <img
                    src={file.preview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                  <Button
                    onClick={() => removeFile(file.id)}
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border min-w-[120px]">
                  {getFileIcon(file.file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{file.file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <Button
                    onClick={() => removeFile(file.id)}
                    size="sm"
                    variant="ghost"
                    className="w-6 h-6 p-0 text-slate-400 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Zone de saisie principale */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isUploading}
          className="resize-none rounded-xl border-slate-200 focus:border-blue-400 pr-32 min-h-[80px]"
          rows={3}
        />
        
        {/* Boutons d'action dans la zone de texte */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {/* Emoji picker */}
          <div className="relative">
            <Button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-slate-400 hover:text-blue-500"
            >
              <Smile className="h-4 w-4" />
            </Button>
            
            {showEmojiPicker && (
              <div 
                ref={emojiPickerRef}
                className="absolute bottom-10 right-0 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 min-w-[280px]"
              >
                <div className="text-xs text-slate-600 mb-2 font-medium">Emojis populaires</div>
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(emoji)}
                      className="w-8 h-8 text-lg hover:bg-blue-50 hover:scale-110 rounded-lg transition-all duration-150 flex items-center justify-center"
                      style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}
                      title={`Ajouter ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 w-full text-center"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Boutons d'attachement */}
          <Button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-slate-400 hover:text-green-500"
            title="Ajouter une image"
          >
            <Image className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-slate-400 hover:text-purple-500"
            title="Ajouter une vidéo"
          >
            <Video className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-slate-400 hover:text-orange-500"
            title="Ajouter un fichier"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bouton d'envoi */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-slate-500">
          {attachedFiles.length > 0 && (
            <span>{attachedFiles.length} fichier(s) attaché(s)</span>
          )}
        </div>
        
        <Button
          onClick={handleSend}
          disabled={(!value.trim() && attachedFiles.length === 0) || disabled || isUploading}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Inputs cachés pour les fichiers */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files, 'image')}
        className="hidden"
      />
      
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleFileSelect(e.target.files, 'video')}
        className="hidden"
      />
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileSelect(e.target.files, 'file')}
        className="hidden"
      />
    </div>
  )
}
