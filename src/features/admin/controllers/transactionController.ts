import { Transaction, TransactionStats } from '@/features/admin/models/TransactionModel';

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    userId: '2',
    userName: 'Michael Chen',
    type: 'credit_purchase',
    amount: 100,
    status: 'completed',
    description: 'Credit purchase - 1000 coins',
    createdDate: '2024-09-15',
    paymentMethod: 'Credit Card',
    adminApprovalRequired: false
  },
  {
    id: '2',
    userId: '1',
    userName: 'Sarah Johnson',
    type: 'project_payment',
    amount: 2200,
    status: 'pending',
    description: 'Payment for E-commerce Website Development',
    createdDate: '2024-09-16',
    paymentMethod: 'Bank Transfer',
    adminApprovalRequired: true
  },
  {
    id: '3',
    userId: '3',
    userName: 'Alex Rivera',
    type: 'withdrawal',
    amount: 1500,
    status: 'completed',
    description: 'Withdrawal to bank account',
    createdDate: '2024-09-10',
    paymentMethod: 'Bank Transfer',
    adminApprovalRequired: true
  },
  {
    id: '4',
    userId: '7',
    userName: 'Premium Client',
    type: 'credit_purchase',
    amount: 10000,
    status: 'pending',
    description: 'Credit purchase - 10000 coins (Admin Approval Required)',
    createdDate: '2024-09-17',
    paymentMethod: 'Wire Transfer',
    adminApprovalRequired: true
  }
];

class TransactionController {
  private transactions: Transaction[] = mockTransactions;

  getAllTransactions(): Transaction[] {
    return this.transactions;
  }

  getTransactionById(id: string): Transaction | undefined {
    return this.transactions.find(transaction => transaction.id === id);
  }

  getTransactionStats(): TransactionStats {
    const completed = this.transactions.filter(t => t.status === 'completed');
    return {
      totalRevenue: completed.reduce((sum, t) => sum + t.amount, 0),
      pendingTransactions: this.transactions.filter(t => t.status === 'pending').length,
      completedTransactions: completed.length,
      failedTransactions: this.transactions.filter(t => t.status === 'failed').length
    };
  }

  updateTransactionStatus(id: string, status: Transaction['status']): boolean {
    const transactionIndex = this.transactions.findIndex(transaction => transaction.id === id);
    if (transactionIndex !== -1) {
      this.transactions[transactionIndex].status = status;
      return true;
    }
    return false;
  }

  getPendingApprovals(): Transaction[] {
    return this.transactions.filter(t => t.adminApprovalRequired && t.status === 'pending');
  }

  getTransactionsByUser(userId: string): Transaction[] {
    return this.transactions.filter(transaction => transaction.userId === userId);
  }

  getTransactionsByType(type: Transaction['type']): Transaction[] {
    return this.transactions.filter(transaction => transaction.type === type);
  }

  searchTransactions(query: string): Transaction[] {
    const lowercaseQuery = query.toLowerCase();
    return this.transactions.filter(transaction =>
      transaction.userName.toLowerCase().includes(lowercaseQuery) ||
      transaction.description.toLowerCase().includes(lowercaseQuery) ||
      transaction.type.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const transactionController = new TransactionController();