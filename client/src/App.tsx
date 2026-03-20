import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { useAuth } from "@/hooks/use-auth";
import { LiveMarketProvider } from "@/hooks/use-live-market";
import { AppLayout } from "@/components/layout/AppLayout";

import { AuthPage } from "@/pages/AuthPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ExplorePage } from "@/pages/ExplorePage";
import { PortfolioPage } from "@/pages/PortfolioPage";
import { CommunityPage } from "@/pages/CommunityPage";
import StockDetailPage from "@/pages/StockDetailPage";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/auth">
        {() => {
          if (isLoading) return null;
          if (user) return <Redirect to="/" />;
          return <AuthPage />;
        }}
      </Route>
      
      <Route path="/">
        {() => <ProtectedRoute component={DashboardPage} />}
      </Route>
      
      <Route path="/explore">
        {() => <ProtectedRoute component={ExplorePage} />}
      </Route>
      
      <Route path="/portfolio">
        {() => <ProtectedRoute component={PortfolioPage} />}
      </Route>

      <Route path="/community">
        {() => <ProtectedRoute component={CommunityPage} />}
      </Route>



      <Route path="/stock/:symbol">
        {() => <ProtectedRoute component={StockDetailPage} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LiveMarketProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LiveMarketProvider>
    </QueryClientProvider>
  );
}

export default App;
