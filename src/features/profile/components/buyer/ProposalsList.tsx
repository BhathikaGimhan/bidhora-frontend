import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Users, AlertCircle } from "lucide-react";
import { ProposalItem } from "./ProposalItem";
import { Proposal, User as UserType } from "@/Services/projectService";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface ProposalsListProps {
  projectId: string;
  projectTitle: string;
  proposals: (Proposal & { sender?: UserType })[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onApproveProposal: (proposalId: string, sellerId: string) => void;
  onRejectProposal: (proposalId: string) => void;
  isOwner?: boolean;
}

export const ProposalsList = ({
  projectId,
  projectTitle,
  proposals,
  loading,
  error,
  onBack,
  onApproveProposal,
  onRejectProposal,
  isOwner = false,
}: ProposalsListProps) => {
  const [filteredProposals, setFilteredProposals] = useState(proposals);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "accepted" | "rejected"
  >("all");

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredProposals(proposals);
    } else {
      setFilteredProposals(
        proposals.filter((proposal) => proposal.status === statusFilter)
      );
    }
  }, [proposals, statusFilter]);

  const getProposalStats = () => {
    const total = proposals.length;
    const pending = proposals.filter((p) => p.status === "pending").length;
    const accepted = proposals.filter((p) => p.status === "accepted").length;
    const rejected = proposals.filter((p) => p.status === "rejected").length;

    return { total, pending, accepted, rejected };
  };

  const stats = getProposalStats();
  const filterOptions = [
    { value: "all", label: `All (${stats.total})` },
    { value: "pending", label: `Pending (${stats.pending})` },
    { value: "accepted", label: `Accepted (${stats.accepted})` },
    { value: "rejected", label: `Rejected (${stats.rejected})` },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
              <div>
                <CardTitle className="text-lg">ProjectX</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  For project: "{projectTitle}"
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">{proposals.length} total ProjectX</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filter Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setStatusFilter(
                    option.value as "all" | "pending" | "accepted" | "rejected"
                  )
                }
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">
              {statusFilter === "all"
                ? "No ProjectX yet"
                : `No ${statusFilter} ProjectX`}
            </h3>
            <p className="text-muted-foreground">
              {statusFilter === "all"
                ? "This project hasn't received any ProjectX yet."
                : `There are no ${statusFilter} ProjectX for this project.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <ProposalItem
              key={proposal.id}
              proposal={proposal}
              onApprove={onApproveProposal}
              onReject={onRejectProposal}
              isOwner={isOwner}
            />
          ))}
        </div>
      )}
    </div>
  );
};
