'use client';

import React, { useRef } from 'react';
import { Camera, Check } from 'lucide-react';
import { PRESET_AVATAR_COLORS } from '@/types/demo-auth';

interface AvatarPickerProps {
  initials: string;
  selectedColor: string;
  avatarUrl?: string;
  onColorChange: (color: string) => void;
  onImageChange?: (dataUrl: string) => void;
}

export function AvatarPicker({
  initials,
  selectedColor,
  avatarUrl,
  onColorChange,
  onImageChange,
}: AvatarPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageChange) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onImageChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-[var(--paper)] border border-[var(--line)]">
      {/* Avatar Circle Preview */}
      <div className="relative group shrink-0">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-md border-2 border-white overflow-hidden transition-transform group-hover:scale-105"
          style={{ backgroundColor: selectedColor }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
          ) : (
            <span>{initials || 'FS'}</span>
          )}
        </div>

        {/* Local File Trigger */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-[var(--paper-elevated)] border border-[var(--line)] shadow-xs text-[var(--ink)] hover:text-[var(--flash-deep)] transition-colors"
          title="Upload local avatar preview"
          aria-label="Upload local avatar preview"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Color Selection & Instructions */}
      <div className="flex-1 text-center sm:text-left space-y-2">
        <div>
          <span className="text-xs font-semibold text-[var(--ink)]">Avatar Color</span>
          <p className="text-[11px] text-[var(--muted)]">
            Choose an accent color for your demo persona and team activity badge.
          </p>
        </div>

        <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1">
          {PRESET_AVATAR_COLORS.map((color) => {
            const isSelected = selectedColor === color.value;
            return (
              <button
                key={color.value}
                type="button"
                onClick={() => onColorChange(color.value)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-all ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-[var(--ink)] scale-110 shadow-xs'
                    : 'hover:scale-105 opacity-85 hover:opacity-100'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.label}
                aria-label={`Select ${color.label}`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
