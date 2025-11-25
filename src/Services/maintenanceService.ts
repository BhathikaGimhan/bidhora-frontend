import { doc, getDoc, setDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export interface MaintenanceMode {
  enabled: boolean;
  title: string;
  message: string;
  enabledAt?: Date;
  enabledBy?: string;
}

const MAINTENANCE_DOC_PATH = "settings/maintenance";

// Get current maintenance mode status
export const getMaintenanceMode = async (): Promise<MaintenanceMode> => {
  try {
    const maintenanceDoc = await getDoc(doc(db, MAINTENANCE_DOC_PATH));
    
    if (maintenanceDoc.exists()) {
      const data = maintenanceDoc.data();
      return {
        enabled: data.enabled || false,
        title: data.title || "System Maintenance",
        message: data.message || "We're currently performing scheduled maintenance. Please check back soon.",
        enabledAt: data.enabledAt?.toDate(),
        enabledBy: data.enabledBy,
      };
    }
    
    // Default values if document doesn't exist
    return {
      enabled: false,
      title: "System Maintenance",
      message: "We're currently performing scheduled maintenance. Please check back soon.",
    };
  } catch (error) {
    console.error("Error fetching maintenance mode:", error);
    return {
      enabled: false,
      title: "System Maintenance",
      message: "We're currently performing scheduled maintenance. Please check back soon.",
    };
  }
};

// Update maintenance mode
export const updateMaintenanceMode = async (
  enabled: boolean,
  title: string,
  message: string,
  adminUid: string
): Promise<void> => {
  try {
    const maintenanceData: {
      enabled: boolean;
      title: string;
      message: string;
      updatedAt: Timestamp;
      enabledAt?: Timestamp;
      enabledBy?: string;
      disabledAt?: Timestamp;
    } = {
      enabled,
      title,
      message,
      updatedAt: Timestamp.now(),
    };

    if (enabled) {
      maintenanceData.enabledAt = Timestamp.now();
      maintenanceData.enabledBy = adminUid;
    } else {
      maintenanceData.disabledAt = Timestamp.now();
    }

    await setDoc(doc(db, MAINTENANCE_DOC_PATH), maintenanceData, { merge: true });
  } catch (error) {
    console.error("Error updating maintenance mode:", error);
    throw new Error("Failed to update maintenance mode");
  }
};

// Subscribe to maintenance mode changes (real-time)
export const subscribeToMaintenanceMode = (
  callback: (maintenance: MaintenanceMode) => void
): (() => void) => {
  const unsubscribe = onSnapshot(
    doc(db, MAINTENANCE_DOC_PATH),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          enabled: data.enabled || false,
          title: data.title || "System Maintenance",
          message: data.message || "We're currently performing scheduled maintenance. Please check back soon.",
          enabledAt: data.enabledAt?.toDate(),
          enabledBy: data.enabledBy,
        });
      } else {
        callback({
          enabled: false,
          title: "System Maintenance",
          message: "We're currently performing scheduled maintenance. Please check back soon.",
        });
      }
    },
    (error) => {
      console.error("Error subscribing to maintenance mode:", error);
    }
  );

  return unsubscribe;
};
