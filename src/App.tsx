import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, useAuthState, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DMView from "./pages/DMView";
import PlayerView from "./pages/PlayerView";
import CharacterBuilder from "./pages/CharacterBuilder";
import MapBuilder from "./pages/MapBuilder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen bg-[#06090f] flex items-center justify-center text-amber-700 text-sm">Loading…</div>;
  if (!user) return <Navigate to="/login" replace/>;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/character-builder" element={<RequireAuth><CharacterBuilder /></RequireAuth>} />
            <Route path="/map-builder" element={<RequireAuth><MapBuilder /></RequireAuth>} />
            <Route path="/dm" element={<DMView />} />
            <Route path="/player" element={<PlayerView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
