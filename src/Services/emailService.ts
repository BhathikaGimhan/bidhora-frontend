import axios from "axios";

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  clientTime?: string;
}

export interface ProjectPriceNotificationData {
  to_email: string;
  to_name?: string;
  project_title: string;
  project_price: number;
  project_duration?: string;
  admin_notes?: string;
  project_id: string;
  payment_link: string; // Add payment link
  deposit_amount: number; // Fixed deposit amount (1500 LKR)
}

export interface EmployeeAssignmentNotificationData {
  employeeEmail: string;
  employeeName: string;
  projectTitle: string;
  projectDescription: string;
  projectPrice: number;
  projectId: string;
  buyerEmail: string;
  projectLink?: string; // Custom link for employee to access the project
  isUrgent?: boolean;
}

export interface FinalPaymentNotificationData {
  to_email: string;
  to_name: string;
  project_title: string;
  project_id: string;
  amount: number; // Final part payment amount
  payment_link: string;
}

export interface MarketerWelcomeData {
  email: string;
  name: string;
  promoCode: string;
  commissionRate: number;
  profileId: string;
}

export interface PartPaymentNotificationData {
  to_email: string;
  to_name: string;
  project_title: string;
  part_tag: string;
  submission_id: string;
  amount: number;
  payment_link: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
}

class EmailService {
  private apiBaseUrl: string;

  constructor() {
    // Use Firebase Functions URL that's allowed in CSP
    this.apiBaseUrl = "https://us-central1-bidhora.cloudfunctions.net";
  }

  async sendContactEmail(contactData: ContactFormData): Promise<EmailResponse> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/sendContactEmail`,
        {
          name: contactData.name,
          email: contactData.email,
          subject: contactData.subject,
          message: contactData.message,
          clientTime: contactData.clientTime,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        message: response.data.message || "Email sent successfully!",
      };
    } catch (error) {
      console.error("Error sending contact email:", error);
      return {
        success: false,
        message: "Failed to send email. Please try again later.",
      };
    }
  }

  async sendMarketerWelcomeEmail(data: MarketerWelcomeData): Promise<EmailResponse> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/sendMarketerWelcomeEmail`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        message: response.data.message || "Welcome email sent successfully!",
      };
    } catch (error) {
      console.error("Error sending marketer welcome email:", error);
      return {
        success: false,
        message: "Failed to send welcome email. Please try again later.",
      };
    }
  }

  async sendProjectPriceNotification(
    notificationData: ProjectPriceNotificationData
  ): Promise<EmailResponse> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/sendProjectPriceNotification`,
        {
          to_email: notificationData.to_email,
          to_name: notificationData.to_name || "Valued Customer",
          project_title: notificationData.project_title,
          project_price: notificationData.project_price,
          project_duration:
            notificationData.project_duration || "Not specified",
          admin_notes: notificationData.admin_notes || "No additional notes",
          project_id: notificationData.project_id,
          payment_link: notificationData.payment_link,
          deposit_amount: notificationData.deposit_amount,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        message:
          response.data.message || "Price notification sent successfully!",
      };
    } catch (error) {
      console.error("Project price notification error:", error);

      // Return a user-friendly error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send price notification. Please try again later.";
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  async sendEmployeeAssignmentNotification(
    notificationData: EmployeeAssignmentNotificationData
  ): Promise<EmailResponse> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/sendEmployeeAssignmentNotification`,
        {
          employee_email: notificationData.employeeEmail,
          employee_name: notificationData.employeeName,
          project_title: notificationData.projectTitle,
          project_description: notificationData.projectDescription,
          project_price: notificationData.projectPrice,
          project_id: notificationData.projectId,
          buyer_email: notificationData.buyerEmail,
          project_link: notificationData.projectLink,
          is_urgent: notificationData.isUrgent || false,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        message:
          response.data.message ||
          "Employee assignment notification sent successfully!",
      };
    } catch (error) {
      console.error("Employee assignment notification error:", error);

      // Return a user-friendly error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send assignment notification. Please try again later.";
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  async sendFinalPaymentNotification(
    notificationData: FinalPaymentNotificationData
  ): Promise<EmailResponse> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/sendFinalPaymentNotification`,
        {
          to_email: notificationData.to_email,
          to_name: notificationData.to_name,
          project_title: notificationData.project_title,
          project_id: notificationData.project_id,
          amount: notificationData.amount,
          payment_link: notificationData.payment_link,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        message:
          response.data.message ||
          "Final payment notification sent successfully!",
      };
    } catch (error) {
      console.error("Final payment notification error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send final payment notification. Please try again later.";
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  async sendPartPaymentNotification(
    notificationData: PartPaymentNotificationData
  ): Promise<EmailResponse> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/sendPartPaymentNotification`,
        {
          to_email: notificationData.to_email,
          to_name: notificationData.to_name,
          project_title: notificationData.project_title,
          part_tag: notificationData.part_tag,
          submission_id: notificationData.submission_id,
          amount: notificationData.amount,
          payment_link: notificationData.payment_link,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        message:
          response.data.message ||
          "Part payment notification sent successfully!",
      };
    } catch (error) {
      console.error("Part payment notification error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send part payment notification. Please try again later.";
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
}

export const emailService = new EmailService();
