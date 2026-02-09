export function handleNextDigits(current: string, inputType: string, data: string): string {
    let digits = current;

    if (inputType === "insertText" && /\d/.test(data)) {
        const candidate = current + data;
        if (parseInt(candidate, 10) <= 99999) digits = candidate;
    } else if (inputType === "deleteContentBackward") {
        digits = current.slice(0, -1);
    }

    return digits.padStart(3, "0");
}