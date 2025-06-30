'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Note {
  text: string
  timestamp: number
}

interface QuoteNotesProps {
  notes: Note[]
  onSave: (note: Note) => void
  loading?: boolean
}

function formatDateTime (ts: number) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Inline SVG for a subtle document icon
function NoteIcon () {
  return (
    <svg
      className='w-5 h-5 text-gray-400 flex-shrink-0'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 20 20'
      aria-hidden='true'
    >
      <rect
        x='4'
        y='3'
        width='12'
        height='14'
        rx='2'
        fill='#f3f4f6'
        stroke='#cbd5e1'
      />
      <path
        d='M7 7h6M7 10h6M7 13h4'
        stroke='#94a3b8'
        strokeWidth={1.2}
        strokeLinecap='round'
      />
    </svg>
  )
}

export function QuoteNotes ({ notes, onSave, loading }: QuoteNotesProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newNote, setNewNote] = useState('')

  const handleAddNote = () => {
    setIsAdding(true)
    setNewNote('')
  }

  const handleSaveNote = () => {
    if (newNote.trim() === '') return
    const noteObj = { text: newNote.trim(), timestamp: Date.now() }
    onSave(noteObj)
    setIsAdding(false)
    setNewNote('')
  }

  const handleCancel = () => {
    setIsAdding(false)
    setNewNote('')
  }

  return (
    <div className='rounded-lg border p-6'>
      <h2 className='mb-4 text-lg font-semibold'>Recent activity</h2>
      <div className='space-y-4'>
        {loading ? (
          <div className='text-muted-foreground border border-dashed rounded p-4 text-center'>
            Loading activity...
          </div>
        ) : notes.length === 0 && !isAdding ? (
          <div className='text-muted-foreground border border-dashed rounded p-4 text-center'>
            No recent activity
          </div>
        ) : null}
        {notes.length > 0 && !loading && (
          <div className='relative'>
            {[...notes].reverse().map((note, idx) => (
              <div
                key={idx}
                className='relative flex items-start mb-6 last:mb-0'
              >
                {/* Vertical line */}
                {idx !== notes.length - 1 && (
                  <span className='absolute left-2.5 top-6 w-px h-[calc(100%+1.5rem)] bg-gray-200 z-0' />
                )}
                <div className='flex flex-row items-start w-full'>
                  <span className='mt-1 mr-1 z-10'>
                    <NoteIcon />
                  </span>
                  <div className='bg-white px-4 w-full'>
                    <div className='text-sm mb-1 flex items-center'>
                      <span>{note.text}</span>
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {formatDateTime(note.timestamp)} by kenneth.mack@live.com
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {isAdding ? (
          <div className='space-y-2'>
            <Textarea
              placeholder='Add a note...'
              className='min-h-[80px]'
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              autoFocus
            />
            <div className='flex gap-2'>
              <Button onClick={handleSaveNote} disabled={newNote.trim() === ''}>
                Add note
              </Button>
              <Button variant='outline' onClick={handleCancel} type='button'>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant='outline' onClick={handleAddNote}>
            + Add note
          </Button>
        )}
      </div>
    </div>
  )
}
