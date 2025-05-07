import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { CardData } from "@/data/jobs-cards";

export function SectionCards({ data }: { data: CardData[] }) {
    return (

        <div className="px-4 lg:px-6">
            <div className="flex flex-wrap w-full gap-4">
                {data.map((card, index) => (
                    <Card
                        key={index}
                        className="@container/card grow basis-0"
                    >
                        <CardHeader>
                            <CardDescription>{card.title}</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {card.value}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
}
