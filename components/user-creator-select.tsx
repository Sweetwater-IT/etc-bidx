import * as React from "react"

import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"

import {

  Command,

  CommandEmpty,

  CommandGroup,

  CommandInput,

  CommandItem,

} from "@/components/ui/command"

import {

  Popover,

  PopoverContent,

  PopoverTrigger,

} from "@/components/ui/popover"

interface User {

  id: number

  name: string

  email: string

  role: string

}

interface UserCreatorSelectProps {

  users: User[]

  value: string | null

  onValueChange: (value: string | null) => void

}

export function UserCreatorSelect({ 

  users, 

  value, 

  onValueChange 

}: UserCreatorSelectProps) {

  const [open, setOpen] = React.useState(false)

  const selectedUser = React.useMemo(

    () => users.find((user) => user.email === value),

    [users, value]

  )

  return (

    <Popover open={open} onOpenChange={setOpen}>

      <PopoverTrigger asChild>

        <Button

          variant="outline"

          role="combobox"

          aria-expanded={open}

          className="w-[250px] justify-between"

        >

          {selectedUser ? `${selectedUser.name} (${selectedUser.role})` : "Select creator..."}

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />

        </Button>

      </PopoverTrigger>

      <PopoverContent className="w-[250px] p-0">

        <Command>

          <CommandInput placeholder="Search creator..." />

          <CommandEmpty>No creator found.</CommandEmpty>

          <CommandGroup>

            <CommandItem

              key="all"

              value="all"

              onSelect={() => {

                onValueChange(null)

                setOpen(false)

              }}

            >

              <Check

                className={cn(

                  "mr-2 h-4 w-4",

                  value === null ? "opacity-100" : "opacity-0"

                )}

              />

              All Creators

            </CommandItem>

            {users.map((user) => (

              <CommandItem

                key={user.id}

                value={user.email}

                onSelect={() => {

                  onValueChange(user.email)

                  setOpen(false)

                }}

              >

                <Check

                  className={cn(

                    "mr-2 h-4 w-4",

                    value === user.email ? "opacity-100" : "opacity-0"

                  )}

                />

                {user.name} ({user.role})

              </CommandItem>

            ))}

          </CommandGroup>

        </Command>

      </PopoverContent>

    </Popover>

  )

}
