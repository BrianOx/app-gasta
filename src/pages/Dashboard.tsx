
import React, { useEffect, useState } from "react";
import { Mic, Plus } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { databaseService } from "@/services/DatabaseService";
import { Category } from "@/models/Category";
import { Expense } from "@/models/Expense";
import { Settings } from "@/models/Settings";
import { voiceRecognitionService } from "@/services/VoiceRecognitionService";
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
  const [isRecording, setIsRecording] = useState(false);
  
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

  // Handle voice recognition
  const handleVoiceRecognition = async () => {
    if (isRecording) {
      voiceRecognitionService.stopListening();
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    try {
      await voiceRecognitionService.startListening();
      
      // Automatically stop after 5 seconds
      setTimeout(() => {
        if (isRecording) {
          voiceRecognitionService.stopListening();
          setIsRecording(false);
        }
      }, 5000);

      // Reload data after voice recognition
      setTimeout(() => {
        loadData();
      }, 1000);
    } catch (error) {
      console.error("Error during voice recognition:", error);
    } finally {
      setIsRecording(false);
    }
  };

  // Add expense handler
  const handleAddExpense = () => {
    setIsAddExpenseOpen(true);
  };

  return (
    <div className="container px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gastapp</h1>
        <Button variant="outline" size="icon" onClick={handleVoiceRecognition}>
          <Mic className={isRecording ? "text-red-500 animate-pulse" : ""} />
        </Button>
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
