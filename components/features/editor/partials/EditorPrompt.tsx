"use client";

import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface EditorPromptProps {
    prompt: string;
    setPrompt: (value: string) => void;
    isGenerating: boolean;
    isConnected: boolean;
    hasGenerated: boolean;
    error: string | null;
    onGenerate: () => void;
    onBack: () => void;
}

export function EditorPrompt({
    prompt,
    setPrompt,
    isGenerating,
    isConnected,
    hasGenerated,
    error,
    onGenerate,
    onBack
}: EditorPromptProps) {
    return (
        <div className="space-y-4 pt-2">
            <Textarea
                placeholder="What would you show?"
                className="resize-none min-h-[120px]"
                value={prompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                disabled={!isConnected || isGenerating}
            />
            {!isConnected && (
                <p className="text-red-500 text-sm font-bold">Please connect wallet.</p>
            )}
            {error && (
                <p className="text-red-500 text-sm font-bold">{error}</p>
            )}
            <div className="flex gap-4">
                {!hasGenerated && (
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="flex-1"
                    >
                        Back
                    </Button>
                )}
                <Button
                    onClick={onGenerate}
                    disabled={isGenerating || !isConnected || !prompt.trim()}
                    isLoading={isGenerating}
                    className="flex-1"
                    icon={Wand2}
                >
                    {hasGenerated ? "Refine" : "Construct"}
                </Button>
            </div>
        </div>
    );
}
