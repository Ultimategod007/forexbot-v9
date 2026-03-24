import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Browse from "@/pages/Browse";
import SeriesDetail from "@/pages/SeriesDetail";
import Reader from "@/pages/Reader";
import Upload from "@/pages/Upload";
import { Layout } from "@/components/Layout";

function Router() {
  return (
    <Switch>
      <Route path="/read/:id" component={Reader} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/browse" component={Browse} />
            <Route path="/series/:id" component={SeriesDetail} />
            <Route path="/upload" component={Upload} />
            <Route path="/library" component={Browse} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
