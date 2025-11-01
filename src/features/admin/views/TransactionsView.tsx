import { useState } from 'react';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, CheckCircle, X, RefreshCw } from 'lucide-react';
import { transactionController } from '@/features/admin/controllers/transactionController';
import { Transaction } from '@/features/admin/models/TransactionModel';
import { useToast } from '@/hooks/use-toast';

export function TransactionsView() {
  const [transactions, setTransactions] = useState(transactionController.getAllTransactions());
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const handleManualRefresh = async () => {
    setRefreshing(true);
    // Clear cache and reload
    transactionController['isLoaded'] = false;
    setTransactions(transactionController.getAllTransactions());
    setRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Transactions list updated successfully',
    });
  };

  const handleSearch = (query: string) => {
    if (query.trim() === '') {
      setTransactions(transactionController.getAllTransactions());
    } else {
      setTransactions(transactionController.searchTransactions(query));
    }
  };

  const handleStatusChange = (transactionId: string, newStatus: Transaction['status']) => {
    const success = transactionController.updateTransactionStatus(transactionId, newStatus);
    if (success) {
      setTransactions(transactionController.getAllTransactions());
      toast({
        title: 'Transaction Updated',
        description: `Transaction status changed to ${newStatus}`,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'credit_purchase':
        return 'bg-blue-100 text-blue-700';
      case 'project_payment':
        return 'bg-green-100 text-green-700';
      case 'withdrawal':
        return 'bg-orange-100 text-orange-700';
      case 'refund':
        return 'bg-red-100 text-red-700';
      case 'commission':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const columns = [
    {
      key: 'userName',
      title: 'User',
      sortable: true,
      render: (value: string, transaction: Transaction) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">ID: {transaction.userId}</div>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Type',
      sortable: true,
      render: (value: string) => (
        <Badge className={getTypeColor(value)}>
          {value.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value: string) => (
        <Badge variant={getStatusColor(value)}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      sortable: false,
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      key: 'paymentMethod',
      title: 'Payment Method',
      sortable: true,
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'adminApprovalRequired',
      title: 'Admin Approval',
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? 'destructive' : 'outline'}>
          {value ? 'Required' : 'Not Required'}
        </Badge>
      ),
    },
    {
      key: 'createdDate',
      title: 'Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const actions = (transaction: Transaction) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => console.log('View transaction', transaction.id)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        {transaction.status === 'pending' && transaction.adminApprovalRequired && (
          <>
            <DropdownMenuItem onClick={() => handleStatusChange(transaction.id, 'completed')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange(transaction.id, 'failed')}>
              <X className="mr-2 h-4 w-4" />
              Reject
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Transactions Management</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all platform transactions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      <DataTable
        title=""
        data={transactions}
        columns={columns}
        searchPlaceholder="Search transactions by user, type, or description..."
        onSearch={handleSearch}
        actions={actions}
      />
    </div>
  );
}