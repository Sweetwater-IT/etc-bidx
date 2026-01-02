/* Common table utilities extracted from data-table.tsx */

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/formatUTCDate'

export type LegacyColumn = {
  key
