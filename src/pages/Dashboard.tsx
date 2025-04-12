
import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { databaseService } from "@/services/DatabaseService";
import { Category } from "@/models/Category";
import { Expense } from "@/models/Expense";
import { Settings } from "@/models/Settings";
import VoiceButton from "@/components/layout/VoiceButton";
import AddExpenseDialog from "@/components/expenses/AddExpenseDialog";
import MonthlyOverview from "@/components/dashboard/MonthlyOverview";
import CategoryChart from "@/components/dashboard/CategoryChart";
import RecentExpenses from "@/components/dashboard/RecentExpenses";

const Dashboard = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  
  // Function to load all data
  const loadData = async () => {
    try {
      const [loadedExpenses, loadedCategories, loadedSettings, currentMonthTotal] = await Promise.all([
        databaseService.getExpenses(),
        databaseService.getCategories(),
        databaseService.getSettings(),
        databaseService.getCurrentMonthTotal()
      ]);
      
      setExpenses(loadedExpenses);
      setCategories(loadedCategories);
      setSettings(loadedSettings);
      setMonthlyTotal(currentMonthTotal);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Configurar un evento personalizado para recargar datos cuando se completa el reconocimiento de voz
  useEffect(() => {
    const handleVoiceRecognitionComplete = () => {
      console.log("Reloading data after voice recognition");
      loadData();
    };
    
    window.addEventListener('voiceRecognitionComplete', handleVoiceRecognitionComplete);
    
    return () => {
      window.removeEventListener('voiceRecognitionComplete', handleVoiceRecognitionComplete);
    };
  }, []);

  // Add expense handler
  const handleAddExpense = () => {
    setIsAddExpenseOpen(true);
  };

  return (
    <div className="container px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gastapp</h1>
        <VoiceButton />
      </div>

      {/* Monthly summary */}
      <MonthlyOverview 
        monthlyTotal={monthlyTotal}
        settings={settings}
      />

      {/* Category Chart */}
      <CategoryChart 
        expenses={expenses}
        categories={categories}
      />

      {/* Recent Expenses */}
      <RecentExpenses 
        expenses={expenses}
        categories={categories}
      />

      {/* Add expense button */}
      <div className="fixed bottom-28 right-4">
        <Button 
          className="rounded-full h-12 w-12 shadow-lg"
          onClick={handleAddExpense}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Add expense dialog */}
      <AddExpenseDialog 
        open={isAddExpenseOpen} 
        onOpenChange={setIsAddExpenseOpen}
        onExpenseAdded={loadData}
        categories={categories}
      />
    </div>
  );
};

export default Dashboard;
