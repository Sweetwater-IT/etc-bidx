export type QuoteCreatorSegment = {
  label: string
  segmentLabel: string
  value: string
  aliases: string[]
}

export const QUOTE_CREATOR_SEGMENTS: QuoteCreatorSegment[] = [
  {
    label: "Napoleon Dunn",
    segmentLabel: "Dunn",
    value: "ndunn@establishedtraffic.com",
    aliases: ["ndunn@establishedtraffic.com", "Napoleon Dunn"],
  },
  {
    label: "Eric Frye",
    segmentLabel: "Frye",
    value: "efrye@establishedtraffic.com",
    aliases: ["efrye@establishedtraffic.com", "Eric Frye"],
  },
  {
    label: "Rad Bodkin",
    segmentLabel: "Bodkin",
    value: "rbodkin@establishedtraffic.com",
    aliases: ["rbodkin@establishedtraffic.com", "Rad Bodkin"],
  },
  {
    label: "Kenneth Austin",
    segmentLabel: "Austin",
    value: "kaustin@establishedtraffic.com",
    aliases: ["kaustin@establishedtraffic.com", "Kenneth Austin"],
  },
  {
    label: "Jim Turner",
    segmentLabel: "Turner",
    value: "jturner@establishedtraffic.com",
    aliases: ["jturner@establishedtraffic.com", "Jim Turner"],
  },
  {
    label: "Jim Redden",
    segmentLabel: "Redden",
    value: "jredden@establishedtraffic.com",
    aliases: ["jredden@establishedtraffic.com", "Jim Redden"],
  },
  {
    label: "John Nelson",
    segmentLabel: "Nelson",
    value: "jnelson@establishedtraffic.com",
    aliases: ["jnelson@establishedtraffic.com", "John Nelson"],
  },
]

export const QUOTE_CREATOR_NAME_BY_IDENTIFIER = Object.fromEntries(
  QUOTE_CREATOR_SEGMENTS.flatMap(segment => segment.aliases.map(alias => [alias, segment.label]))
) as Record<string, string>

export function getQuoteCreatorSegment(value: string | null | undefined) {
  if (!value) return null
  const normalizedValue = value.trim().toLowerCase()
  return (
    QUOTE_CREATOR_SEGMENTS.find(segment =>
      segment.aliases.some(alias => alias.trim().toLowerCase() === normalizedValue)
    ) || null
  )
}
