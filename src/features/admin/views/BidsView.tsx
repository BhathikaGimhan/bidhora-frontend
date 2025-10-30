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
import { MoreHorizontal, Eye, CheckCircle, X } from 'lucide-react';
import { bidController } from '@/features/admin/controllers/bidController';
import { Bid } from '@/features/admin/models/BidModel';
import { useToast } from '@/hooks/use-toast';

export function BidsView() {
  const [bids, setBids] = useState(bidController.getAllBids());
  const { toast } = useToast();

  const handleSearch = (query: string) => {
    if (query.trim() === '') {
      setBids(bidController.getAllBids());
    } else {
      setBids(bidController.searchBids(query));
    }
  };

  const handleStatusChange = (bidId: string, newStatus: Bid['status']) => {
    const success = bidController.updateBidStatus(bidId, newStatus);
    if (success) {
      setBids(bidController.getAllBids());
      toast({
        title: 'Bid Updated',
        description: `Bid status changed to ${newStatus}`,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'withdrawn':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const columns = [
    {
      key: 'projectTitle',
      title: 'Project',
      sortable: true,
      render: (value: string, bid: Bid) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {bid.proposal.substring(0, 100)}...
          </div>
        </div>
      ),
    },
    {
      key: 'bidderName',
      title: 'Bidder',
      sortable: true,
      render: (value: string, bid: Bid) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground flex items-center space-x-1">
            <span>{bid.freelancerRating.toFixed(1)}</span>
            <span className="text-yellow-500">★</span>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      title: 'Bid Amount',
      sortable: true,
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      key: 'deliveryTime',
      title: 'Delivery',
      sortable: true,
      render: (value: number) => `${value} days`,
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
      key: 'createdDate',
      title: 'Submitted',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const actions = (bid: Bid) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => console.log('View bid', bid.id)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        {bid.status === 'pending' && (
          <>
            <DropdownMenuItem onClick={() => handleStatusChange(bid.id, 'accepted')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Accept Bid
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange(bid.id, 'rejected')}>
              <X className="mr-2 h-4 w-4" />
              Reject Bid
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <DataTable
        title="Bids Management"
        data={bids}
        columns={columns}
        searchPlaceholder="Search bids by project or bidder..."
        onSearch={handleSearch}
        actions={actions}
      />
    </div>
  );
}