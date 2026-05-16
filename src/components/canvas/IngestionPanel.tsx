"use client";

import { useCallback, useEffect, useRef, useState } from 'react'
import type React from 'react'
import { IngestionPort } from '@/components/canvas/IngestionPort'
import { UrlIngestionModal } from '@/components/canvas/UrlIngestionModal'
import { QuickNoteModal } from '@/components/canvas/QuickNoteModal'
import { FileDropZone, processDroppedFiles } from '@/components/canvas/FileDropZone'
import type { Pearl } from '@/lib/pearls/types'

type IngestionKind = 'url' | 'note' | 'media' | 'bookmark'

type IngestionPanelProps = {
  onPearlCreated: (pearl: Pearl) => void
  canvasCenter: { x: number; y: number }
}

export function IngestionPanel({ onPearlCreated, canvasCenter }: IngestionPanelProps) {
  const [activePort, setActivePort] = useState<IngestionKind | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounterRef = useRef(0)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement

      if (isTyping) return

      switch (event.key.toLowerCase()) {
        case 'u':
          event.preventDefault()
          setActivePort((current) => (current === 'url' ? null : 'url'))
          break
        case 'n':
          event.preventDefault()
          setActivePort((current) => (current === 'note' ? null : 'note'))
          break
        case 'm':
          event.preventDefault()
          setActivePort((current) => (current === 'media' ? null : 'media'))
          break
        case 'b':
          event.preventDefault()
          setActivePort((current) => (current === 'bookmark' ? null : 'bookmark'))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounterRef.current += 1

    if (event.dataTransfer.types?.includes('Files')) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounterRef.current -= 1

    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)
    dragCounterRef.current = 0

    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      processDroppedFiles(Array.from(files), canvasCenter, onPearlCreated)
    }
  }, [canvasCenter, onPearlCreated])

  function handleCloseModal() {
    setActivePort(null)
  }

  function handlePearlCreated(pearl: Pearl) {
    onPearlCreated(pearl)
    setActivePort(null)
  }

  function openFileDialog() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,audio/*,video/*,.pdf,.txt'
    input.multiple = true
    input.onchange = () => {
      const files = input.files
      if (!files || files.length === 0) return

      processDroppedFiles(Array.from(files), canvasCenter, onPearlCreated)
    }
    input.click()
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ position: 'fixed', inset: 0, zIndex: 41, pointerEvents: isDragOver ? 'auto' : 'none' }}
    >
      {isDragOver ? (
        <FileDropZone
          onDrop={(files) => {
            setIsDragOver(false)
            dragCounterRef.current = 0
            processDroppedFiles(Array.from(files), canvasCenter, onPearlCreated)
          }}
        />
      ) : null}

      <section className="ingestion-panel">
        <IngestionPort
          icon="🔗"
          label="URL"
          onClick={() => setActivePort('url')}
        />
        <IngestionPort
          icon="✏️"
          label="Note"
          onClick={() => setActivePort('note')}
        />
        <IngestionPort
          icon="📁"
          label="Media"
          onClick={openFileDialog}
        />
        <IngestionPort
          icon="🔖"
          label="Bookmark"
          onClick={() => setActivePort('bookmark')}
        />
      </section>

      {activePort === 'url' ? (
        <UrlIngestionModal
          onClose={handleCloseModal}
          onPearlCreated={handlePearlCreated}
          position={canvasCenter}
        />
      ) : null}

      {activePort === 'note' ? (
        <QuickNoteModal
          onClose={handleCloseModal}
          onPearlCreated={handlePearlCreated}
          position={canvasCenter}
        />
      ) : null}

      {activePort === 'bookmark' ? (
        <UrlIngestionModal
          onClose={handleCloseModal}
          onPearlCreated={handlePearlCreated}
          position={canvasCenter}
          bookmarkMode
        />
      ) : null}
    </div>
  )
}
