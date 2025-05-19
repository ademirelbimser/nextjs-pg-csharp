"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { TableSchema, GeneratedCode } from "@/types/schema";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export default function Home() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [activeTab, setActiveTab] = useState<string>("entity");

  const form = useForm({
    defaultValues: {
      tableName: "",
      namespace: process.env.NEXT_PUBLIC_NAMESPACE || "Taz.Services",
      ignoreLastSChar: true,
    },
  });

  const onSubmit = async (data: { tableName: string, namespace:string, ignoreLastSChar: boolean }) => {
    setIsLoading(true);
    try {
      if (!data.tableName) {
        toast.error("Tablo adı boş olamaz");
        return;
      }
      if (!data.namespace) {
        toast.error("Namespace boş olamaz");
        return;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tableName: data.tableName, namespace: data.namespace, ignoreLastSChar: data.ignoreLastSChar }),
      });

      const result = await response.json();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (!response.ok) {
        throw new Error(result.message || "Bir hata oluştu");
      }
      


      setSchema(result.schema);
      setGeneratedCode(result.generatedCode);
      toast.success("Kod başarıyla oluşturuldu!");
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Kod oluşturulurken bir hata oluştu");
      } else {
        toast.error("Kod oluşturulurken bir hata oluştu");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-4 md:p-24">
      <h1 className="text-3xl font-bold mb-8 text-center">PostgreSQL C# Code Generator</h1>
      
      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Table Info</CardTitle>
            <CardDescription>
              Enter PostgreSQL table and Generate C# codes for CQRS pattern
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="tableName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Table Name</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: users" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter table name in PostgreSQL Database
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ignoreLastSChar" // Checkbox için uygun bir isim verin
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl >
                          <Checkbox
                            checked={field.value} // field.value yerine field.checked kullanılır
                            onCheckedChange={field.onChange} // Değişiklikler için field.onChange kullanılır
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Ignore last &quot;s&quot; character in table name
                          </FormLabel>
                          <FormDescription>
                            Bu seçeneği işaretlerseniz, C# için üretilen tüm class isimlerinde eğer varsa son s harfi kaldırılacaktır. 
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                      )}
                    />
                
                <FormField
                  control={form.control}
                  name="namespace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Namespace</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Taz.Services" {...field} />
                      </FormControl>
                      <FormDescription>
                        C# Namespace for the generated code
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Proceed..." : "Generate Code"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {schema && generatedCode && (
          <Card>
            <CardHeader>
              <CardTitle>Generated C# Code</CardTitle>
              <CardDescription>
                C# codes for {schema.tableName} table
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="entity" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
                  <TabsTrigger value="entity">Entity</TabsTrigger>
                  <TabsTrigger value="interface">Interface</TabsTrigger>
                  <TabsTrigger value="repository">Repository</TabsTrigger>
                  <TabsTrigger value="commands">Commands</TabsTrigger>
                  <TabsTrigger value="queries">Queries</TabsTrigger>
                  <TabsTrigger value="handlers">Handlers</TabsTrigger>
                </TabsList>
                <TabsContent value="entity">
                  <div className="relative">
                    <SyntaxHighlighter language="csharp" style={vscDarkPlus} showLineNumbers>
                      {generatedCode.entity}
                    </SyntaxHighlighter>
                    <Button 
                      className="absolute top-2 right-2" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCode.entity);
                        toast.success("Entity code copied!");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="interface">
                  <div className="relative">
                    <SyntaxHighlighter language="csharp" style={vscDarkPlus} showLineNumbers>
                      {generatedCode.interface}
                    </SyntaxHighlighter>
                    <Button 
                      className="absolute top-2 right-2" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCode.interface);
                        toast.success("Interface code copied!");
                      }}
                    >
                      Kopyala
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="repository">
                  <div className="relative">
                    <SyntaxHighlighter language="csharp" style={vscDarkPlus} showLineNumbers>
                      {generatedCode.repository}
                    </SyntaxHighlighter>
                    <Button 
                      className="absolute top-2 right-2" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCode.repository);
                        toast.success("Repository code copied!");
                      }}
                    >
                      Kopyala
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="commands">
                  <div className="relative">
                    <SyntaxHighlighter language="csharp" style={vscDarkPlus} showLineNumbers>
                      {generatedCode.commands}
                    </SyntaxHighlighter>
                    <Button 
                      className="absolute top-2 right-2" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCode.commands);
                        toast.success("Commands code copied!");
                      }}
                    >
                      Kopyala
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="queries">
                  <div className="relative">
                    <SyntaxHighlighter language="csharp" style={vscDarkPlus} showLineNumbers>
                      {generatedCode.queries}
                    </SyntaxHighlighter>
                    <Button 
                      className="absolute top-2 right-2" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCode.queries);
                        toast.success("Queries code copied!");
                      }}
                    >
                      Kopyala
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="handlers">
                  <div className="relative">
                    <SyntaxHighlighter language="csharp" style={vscDarkPlus} showLineNumbers>
                      {generatedCode.handlers}
                    </SyntaxHighlighter>
                    <Button 
                      className="absolute top-2 right-2" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCode.handlers);
                        toast.success("Handlers code copied!");
                      }}
                    >
                      Kopyala
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => {
                  const allCode = `// Entity Class\n${generatedCode.entity}\n\n// Repository Interface\n${generatedCode.interface}\n\n// Repository Implementation\n${generatedCode.repository}\n\n// Commands\n${generatedCode.commands}\n\n// Queries\n${generatedCode.queries}\n\n// Handlers\n${generatedCode.handlers}`;
                  navigator.clipboard.writeText(allCode);
                  toast.success("All codes copied!");
                }}
              >
                Copy All Code
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </main>
  );
}
