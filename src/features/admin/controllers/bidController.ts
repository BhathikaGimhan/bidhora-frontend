import { Bid, BidStats } from '@/features/admin/models/BidModel';

// Mock data
const mockBids: Bid[] = [
  {
    id: '1',
    projectId: '1',
    projectTitle: 'E-commerce Website Development',
    bidderId: '1',
    bidderName: 'Sarah Johnson',
    amount: 2500,
    deliveryTime: 30,
    status: 'pending',
    proposal: 'I have 5+ years of experience in React and Node.js development...',
    createdDate: '2024-09-02',
    freelancerRating: 4.8
  },
  {
    id: '2',
    projectId: '1',
    projectTitle: 'E-commerce Website Development',
    bidderId: '3',
    bidderName: 'Alex Rivera',
    amount: 2200,
    deliveryTime: 25,
    status: 'accepted',
    proposal: 'I can deliver a high-quality e-commerce solution within your budget...',
    createdDate: '2024-09-03',
    freelancerRating: 4.2
  },
  {
    id: '3',
    projectId: '2',
    projectTitle: 'Mobile App UI/UX Design',
    bidderId: '1',
    bidderName: 'Sarah Johnson',
    amount: 1200,
    deliveryTime: 14,
    status: 'pending',
    proposal: 'I specialize in mobile app design with a focus on user experience...',
    createdDate: '2024-09-16',
    freelancerRating: 4.8
  }
];

class BidController {
  private bids: Bid[] = mockBids;

  getAllBids(): Bid[] {
    return this.bids;
  }

  getBidById(id: string): Bid | undefined {
    return this.bids.find(bid => bid.id === id);
  }

  getBidStats(): BidStats {
    return {
      totalBids: this.bids.length,
      pendingBids: this.bids.filter(b => b.status === 'pending').length,
      acceptedBids: this.bids.filter(b => b.status === 'accepted').length,
      rejectedBids: this.bids.filter(b => b.status === 'rejected').length
    };
  }

  updateBidStatus(id: string, status: Bid['status']): boolean {
    const bidIndex = this.bids.findIndex(bid => bid.id === id);
    if (bidIndex !== -1) {
      this.bids[bidIndex].status = status;
      return true;
    }
    return false;
  }

  getBidsByProject(projectId: string): Bid[] {
    return this.bids.filter(bid => bid.projectId === projectId);
  }

  getBidsByFreelancer(bidderId: string): Bid[] {
    return this.bids.filter(bid => bid.bidderId === bidderId);
  }

  searchBids(query: string): Bid[] {
    const lowercaseQuery = query.toLowerCase();
    return this.bids.filter(bid =>
      bid.projectTitle.toLowerCase().includes(lowercaseQuery) ||
      bid.bidderName.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const bidController = new BidController();