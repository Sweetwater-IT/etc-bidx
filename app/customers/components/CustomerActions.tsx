'use client'
import { Button, Group } from '@mantine/core'
import { IconDownload, IconPlus, IconUpload } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

interface CustomerActionsProps {
    onCreateClick: () => void
}

export function CustomerActions({ onCreateClick }: CustomerActionsProps) {
    const handleCreateClick = () => {
        console.log('Create button clicked');
        onCreateClick();
    };

    return (
        <Group gap={6}>
            <Button
                styles={{
                    root: {
                        backgroundColor: '#171717',
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        padding: '5px 5px',
                        marginRight: '10px',
                        '&:hover': {
                            backgroundColor: '#2e2e2e'
                        }
                    },
                    inner: {
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                    }
                }}
                onClick={handleCreateClick}
            >
                <IconPlus size={14} style={{ display: 'inline', marginTop: '-3px' }} /> Create Customer
            </Button>
            <Button 
                styles={{
                    root: {
                        backgroundColor: '#171717',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 500,
                        borderRadius: '8px',
                        padding: '5px 5px',
                        marginRight: '10px',
                        '&:hover': {
                            backgroundColor: '#2e2e2e'
                        }
                    },
                    inner: {
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                    }
                }}
                onClick={() => {
                    notifications.show({
                        color: 'blue',
                        message: 'Export functionality coming soon'
                    })
                }}
            >
                <IconDownload size={14} style={{ display: 'inline', marginTop: '-3px' }} /> Export
            </Button>
            <Button 
                styles={{
                    root: {
                        backgroundColor: '#171717',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 500,
                        borderRadius: '8px',
                        padding: '5px 5px',
                        '&:hover': {
                            backgroundColor: '#2e2e2e'
                        }
                    },
                    inner: {
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                    }
                }}
                onClick={() => {
                    notifications.show({
                        color: 'blue',
                        message: 'Import functionality coming soon'
                    })
                }}
            >
                <IconUpload size={14} style={{ display: 'inline', marginTop: '-3px' }} /> Import
            </Button>
        </Group>
    )
} 