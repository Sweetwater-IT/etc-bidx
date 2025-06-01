export function formatDecimal(value: string): string {
    return (parseInt(value, 10) / 100).toFixed(2)
}