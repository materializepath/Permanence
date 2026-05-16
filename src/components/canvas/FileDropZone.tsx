"use client";

import { useCallback, useRef, useState } from 'react'
import type React from 'react'
import { createPearl } from '@/lib/pearls/store'
import type { Pearl, SourceType } from '@/lib/pearls/types'

type FileDropZoneProps = {
  onDrop: (files: FileList) => void
}

export function FileDropZone({ onDrop }: FileDropZoneProps) {
  const dropRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsActive(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsActive(false)
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsActive(false)

      const files = event.dataTransfer.files
      if (files && files.length > 0) {
        onDrop(files)
      }
    },
    [onDrop],
  )

  return (
    <div
      ref={dropRef}
      className={`file-drop-zone ${isActive ? 'file-drop-zone--active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="file-drop-zone__content">
        <span className="file-drop-zone__icon">📁</span>
        <p className="file-drop-zone__text">Drop files to create Pearls</p>
        <p className="file-drop-zone__hint">Images, audio, video, PDFs, text files</p>
      </div>
    </div>
  )
}

export function processDroppedFiles(
  files: File[],
  position: { x: number; y: number },
  onPearlCreated: (pearl: Pearl) => void,
) {
  for (const file of files) {
    processSingleFile(file, position, onPearlCreated)
  }
}

function processSingleFile(
  file: File,
  position: { x: number; y: number },
  onPearlCreated: (pearl: Pearl) => void,
) {
  const reader = new FileReader()

  reader.onload = (event) => {
    const dataUrl = event.target?.result as string
    const name = file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]/g, ' ')
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg']
    const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a']
    const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv']
    const textExts = ['txt', 'md', 'csv']

    let sourceType: SourceType = 'other'
    if (imageExts.includes(ext)) sourceType = 'exhibition'
    else if (audioExts.includes(ext)) sourceType = 'music'
    else if (videoExts.includes(ext)) sourceType = 'film'
    else if (textExts.includes(ext)) sourceType = 'article'

    const isImage = imageExts.includes(ext)
    const thumbnailUrl = isImage ? dataUrl : ''

    const draft = {
      envelope: {
        title: name || file.name,
        source: file.name,
        author: '',
        date: new Date().toISOString().split('T')[0] ?? '',
        location: '',
        thumbnailUrl,
        sourceType,
        encounterDate: new Date().toISOString().split('T')[0] ?? '',
        tags: [] as string[],
        mood: '',
      },
      experientialRecord: `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      intellectualSynthesis: '',
      professorTranscript: [],
      connections: [],
      attachments: [
        {
          id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          label: file.name,
          url: dataUrl,
        },
      ],
    }

    try {
      const result = createPearl(draft)

      window.dispatchEvent(
        new CustomEvent('pearl-ingested', {
          detail: { pearlId: result.pearl.id, position },
        }),
      )

      onPearlCreated(result.pearl)
    } catch {
      // Silently fail for individual files
    }
  }

  reader.readAsDataURL(file)
}
