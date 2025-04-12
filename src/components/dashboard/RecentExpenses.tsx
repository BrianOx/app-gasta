
import React from "react";
import { Card } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { Category } from "@/models/Category";
import { Expense } from "@/models/Expense";
import { formatCurrency } from "@/utils/formatters";

interface RecentExpensesProps {
  expenses: Expense[];
  categories: Category[];
}

const RecentExpenses = ({ expenses, categories }: RecentExpensesProps) => {
  const recentExpenses = expenses.slice(0, 3);

  return (
    <>
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
    </>
  );
};

export default RecentExpenses;
