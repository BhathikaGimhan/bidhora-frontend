import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DollarSign,
  Clock,
  Calendar,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Proposal, User as UserType } from "@/Services/projectService";

interface ProposalItemProps {
  proposal: Proposal & {
    seller?: UserType;
    project?: {
      status?: string;
      assignedTo?: string;
    };
  };
  onApprove?: (proposalId: string, sellerId: string) => void;
  onReject?: (proposalId: string) => void;
  isOwner?: boolean;
}

export const ProposalItem = ({
  proposal,
  onApprove,
  onReject,
  isOwner = false,
}: ProposalItemProps) => {
  console.log("Rendering ProposalItem with proposal:", proposal);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (
    date:
      | Date
      | { toDate: () => Date }
      | { _seconds: number }
      | string
      | number
      | null
      | undefined
  ) => {
    if (!date) return "N/A";

    try {
      // Handle Firestore Timestamp
      if (
        date &&
        typeof date === "object" &&
        "toDate" in date &&
        typeof date.toDate === "function"
      ) {
        date = date.toDate();
      }
      // Handle Firestore Timestamp with _seconds
      else if (date && typeof date === "object" && "_seconds" in date) {
        date = new Date(date._seconds * 1000);
      }
      // Handle ISO string
      else if (typeof date === "string") {
        date = new Date(date);
      }
      // Handle number (timestamp)
      else if (typeof date === "number") {
        date = new Date(date);
      }

      return date instanceof Date && !isNaN(date.getTime())
        ? date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "N/A";
    } catch (error) {
      console.error("Error formatting date:", error, date);
      return "N/A";
    }
  };

  const formatTime = (
    date: Date | { toDate: () => Date } | string | number | null | undefined
  ) => {
    if (!date) return "N/A";

    if (
      date &&
      typeof date === "object" &&
      "toDate" in date &&
      typeof date.toDate === "function"
    ) {
      date = date.toDate();
    }

    if (typeof date === "string") {
      date = new Date(date);
    }

    return date instanceof Date && !isNaN(date.getTime())
      ? date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Invalid Time";
  };

  const canTakeActions =
    isOwner &&
    proposal.status === "pending" &&
    (!proposal.project?.assignedTo || proposal.project?.status !== "ongoing");

  return (
    <Card className="hover:shadow-sm transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={proposal.seller?.photoURL || ""}
                alt={proposal.seller?.displayName || "User"}
              />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-medium text-base">
                {proposal.seller?.displayName || "Anonymous"}
              </h4>
              {proposal.name && (
                <p className="text-sm font-medium text-primary">
                  "{proposal.name}"
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {proposal.seller?.email}
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`text-xs font-medium ${getStatusColor(proposal.status)}`}
          >
            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Proposal Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-emerald-600">
              LKR {proposal.biddingPrice?.toLocaleString() || "N/A"}
              </span>
            </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              {proposal.estimatedDuration} {proposal.durationUnit}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              Delivery:{" "}
              {proposal.deliveryDate
                ? formatDate(proposal.deliveryDate)
                : "TBD"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              Submitted: {formatDate(proposal.createdAt)} at{" "}
              {formatTime(proposal.createdAt)}
            </span>
          </div>
        </div>

        {/* Additional Notes */}
        {proposal.additionalNotes && (
          <div className="border-t pt-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Notes:</span>{" "}
              {proposal.additionalNotes}
            </p>
          </div>
        )}

        {/* Content/Description */}
        {proposal.content && (
          <div className="border-t pt-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Message:</span> {proposal.content}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {canTakeActions && (
          <div className="flex gap-2 pt-3 border-t">
            <Button
              size="sm"
              onClick={() =>
                onApprove?.(proposal.id || "", proposal.proposalSenderId)
              }
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              Approve & Assign
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject?.(proposal.id || "")}
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
          </div>
        )}

        {/* Status Messages */}
        {proposal.status === "accepted" && (
          <div className="flex items-center gap-2 text-green-600 text-sm pt-2 border-t">
            <CheckCircle className="w-4 h-4" />
            <span>This ProjectX has been accepted and assigned</span>
          </div>
        )}

        {proposal.status === "rejected" && (
          <div className="flex items-center gap-2 text-red-600 text-sm pt-2 border-t">
            <XCircle className="w-4 h-4" />
            <span>This ProjectX has been rejected</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
