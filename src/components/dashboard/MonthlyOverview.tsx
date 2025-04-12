
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "@/models/Settings";
import { formatCurrency } from "@/utils/formatters";

interface MonthlyOverviewProps {
  monthlyTotal: number;
  settings: Settings | null;
}

const MonthlyOverview = ({ monthlyTotal, settings }: MonthlyOverviewProps) => {
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

  return (
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
  );
};

export default MonthlyOverview;
