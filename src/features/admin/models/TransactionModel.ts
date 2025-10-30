export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'credit_purchase' | 'project_payment' | 'withdrawal' | 'refund' | 'commission';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  createdDate: string;
  paymentMethod?: string;
  adminApprovalRequired: boolean;
}

export interface TransactionStats {
  totalRevenue: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
}