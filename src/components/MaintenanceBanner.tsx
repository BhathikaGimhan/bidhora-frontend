import { useEffect, useState } from "react";
import { AlertTriangle, Wrench } from "lucide-react";
import { subscribeToMaintenanceMode, MaintenanceMode } from "../Services/maintenanceService";

export const MaintenanceBanner = () => {
  const [maintenance, setMaintenance] = useState<MaintenanceMode>({
    enabled: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    const unsubscribe = subscribeToMaintenanceMode((data) => {
      setMaintenance(data);
      
      // Add padding to body when banner is visible
      if (data.enabled) {
        document.body.style.paddingTop = '80px';
      } else {
        document.body.style.paddingTop = '0';
      }
    });

    return () => {
      unsubscribe();
      document.body.style.paddingTop = '0';
    };
  }, []);

  if (!maintenance.enabled) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top">
      <div className="bg-brand-primary dark:bg-brand-primary/90 border-b border-white/20 shadow-lg">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex-shrink-0 mt-0.5 sm:mt-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-pulse" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-white flex-shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {maintenance.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-white/90 break-words leading-relaxed">
                {maintenance.message}
              </p>
            </div>
            <div className="flex-shrink-0 hidden sm:block">
              <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
