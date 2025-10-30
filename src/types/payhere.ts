// PayHere TypeScript Definitions
// Types for PayHere.js integration

export interface PayHereWindow extends Window {
  payhere?: PayHere;
}

export interface PayHere {
  startPayment: (payment: PayHerePayment) => void;
  onCompleted: (orderId: string) => void;
  onDismissed: () => void;
  onError: (error: string) => void;
}

export interface PayHerePayment {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_country?: string;
  custom_1?: string;
  custom_2?: string;
}

export interface PayHereNotifyPayload {
  merchant_id: string;
  order_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  custom_1?: string;
  custom_2?: string;
  method?: string;
  status_message?: string;
  card_holder_name?: string;
  card_no?: string;
  payment_id?: string;
}

export interface PaymentVerification {
  orderId: string;
  paymentId: string;
  status: "pending" | "success" | "failed" | "cancelled";
  amount: string;
  currency: string;
  cardLast4?: string;
  cardType?: string;
  verifiedAt?: Date;
  errorMessage?: string;
}

export interface PaymentVerificationInfo {
  verificationStatus: "not_started" | "processing" | "verified" | "failed";
  orderId?: string;
  paymentId?: string;
  transactionAmount?: string;
  cardLast4?: string;
  cardType?: string;
  verifiedAt?: Date;
  errorMessage?: string;
}

// Bank Account Details for Payment Verification
export interface BankAccountInfo {
  bankName: string;
  branchName: string;
  accountNumber: string;
  accountHolderName: string;
  passbookImage: File | null;
}
