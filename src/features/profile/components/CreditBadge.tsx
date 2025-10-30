// components/CreditBadge.tsx
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";

interface CreditBadgeProps {
  credits: number;
}

const CreditBadge: React.FC<CreditBadgeProps> = ({ credits }) => {
  return (
    <div className="">
      <Badge
        variant="outline"
        className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm px-3 py-1"
      >
        <Coins className="w-8 h-8 text-yellow-600" />
        <span className="text-sm font-medium">{credits} Credits</span>
      </Badge>
    </div>
  );
};

export default CreditBadge;
