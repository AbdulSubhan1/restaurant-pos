"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageUploaderProps {
  initialImage?: string | null;
  onImageChange: (imageDataUrl: string | null) => void;
  className?: string;
}

export default function ImageUploader({
  initialImage,
  onImageChange,
  className,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(initialImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setPreview(null);
      onImageChange(null);
      return;
    }

    // Only accept image files
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Read the file as a data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setPreview(imageDataUrl);
      onImageChange(imageDataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setPreview(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Menu Item Image</Label>

      <div
        className={cn(
          "border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center min-h-[200px] cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary/50",
          preview ? "bg-gray-50" : "bg-white"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!preview ? triggerFileInput : undefined}
      >
        {preview ? (
          <div className="relative w-full h-full min-h-[180px]">
            <div className="absolute top-0 right-0 m-2 z-10">
              <Button
                variant="destructive"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={preview}
                alt="Menu item preview"
                width={200}
                height={200}
                className="max-h-[180px] object-contain rounded-md"
              />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm text-gray-500">
                Drag and drop an image, or click to browse
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
            </div>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleInputChange}
      />

      <p className="text-xs text-gray-500">
        Recommended: Square images, 500x500px or larger
      </p>
    </div>
  );
}
