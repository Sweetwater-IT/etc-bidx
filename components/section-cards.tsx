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
import type { CardData } from "@/data/jobs-cards"

export function SectionCards({ data }: { data: CardData[] }) {
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
              {card.change !== undefined && (
                <CardAction>
                  <Badge variant="outline" className="font-medium">
                    {card.trend === "up" ? (
                      <IconTrendingUp className="h-4 w-4" />
                    ) : card.trend === "down" ? (
                      <IconTrendingDown className="h-4 w-4" />
                    ) : null}
                    {card.change > 0 ? "+" : ""}{card.change}%
                  </Badge>
                </CardAction>
              )}
            </CardHeader>
            {(card.description || card.subtitle) && (
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                {card.description && (
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    {card.description}{" "}
                    {card.trend === "up" ? (
                      <IconTrendingUp className="h-4 w-4" />
                    ) : card.trend === "down" ? (
                      <IconTrendingDown className="h-4 w-4" />
                    ) : null}
                  </div>
                )}
                {card.subtitle && (
                  <div className="text-muted-foreground">{card.subtitle}</div>
                )}
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
