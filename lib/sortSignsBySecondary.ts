import { PrimarySign, SecondarySign } from "@/types/MPTEquipment";

export function sortSignsBySecondary(allSigns: (PrimarySign | SecondarySign)[]): (PrimarySign | SecondarySign)[] {
    const primarySigns = allSigns.filter(sign => Object.hasOwn(sign, 'associatedStructure')) as PrimarySign[];
    const sortedSigns: (PrimarySign | SecondarySign)[] = []

    primarySigns.forEach(ps => {
        sortedSigns.push(ps)
        const associatedSecondaries = allSigns.filter(sign => (Object.hasOwn(sign, 'primarySignId') && (sign as SecondarySign).primarySignId === ps.id))
        sortedSigns.push(...associatedSecondaries)
    })

    return sortedSigns;
}