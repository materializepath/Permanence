"use client";

import { useCallback, useEffect, useRef, useState } from 'react'
import type React from 'react'
import { SacredButton } from '@/components/sacred/Sacred'
import { createPearl } from '@/lib/pearls/store'
import type { Pearl } from '@/lib/pearls/types'

type QuickNoteModalProps = {
  onClose: () => void
  onPearlCreated: (pearl: Pearl) => void
  position: { x: number; y: number }
}

export function QuickNoteModal({
  onClose,
  onPearlCreated,
  position,
}: QuickNoteModalProps) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    textareaRef.current?.focus()

    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const handleIngest = useCallback(() => {
    const trimmedText = text.trim()

    if (!trimmedText) {
      setStatus('error')
      setErrorMessage('Please enter some text.')
      return
    }

    setStatus('loading')

    try {
      const lines = trimmedText.split('\n')
      const title = lines[0]?.trim() ?? 'Untitled Note'
      const body = trimmedText

      const draft = {
        envelope: {
          title,
          source: '',
          author: '',
          date: new Date().toISOString().split('T')[0] ?? '',
          location: '',
          thumbnailUrl: '',
          sourceType: 'other' as const,
          encounterDate: new Date().toISOString().split('T')[0] ?? '',
          tags: [] as string[],
          mood: '',
        },
        experientialRecord: body,
        intellectualSynthesis: '',
        professorTranscript: [],
        connections: [],
        attachments: [],
      }

      const result = createPearl(draft)

      setStatus('success')

      window.dispatchEvent(
        new CustomEvent('pearl-ingested', {
          detail: { pearlId: result.pearl.id, position },
        }),
      )

      onPearlCreated(result.pearl)
    } catch {
      setStatus('error')
      setErrorMessage('Failed to create Pearl. Please try again.')
    }
  }, [text, position, onPearlCreated])

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      if (status !== 'loading') {
        handleIngest()
      }
    }
  }

  return (
    <div
      className="pearl-modal"
      role="dialog"
      aria-modal="true"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose()
        }
      }}
    >
      <div
        className="pearl-modal__window ingestion-modal"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <section className="ingestion-modal__body">
          <header className="ingestion-modal__header">
            <h2>Quick Note</h2>
            <SacredButton onClick={onClose} type="button">
              Cancel
            </SacredButton>
          </header>

          <label className="sacred-field">
            <span>Write your note</span>
            <textarea
              ref={textareaRef}
              className="sacred-input ingestion-modal__textarea"
              onChange={(event) => {
                setText(event.currentTarget.value)
                if (status === 'error') {
                  setStatus('idle')
                  setErrorMessage('')
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="First line becomes the title..."
              value={text}
            />
          </label>

          {status === 'loading' ? (
            <p className="ingestion-modal__status">Creating Pearl...</p>
          ) : null}

          {status === 'error' ? (
            <p className="ingestion-modal__error">{errorMessage}</p>
          ) : null}

          <div className="ingestion-modal__actions">
            <SacredButton
              disabled={status === 'loading'}
              onClick={handleIngest}
              type="button"
            >
              Create Pearl
            </SacredButton>
          </div>
        </section>
      </div>
    </div>
  )
}
