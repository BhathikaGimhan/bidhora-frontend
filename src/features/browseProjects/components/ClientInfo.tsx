import React from "react";
import { User, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Client {
  name: string;
  location: string;
  rating: number;
  projectsPosted: number;
}

interface ClientInfoProps {
  client: Client;
}

const ClientInfo: React.FC<ClientInfoProps> = ({ client }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 w-full">
      {/* Left side */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground text-base truncate">
            {client.name}
          </p>
          <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{client.rating}</span>
            <span>•</span>
            <span className="truncate">{client.projectsPosted} projects posted</span>
          </div>
        </div>
      </div>

      {/* Right side button */}
      <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 transition-all duration-300">
        Submit Proposal
      </Button>
    </div>
  );
};

export default ClientInfo;
