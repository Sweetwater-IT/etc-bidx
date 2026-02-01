"use client"

import * as React from "react"
import { User } from "@/types/User"
import { fetchReferenceData } from "@/lib/api-client"
import { Combobox, ComboboxItem } from "@/components/ui/combobox"
import { toast } from "sonner"

interface ChooseRequestorComponentProps {
  value?: User | null
  onValueChange: (user: User | null) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export function ChooseRequestorComponent({
  value,
  onValueChange,
  placeholder = "Select requestor...",
  disabled = false,
  required = false,
}: ChooseRequestorComponentProps) {
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(false)

  // Fetch users on mount
  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        const fetchedUsers = await fetchReferenceData('users')
        setUsers(fetchedUsers || [])
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error('Error fetching users')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  // Convert users to combobox items (only include users with valid ids)
  const userItems: ComboboxItem[] = users
    .filter(user => user.id != null)
    .map(user => ({
      value: user.id!.toString(),
      label: user.name,
      user: user, // Store the full user object
    }))

  const handleValueChange = (selectedValue: string) => {
    if (!selectedValue) {
      onValueChange(null)
      return
    }

    const selectedItem = userItems.find(item => item.value === selectedValue)
    if (selectedItem) {
      onValueChange(selectedItem.user)
    }
  }

  const currentValue = value && value.id ? value.id.toString() : ""

  return (
    <Combobox
      items={userItems}
      value={currentValue}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      searchPlaceholder="Search requestors..."
      emptyMessage="No requestors found."
      disabled={disabled || loading}
    />
  )
}