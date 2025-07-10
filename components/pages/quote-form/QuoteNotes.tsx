'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'
import { useAuth } from "@/contexts/auth-context";

export interface Note {
  text: string
  timestamp: number
}

interface QuoteNotesProps {
  notes: Note[]
  onSave: (note: Note) => void
  onEdit: (index: number, updatedNote: Note) => void
  onDelete: (index: number) => void
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

export function QuoteNotes ({
  notes,
  onSave,
  onEdit,
  onDelete,
  loading
}: QuoteNotesProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { user } = useAuth();

  const handleAddNote = () => {
    setIsAdding(true)
    setNewNote('')
    setEditIndex(null)
  }

  const handleSaveNote = () => {
    if (newNote.trim() === '') return
    const noteObj = { text: newNote.trim(), timestamp: Date.now() }
    onSave(noteObj)
    setIsAdding(false)
    setNewNote('')
  }

  const handleEditNote = (idx: number) => {
    setEditIndex(idx)
    setEditValue(notes[idx].text)
    setIsAdding(false)
  }

  const handleUpdateNote = () => {
    if (editIndex === null || editValue.trim() === '') return
    const updatedNote = { ...notes[editIndex], text: editValue.trim() }
    onEdit(editIndex, updatedNote)
    setEditIndex(null)
    setEditValue('')
  }

  const handleDeleteNote = (idx: number) => {
    setDeleteIndex(idx)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      onDelete(deleteIndex)
    }
    setShowDeleteModal(false)
    setDeleteIndex(null)
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setDeleteIndex(null)
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
            {notes.map((note, idx) => (
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
                    {editIndex === idx ? (
                      <div className='space-y-2'>
                        <Textarea
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className='min-h-[80px]'
                          autoFocus
                        />
                        <div className='flex gap-2'>
                          <Button
                            onClick={handleUpdateNote}
                            disabled={editValue.trim() === ''}
                          >
                            Update note
                          </Button>
                          <Button
                            variant='outline'
                            onClick={() => setEditIndex(null)}
                            type='button'
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className='text-sm mb-1 flex items-center'>
                          <span>{note.text}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='ml-2'
                              >
                                <span className='sr-only'>Open options</span>
                                <MoreVertical className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-28'>
                              <DropdownMenuItem
                                onClick={() => handleEditNote(idx)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteNote(idx)}
                                variant='destructive'
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {formatDateTime(note.timestamp)} by
                          {user?.email || ''}
                        </div>
                      </>
                    )}
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
              <Button
                variant='outline'
                onClick={() => setIsAdding(false)}
                type='button'
              >
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
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30'>
          <div className='bg-white rounded-lg p-6 shadow-lg w-80'>
            <h3 className='text-lg font-semibold mb-4'>Delete Note</h3>
            <p className='mb-6'>Are you sure you want to delete this note?</p>
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={cancelDelete}>
                Cancel
              </Button>
              <Button variant='destructive' onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
