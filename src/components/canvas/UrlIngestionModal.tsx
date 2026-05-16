"use client";

import { useCallback, useEffect, useRef, useState } from 'react'
import type React from 'react'
import { SacredButton, SacredField } from '@/components/sacred/Sacred'
import { createPearl } from '@/lib/pearls/store'
import type { Pearl, SourceType } from '@/lib/pearls/types'

type UrlIngestionModalProps = {
  onClose: () => void
  onPearlCreated: (pearl: Pearl) => void
  position: { x: number; y: number }
  bookmarkMode?: boolean
}

export function UrlIngestionModal({
  onClose,
  onPearlCreated,
  position,
  bookmarkMode = false,
}: UrlIngestionModalProps) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    inputRef.current?.focus()

    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const handleIngest = useCallback(() => {
    const trimmedUrl = url.trim()

    if (!trimmedUrl) {
      setStatus('error')
      setErrorMessage('Please enter a URL.')
      return
    }

    try {
      new URL(trimmedUrl)
    } catch {
      setStatus('error')
      setErrorMessage('Invalid URL format.')
      return
    }

    setStatus('loading')

    try {
      let title = ''
      let author = ''
      let thumbnailUrl = ''

      try {
        const parsed = new URL(trimmedUrl)
        title = parsed.hostname.replace(/^www\./, '') + parsed.pathname
          .replace(/\/$/, '')
          .split('/')
          .slice(-1)[0]
          ?.replace(/[-_]/g, ' ')
          .replace(/\.[a-z0-9]+$/i, '')
          .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase()) || parsed.hostname

        // Try to extract page title from common patterns
        if (parsed.hostname.includes('wikipedia.org')) {
          const pageName = parsed.pathname.split('/').filter(Boolean).pop()
          if (pageName) {
            title = pageName.replace(/_/g, ' ')
          }
        }

        if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
          thumbnailUrl = `https://img.youtube.com/vi/${parsed.searchParams.get('v') || parsed.pathname.split('/').pop()}/hqdefault.jpg`
        }
      } catch {
        // If URL parsing fails, use the raw URL
        title = trimmedUrl
      }

      const sourceType = (bookmarkMode ? 'article' : 'website') as SourceType

      const draft = {
        envelope: {
          title: title || trimmedUrl,
          source: trimmedUrl,
          author,
          date: new Date().toISOString().split('T')[0] ?? '',
          location: '',
          thumbnailUrl,
          sourceType,
          sourceUrl: trimmedUrl,
          encounterDate: new Date().toISOString().split('T')[0] ?? '',
          tags: [] as string[],
          mood: '',
        },
        experientialRecord: '',
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
  }, [url, position, bookmarkMode, onPearlCreated])

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && status !== 'loading') {
      handleIngest()
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
            <h2>{bookmarkMode ? 'Add Bookmark' : 'Ingest URL'}</h2>
            <SacredButton onClick={onClose} type="button">
              Cancel
            </SacredButton>
          </header>

          <SacredField label={bookmarkMode ? 'Bookmark URL' : 'Paste a URL to ingest'}>
            <input
              ref={inputRef}
              className="sacred-input"
              onChange={(event) => {
                setUrl(event.currentTarget.value)
                if (status === 'error') {
                  setStatus('idle')
                  setErrorMessage('')
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com/article"
              type="url"
              value={url}
            />
          </SacredField>

          {status === 'loading' ? (
            <p className="ingestion-modal__status">Ingesting...</p>
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
              {bookmarkMode ? 'Bookmark' : 'Ingest'}
            </SacredButton>
          </div>
        </section>
      </div>
    </div>
  )
}
