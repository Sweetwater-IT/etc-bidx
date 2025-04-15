import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface CardData {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  description: string
  subtitle: string
}

export function SectionCards({ data }: { data: CardData[] }) {
  const shouldWrap = data.length > 4

  return (
    <div className="px-4 lg:px-6">
      <div className="flex flex-wrap w-full gap-4">
        {data.map((card, index) => (
          <Card 
            key={index} 
            className="@container/card grow basis-0 min-w-[250px]"
          >
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {card.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="font-medium">
                  {card.trend === "up" ? (
                    <IconTrendingUp className="h-4 w-4" />
                  ) : (
                    <IconTrendingDown className="h-4 w-4" />
                  )}
                  {card.change}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {card.description}{" "}
                {card.trend === "up" ? (
                  <IconTrendingUp className="h-4 w-4" />
                ) : (
                  <IconTrendingDown className="h-4 w-4" />
                )}
              </div>
              <div className="text-muted-foreground">{card.subtitle}</div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
