import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin } from "lucide-react";

interface Props {
  values: { deadline: string; location: string };
  onChange: (field: string, value: string) => void;
}

const DeadlineLocationFields: React.FC<Props> = ({ values, onChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="deadline" className="text-foreground">
        Deadline *
      </Label>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="deadline"
          type="date"
          value={values.deadline}
          onChange={(e) => onChange("deadline", e.target.value)}
          className="pl-10 bg-background border-input text-foreground"
          required
          aria-label="Project deadline"
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor="location" className="text-foreground">
        Location
      </Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="location"
          value={values.location}
          onChange={(e) => onChange("location", e.target.value)}
          placeholder="e.g., Remote or New York, NY"
          className="pl-10 bg-background border-input text-foreground"
          aria-label="Project location"
        />
      </div>
    </div>
  </div>
);

export default DeadlineLocationFields;