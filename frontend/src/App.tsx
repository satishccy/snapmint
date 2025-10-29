import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Capture from "./pages/Capture";
import Gallery from "./pages/Gallery";
import PhotoDetail from "./pages/PhotoDetail";
import PhotoBooth from "./pages/PhotoBooth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider,
} from "@txnlab/use-wallet-react";

const queryClient = new QueryClient();

const walletManager = new WalletManager({
  wallets: [WalletId.PERA, WalletId.DEFLY, WalletId.LUTE],
  defaultNetwork: NetworkId.TESTNET,
  options: {
    resetNetwork: true,
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider manager={walletManager}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/capture" element={<Capture />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/photo/:id" element={<PhotoDetail />} />
              <Route path="/photo-booth" element={<PhotoBooth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin-auth" element={<Auth />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
