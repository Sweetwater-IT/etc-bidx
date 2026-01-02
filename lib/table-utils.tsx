/* Common table utilities extracted from data-table.tsx */

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/formatUTCDate'

export type LegacyColumn = {
  key: string
  title: string
  className?: string
  sortable?: boolean
}

export type ExtendedColumn<TData> = ColumnDef<TData, any> & {
  className?: string
}

export const handleStatusVariant = (status: string) => {
  const normalized = status.toLowerCase().replace(/\s|_/g, '-')
  if (normalized === 'submitted') return 'successful'
  switch (normalized) {
    case 'in-progress':
    case 'in-process':
      return 'warning'
    case 'not-started':
      return 'secondary'
    case 'complete':
      return 'successful'
    case 'on-hold':
      return 'destructive'
    case 'open':
      return 'default'
    case 'pending':
      return 'warning'
    case 'urgent':
    case 'no-bid':
    case 'lost':
      return 'destructive'
    case 'bid':
    case 'won':
    case 'won-pending':
      return 'successful'
    case 'unset':
    case 'draft':
    default:
      return 'secondary'
  }
}

export const formatCellValue = (value: any, key: string, row?: any) => {
  if (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.toLowerCase() === 'unknown')
  ) {
    return '-'
  }

  // Handle special formatting for contractNumber and county fields
  if (
    (key === 'contractNumber' || key === 'county') &&
    typeof value === 'object' &&
    value !== null
  ) {
    if (value.main) {
      return (
        <div className='flex flex-col'>
          <span className={key === 'contractNumber' ? 'uppercase' : ''}>
            {value.main}
          </span>
          {value.secondary && (
            <span className='text-xs text-red-500'>{value.secondary}</span>
          )}
        </div>
      )
    }
  }

  // Format currency for total column and mptValue
  if (key === 'total' || key === 'mptValue') {
    // Handle if value is already formatted with $ (string)
    if (typeof value === 'string' && value.startsWith('$')) {
      return value
    }

    // Convert to number if it's a string without $ sign
    const numValue = typeof value === 'string' ? parseFloat(value) : value

    // Format as currency if it's a valid number
    if (!isNaN(numValue)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(numValue)
    }
    return value
  }

  if (key === 'dbe' || key === 'dbePercentage') {
    if (typeof value === 'string' && value.endsWith('%')) {
      return value
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value

    if (!isNaN(numValue)) {
      return `${numValue % 1 === 0 ? numValue.toFixed(0) : numValue}%`
    }
    return value
  }

  // Handle status badges
  if (
    key === 'status' ||
    key === 'projectStatus' ||
    key === 'billingStatus' ||
    key === 'shop_status' ||
    key === 'order_status'
  ) {
    const variant = handleStatusVariant(value)

    return (
      <Badge
        variant={variant}
        className={`font-medium ${variant === 'warning' && 'text-black'}`}
      >
        {key === 'projectStatus' || key === 'billingStatus'
          ? value.replace('_', ' ')
          : key === 'shop_status'
            ? value === 'not-started'
              ? 'Not Started'
              : value === 'in-progress'
                ? 'In-Process'
                : value === 'in-process'
                  ? 'In-Process'
                  : value === 'complete'
                    ? 'Complete'
                    : value === 'on-hold'
                      ? 'On Hold'
                      : value === 'on-order'
                        ? 'On Order'
                        : value
            : key === 'order_status'
              ? value === 'submitted' || value === 'SUBMITTED'
                ? 'Submitted'
                : value === 'draft' || value === 'DRAFT'
                  ? 'Draft'
                  : value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
              : value}
      </Badge>
    )
  }

  if (key === 'contractor' || key === 'subcontractor') {
    if (!value) return ''
    return value === '-' ? (
      '-'
    ) : (
      <Badge
        variant='outline'
        className='font-medium bg-background hover:bg-background'
      >
        {value}
      </Badge>
    )
  }

  if (value instanceof Date) {
    return formatDate(value)
  }
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    if (typeof value !== 'string') return value

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number)
        const timestamp = (key === 'created_at' || key === 'createdAt') ? ', 12:00 AM' : ''
        return `${monthNames[month - 1]} ${day}, ${year}${timestamp}`
      }

      const date = new Date(value)
      const monthName = monthNames[date.getMonth()]
      const dayNum = date.getDate()
      const yearNum = date.getFullYear()
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const amOrPm = hours >= 12 ? 'PM' : 'AM'
      const hoursFormatted = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
      const minutesFormatted = minutes.toString().padStart(2, '0')
      const timestamp = `, ${hoursFormatted}:${minutesFormatted} ${amOrPm}`

      if (key === 'created_at' || key === 'createdAt') {
        return `${monthName} ${dayNum}, ${yearNum}${timestamp}`
      }

      return `${monthName} ${dayNum}, ${yearNum}`
    } catch (e) {
      return value
    }
  }

  // Handle objects
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    if (value === null) {
      return ''
    }
    return JSON.stringify(value)
  }

  // QUOTES: Real bidx type_quote badge — EXACT MATCH
  if (key === "type") {
  const val = String(value || "").trim();
  const fullRow = row || {}; 

  let displayValue = "Unknown";

  if (val === "straight_sale") {
    displayValue = "Straight Sale";
  } else if (val === "to_project") {
    const jobNum = fullRow?.etc_job_number || "";
    displayValue = jobNum ? `Job: ${jobNum}` : "To Project";
  } else if (val === "estimate_bid") {
    const contractNum = fullRow?.estimate_contract_number || "";
    displayValue = contractNum ? `Bid: ${contractNum}` : "Estimate/Bid";
  }

  return (
    <Badge 
      variant="outline" 
      className="font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    >
      {displayValue}
    </Badge>
  );
}
  
  return value
}
