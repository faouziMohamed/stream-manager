"use client";

import { useCallback, useRef, useState } from "react";
import { Check, Copy, ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadToCloudinary } from "@/lib/hooks/queries/use-settings.queries";

interface LogoUploaderProps {
  value: string;
  onChange: (url: string) => void;
  onUploaded?: (publicId: string) => void;
  onCleared?: () => void;
}

export function LogoUploader({
  value,
  onChange,
  onUploaded,
  onCleared,
}: LogoUploaderProps) {
  const uploadMutation = useUploadToCloudinary();
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentPublicId = useRef<string | null>(null);

  const readBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const base64 = await readBase64(file);
      const result = await uploadMutation.mutateAsync({
        base64,
        filename: `logos/${file.name}`,
      });
      if (result.success && result.url) {
        onChange(result.url);
        if (result.publicId) {
          currentPublicId.current = result.publicId;
          onUploaded?.(result.publicId);
        }
      }
    },
    [uploadMutation, onChange, onUploaded],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const isUploading = uploadMutation.isPending;

  if (value) {
    const raw = value.split("/").pop()?.split("?")[0] ?? "logo";
    const filename = raw.replace(/\.[^.]+$/, "").replace(/_\d{10,}$/, "");

    const handleCopy = () => {
      navigator.clipboard.writeText(value).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };

    return (
      <div className="flex items-center gap-2 w-full min-w-0 overflow-hidden rounded-lg border bg-muted/30 px-3 py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="logo"
          className="h-10 w-10 rounded-md object-cover border bg-background shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" title={value}>
            {filename}
          </p>
          <p className="text-xs text-muted-foreground">
            Logo uploadé sur Cloudinary
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
          title="Copier l'URL"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-destructive hover:text-destructive cursor-pointer"
          title="Supprimer le logo"
          onClick={() => {
            currentPublicId.current = null;
            onCleared?.();
            onChange("");
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onClick={() => !isUploading && fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-sm transition-colors select-none
                ${isUploading ? "cursor-wait" : "cursor-pointer"}
                ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"}`}
    >
      {isUploading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Téléversement…</span>
        </>
      ) : (
        <>
          <UploadCloud className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Glisser ou <span className="text-primary underline">parcourir</span>
          </span>
          <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
