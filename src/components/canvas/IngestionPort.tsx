"use client";

import { useState } from 'react'
import type React from 'react'

type IngestionPortProps = {
  icon: string
  label: string
  onClick: () => void
}

const HOTKEY_MAP: Record<string, string> = {
  URL: 'U',
  Note: 'N',
  Media: 'M',
  Bookmark: 'B',
}

export function IngestionPort({ icon, label, onClick }: IngestionPortProps) {
  const [isHovered, setIsHovered] = useState(false)
  const hotkey = HOTKEY_MAP[label] ?? ''

  return (
    <button
      className="ingestion-port"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      type="button"
    >
      <span className="ingestion-port__icon">{icon}</span>
      <span className="ingestion-port__label">{label}</span>
      {isHovered && hotkey ? (
        <span className="ingestion-port__hotkey">{hotkey}</span>
      ) : null}
    </button>
  )
}
