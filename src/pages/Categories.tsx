
import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "@/components/ui/use-toast";
import { databaseService } from "@/services/DatabaseService";
import { Category } from "@/models/Category";

const COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#FFD166", // Yellow
  "#6A0572", // Purple
  "#1A936F", // Green
  "#3D5A80", // Blue
  "#8A817C", // Gray
  "#E76F51", // Orange
  "#457B9D", // Blue-Gray
  "#F72585", // Pink
];

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // New category state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0]);
  
  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);
  
  const loadCategories = async () => {
    try {
      const loadedCategories = await databaseService.getCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      });
    }
  };
  
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría no puede estar vacío",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await databaseService.addCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
        icon: "circle", // Default icon
      });
      
      toast({
        title: "Categoría agregada",
        description: `La categoría "${newCategoryName}" se agregó correctamente`,
      });
      
      // Reset form and close dialog
      setNewCategoryName("");
      setNewCategoryColor(COLORS[0]);
      setIsAddDialogOpen(false);
      
      // Reload categories
      loadCategories();
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar la categoría",
        variant: "destructive",
      });
    }
  };
  
  const confirmDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      const success = await databaseService.deleteCategory(categoryToDelete.id);
      
      if (success) {
        toast({
          title: "Categoría eliminada",
          description: `La categoría "${categoryToDelete.name}" se eliminó correctamente`,
        });
      } else {
        toast({
          title: "No se puede eliminar",
          description: "La categoría tiene gastos asociados",
          variant: "destructive",
        });
      }
      
      // Reset state and close dialog
      setCategoryToDelete(null);
      setIsDeleteDialogOpen(false);
      
      // Reload categories
      loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Nueva
        </Button>
      </div>

      {/* Categories list */}
      <div className="space-y-3">
        {categories.map((category) => (
          <Card key={category.id} className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div
                  className="w-6 h-6 rounded-full mr-3"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium">{category.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => confirmDeleteCategory(category)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add category dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej: Transporte"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      newCategoryColor === color ? "ring-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewCategoryColor(color)}
                  >
                    {newCategoryColor === color && (
                      <div className="text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleAddCategory}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete category confirmation dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete?.name && (
                <>
                  La categoría "{categoryToDelete.name}" se eliminará. Esta acción
                  no se puede deshacer.
                  <br />
                  <br />
                  Nota: No se pueden eliminar categorías que tengan gastos asociados.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Categories;
