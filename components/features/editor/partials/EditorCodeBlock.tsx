"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CodeEditor from "../CodeEditor";

interface EditorCodeBlockProps {
    dataCode: string;
    setDataCode: (code: string) => void;
    uiCode: string;
    setUICode: (code: string) => void;
}

export function EditorCodeBlock({
    dataCode,
    setDataCode,
    uiCode,
    setUICode
}: EditorCodeBlockProps) {
    return (
        <Tabs defaultValue="data" className="gap-0">
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
    );
}
