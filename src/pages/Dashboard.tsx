
import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { CreditCard, TrendingUp, ArrowUpCircle, Mic, Plus } from "lucide-react"; // Add Plus import
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { databaseService } from "@/services/DatabaseService";
import { Category } from "@/models/Category";
import { Expense } from "@/models/Expense";
import { Settings } from "@/models/Settings";
import { voiceRecognitionService } from "@/services/VoiceRecognitionService";
import { formatCurrency } from "@/utils/formatters";
import AddExpenseDialog from "@/components/expenses/AddExpenseDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const handleAddExpense = async () => {
    setIsAddExpenseOpen(true);
  };

  // Prepare chart data
  const expensesByCategory = categories.map(category => {
    const categoryExpenses = expenses.filter(expense => expense.categoryId === category.id);
    const total = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    return {
      id: category.id,
      name: category.name,
      value: total,
      color: category.color
    };
  }).filter(item => item.value > 0);

  // Calculate limit progress percentage
  const limitPercentage = settings?.monthlyLimit 
    ? Math.min(100, (monthlyTotal / settings.monthlyLimit) * 100) 
    : 0;

  // Determine limit progress color
  const getLimitProgressColor = () => {
    if (limitPercentage < 50) return "bg-green-500";
    if (limitPercentage < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Get recent expenses
  const recentExpenses = expenses.slice(0, 3);

  return (
    <div className="container px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gastapp</h1>
        <Button variant="outline" size="icon" onClick={handleVoiceRecognition}>
          <Mic className={isRecording ? "text-red-500 animate-pulse" : ""} />
        </Button>
      </div>

      {/* Monthly summary card */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between">
            <span>Este mes</span>
            <span>{formatCurrency(monthlyTotal)}</span>
          </CardTitle>
          <CardDescription>
            {settings?.monthlyLimit && (
              `Límite: ${formatCurrency(settings.monthlyLimit)}`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings?.monthlyLimit ? (
            <div className="space-y-2">
              <div className="limit-indicator">
                <div 
                  className={`limit-progress ${getLimitProgressColor()}`}
                  style={{ width: `${limitPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>{limitPercentage.toFixed(0)}% usado</span>
                <span>100%</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Sin límite definido
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense by Category Chart */}
      {expensesByCategory.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Gastos por categoría</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert className="mb-6">
          <ArrowUpCircle className="h-4 w-4" />
          <AlertTitle>Sin datos</AlertTitle>
          <AlertDescription>
            Agrega gastos para ver estadísticas por categoría
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Expenses */}
      <h2 className="text-lg font-medium mb-3">Gastos recientes</h2>
      {recentExpenses.length > 0 ? (
        <div className="space-y-3">
          {recentExpenses.map(expense => {
            const category = categories.find(c => c.id === expense.categoryId);
            return (
              <Card key={expense.id} className="expense-card">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center" 
                      style={{ backgroundColor: category?.color || '#gray' }}
                    >
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{expense.description}</h3>
                      <p className="text-sm text-muted-foreground">{category?.name}</p>
                    </div>
                  </div>
                  <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No hay gastos recientes
        </div>
      )}

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
