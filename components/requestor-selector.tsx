'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from '@/components/ui/command'
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

function findSelectedUser<TUser extends RequestorLike>(
  users: TUser[],
  selectedUser?: TUser | null,
  selectedName?: string | null
) {
  if (selectedUser) {
    const matchedById = users.find(user => {
      if (selectedUser.id == null || user.id == null) {
        return false
      }
      return String(user.id) === String(selectedUser.id)
    })

    if (matchedById) {
      return matchedById
    }

    const matchedByEmail = users.find(
      user => selectedUser.email && user.email && user.email === selectedUser.email
    )

    if (matchedByEmail) {
      return matchedByEmail
    }

    const matchedByName = users.find(user => user.name === selectedUser.name)
    if (matchedByName) {
      return matchedByName
    }
  }

  if (selectedName) {
    return users.find(user => user.name === selectedName) ?? null
  }

  return null
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
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const selectedRequestor = findSelectedUser(users, selectedUser, selectedName)
  const autoDefaultRef = useRef<string | null>(null)

  useEffect(() => {
    console.debug('[RequestorSelector] render-state', {
      options: users.length,
      selectedName: selectedRequestor?.name ?? selectedName ?? null,
      authEmail: user?.email ?? null
    })
  }, [selectedRequestor?.name, selectedName, user?.email, users.length])

  useEffect(() => {
    if (selectedRequestor || !users.length || !user) {
      return
    }

    const authEmail = user.email?.toLowerCase() ?? ''
    const authName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email ??
      ''

    const matchedUser =
      users.find(candidate => candidate.email?.toLowerCase() === authEmail) ??
      users.find(candidate => candidate.name === authName)

    if (!matchedUser) {
      if (autoDefaultRef.current !== '__no-match__') {
        console.warn('[RequestorSelector] no logged-in employee match found', {
          authEmail,
          authName,
          options: users.length
        })
        autoDefaultRef.current = '__no-match__'
      }
      return
    }

    const matchedKey = getRequestorKey(matchedUser)
    if (autoDefaultRef.current === matchedKey) {
      return
    }

    autoDefaultRef.current = matchedKey
    console.debug('[RequestorSelector] defaulting to logged-in user', {
      requestor: matchedUser.name,
      authEmail
    })
    onSelect(matchedUser)
  }, [onSelect, selectedRequestor, user, users])

  return (
    <Popover
      open={open}
      onOpenChange={nextOpen => {
        setOpen(nextOpen)
        console.debug('[RequestorSelector] popover-state', { open: nextOpen })
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between',
            buttonClassName
          )}
        >
          {selectedRequestor?.name ?? selectedName ?? placeholder}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-full p-0', contentClassName)}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup>
            {users.map(userOption => {
              const optionKey = getRequestorKey(userOption)
              const isSelected =
                selectedRequestor != null &&
                getRequestorKey(selectedRequestor) === optionKey

              return (
                <CommandItem
                  key={optionKey}
                  value={userOption.name}
                  onSelect={() => {
                    console.debug('[RequestorSelector] selected-requestor', {
                      requestor: userOption.name,
                      email: userOption.email ?? null
                    })
                    onSelect(userOption)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      isSelected ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {userOption.name}
                </CommandItem>
              )
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
