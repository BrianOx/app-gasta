
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, History, PieChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import VoiceButton from "./VoiceButton";

const MobileNavbar: React.FC = () => {
  const location = useLocation();
  
  return (
    <>
      {/* Add button (Centered above navbar) */}
      <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-10">
        <VoiceButton />
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 z-10">
        <div className="flex justify-around items-center">
          <Link to="/" className="flex flex-col items-center">
            <div className={cn(
              "p-1.5 rounded-md",
              location.pathname === "/" ? "bg-primary/20 text-primary" : "text-muted-foreground"
            )}>
              <Home className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1">Inicio</span>
          </Link>
          
          <Link to="/history" className="flex flex-col items-center">
            <div className={cn(
              "p-1.5 rounded-md",
              location.pathname === "/history" ? "bg-primary/20 text-primary" : "text-muted-foreground"
            )}>
              <History className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1">Historial</span>
          </Link>
          
          <div className="w-16"></div> {/* Placeholder for the centered button */}
          
          <Link to="/categories" className="flex flex-col items-center">
            <div className={cn(
              "p-1.5 rounded-md",
              location.pathname === "/categories" ? "bg-primary/20 text-primary" : "text-muted-foreground"
            )}>
              <PieChart className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1">Categorías</span>
          </Link>
          
          <Link to="/settings" className="flex flex-col items-center">
            <div className={cn(
              "p-1.5 rounded-md",
              location.pathname === "/settings" ? "bg-primary/20 text-primary" : "text-muted-foreground"
            )}>
              <Settings className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1">Ajustes</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default MobileNavbar;
