import { TextInput, TextInputProps } from '@mantine/core'
import React from 'react'

interface CustomPhoneNumberInputProps extends TextInputProps {
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function CustomPhoneNumberInput({ value, onChange, ...props }: CustomPhoneNumberInputProps) {
    const formatPhoneNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '')
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`
        }
        return value
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatPhoneNumber(e.target.value)
        onChange({
            ...e,
            target: {
                ...e.target,
                value: formattedValue
            }
        })
    }

    return (
        <TextInput
            {...props}
            value={value}
            onChange={handleChange}
        />
    )
} 