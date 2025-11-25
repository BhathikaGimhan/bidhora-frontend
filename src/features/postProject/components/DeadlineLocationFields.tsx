import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, MapPin } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Props {
  values: { deadline: string; location: string };
  onChange: (field: string, value: string) => void;
}

const DeadlineLocationFields: React.FC<Props> = ({ values, onChange }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Convert string date to Date object for calendar
  const selectedDate = values.deadline ? new Date(values.deadline) : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="deadline" className="text-foreground">
          Deadline *
        </Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !values.deadline && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {values.deadline ? (
                format(new Date(values.deadline), "PPP")
              ) : (
                <span>Pick a deadline date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  onChange("deadline", format(date, "yyyy-MM-dd"));
                  setIsCalendarOpen(false);
                }
              }}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
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
};

export default DeadlineLocationFields;