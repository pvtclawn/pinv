"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Pin } from "@/types";
import { useWidgetGeneration, useDataCodeRunner, usePreviewRenderer } from "@/hooks";
import { cn } from "@/lib/utils";

import { EditorPrompt } from "./partials/EditorPrompt";
import { EditorConfig } from "./partials/EditorConfig";
import { EditorCode } from "./partials/EditorCode";
import { EditorLogs } from "./partials/EditorLogs";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import PinDisplayCard from "../viewer/PinDisplayCard";

import { Button } from "@/components/ui/button";
import { Play, Save, Wand2, Settings2, Code2, TerminalSquare, ChevronLeft } from "lucide-react";

interface PinEditorProps {
    pinId: number;
    pin: Pin | null;
}

const SECTION_CONFIG = [
    {
        id: "prompt",
        icon: Wand2,
        label: "Prompt",
    },
    {
        id: "config",
        icon: Settings2,
        label: "Config",
    },
    {
        id: "code",
        icon: Code2,
        label: "Code",
    },
    {
        id: "logs",
        icon: TerminalSquare,
        label: "Logs",
    },
];

/**
 * PinEditor - Orchestrates widget creation and editing.
 * 
 * Uses extracted hooks for logic and partial components for UI.
 */
export default function PinEditor({ pinId, pin }: PinEditorProps) {
    const { isConnected } = useAccount();
    const router = useRouter();

    // Local state for user inputs
    const initialWidget = pin?.widget;

    // Pin Metadata Editing
    const [title, setTitle] = useState(pin?.title || "");
    const [tagline, setTagline] = useState(pin?.tagline || "");

    const [prompt, setPrompt] = useState("");
    const [dataCode, setDataCode] = useState(initialWidget?.litActionCode || "");
    const [uiCode, setUICode] = useState(initialWidget?.reactCode || "");
    const [parameters, setParameters] = useState<any[]>(initialWidget?.parameters || []);
    const [previewData, setPreviewData] = useState<Record<string, unknown>>(initialWidget?.previewData || {});

    // If we have a widget, we effectively have "generated" content already
    const [hasGenerated, setHasGenerated] = useState(!!initialWidget);

    // Accordion state - default to 'prompt'
    const [accordionValue, setAccordionValue] = useState("prompt");

    // Extracted hooks
    const { generate, isGenerating, error: generateError } = useWidgetGeneration();
    const { run: runDataCode, isRunning: isDataCodeRunning, error: dataCodeError, logs } = useDataCodeRunner();
    const { render: renderPreview, isLoading: isPreviewLoading, imageUrl: previewImageUrl } = usePreviewRenderer();

    // Initialize preview if we have existing code
    useEffect(() => {
        if (initialWidget && initialWidget.reactCode && initialWidget.previewData) {
            renderPreview(initialWidget.reactCode, initialWidget.previewData);
        }
    }, [initialWidget, renderPreview]);


    // Handle AI generation
    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        let finalPrompt = prompt;
        // If we have existing code, append it to the prompt for iterative refinement
        if (hasGenerated && (dataCode || uiCode)) {
            finalPrompt = `
                Current Data Code:
                \`\`\`javascript
                ${dataCode}
                \`\`\`

                Current UI Code:
                \`\`\`jsx
                ${uiCode}
                \`\`\`

                User Request: ${prompt}
            `.trim();
        }

        const result = await generate(finalPrompt);
        if (result) {
            setDataCode(result.dataCode);
            setUICode(result.uiCode);
            setParameters(result.parameters);
            setPreviewData(result.previewData);
            setHasGenerated(true);

            // Auto open config after generation to show progress/change
            setAccordionValue("config");

            // Auto-trigger preview render
            renderPreview(result.uiCode, result.previewData);
        }
    };

    // Handle Lit Action execution  
    const handleRunDataCode = async () => {
        // Build user params from current parameter values
        const userParams: Record<string, unknown> = {};
        parameters.forEach(p => {
            userParams[p.name] = previewData[p.name];
        });

        const result = await runDataCode(dataCode, userParams);
        if (result) {
            // Re-render preview with live data
            renderPreview(uiCode, result);
        }
    };

    // Handle save
    const handleSave = async () => {
        if (!hasGenerated) return;

        try {
            const savePayload = {
                title,
                tagline,
                widget: {
                    litActionCode: dataCode,
                    reactCode: uiCode,
                    parameters,
                    previewData,
                    userConfig: previewData,
                }
            };

            const res = await fetch(`/api/pins/${pinId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(savePayload),
            });

            if (!res.ok) throw new Error("Failed to save pin");

            router.push(`/p/${pinId}`);
            router.refresh();
        } catch (e) {
            console.error("Save failed:", e);
            alert("Failed to save pin. Check console.");
        }
    };

    const currentError = generateError || dataCodeError;

    // Render Helpers
    const renderContent = (id: string) => {
        switch (id) {
            case "prompt":
                return (
                    <EditorPrompt
                        prompt={prompt}
                        setPrompt={setPrompt}
                        isGenerating={isGenerating}
                        isConnected={isConnected}
                        hasGenerated={hasGenerated}
                        error={currentError || null}
                        onGenerate={handleGenerate}
                        onBack={() => router.push(`/p/${pinId}`)}
                    />
                );
            case "config":
                return (
                    <EditorConfig
                        parameters={parameters}
                        values={previewData as Record<string, any>}
                        onChange={(values) => setPreviewData(values)}
                        onParametersChange={setParameters}
                    />
                );
            case "code":
                return (
                    <EditorCode
                        dataCode={dataCode}
                        setDataCode={setDataCode}
                        uiCode={uiCode}
                        setUICode={setUICode}
                    />
                );
            case "logs":
                return (
                    <EditorLogs logs={logs} />
                );
            default:
                return null;
        }
    };

    return (
        <div className={cn("flex flex-col gap-0 max-w-3xl mx-auto relative", !hasGenerated && "pt-20 md:pt-24")}>
            {hasGenerated ? (
                <>
                    <PinDisplayCard
                        title={title}
                        description={tagline}
                        imageSrc={previewImageUrl}
                        isLoading={isGenerating || isPreviewLoading || isDataCodeRunning}
                    >
                        <div className="w-full px-0">
                            <div className="grid grid-cols-3 gap-2 md:gap-4 w-full">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/p/${pinId}`)}
                                    className="w-full h-10 font-bold tracking-wider"
                                    icon={ChevronLeft}
                                >
                                    BACK
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={handleRunDataCode}
                                    disabled={isDataCodeRunning || isPreviewLoading}
                                    isLoading={isPreviewLoading}
                                    className="w-full h-10 font-bold tracking-wider"
                                    icon={Play}
                                >
                                    UPDATE
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={!hasGenerated || isDataCodeRunning}
                                    className="w-full h-10 font-bold tracking-wider"
                                    icon={Save}
                                >
                                    SAVE
                                </Button>
                            </div>
                        </div>
                    </PinDisplayCard>

                    <Accordion
                        type="single"
                        collapsible
                        value={accordionValue}
                        onValueChange={setAccordionValue}
                        className="w-full bg-card border shadow-lg flex flex-col relative"
                    >
                        {SECTION_CONFIG.map((section) => (
                            <AccordionItem
                                key={section.id}
                                value={section.id}
                                className={cn(accordionValue === section.id && "order-first")}
                            >
                                <AccordionTrigger className="text-lg font-semibold px-4 md:px-6 py-4 cursor-pointer items-center hover:bg-accent/50 hover:no-underline">
                                    <span className="flex items-center gap-3">
                                        <section.icon className="h-5 w-5 text-primary" />
                                        <span className="leading-none translate-y-[3px]">{section.label}</span>
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="p-0 border-b-2">
                                    {renderContent(section.id)}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </>
            ) : (
                <div className="w-full bg-card border shadow-lg flex flex-col relative rounded-md">
                    <div className="flex flex-1 items-center justify-between gap-4 py-4 px-4 md:px-6 text-left text-sm font-medium border-b">
                        <span className="flex items-center gap-3">
                            <Wand2 className="h-5 w-5 text-primary" />
                            <span className="text-lg font-semibold leading-none translate-y-[3px]">Prompt</span>
                        </span>
                    </div>
                    <div className="p-0">
                        {renderContent("prompt")}
                    </div>
                </div>
            )}
        </div>
    );
}
