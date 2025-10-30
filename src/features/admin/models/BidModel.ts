export interface Bid {
  id: string;
  projectId: string;
  projectTitle: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  deliveryTime: number; // in days
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  proposal: string;
  createdDate: string;
  freelancerRating: number;
}

export interface BidStats {
  totalBids: number;
  pendingBids: number;
  acceptedBids: number;
  rejectedBids: number;
}