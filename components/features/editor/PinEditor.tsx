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
import { SavePinButton } from "./partials/SavePinButton";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import PinDisplayCard from "../viewer/PinDisplayCard";

import { Button } from "@/components/ui/button";
import { Play, Settings2, Wand2, Code2, TerminalSquare, ChevronLeft } from "lucide-react";
import { notify } from "@/components/shared/Notifications";

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
    const [dataCode, setDataCode] = useState(initialWidget?.dataCode || "");
    const [uiCode, setUICode] = useState(initialWidget?.uiCode || "");
    const [parameters, setParameters] = useState<any[]>(initialWidget?.parameters || []);
    const [previewData, setPreviewData] = useState<Record<string, unknown>>(initialWidget?.previewData || {});

    const [hasGenerated, setHasGenerated] = useState(!!(initialWidget && initialWidget.uiCode));

    // Accordion state - default to 'prompt'
    const [accordionValue, setAccordionValue] = useState("prompt");

    // Extracted hooks
    const { generate, isGenerating, error: generateError } = useWidgetGeneration();
    const { run: runDataCode, isRunning: isDataCodeRunning, error: dataCodeError, logs } = useDataCodeRunner();
    const { render: renderPreview, isLoading: isPreviewLoading, imageUrl: previewImageUrl } = usePreviewRenderer();

    // Initialize preview if we have existing code
    useEffect(() => {
        if (initialWidget && initialWidget.uiCode && initialWidget.previewData) {
            renderPreview({
                dataCode: initialWidget.dataCode || '',
                uiCode: initialWidget.uiCode,
                previewData: initialWidget.previewData,
                parameters: initialWidget.parameters || [],
                userConfig: initialWidget.userConfig
            }, pinId);
        }
    }, [initialWidget, renderPreview, pinId]);


    // Handle AI generation
    const handleGenerate = async (fromScratch = false) => {
        if (!prompt.trim()) return;

        let finalPrompt = prompt;
        // If we have existing code, append it to the prompt for iterative refinement
        // UNLESS we are explicitly starting from scratch
        if (!fromScratch && hasGenerated && (dataCode || uiCode)) {
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
            renderPreview({
                dataCode: result.dataCode,
                uiCode: result.uiCode,
                previewData: result.previewData,
                parameters: result.parameters,
                userConfig: initialWidget?.userConfig // Preserve existing config or empty
            }, pinId);
        }
    };

    // Handle Lit Action execution  
    const handleRunDataCode = async () => {
        // Build user params from current parameter values
        const userParams: Record<string, unknown> = {};
        parameters.forEach(p => {
            userParams[p.name] = previewData[p.name];
        });

        // 1. Run Client-Side (Log Only)
        // We run this to show logs to the user, but we DON'T block update on failure.
        // The Server will re-run this to generate the image.
        runDataCode(dataCode, userParams).then((result) => {
            if (!result) {
                notify("Client execution logs empty (Server will retry for image)", "warning");
            }
        });

        // 2. Trigger Preview Update (Start IPFS Upload & Sign)
        // We pass 'userParams' (INPUTS), not 'result' (OUTPUTS).
        // The Server will execute DataCode(Inputs) -> Outputs.
        renderPreview({
            dataCode: dataCode,
            uiCode: uiCode,
            previewData: userParams, // PASS INPUTS!
            parameters: parameters,
            userConfig: initialWidget?.userConfig
        }, pinId);
    };

    const currentError = generateError || dataCodeError;

    useEffect(() => {
        if (currentError) {
            notify(currentError, 'error');
        }
    }, [currentError]);

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
                        onGenerate={(fromScratch?: boolean) => { void handleGenerate(fromScratch); }}
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
                                <SavePinButton
                                    pinId={pinId}
                                    title={title}
                                    tagline={tagline}
                                    uiCode={uiCode}
                                    dataCode={dataCode}
                                    parameters={parameters}
                                    previewData={previewData}
                                    disabled={!hasGenerated || isDataCodeRunning}
                                    className="w-full h-10 font-bold tracking-wider"
                                />
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
