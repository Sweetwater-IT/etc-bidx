export function formatDecimal(value: string): string {
    return (parseInt(value, 10) / 100).toFixed(2)
}

export function formatCurrencyValue(value: string | number): string {
    return Number(value).toFixed(2);
}