
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { databaseService } from "@/services/DatabaseService";
import { Category } from "@/models/Category";
import { Expense } from "@/models/Expense";
import { formatCurrency } from "@/utils/formatters";

const History = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );

  // Function to load expenses and categories
  const loadData = async () => {
    try {
      const [loadedExpenses, loadedCategories] = await Promise.all([
        databaseService.getExpenses(),
        databaseService.getCategories(),
      ]);

      setExpenses(loadedExpenses);
      setCategories(loadedCategories);
    } catch (error) {
      console.error("Error loading history data:", error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter expenses by date and category
  const filteredExpenses = expenses.filter((expense) => {
    // Filter by date if selected
    if (selectedDate) {
      const expenseDate = new Date(expense.date);
      if (
        expenseDate.getDate() !== selectedDate.getDate() ||
        expenseDate.getMonth() !== selectedDate.getMonth() ||
        expenseDate.getFullYear() !== selectedDate.getFullYear()
      ) {
        return false;
      }
    }

    // Filter by category if selected
    if (selectedCategory && expense.categoryId !== selectedCategory) {
      return false;
    }

    return true;
  });

  // Group expenses by date
  const groupedExpenses: Record<string, Expense[]> = {};
  filteredExpenses.forEach((expense) => {
    const dateKey = format(new Date(expense.date), "yyyy-MM-dd");
    if (!groupedExpenses[dateKey]) {
      groupedExpenses[dateKey] = [];
    }
    groupedExpenses[dateKey].push(expense);
  });

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  // Clear filters
  const clearFilters = () => {
    setSelectedDate(undefined);
    setSelectedCategory(undefined);
  };

  return (
    <div className="container px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Historial</h1>
        <div className="flex space-x-2">
          {/* Date filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Calendar className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>

          {/* Category filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedCategory(undefined)}>
                Todas las categorías
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active filters */}
      {(selectedDate || selectedCategory) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedDate && (
            <div className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-sm flex items-center">
              {format(selectedDate, "PPP", { locale: es })}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1"
                onClick={() => setSelectedDate(undefined)}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          )}
          {selectedCategory && (
            <div className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-sm flex items-center">
              {
                categories.find((c) => c.id === selectedCategory)?.name ||
                "Categoría"
              }
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1"
                onClick={() => setSelectedCategory(undefined)}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6"
            onClick={clearFilters}
          >
            Limpiar filtros
          </Button>
        </div>
      )}

      {/* Expenses list grouped by date */}
      {sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const dateExpenses = groupedExpenses[dateKey];
            const dateTotal = dateExpenses.reduce(
              (sum, expense) => sum + expense.amount,
              0
            );

            return (
              <div key={dateKey}>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    {format(new Date(dateKey), "EEEE, d 'de' MMMM", {
                      locale: es,
                    })}
                  </h2>
                  <span className="text-sm font-medium">
                    {formatCurrency(dateTotal)}
                  </span>
                </div>

                <div className="space-y-2">
                  {dateExpenses.map((expense) => {
                    const category = categories.find(
                      (c) => c.id === expense.categoryId
                    );
                    return (
                      <Card key={expense.id} className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{
                                backgroundColor: category?.color || "gray",
                              }}
                            />
                            <div>
                              <p className="font-medium">{expense.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {category?.name}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(expense.amount)}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center mt-12 text-center">
          <div className="text-muted-foreground mb-2">
            <Filter className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <h3 className="text-lg font-medium">No hay gastos</h3>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            {selectedDate || selectedCategory
              ? "No se encontraron gastos con los filtros seleccionados"
              : "Agrega tu primer gasto para verlo aquí"}
          </p>
          {(selectedDate || selectedCategory) && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={clearFilters}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default History;
