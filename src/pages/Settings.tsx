
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mic, Save, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { databaseService } from "@/services/DatabaseService";
import { voiceRecognitionService } from "@/services/VoiceRecognitionService";
import { Settings as SettingsModel } from "@/models/Settings";
import { formatCurrency } from "@/utils/formatters";

const Settings = () => {
  const [settings, setSettings] = useState<SettingsModel | null>(null);
  const [monthlyLimit, setMonthlyLimit] = useState<string>("");
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);

  useEffect(() => {
    loadSettings();
    checkVoiceSupport();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await databaseService.getSettings();
      setSettings(loadedSettings);
      setMonthlyLimit(loadedSettings.monthlyLimit.toString());
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar la configuración",
        variant: "destructive",
      });
    }
  };

  const checkVoiceSupport = () => {
    const isSupported = voiceRecognitionService.isRecognitionSupported();
    setIsVoiceSupported(isSupported);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      const parsedLimit = parseFloat(monthlyLimit);
      
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        toast({
          title: "Error",
          description: "El límite mensual debe ser un número positivo",
          variant: "destructive",
        });
        return;
      }

      const updatedSettings = await databaseService.updateSettings({
        ...settings,
        monthlyLimit: parsedLimit,
      });

      setSettings(updatedSettings);
      toast({
        title: "Configuración guardada",
        description: "La configuración se guardó correctamente",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    }
  };

  const handleNotificationsChange = async (enabled: boolean) => {
    if (!settings) return;

    try {
      const updatedSettings = await databaseService.updateSettings({
        ...settings,
        enableNotifications: enabled,
      });

      setSettings(updatedSettings);
      toast({
        title: "Configuración actualizada",
        description: `Notificaciones ${enabled ? "activadas" : "desactivadas"}`,
      });
    } catch (error) {
      console.error("Error updating notification settings:", error);
    }
  };

  const handleVoiceRecognitionChange = async (enabled: boolean) => {
    if (!settings) return;

    try {
      const updatedSettings = await databaseService.updateSettings({
        ...settings,
        enableVoiceRecognition: enabled,
      });

      setSettings(updatedSettings);
      toast({
        title: "Configuración actualizada",
        description: `Reconocimiento de voz ${enabled ? "activado" : "desactivado"}`,
      });
    } catch (error) {
      console.error("Error updating voice recognition settings:", error);
    }
  };

  return (
    <div className="container px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>

      <div className="space-y-6">
        {/* Monthly limit */}
        <Card>
          <CardHeader>
            <CardTitle>Límite Mensual</CardTitle>
            <CardDescription>
              Define un límite mensual para tus gastos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyLimit">Monto máximo por mes</Label>
                <div className="flex space-x-2">
                  <Input
                    id="monthlyLimit"
                    type="number"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                    placeholder="0"
                  />
                  <Button onClick={handleSaveSettings}>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                </div>
              </div>
              
              {settings && (
                <p className="text-sm text-muted-foreground">
                  Límite actual: {formatCurrency(settings.monthlyLimit)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
            <CardDescription>
              Recibe alertas cuando te acerques a tu límite de gastos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Activar notificaciones</Label>
                <p className="text-sm text-muted-foreground">
                  Te avisaremos cuando estés cerca de tu límite mensual
                </p>
              </div>
              <Switch
                id="notifications"
                checked={settings?.enableNotifications || false}
                onCheckedChange={handleNotificationsChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Voice Recognition */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Reconocimiento de Voz</CardTitle>
              {!isVoiceSupported && (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
            </div>
            <CardDescription>
              Registra gastos usando solo tu voz
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isVoiceSupported ? (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="voiceRecognition">Activar dictado por voz</Label>
                  <p className="text-sm text-muted-foreground">
                    Di por ejemplo: "Gasté 2500 en sushi, categoría comida"
                  </p>
                </div>
                <Switch
                  id="voiceRecognition"
                  checked={settings?.enableVoiceRecognition || false}
                  onCheckedChange={handleVoiceRecognitionChange}
                />
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Reconocimiento de voz no disponible
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Tu navegador no es compatible con el reconocimiento de voz.
                        Para usar esta función, prueba con Chrome, Edge o Safari.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>Acerca de</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gastapp - Versión 1.0.0
              <br />
              Una aplicación para gestionar tus gastos de manera sencilla.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
