// Get raw phone number (digits only) for storage
export const getPhoneDigits = (formattedPhone: string): string => {
    return formattedPhone.replace(/\D/g, '');
};

export const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

// Handle phone number input (removes formatting for processing)
export const handlePhoneInput = (inputType: string, data: string, currentValue: string): string => {
    if (inputType === "deleteContentBackward") {
        // Remove last character, handling formatted characters
        const digits = currentValue.replace(/\D/g, '');
        const newDigits = digits.slice(0, -1);
        return formatPhoneNumber(newDigits);
    } else if (inputType === "insertText" && /\d/.test(data)) {
        // Add new digit
        const digits = currentValue.replace(/\D/g, '');
        if (digits.length < 10) {
            return formatPhoneNumber(digits + data);
        }
    }
    return currentValue;
};