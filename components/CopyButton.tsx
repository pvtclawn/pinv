"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
    url: string;
}

export default function CopyButton({ url }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2s
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    return (
        <Button
            onClick={handleCopy}
            variant="secondary"
            className="bg-[#111218] hover:bg-[#111218]/90 text-white border border-white/10 font-bold min-w-[120px]"
        >
            {copied ? (
                <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Copied
                </>
            ) : (
                <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                </>
            )}
        </Button>
    );
}
