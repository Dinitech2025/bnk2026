"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, Play, Image as ImageIcon, Video } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
  duration?: number;
}

interface MediaUploadProps {
  value: MediaItem[];
  onChange: (value: MediaItem[]) => void;
  onRemove: (index: number) => void;
  mediaType?: 'product' | 'service' | 'offer' | 'general';
  maxFiles?: number;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  value,
  onChange,
  onRemove,
  mediaType = 'general',
  maxFiles = 6
}) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      console.log('Fichiers acceptés:', acceptedFiles.length)
      console.log('Type de média:', mediaType)
      
      setUploading(true);

      const uploadPromises = acceptedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", mediaType);

        console.log('Envoi du fichier:', file.name, 'type:', file.type)

        try {
          const response = await fetch("/api/upload-imagekit", {
            method: "POST",
            body: formData
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Erreur de réponse:', errorData)
            throw new Error(errorData.error || "Erreur lors du téléchargement");
          }

          const data = await response.json();
          console.log('Réponse du serveur:', data)
          
          // Déterminer le type de média basé sur le MIME type
          const isVideo = file.type.startsWith('video/');
          
          return {
            url: data.url,
            type: isVideo ? 'video' as const : 'image' as const,
            thumbnail: data.thumbnail || null,
            duration: data.duration || null
          };
        } catch (error) {
          console.error("Erreur détaillée:", error);
          return null;
        }
      });

      const mediaItems = (await Promise.all(uploadPromises)).filter(
        (item) => item !== null
      ) as MediaItem[];
      
      console.log('Médias obtenus:', mediaItems)
      onChange([...value, ...mediaItems]);
      setUploading(false);
    },
    [value, onChange, mediaType]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
      "video/*": [".mp4", ".webm", ".mov", ".avi"]
    },
    maxFiles: maxFiles - value.length,
    disabled: uploading || value.length >= maxFiles
  });

  const renderMediaPreview = (media: MediaItem, index: number) => {
    if (media.type === 'video') {
      return (
        <div key={`${media.url}-${index}`} className="relative w-[200px] h-[200px] rounded-lg overflow-hidden border">
          <div className="z-10 absolute top-2 right-2">
            <Button
              type="button"
              onClick={() => onRemove(index)}
              variant="destructive"
              size="icon"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="z-10 absolute top-2 left-2">
            <div className="bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center">
              <Video className="h-3 w-3 mr-1" />
              Vidéo
            </div>
          </div>
          {media.thumbnail ? (
            <Image
              fill
              className="object-cover"
              alt="Thumbnail vidéo"
              src={media.thumbnail}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Play className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <Play className="h-8 w-8 text-white" />
          </div>
        </div>
      );
    }

    return (
      <div key={`${media.url}-${index}`} className="relative w-[200px] h-[200px] rounded-lg overflow-hidden border">
        <div className="z-10 absolute top-2 right-2">
          <Button
            type="button"
            onClick={() => onRemove(index)}
            variant="destructive"
            size="icon"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="z-10 absolute top-2 left-2">
          <div className="bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center">
            <ImageIcon className="h-3 w-3 mr-1" />
            Image
          </div>
        </div>
        <Image
          fill
          className="object-cover"
          alt="Image"
          src={media.url}
        />
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        {value.map((media, index) => renderMediaPreview(media, index))}
      </div>
      
      {value.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-4 rounded-lg hover:border-primary cursor-pointer text-center transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : ''
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload className="h-6 w-6 mx-auto mb-2" />
          {uploading ? (
            <p>Téléchargement en cours...</p>
          ) : isDragActive ? (
            <p>Déposez les médias ici</p>
          ) : (
            <p>Glissez et déposez des images ou vidéos ici, ou cliquez pour sélectionner</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Images: PNG, JPG, WEBP, GIF | Vidéos: MP4, WEBM, MOV
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum {maxFiles} fichiers ({maxFiles - value.length} restants)
          </p>
        </div>
      )}
    </div>
  );
}; 