import { Transaction, TransactionStats } from '@/features/admin/models/TransactionModel';
import { db } from "@/firebaseConfig";
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";

class TransactionController {
  private transactions: Transaction[] = [];
  private lastFetch: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  async fetchTransactions(): Promise<Transaction[]> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.transactions.length > 0 && now - this.lastFetch < this.CACHE_DURATION) {
      return this.transactions;
    }

    try {
      // Fetch from projects collection (payments)
      const projectsRef = collection(db, "projects");
      const projectsSnapshot = await getDocs(projectsRef);
      
      const transactions: Transaction[] = [];
      
      projectsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        
        // Add initial payment transaction if exists
        if (data.initialPaymentAmount && data.initialPaymentAmount > 0) {
          transactions.push({
            id: `${doc.id}-initial`,
            userId: data.clientId || "unknown",
            userName: data.clientName || "Unknown Client",
            type: 'project_payment',
            amount: data.initialPaymentAmount,
            status: data.initialPaymentStatus === "paid" ? 'completed' : 'pending',
            description: `Initial payment for ${data.title}`,
            createdDate: data.initialPaymentDate ? new Date(data.initialPaymentDate.toDate()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            paymentMethod: data.initialPaymentMethod || 'Genie Payment',
            adminApprovalRequired: false
          });
        }

        // Add final payment transaction if exists
        if (data.finalPaymentAmount && data.finalPaymentAmount > 0) {
          transactions.push({
            id: `${doc.id}-final`,
            userId: data.clientId || "unknown",
            userName: data.clientName || "Unknown Client",
            type: 'project_payment',
            amount: data.finalPaymentAmount,
            status: data.finalPaymentStatus === "paid" ? 'completed' : 'pending',
            description: `Final payment for ${data.title}`,
            createdDate: data.finalPaymentDate ? new Date(data.finalPaymentDate.toDate()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            paymentMethod: data.finalPaymentMethod || 'Genie Payment',
            adminApprovalRequired: false
          });
        }
      });

      // Sort by date (most recent first)
      this.transactions = transactions.sort((a, b) => 
        new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      );

      this.lastFetch = now;
      return this.transactions;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await this.fetchTransactions();
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    const transactions = await this.fetchTransactions();
    return transactions.find(transaction => transaction.id === id);
  }

  async getTransactionStats(): Promise<TransactionStats> {
    const transactions = await this.fetchTransactions();
    const completed = transactions.filter(t => t.status === 'completed');
    
    return {
      totalRevenue: completed.reduce((sum, t) => sum + t.amount, 0),
      pendingTransactions: transactions.filter(t => t.status === 'pending').length,
      completedTransactions: completed.length,
      failedTransactions: transactions.filter(t => t.status === 'failed').length
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