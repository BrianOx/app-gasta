
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowUpCircle } from "lucide-react";
import { Category } from "@/models/Category";
import { Expense } from "@/models/Expense";

interface CategoryChartProps {
  expenses: Expense[];
  categories: Category[];
}

const CategoryChart = ({ expenses, categories }: CategoryChartProps) => {
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

  return (
    expensesByCategory.length > 0 ? (
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
    )
  );
};

export default CategoryChart;
