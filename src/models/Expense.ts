
export interface Expense {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: Date;
  createdAt: Date;
}

export interface ExpenseInput {
  amount: number;
  description: string;
  categoryId: string;
  date: Date;
}
