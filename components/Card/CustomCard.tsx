import { Card, CardProps } from '@mantine/core'
import React from 'react'

interface CustomCardProps extends CardProps {
    children: React.ReactNode
}

export default function CustomCard({ children, ...props }: CustomCardProps) {
    return (
        <Card withBorder {...props}>
            {children}
        </Card>
    )
}