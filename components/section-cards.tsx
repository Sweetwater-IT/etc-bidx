import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CardData } from "@/data/jobs-cards";

export function SectionCards({ data }: { data: CardData[] }) {
    return (
        <div className="px-4 lg:px-6">
            <div className="grid grid-cols-6 gap-4">
                {data.map((card, index) => (
                    <Card key={index} className="flex flex-col !py-4">
                        <CardHeader>
                            <CardDescription>{card.title}</CardDescription>
                            <CardTitle className="font-semibold">{card.value}</CardTitle>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
}
