import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ScanFace } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinDisplayCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    title: React.ReactNode;
    description: React.ReactNode;
    imageSrc?: string | null;
    isLoading?: boolean;
    children?: React.ReactNode;
    // Optional placeholder icon/text overrides
    placeholderIcon?: React.ElementType;
    placeholderText?: string;
}

export default function PinDisplayCard({
    title,
    description,
    imageSrc,
    isLoading = false,
    children,
    className,
    placeholderIcon: PlaceholderIcon = ScanFace,
    placeholderText = "No preview available",
    ...props
}: PinDisplayCardProps) {
    return (
        <Card className={cn("h-full flex flex-col shadow-lg", className)} {...props}>
            <CardHeader className="text-center md:text-left bg-muted/5 border-b">
                <CardTitle className="text-xl md:text-2xl">{title}</CardTitle>
                <CardDescription className="text-sm md:text-base">{description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative min-h-[400px] flex items-center justify-center bg-muted/10">
                {/* Image Container */}
                <div className="w-full h-full flex items-center justify-center p-4">
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt="Pin Preview"
                            className="max-w-full max-h-[600px] object-contain shadow-md rounded-md"
                        />
                    ) : (
                        <div className="text-center text-muted-foreground flex flex-col items-center gap-2">
                            <PlaceholderIcon className="w-12 h-12 opacity-50" />
                            <p>{placeholderText}</p>
                        </div>
                    )}
                </div>

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm z-10">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                )}
            </CardContent>

            {(children) && (
                <CardFooter className="flex flex-col gap-4 border-t bg-muted/5 p-6 md:p-8">
                    {children}
                </CardFooter>
            )}
        </Card>
    );
}
