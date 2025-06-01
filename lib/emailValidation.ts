export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
    if (!email) return { isValid: true }; // Empty is ok for optional fields
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        return { isValid: false, message: "Please enter a valid email address" };
    }
    
    return { isValid: true };
};