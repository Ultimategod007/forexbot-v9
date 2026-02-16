import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useCreateSeries, useSeries } from "@/hooks/use-series";
import { useCreateChapter } from "@/hooks/use-chapters";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSeriesSchema, insertChapterSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, Plus, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";

// Schema for Series creation with array transformation for genres
const createSeriesFormSchema = insertSeriesSchema.extend({
  genres: z.string().transform((str) => str.split(',').map(s => s.trim()).filter(s => s.length > 0)),
});

type CreateSeriesFormValues = z.infer<typeof createSeriesFormSchema>;

// Schema for Chapter creation
const createChapterFormSchema = insertChapterSchema.omit({ seriesId: true }).extend({
  pages: z.string().min(1, "At least one image URL is required"), // Text area input
});

type CreateChapterFormValues = z.infer<typeof createChapterFormSchema>;

export default function Upload() {
  const { user, isLoading: isAuthLoading, isAdmin, login } = useAuth();
  const [, setLocation] = useLocation();
  const { mutate: createSeries, isPending: isCreatingSeries } = useCreateSeries();
  const { mutate: createChapter, isPending: isCreatingChapter } = useCreateChapter();
  const { data: mySeries } = useSeries(); 
  
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");

  const seriesForm = useForm<CreateSeriesFormValues>({
    resolver: zodResolver(createSeriesFormSchema),
    defaultValues: {
      title: "",
      description: "",
      author: "",
      coverImage: "",
      genres: "Action, Fantasy" as any, 
      status: "ongoing",
    },
  });

  const chapterForm = useForm<CreateChapterFormValues>({
    resolver: zodResolver(createChapterFormSchema),
    defaultValues: {
      title: "",
      chapterNumber: 1,
      pages: "",
    },
  });

  if (isAuthLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }
  
  if (!user || !isAdmin) {
    return (
      <Layout>
        <div className="container max-w-md mx-auto py-20 px-4 text-center">
          <UploadCloud className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Creator Studio</h1>
          <p className="text-muted-foreground mb-8">
            {!user 
              ? "Sign in to start publishing your own series and chapters." 
              : "Only authorized creators can upload content. Your account does not have admin privileges."}
          </p>
          {!user && (
            <Button onClick={login} className="w-full">
              Login with Replit
            </Button>
          )}
          {user && !isAdmin && (
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Back to Home</Link>
            </Button>
          )}
        </div>
      </Layout>
    );
  }

  function onSeriesSubmit(data: CreateSeriesFormValues) {
    createSeries(data, {
      onSuccess: () => {
        seriesForm.reset();
        // Ideally redirect to the new series or switch tab
      }
    });
  }

  function onChapterSubmit(data: CreateChapterFormValues) {
    if (!selectedSeriesId) return;
    
    // Parse pages from text area (newline separated)
    const pageUrls = data.pages.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    
    createChapter({
      ...data,
      seriesId: parseInt(selectedSeriesId),
      pages: pageUrls,
    }, {
      onSuccess: () => {
        chapterForm.reset();
        chapterForm.setValue("chapterNumber", (data.chapterNumber || 0) + 1);
      }
    });
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl">
            <UploadCloud className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Creator Studio</h1>
            <p className="text-muted-foreground">Manage your series and upload new chapters</p>
          </div>
        </div>

        <Tabs defaultValue="series" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/50 p-1">
            <TabsTrigger value="series" className="data-[state=active]:bg-background">Create New Series</TabsTrigger>
            <TabsTrigger value="chapter" className="data-[state=active]:bg-background">Upload Chapter</TabsTrigger>
          </TabsList>

          <TabsContent value="series">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Series Details</CardTitle>
                <CardDescription>Create a new series to start adding chapters.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...seriesForm}>
                  <form onSubmit={seriesForm.handleSubmit(onSeriesSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={seriesForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Series Title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={seriesForm.control}
                        name="author"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Author / Artist</FormLabel>
                            <FormControl>
                              <Input placeholder="Author Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={seriesForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Synopsis</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the story..." className="h-32" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={seriesForm.control}
                        name="coverImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cover Image URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormDescription>Link to a vertical poster image (2:3 aspect ratio recommended)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={seriesForm.control}
                        name="genres"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Genres</FormLabel>
                            <FormControl>
                              <Input placeholder="Action, Fantasy, Adventure" {...field} />
                            </FormControl>
                            <FormDescription>Comma separated list</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={seriesForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ongoing">Ongoing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="hiatus">Hiatus</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isCreatingSeries} className="w-full">
                      {isCreatingSeries ? "Creating..." : "Create Series"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chapter">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>New Chapter</CardTitle>
                <CardDescription>Add a new chapter to an existing series.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">Select Series</label>
                  <Select value={selectedSeriesId} onValueChange={setSelectedSeriesId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a series..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mySeries?.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedSeriesId && <p className="text-sm text-muted-foreground mt-2">Select a series to continue</p>}
                </div>

                {selectedSeriesId && (
                  <Form {...chapterForm}>
                    <form onSubmit={chapterForm.handleSubmit(onChapterSubmit)} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={chapterForm.control}
                          name="chapterNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Chapter Number</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={chapterForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Chapter Title (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. The Beginning" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={chapterForm.control}
                        name="pages"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Page URLs</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Paste image URLs here, one per line..." 
                                className="h-64 font-mono text-sm" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>Enter direct links to images. One URL per line. Ordered top to bottom.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={isCreatingChapter} className="w-full">
                        {isCreatingChapter ? "Uploading..." : "Publish Chapter"}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
