
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

// Helper function to position labels
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
  // Calculate the position of the label
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.35; // Place labels farther from the pie
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show labels for segments with at least 5% of the total
  if (percent < 0.05) return null;

  // Calculate text anchor based on which side of the pie we're on
  const textAnchor = x > cx ? 'start' : 'end';

  return (
    <text 
      x={x} 
      y={y} 
      fill="#888888" 
      textAnchor={textAnchor} 
      dominantBaseline="central"
      fontSize="0.75rem"
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

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

  // Calculate total for percentage calculation
  const totalExpenses = expensesByCategory.reduce((sum, item) => sum + item.value, 0);

  return (
    expensesByCategory.length > 0 ? (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Gastos por categoría</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
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
