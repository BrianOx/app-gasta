
import { Expense, ExpenseInput } from "@/models/Expense";
import { Category, CategoryInput } from "@/models/Category";
import { Settings } from "@/models/Settings";

// Default categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Comida", color: "#FF6B6B", icon: "utensils" },
  { id: "2", name: "Transporte", color: "#4ECDC4", icon: "car" },
  { id: "3", name: "Compras", color: "#FFD166", icon: "shopping-bag" },
  { id: "4", name: "Entretenimiento", color: "#6A0572", icon: "film" },
  { id: "5", name: "Salud", color: "#1A936F", icon: "heart-pulse" },
  { id: "6", name: "Facturas", color: "#3D5A80", icon: "file-text" },
  { id: "7", name: "Otros", color: "#8A817C", icon: "more-horizontal" },
];

// Default settings
const DEFAULT_SETTINGS: Settings = {
  monthlyLimit: 50000,
  enableNotifications: true,
  enableVoiceRecognition: true,
};

class DatabaseService {
  private expenses: Expense[] = [];
  private categories: Category[] = [...DEFAULT_CATEGORIES];
  private settings: Settings = { ...DEFAULT_SETTINGS };
  
  // Initialize with some sample data
  constructor() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    this.expenses = [
      {
        id: "1",
        amount: 2500,
        description: "Sushi",
        categoryId: "1",
        date: today,
        createdAt: today,
      },
      {
        id: "2",
        amount: 1500,
        description: "Nafta",
        categoryId: "2",
        date: yesterday,
        createdAt: yesterday,
      },
      {
        id: "3",
        amount: 3000,
        description: "Cine",
        categoryId: "4",
        date: twoDaysAgo,
        createdAt: twoDaysAgo,
      },
      {
        id: "4",
        amount: 5000,
        description: "Supermercado",
        categoryId: "3",
        date: yesterday,
        createdAt: yesterday,
      },
    ];
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return [...this.expenses].sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getExpenseById(id: string): Promise<Expense | undefined> {
    return this.expenses.find(expense => expense.id === id);
  }

  async addExpense(expense: ExpenseInput): Promise<Expense> {
    const newExpense: Expense = {
      id: Date.now().toString(),
      ...expense,
      createdAt: new Date(),
    };
    this.expenses.push(newExpense);
    return newExpense;
  }

  async updateExpense(id: string, expense: Partial<ExpenseInput>): Promise<Expense | undefined> {
    const index = this.expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      this.expenses[index] = {
        ...this.expenses[index],
        ...expense,
      };
      return this.expenses[index];
    }
    return undefined;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const initialLength = this.expenses.length;
    this.expenses = this.expenses.filter(expense => expense.id !== id);
    return initialLength !== this.expenses.length;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return [...this.categories];
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return this.categories.find(category => category.id === id);
  }

  async addCategory(category: CategoryInput): Promise<Category> {
    const newCategory: Category = {
      id: Date.now().toString(),
      ...category,
    };
    this.categories.push(newCategory);
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<CategoryInput>): Promise<Category | undefined> {
    const index = this.categories.findIndex(c => c.id === id);
    if (index !== -1) {
      this.categories[index] = {
        ...this.categories[index],
        ...category,
      };
      return this.categories[index];
    }
    return undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    // Don't delete if expenses are using this category
    if (this.expenses.some(expense => expense.categoryId === id)) {
      return false;
    }
    
    const initialLength = this.categories.length;
    this.categories = this.categories.filter(category => category.id !== id);
    return initialLength !== this.categories.length;
  }

  // Settings
  async getSettings(): Promise<Settings> {
    return { ...this.settings };
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    this.settings = {
      ...this.settings,
      ...settings,
    };
    return this.settings;
  }

  // Analytics
  async getTotalExpensesByCategory(): Promise<{categoryId: string; total: number}[]> {
    const result: Record<string, number> = {};
    
    this.expenses.forEach(expense => {
      if (!result[expense.categoryId]) {
        result[expense.categoryId] = 0;
      }
      result[expense.categoryId] += expense.amount;
    });
    
    return Object.entries(result).map(([categoryId, total]) => ({
      categoryId,
      total,
    }));
  }

  async getCurrentMonthTotal(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return this.expenses
      .filter(expense => expense.date >= startOfMonth)
      .reduce((sum, expense) => sum + expense.amount, 0);
  }
}

// Singleton instance
export const databaseService = new DatabaseService();
