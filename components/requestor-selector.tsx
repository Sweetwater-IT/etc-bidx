'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type RequestorLike = {
  id?: string | number | null
  name: string
  email?: string | null
}

interface RequestorSelectorProps<TUser extends RequestorLike> {
  users: TUser[]
  selectedUser?: TUser | null
  selectedName?: string | null
  onSelect: (user: TUser) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  buttonClassName?: string
  contentClassName?: string
}

function getRequestorKey(user: RequestorLike) {
  return [user.id ?? '', user.email ?? '', user.name].join('::')
}

function isSameRequestor(a: RequestorLike | null | undefined, b: RequestorLike) {
  if (!a) {
    return false
  }

  if (a.id != null && b.id != null) {
    return String(a.id) === String(b.id)
  }

  if (a.email && b.email) {
    return a.email === b.email
  }

  return a.name === b.name
}

export function RequestorSelector<TUser extends RequestorLike>({
  users,
  selectedUser,
  selectedName,
  onSelect,
  placeholder = 'Select requestor...',
  searchPlaceholder = 'Search requestor...',
  emptyMessage = 'No requestor found.',
  disabled = false,
  buttonClassName,
  contentClassName
}: RequestorSelectorProps<TUser>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  const normalizedSearch = search.trim().toLowerCase()
  const filteredUsers =
    normalizedSearch.length === 0
      ? users
      : users.filter(user =>
          `${user.name} ${user.email ?? ''}`.toLowerCase().includes(normalizedSearch)
        )

  const displayValue = selectedUser?.name ?? selectedName ?? placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between',
            !selectedUser && !selectedName && 'text-muted-foreground',
            buttonClassName
          )}
        >
          <span className='truncate'>{displayValue}</span>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className={cn('w-[var(--radix-popover-trigger-width)] p-0', contentClassName)}
      >
        <div className='border-b p-2'>
          <Input
            autoFocus
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className='h-9'
          />
        </div>
        <div className='max-h-64 overflow-y-auto p-1'>
          {filteredUsers.length === 0 ? (
            <div className='py-6 text-center text-sm text-muted-foreground'>
              {emptyMessage}
            </div>
          ) : (
            filteredUsers.map(user => {
              const selected = selectedUser
                ? isSameRequestor(selectedUser, user)
                : selectedName === user.name

              return (
                <button
                  key={getRequestorKey(user)}
                  type='button'
                  onClick={() => {
                    onSelect(user)
                    setOpen(false)
                  }}
                  className='flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground'
                >
                  <Check
                    className={cn('h-4 w-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')}
                  />
                  <div className='min-w-0 flex-1'>
                    <div className='truncate'>{user.name}</div>
                    {user.email ? (
                      <div className='truncate text-xs text-muted-foreground'>
                        {user.email}
                      </div>
                    ) : null}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
