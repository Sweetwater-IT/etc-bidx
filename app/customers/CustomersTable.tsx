'use client'
import { useState, useEffect, useMemo } from 'react'
import { Badge, Button, Menu, Box, ActionIcon, Flex, SegmentedControl, Modal, Stack, Table, Loader, TextInput } from '@mantine/core'
import { IconChevronDown, IconPlus, IconTrash, IconEdit, IconEye, IconDotsVertical, IconSearch } from '@tabler/icons-react'
import { Contractor } from '@/app/customers/types'
import CustomCard from '@/components/Card/CustomCard'
import styles from './contractorTable.module.css'

interface Props {
  contractors: Contractor[]
  isLoading: boolean
  selectedContractor: Contractor | undefined
  handleSelectContractor: (contractor: Contractor) => void
}

// Simple fuzzy search function
const fuzzySearch = (items: Contractor[], searchTerm: string): Contractor[] => {
  const lowercaseSearchTerm = searchTerm.toLowerCase().trim()

  if (!lowercaseSearchTerm) return items

  return items.filter((item) => {
    const name = item.name.toLowerCase()

    // Exact match has highest priority
    if (name.includes(lowercaseSearchTerm)) return true

    // Check if the search term characters appear in the same order in the name
    let searchIndex = 0
    let nameIndex = 0

    while (searchIndex < lowercaseSearchTerm.length && nameIndex < name.length) {
      if (lowercaseSearchTerm[searchIndex] === name[nameIndex]) {
        searchIndex++
      }
      nameIndex++
    }

    // If we've gone through all search term characters, it's a match
    return searchIndex === lowercaseSearchTerm.length
  })
}

export function CustomersTable({ contractors, isLoading, selectedContractor, handleSelectContractor }: Props) {
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Use memoization to prevent unnecessary re-filtering on each render
  const filteredContractors = useMemo(() => {
    return fuzzySearch(contractors, searchTerm)
  }, [contractors, searchTerm])

  return (
    <CustomCard style={{ overflowY: 'auto', height: '80vh', marginTop: '-60px' }}>
      <TextInput
        leftSection={
          <IconSearch size={20} style={{ color: '#71717A',marginTop: '75px', zIndex: 1000, marginLeft: '150px' }} />
        }
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder='Search contractors...'
        mb="md"
        styles={{
          input: {
            height: '36px',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            backgroundColor: 'white',
            paddingLeft: '12px',
            '&:focus': {
              border: '1px solid #E2E8F0',
            },
          },
          section: {
            marginLeft: '12px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
          },
        }}
      />

      {isLoading ? (
        <Loader type='bars' size='sm' />
      ) : (
        <>
          {filteredContractors.length === 0 ? (
            <Box ta="center" py="xl" c="dimmed">No contractors found matching &quot;{searchTerm}&quot;</Box>
          ) : (
            <Table bg='white'>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Number</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody className={styles.contractorBody}>
                {filteredContractors.map(contractor => (
                  <Table.Tr key={contractor.id} style={{ cursor: 'pointer' }}
                    className={(contractor && contractor.id === selectedContractor?.id) ? styles.selectedRow : ''}
                    onClick={() => handleSelectContractor(contractor)}>
                    <Table.Td>{contractor.name}</Table.Td>
                    <Table.Td>{contractor.customerNumber}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </>
      )}
    </CustomCard>
  )
} 