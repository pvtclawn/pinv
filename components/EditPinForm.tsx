"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAccount } from "wagmi";
import { Pin } from "@/types";
import { Loader2, Wand2, Save, ScanFace, Play } from "lucide-react";
import Link from "next/link";

interface EditPinFormProps {
    fid: number;
    pin: Pin | null;
}

export default function EditPinForm({ fid, pin }: EditPinFormProps) {
    const { isConnected } = useAccount();
    // const isConnected = true; // MOCKED FOR VERIFICATION
    const router = useRouter();

    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [litActionCode, setLitActionCode] = useState("");
    const [reactCode, setReactCode] = useState("");
    const [parameters, setParameters] = useState<any[]>([]);
    const [previewData, setPreviewData] = useState<any>({});
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isLitActionRunning, setIsLitActionRunning] = useState(false);

    // AI Generation
    const handleUpdate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        setHasGenerated(false);
        setPreviewImageUrl(null);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate');
            }

            const data = await response.json();

            setLitActionCode(data.lit_action_code);
            setReactCode(data.react_code);
            setParameters(data.parameters || []);
            setPreviewData(data.preview_data || {});
            setHasGenerated(true);

            // Auto-trigger preview render
            renderPreview(data.react_code, data.preview_data);

        } catch (error) {
            console.error('Generation failed:', error);
            alert("Generation failed. Check console/network.");
        } finally {
            setIsGenerating(false);
        }
    };

    const renderPreview = async (code: string, data: any) => {
        setIsPreviewLoading(true);
        try {
            const response = await fetch('/api/preview-widget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, props: data }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setPreviewImageUrl(url);
            }
        } catch (error) {
            console.error("Preview render failed:", error);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const runLitAction = async () => {
        setIsLitActionRunning(true);
        try {
            // Create userParams object from inputs
            const userParams: any = {};
            parameters.forEach(p => {
                userParams[p.name] = previewData[p.name];
            });

            console.log("Running Lit Action with:", userParams);

            // Proxy Fetch to bypass CORS (Using Local Proxy)
            const proxiedFetch = async (url: string, options?: RequestInit) => {
                const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
                try {
                    const res = await fetch(proxyUrl, options);

                    if (!res.ok) {
                        const text = await res.text();
                        console.error(`[Proxy] Request Failed with body:`, text);
                    }
                    return res;
                } catch (e) {
                    console.error(`[Proxy] Network Error:`, e);
                    throw e;
                }
            };

            // Wrap code in async IIFE
            // Note: We use 'new Function' to create a sandbox-ish scope
            // We inject 'proxiedFetch' as 'fetch' to automatically route requests through proxy
            const executor = new Function('userParams', 'fetch', `
                return (async () => {
                    const jsParams = userParams; // Alias for Lit Action compatibility
                    
                    // Execute the code
                    // If it returns a value directly, that's great.
                    // If it defines a 'main' function (standard Lit pattern), we call it.
                    try {
                        ${litActionCode}
                        
                        // Check if 'main' was defined and call it if so
                        // @ts-ignore
                        if (typeof main !== 'undefined' && typeof main === 'function') {
                            // @ts-ignore
                            return await main(jsParams);
                        }
                    } catch (e) {
                         throw e;
                    }
                })()
            `);

            const result = await executor(userParams, proxiedFetch);
            console.log("Lit Action Result:", result);

            // Re-render preview with REAL data
            renderPreview(reactCode, result);

        } catch (e: any) {
            console.error("Lit Action execution failed:", e);
            alert(`Execution Failed: ${e.message}\n\nCheck console for details (CORS?).`);
        } finally {
            setIsLitActionRunning(false);
        }
    };

    const handleSave = async () => {
        if (!hasGenerated) return;

        try {
            const savePayload = {
                widget: {
                    litActionCode,
                    reactCode,
                    parameters,
                    previewData, // Default mocks
                    userConfig: previewData, // Saves current inputs as default config
                }
            };

            const res = await fetch(`/api/pins/${fid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(savePayload),
            });

            if (!res.ok) throw new Error("Failed to save pin");

            // Option: Revalidate/Refresh? For now just redirect
            router.push(`/p/${fid}`);
            router.refresh();

        } catch (e) {
            console.error("Save failed:", e);
            alert("Failed to save pin. Check console.");
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-8">
            <Header />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[calc(100vh-200px)]">
                {/* Left Column: Controls */}
                <div className="flex flex-col gap-6 overflow-y-auto pr-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pin Prompt</CardTitle>
                            <CardDescription>Describe what you want this pin to do.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="e.g. show the price of ETH from CoinGecko..."
                                className="min-h-[120px]"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={!isConnected || isGenerating}
                            />
                            {!isConnected && <p className="text-red-500 text-sm">Please connect wallet.</p>}
                            <Button
                                onClick={handleUpdate}
                                disabled={isGenerating || !isConnected || !prompt}
                                className="w-full"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        Generate Widget
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {hasGenerated && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Parameters</CardTitle>
                                    <CardDescription>Configure your widget settings.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {parameters.length === 0 && <p className="text-sm text-muted-foreground">No configurable parameters.</p>}
                                    {parameters.map((param, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <Label>{param.name}</Label>
                                            <Input
                                                value={previewData[param.name] || ''}
                                                onChange={(e) => {
                                                    const newData = { ...previewData, [param.name]: e.target.value };
                                                    setPreviewData(newData);
                                                }}
                                                placeholder={param.description}
                                            />
                                            <p className="text-xs text-muted-foreground">{param.description}</p>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={isPreviewLoading || isLitActionRunning}
                                        className="w-full bg-slate-900 text-white hover:bg-slate-800"
                                    >
                                        <Save className="mr-2 h-4 w-4" /> Save Pin
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Logic Code (Lit Action)</CardTitle>
                                    <CardDescription>Edit the Javascript code that fetches your data.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        value={litActionCode}
                                        onChange={(e) => setLitActionCode(e.target.value)}
                                        className="font-mono text-xs min-h-[200px]"
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Actions</CardTitle>
                                    <CardDescription>Run and refresh your widget.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => runLitAction()}
                                        disabled={isLitActionRunning}
                                        className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300"
                                    >
                                        {isLitActionRunning ? (
                                            <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Running Code...</>
                                        ) : (
                                            <><Play className="mr-2 h-3 w-3" /> Run Live Code</>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => renderPreview(reactCode, previewData)}
                                        disabled={isPreviewLoading}
                                        className="w-full mt-2"
                                    >
                                        {isPreviewLoading ? (
                                            <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Updating Preview...</>
                                        ) : (
                                            "Refresh Preview"
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Generated Code</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Tabs defaultValue="react">
                                        <TabsList className="w-full">
                                            <TabsTrigger value="react" className="flex-1">React (UI)</TabsTrigger>
                                            <TabsTrigger value="lit" className="flex-1">Lit Action (Data)</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="react">
                                            <Textarea value={reactCode} readOnly className="font-mono text-xs h-[200px]" />
                                        </TabsContent>
                                        <TabsContent value="lit">
                                            <Textarea value={litActionCode} readOnly className="font-mono text-xs h-[200px]" />
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                {/* Right Column: Preview */}
                <div className="flex flex-col gap-6">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Live Preview</CardTitle>
                            <CardDescription>Target: 1200x800px (Farcaster Embed)</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-center justify-center bg-muted/20 rounded-lg m-6 border-2 border-dashed relative overflow-hidden min-h-[400px]">
                            {previewImageUrl ? (
                                <img src={previewImageUrl} alt="Widget Preview" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <ScanFace className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Generate a widget to see preview</p>
                                </div>
                            )}
                            {isPreviewLoading && (
                                <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="justify-end border-t p-6">
                            <div className="flex gap-4">
                                <Button variant="ghost" asChild>
                                    <Link href={`/p/${fid}`}>Cancel</Link>
                                </Button>
                                <Button onClick={handleSave} disabled={!hasGenerated}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Pin
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
