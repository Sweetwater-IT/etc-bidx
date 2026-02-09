import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function SectionCards({ data }: { data: {title: string, value: string}[] }) {
    return (

        <div className="px-4 lg:px-6">
            <div className="grid grid-cols-4 w-full gap-4">
                {data.length === 3  && <div></div>}
                {data.map((card, index) => (
                    <Card
                        key={index}
                        className="@container/card basis-0"
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
