'use client'
import CustomCard from '@/components/Card/CustomCard'
import { Contractor } from '@/app/customers/types'
import CustomPhoneNumberInput from '@/components/Input/CustomPhoneNumberInput'
import { Button, Divider, Grid, Loader, Modal, Stack, Table, Tabs, Text, TextInput, Group, ActionIcon } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconPencil, IconTrash, IconEdit } from '@tabler/icons-react'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'

interface Props {
    contractor: Contractor | undefined
    isReloading: boolean
    refetch: () => void
    handleEditContractor?: (contractor: Contractor) => void
}

export function CustomerInfo({ refetch, isReloading, contractor, handleEditContractor }: Props) {
    const [opened, { open, close }] = useDisclosure()
    const [name, setName] = useState<string>('')
    const [role, setRole] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [phone, setPhone] = useState<string>('')
    const [updating, setUpdating] = useState<boolean>(false)
    const [currentContactId, setCurrentContactId] = useState<number | undefined>(undefined)

    // Reset form when modal closes
    const handleClose = () => {
        setName('')
        setRole('')
        setPhone('')
        setEmail('')
        setCurrentContactId(undefined)
        close()
    }

    const handleCustomerUpload = async () => {
        setUpdating(true)
        
        // Determine if we're editing or creating
        const isEditing = Boolean(currentContactId)
        const method = isEditing ? 'PATCH' : 'POST'
        const body = isEditing 
            ? JSON.stringify({ name, role, email, phone, contactId: currentContactId })
            : JSON.stringify({ name, role, email, phone, contractorId: contractor?.id })
        
        const customerResponse = await fetch('/api/contractors/contacts', {
            method,
            body,
            headers: { 'Content-Type': 'application/json' }
        })
        
        if (customerResponse.ok) {
            notifications.show({
                color: 'green',
                message: `User successfully ${isEditing ? 'edited' : 'created'}`
            })
            
            // Important: Force refetch to update the table data
            await refetch()
            
            // Reset form fields after successful operation
            setName('')
            setRole('')
            setPhone('')
            setEmail('')
            setCurrentContactId(undefined)
        } else {
            notifications.show({
                color: 'red',
                message: `User ${isEditing ? 'editing' : 'creation'} failed`
            })
        }
        
        setUpdating(false)
        close()
    }

    const handleDeleteContact = async (index: number) => {
        setUpdating(true)
        const deleteResponse = await fetch('/api/contractors/contacts', {
            method: 'DELETE',
            body: JSON.stringify({ contactId: contractor?.contactIds[index]}),
            headers: { 'Content-Type': 'application/json' }
        })
        
        if (deleteResponse.ok) {
            notifications.show({
                color: 'green',
                message: 'User successfully deleted'
            })
            
            // Important: Force refetch to update the table data
            await refetch()
        } else {
            notifications.show({
                color: 'red',
                message: 'User deletion failed'
            })
        }
        setUpdating(false)
    }

    const handleEditContact = (index: number) => {
        // Just set form values and open modal - DON'T send the API request yet
        setCurrentContactId(contractor?.contactIds[index])
        setName(contractor?.names[index] || '')
        setRole(contractor?.roles[index] || '')
        setPhone(contractor?.phones[index] || '')
        setEmail(contractor?.emails[index] || '')
        open()
    }

    return (
        <CustomCard>
            <Modal 
                opened={opened} 
                onClose={handleClose} 
                title={currentContactId ? `Edit contact` : `Add new contact for ${contractor?.name}`} 
                size='md'
            >
                <Grid>
                    <Grid.Col span={6}>
                        <TextInput
                            label='Name'
                            placeholder='Name'
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <TextInput
                            label='Role'
                            placeholder='Role'
                            onChange={(e) => setRole(e.target.value)}
                            value={role}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <TextInput
                            label='Email'
                            placeholder='Email'
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <CustomPhoneNumberInput
                            label='Phone'
                            placeholder='Phone'
                            onChange={(e) => setPhone(e.currentTarget.value)}
                            value={phone}
                        />
                    </Grid.Col>
                    <Grid.Col span={12}>
                        <Button w='100%'
                            disabled={!email || updating}
                            onClick={handleCustomerUpload}
                        >Submit</Button>
                    </Grid.Col>
                </Grid>
            </Modal>
            {contractor ? <>
                <Group justify="space-between" align="center">
                    <Text>Contact details: {contractor.name}</Text>
                    <Button
                        variant="light"
                        size="sm"
                        leftSection={<IconPencil size={14} />}
                        onClick={() => {
                            // Call the parent's edit function if it exists
                            if (handleEditContractor && contractor) {
                                handleEditContractor(contractor)
                            }
                        }}
                    >
                        Edit Customer
                    </Button>
                </Group>
                <Tabs defaultValue="accountInfo">
                    <Tabs.List>
                        <Tabs.Tab value="accountInfo">Account Info</Tabs.Tab>
                        <Tabs.Tab value="contacts">Contacts</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="accountInfo">
                        <Grid mt={12}>
                            <Grid.Col span={6}>
                                <Text>Name: {contractor.name}</Text>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Text>URL: <Link href={contractor.url}>{contractor.url}</Link></Text>
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Divider />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Stack>
                                    <Text fw={500}>Address and Phone</Text>
                                    <Text>{contractor.address}</Text>
                                    <Text>{contractor.city}, {contractor.state}</Text>
                                    <Text>Zip: {contractor.zip}</Text>
                                    <Text>{contractor.phone}</Text>
                                </Stack>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Stack>
                                    <Text fw={500}>Change History</Text>
                                    <Text>Created at: {contractor.created ? new Date(contractor.created).toLocaleDateString() : ''}</Text>
                                    <Text>Updated: {contractor.updated}</Text>
                                </Stack>
                            </Grid.Col>
                        </Grid>
                    </Tabs.Panel>
                    <Tabs.Panel value="contacts">
                        <Button ml='auto' mt={12} style={{ display: 'block' }} leftSection={<IconPlus size={16} />} onClick={() => {
                            setCurrentContactId(undefined)
                            open()
                        }}>Add New Contact</Button>
                        {isReloading ? <Loader type='bars'/> :  <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Name</Table.Th>
                                    <Table.Th>Role</Table.Th>
                                    <Table.Th>Email</Table.Th>
                                    <Table.Th>Phone</Table.Th>
                                    <Table.Th></Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {contractor.emails && contractor.emails.length > 0 && contractor.emails.map((email, index) => (
                                    <Table.Tr key={`${contractor.id}-contact-${index}`}>
                                        <Table.Td>{contractor.names[index]}</Table.Td>
                                        <Table.Td>{contractor.roles[index]}</Table.Td>
                                        <Table.Td>{email}</Table.Td>
                                        <Table.Td>{contractor.phones[index] || ''}</Table.Td>
                                        <Table.Td>
                                            {email && email.length > 0 && <Group>
                                                <ActionIcon variant='subtle' onClick={() => handleEditContact(index)}><IconEdit /></ActionIcon>
                                                <ActionIcon variant='subtle' onClick={() => handleDeleteContact(index)}><IconTrash /></ActionIcon>
                                            </Group>}
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>}
                    </Tabs.Panel>
                </Tabs>
            </> : <Text>Select a customer</Text>}
        </CustomCard>
    )
} 