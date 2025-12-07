"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAccount } from "wagmi";
import { Pin } from "@/types";
import { Play, Save, Wand2, ChevronDown, ChevronUp } from "lucide-react";
import PinParams from "@/components/PinParams";
import PinDisplayCard from "@/components/PinDisplayCard";
import { useWidgetGeneration, useDataCodeRunner, usePreviewRenderer } from "@/hooks";
import CodeEditor from "@/components/CodeEditor";
import { AppCard } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
import { cn } from "@/lib/utils";

interface PinEditorProps {
    fid: number;
    pin: Pin | null;
}

/**
 * PinEditor - Orchestrates widget creation and editing.
 * 
 * Uses extracted hooks for:
 * - AI generation (useWidgetGeneration)
 * - Data code execution (useDataCodeRunner)
 * - Preview rendering (usePreviewRenderer)
 */
export default function PinEditor({ fid, pin }: PinEditorProps) {
    const { isConnected } = useAccount();
    const router = useRouter();

    // Local state for user inputs
    // Initialize with existing widget data if available
    const initialWidget = pin?.widget;

    const [prompt, setPrompt] = useState("");
    const [dataCode, setDataCode] = useState(initialWidget?.litActionCode || "");
    const [uiCode, setUICode] = useState(initialWidget?.reactCode || "");
    const [parameters, setParameters] = useState<any[]>(initialWidget?.parameters || []);
    const [previewData, setPreviewData] = useState<Record<string, unknown>>(initialWidget?.previewData || {});
    // If we have a widget, we effectively have "generated" content already
    const [hasGenerated, setHasGenerated] = useState(!!initialWidget);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Extracted hooks
    const { generate, isGenerating, error: generateError } = useWidgetGeneration();
    const { run: runDataCode, isRunning: isDataCodeRunning, error: dataCodeError } = useDataCodeRunner();
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
                widget: {
                    litActionCode: dataCode,
                    reactCode: uiCode,
                    parameters,
                    previewData,
                    userConfig: previewData,
                }
            };

            const res = await fetch(`/api/pins/${fid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(savePayload),
            });

            if (!res.ok) throw new Error("Failed to save pin");

            router.push(`/p/${fid}`);
            router.refresh();
        } catch (e) {
            console.error("Save failed:", e);
            alert("Failed to save pin. Check console.");
        }
    };

    // Show any errors
    const currentError = generateError || dataCodeError;

    return (
        <div className="min-h-screen bg-background pattern-grid">
            <div className="app-container">
                <Header />

                {/* Header removed from here, moving Back button to bottom */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    {/* Left Column: Controls */}
                    <div className="flex flex-col gap-6 min-w-0">
                        {/* Prompt Card */}
                        <AppCard className="p-4 md:p-6 rounded-none border-x-0 md:border-x">

                            <div className="space-y-4">
                                <Textarea
                                    placeholder="e.g. show the price of ETH from CoinGecko..."
                                    className="min-h-[120px] bg-muted/20 border-border focus:border-primary font-mono text-sm resize-none"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    disabled={!isConnected || isGenerating}
                                />
                                {!isConnected && (
                                    <p className="text-red-500 text-sm font-bold">Please connect wallet.</p>
                                )}
                                {currentError && (
                                    <p className="text-red-500 text-sm font-bold">{currentError}</p>
                                )}
                                <AppButton
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !isConnected || !prompt.trim()}
                                    isLoading={isGenerating}
                                    loadingText="Constructing..."
                                    className="w-full"
                                    icon={Wand2}
                                >
                                    {hasGenerated ? "Refine" : "Construct"}
                                </AppButton>
                            </div>
                        </AppCard>

                        {/* Generated Content */}
                        {hasGenerated && (
                            <>
                                {/* Parameters Card */}
                                <AppCard className="p-0 rounded-none border-0 md:border">
                                    <div className="p-4 border-b border-border bg-muted/10 text-center md:text-left">
                                        <h3 className="text-xl md:text-2xl font-bold font-sans leading-none tracking-tight">Configuration</h3>
                                    </div>
                                    <div className="p-4 md:p-6 space-y-4">
                                        <PinParams
                                            mode="edit"
                                            parameters={parameters}
                                            values={previewData as Record<string, string>}
                                            onChange={(values) => setPreviewData(values)}
                                        />
                                    </div>
                                </AppCard>

                                {/* Widget Code Card - Collapsible */}
                                <AppCard className="p-0 rounded-none border-0 md:border overflow-hidden">
                                    <div
                                        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors flex items-center justify-between border-b border-border bg-muted/10"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                    >
                                        <div className="flex-1 text-center md:text-left">
                                            <h3 className="text-xl md:text-2xl font-bold font-sans leading-none tracking-tight">Code</h3>
                                        </div>
                                        {showAdvanced ? (
                                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                    {showAdvanced && (
                                        <div className="p-0 md:p-4 pt-0">
                                            <Tabs defaultValue="data">
                                                <TabsList className="w-full bg-muted/30 rounded-none border-b border-border p-0 h-10">
                                                    <TabsTrigger value="data" className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-t-2 data-[state=active]:border-primary h-full">Data</TabsTrigger>
                                                    <TabsTrigger value="ui" className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-t-2 data-[state=active]:border-primary h-full">UI</TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="data" className="mt-0 p-0">
                                                    <CodeEditor
                                                        value={dataCode}
                                                        onChange={setDataCode}
                                                        language="javascript"
                                                        placeholder="Data fetching code..."
                                                    />
                                                </TabsContent>
                                                <TabsContent value="ui" className="mt-0 p-0">
                                                    <CodeEditor
                                                        value={uiCode}
                                                        onChange={setUICode}
                                                        language="jsx"
                                                        placeholder="React UI code..."
                                                    />
                                                </TabsContent>
                                            </Tabs>
                                        </div>
                                    )}
                                </AppCard>
                            </>
                        )}
                    </div>

                    {/* Right Column: Preview */}
                    <div className={cn(
                        "flex flex-col gap-6 sticky top-24 min-w-0"
                    )}>
                        <PinDisplayCard
                            title="Preview"
                            description={null}
                            imageSrc={previewImageUrl}
                            isLoading={isPreviewLoading}
                            placeholderText="Initialize module to visualise data."
                            className="h-fit origami-card border-none shadow-none bg-transparent"
                        >
                            <div className={cn(
                                "items-center pt-4 border-t border-dashed border-border mt-2 w-full gap-2 md:gap-4",
                                hasGenerated ? "grid grid-cols-3" : "flex"
                            )}>
                                <AppButton
                                    variant="ghost"
                                    onClick={() => router.push(`/p/${fid}`)}
                                    className="text-muted-foreground hover:text-primary w-full"
                                >
                                    Back
                                </AppButton>
                                {hasGenerated && (
                                    <>
                                        <AppButton
                                            variant="secondary"
                                            onClick={handleRunDataCode}
                                            disabled={isDataCodeRunning || isPreviewLoading}
                                            isLoading={isDataCodeRunning || isPreviewLoading}
                                            loadingText="Updating"
                                            icon={Play}
                                            className="w-full"
                                        >
                                            Update
                                        </AppButton>
                                        <AppButton
                                            onClick={handleSave}
                                            disabled={!hasGenerated}
                                            icon={Save}
                                            className="w-full"
                                        >
                                            Save
                                        </AppButton>
                                    </>
                                )}
                            </div>
                        </PinDisplayCard>
                    </div>
                </div>
            </div >
        </div >
    );
}
