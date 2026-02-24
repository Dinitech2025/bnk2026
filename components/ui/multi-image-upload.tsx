"use client";

import { useState, useRef, useEffect } from "react";import { Button } from "@/components/ui/button";import { ImagePlus, X, ChevronLeft, ChevronRight } from "lucide-react";

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  onUpload?: (file: File) => Promise<string>;
  onMultipleUpload?: (files: File[]) => Promise<string[]>;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  allowMultiple?: boolean;
}

export function MultiImageUpload({
  value = [],
  onChange,
  onUpload,
  onMultipleUpload,
  maxFiles = 4,
  disabled,
  className = "",
  allowMultiple = false,
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (value.length >= maxFiles) {
      setError(`Vous ne pouvez pas ajouter plus de ${maxFiles} images`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      if (onUpload) {
        const url = await onUpload(file);
        onChange([...value, url]);
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      setError("Une erreur est survenue lors du téléchargement");
    } finally {
      setIsUploading(false);
    }
  };

  const handleMultipleFiles = async (files: FileList) => {
    const filesArray = Array.from(files);
    const availableSlots = maxFiles - value.length;
    
    if (filesArray.length > availableSlots) {
      setError(`Vous ne pouvez ajouter que ${availableSlots} images supplémentaires`);
      const limitedFiles = filesArray.slice(0, availableSlots);
      
      if (limitedFiles.length === 0) return;
      
      if (window.confirm(`Vous avez sélectionné ${filesArray.length} images mais seulement ${availableSlots} peuvent être ajoutées. Voulez-vous continuer avec les ${limitedFiles.length} premières?`)) {
        await processFiles(limitedFiles);
      }
    } else {
      await processFiles(filesArray);
    }
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setError(null);

    try {
      if (onMultipleUpload) {
        const urls = await onMultipleUpload(files);
        onChange([...value, ...urls]);
      } else if (onUpload) {
        const uploadPromises = files.map(file => onUpload(file));
        const urls = await Promise.all(uploadPromises);
        onChange([...value, ...urls]);
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement multiple:", error);
      setError("Une erreur est survenue lors du téléchargement");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const newImages = [...value];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (
      (direction === 'left' && index === 0) || 
      (direction === 'right' && index === value.length - 1)
    ) {
      return; // Ne rien faire si on essaie de déplacer hors des limites
    }

    const newImages = [...value];
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    
    // Échanger les positions
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    
    onChange(newImages);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (files.length > 1 && allowMultiple) {
      handleMultipleFiles(files);
    } else {
      handleUpload(files[0]);
    }
    
    // Réinitialiser l'input pour permettre de sélectionner à nouveau les mêmes fichiers
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {value.map((image, index) => (
          <div
            key={index}
            className="relative aspect-video rounded-lg overflow-hidden border"
          >
            <img
              src={image}
              alt={`Image ${index + 1}`}
              className="object-cover w-full h-full"
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                type="button"
                onClick={() => handleRemove(index)}
                variant="destructive"
                size="icon"
                className="h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="absolute bottom-2 right-2 flex gap-1">
              {index > 0 && (
                <Button
                  type="button"
                  onClick={() => moveImage(index, 'left')}
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6 bg-white bg-opacity-70 hover:bg-white"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
              )}
              {index < value.length - 1 && (
                <Button
                  type="button"
                  onClick={() => moveImage(index, 'right')}
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6 bg-white bg-opacity-70 hover:bg-white"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
              {index + 1}
            </div>
          </div>
        ))}
        {value.length < maxFiles && (
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video border-dashed flex flex-col items-center justify-center gap-2"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-sm">
              {isUploading ? "Téléchargement..." : allowMultiple ? "Ajouter des images" : "Ajouter une image"}
            </span>
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <input
        ref={fileInputRef}
        id="multi-image-upload"
        type="file"
        accept="image/*"
        multiple={allowMultiple}
        className="hidden"
        onChange={handleFileInputChange}
      />
      <p className="text-sm text-muted-foreground">
        Formats acceptés : PNG, JPG ou WEBP. Maximum {maxFiles} images.
        {allowMultiple && " Vous pouvez sélectionner plusieurs images à la fois."}
      </p>
    </div>
  );
} 