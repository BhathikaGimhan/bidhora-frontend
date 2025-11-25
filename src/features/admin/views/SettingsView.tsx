import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Button } from "../../../components/ui/button";
import { Switch } from "../../../components/ui/switch";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Settings, Wrench, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getMaintenanceMode, updateMaintenanceMode, MaintenanceMode } from "../../../Services/maintenanceService";
import { auth } from "../../../firebaseConfig";
import { useToast } from "../../../hooks/use-toast";

export function SettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenance, setMaintenance] = useState<MaintenanceMode>({
    enabled: false,
    title: "System Maintenance",
    message: "We're currently performing scheduled maintenance. Please check back soon.",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMaintenanceSettings();
  }, []);

  const loadMaintenanceSettings = async () => {
    try {
      setLoading(true);
      const settings = await getMaintenanceMode();
      setMaintenance(settings);
    } catch (error) {
      console.error("Error loading maintenance settings:", error);
      toast({
        title: "Error",
        description: "Failed to load maintenance settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      await updateMaintenanceMode(
        maintenance.enabled,
        maintenance.title,
        maintenance.message,
        currentUser.uid
      );

      setHasChanges(false);
      toast({
        title: "Settings Saved",
        description: maintenance.enabled 
          ? "Maintenance mode has been activated. Users will see the maintenance banner."
          : "Maintenance mode has been deactivated.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof MaintenanceMode, value: string | boolean) => {
    setMaintenance(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage system-wide settings and configurations
          </p>
        </div>
      </div>

      {/* Maintenance Mode Section */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg">Maintenance Mode</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Enable maintenance mode to prevent user access during updates or system maintenance
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
          {/* Enable/Disable Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 rounded-lg border bg-muted/50">
            <div className="space-y-1 flex-1">
              <Label className="text-sm sm:text-base font-medium">
                Activate Maintenance Mode
              </Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                When enabled, all users except admins will see a maintenance banner
              </p>
            </div>
            <Switch
              checked={maintenance.enabled}
              onCheckedChange={(checked) => updateField("enabled", checked)}
              className="flex-shrink-0"
            />
          </div>

          {/* Status Alert */}
          {maintenance.enabled ? (
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-500" />
              <AlertDescription className="text-xs sm:text-sm text-orange-800 dark:text-orange-300">
                Maintenance mode is <strong>ACTIVE</strong>. All users are currently seeing the maintenance banner.
                {maintenance.enabledAt && (
                  <span className="block mt-1 text-xs">
                    Enabled on {maintenance.enabledAt.toLocaleString()}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
              <AlertDescription className="text-xs sm:text-sm text-green-800 dark:text-green-300">
                Maintenance mode is <strong>INACTIVE</strong>. The site is operating normally.
              </AlertDescription>
            </Alert>
          )}

          {/* Maintenance Title */}
          <div className="space-y-2">
            <Label htmlFor="maintenance-title" className="text-sm sm:text-base">
              Maintenance Banner Title
            </Label>
            <Input
              id="maintenance-title"
              value={maintenance.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g., System Maintenance"
              className="text-sm sm:text-base"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              {maintenance.title.length}/100 characters
            </p>
          </div>

          {/* Maintenance Message */}
          <div className="space-y-2">
            <Label htmlFor="maintenance-message" className="text-sm sm:text-base">
              Maintenance Banner Message
            </Label>
            <Textarea
              id="maintenance-message"
              value={maintenance.message}
              onChange={(e) => updateField("message", e.target.value)}
              placeholder="e.g., We're currently performing scheduled maintenance. Please check back soon."
              rows={4}
              className="text-sm sm:text-base resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {maintenance.message.length}/500 characters
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Live Preview</Label>
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-brand-primary dark:bg-brand-primary/90 border-b border-white/20 shadow-lg">
                <div className="px-4 py-3 sm:py-4">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-pulse" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white flex-shrink-0" />
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          {maintenance.title || "System Maintenance"}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-white/90 break-words leading-relaxed">
                        {maintenance.message || "We're currently performing scheduled maintenance. Please check back soon."}
                      </p>
                    </div>
                    <div className="flex-shrink-0 hidden sm:block">
                      <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-muted/50 px-4 py-2 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  This is how the banner will appear to users
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="w-full sm:w-auto"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            {hasChanges && (
              <Button
                onClick={loadMaintenanceSettings}
                variant="outline"
                className="w-full sm:w-auto"
                size="lg"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Settings Placeholder */}
      <Card className="opacity-60">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Additional Settings</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            More system settings will be available here in future updates
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <p className="text-xs sm:text-sm text-muted-foreground text-center py-8">
            Coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}