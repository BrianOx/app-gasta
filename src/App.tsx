
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MobileLayout from "./components/layout/MobileLayout";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <MobileLayout>
              <Dashboard />
            </MobileLayout>
          } />
          <Route path="/history" element={
            <MobileLayout>
              <History />
            </MobileLayout>
          } />
          <Route path="/categories" element={
            <MobileLayout>
              <Categories />
            </MobileLayout>
          } />
          <Route path="/settings" element={
            <MobileLayout>
              <Settings />
            </MobileLayout>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
