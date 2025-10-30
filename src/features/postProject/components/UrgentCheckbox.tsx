import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Clock, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  checked: boolean;
  onChange: (value: boolean) => void;
}

const UrgentCheckbox: React.FC<Props> = ({ checked, onChange }) => (
  <Card
    className={`border-2 transition-all duration-300 ${
      checked
        ? "border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/10"
        : "border-border hover:border-red-300/50"
    }`}
  >
    <CardContent className="p-4">
      <div className="flex items-start space-x-3">
        <div
          className={`p-2 rounded-lg transition-all duration-300 ${
            checked
              ? "bg-red-500/20 text-red-600"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {checked ? (
            <Zap className="w-5 h-5" />
          ) : (
            <Clock className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="urgent"
              className="text-foreground font-semibold cursor-pointer"
            >
              Mark as Urgent Project
            </Label>
            <Switch
              id="urgent"
              checked={checked}
              onCheckedChange={onChange}
              aria-label="Toggle urgent status"
              className="data-[state=checked]:bg-red-500"
            />
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>
                Urgent projects get priority placement and faster responses
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span>Appears at the top of project listings</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-500" />
              <span>Typically completed within 24-48 hours</span>
            </div>
          </div>

          {checked && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                ⚡ This project will be marked as URGENT and prioritized for
                faster service!
              </p>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default UrgentCheckbox;
