'use client'
import { EstimateProvider } from '@/contexts/EstimateContext'
import React from 'react'
import SignOrderContentSimple from './SignOrderContentSimple'

const CreateSignOrderContent = () => {
    return (
        <EstimateProvider>
            <SignOrderContentSimple />
        </EstimateProvider>
    )
}

export default CreateSignOrderContent
