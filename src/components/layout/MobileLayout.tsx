
import React from "react";
import MobileNavbar from "./MobileNavbar";

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Main content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Mobile navigation */}
      <MobileNavbar />
    </div>
  );
};

export default MobileLayout;
