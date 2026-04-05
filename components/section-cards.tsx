import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SectionCards({
    data,
    variant = "default",
}: {
    data: { title: string, value: string }[],
    variant?: "default" | "productivity"
}) {
    if (variant === "productivity") {
        return (
            <div className="px-4 lg:px-6">
                <div
                    className={cn(
                        "grid gap-3",
                        data.length >= 5
                            ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                            : data.length === 4
                                ? "grid-cols-2 xl:grid-cols-4"
                                : "grid-cols-1 md:grid-cols-3"
                    )}
                >
                    {data.map((card, index) => (
                        <Card key={index} className="border bg-card shadow-sm">
                            <CardContent className="p-4 text-center">
                                <p className="text-2xl font-black tabular-nums text-foreground">
                                    {card.value}
                                </p>
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                    {card.title}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

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
