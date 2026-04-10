"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { Avatar } from "./Avatar";

async function fileToDataUrl(file: File, maxSize = 256): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Resize to fit within maxSize x maxSize for smaller storage
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function UserMenu({ onClose }: { onClose?: () => void }) {
  const t = useTranslations("common");
  const { user, logout, updateAvatar } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Invalid file type");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File too large (max 5MB)");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      await updateAvatar(dataUrl);
    } catch {
      setUploadError("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    onClose?.();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="spring-transition flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-[var(--glow-blue)]"
      >
        <Avatar email={user.email} avatarUrl={user.avatarUrl} size={32} />
        <span className="hidden max-w-[160px] truncate text-sm text-[var(--text-secondary)] md:inline">
          {user.email}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xl backdrop-blur-xl">
          <div className="flex flex-col items-center gap-2 border-b border-[var(--border-subtle)] p-4">
            <Avatar email={user.email} avatarUrl={user.avatarUrl} size={64} />
            <div className="w-full truncate text-center text-sm font-medium text-[var(--text-primary)]">
              {user.email}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="spring-transition rounded-lg bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--glow-blue)] disabled:opacity-50"
            >
              {uploading ? t("loading") : t("changeAvatar")}
            </button>
            {uploadError && (
              <p className="text-xs text-red-500">{uploadError}</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-500/10"
          >
            {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}
