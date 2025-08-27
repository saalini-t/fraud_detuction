import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "./lib/api";

// Pages
import Dashboard from "./pages/dashboard";
import Agents from "./pages/agents";
import Transactions from "./pages/transactions";
import Alerts from "./pages/alerts";
import Reports from "./pages/reports";
import Wallets from "./pages/wallets";
import AuditLogs from "./pages/audit-logs";
import NotFound from "./pages/not-found";
import Login from "./pages/login";

// Layout
import Sidebar from "./components/layout/sidebar";
import Header from "./components/layout/header";

function AuthenticatedApp() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    retry: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user.user} />
        <main className="flex-1 overflow-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/agents" component={Agents} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/alerts" component={Alerts} />
            <Route path="/reports" component={Reports} />
            <Route path="/wallets" component={Wallets} />
            <Route path="/audit-logs" component={AuditLogs} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthenticatedApp />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
