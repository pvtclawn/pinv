"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GenerationFeedbackProps {
    onRate: (score: number) => void;
    className?: string;
}

export function GenerationFeedback({ onRate, className }: GenerationFeedbackProps) {
    const [rating, setRating] = useState<number | null>(null);
    const [hovered, setHovered] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleRate = (score: number) => {
        setRating(score);
        setSubmitted(true);
        onRate(score);
    };

    if (submitted) {
        return (
            <div className={cn("text-xs text-muted-foreground italic text-center py-2", className)}>
                Thanks for the feedback!  Lobster high-five. 🦞✋
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col items-center gap-2 py-4 border-t border-dashed border-border mt-4", className)}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rate this generation
            </div>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                    <button
                        key={score}
                        type="button"
                        className="transition-transform active:scale-95"
                        onMouseEnter={() => setHovered(score)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => handleRate(score)}
                    >
                        <Star
                            className={cn(
                                "w-6 h-6 transition-colors",
                                (hovered !== null ? score <= hovered : score <= (rating || 0))
                                    ? "fill-primary text-primary"
                                    : "text-muted-foreground/30"
                            )}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}
