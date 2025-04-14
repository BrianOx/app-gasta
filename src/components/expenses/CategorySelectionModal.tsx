
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Category } from "@/models/Category";

interface CategorySelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  categories: Category[];
  selectedCategoryId: string;
  onSelect: (categoryId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const CategorySelectionModal: React.FC<CategorySelectionModalProps> = ({
  open,
  onOpenChange,
  title = "Seleccionar categoría",
  description = "No se pudo determinar la categoría exacta para este gasto. Por favor, seleccioná la categoría correcta.",
  categories,
  selectedCategoryId,
  onSelect,
  onConfirm,
  onCancel,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 max-h-[50vh] overflow-y-auto">
          <RadioGroup
            value={selectedCategoryId}
            onValueChange={onSelect}
            className="space-y-2"
          >
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center space-x-2 p-3 rounded-md hover:bg-accent cursor-pointer border border-border"
                onClick={() => onSelect(category.id)}
              >
                <RadioGroupItem value={category.id} id={`category-${category.id}`} />
                <div
                  className="w-5 h-5 rounded-full mr-2"
                  style={{ backgroundColor: category.color }}
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 text-foreground"
                >
                  {category.name}
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CategorySelectionModal;
