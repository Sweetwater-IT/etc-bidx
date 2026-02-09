export interface InputData {
    name: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'number' | 'toggle'
    placeholder?: string
    options?: any[]
    hasToggle?: boolean
}