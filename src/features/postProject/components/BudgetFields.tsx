import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";

interface Props {
  values: { budgetMin: string; budgetMax: string };
  onChange: (field: string, value: string) => void;
}

const BudgetFields: React.FC<Props> = ({ values, onChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="budgetMin" className="text-foreground">Minimum Budget ($) *</Label>
      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="budgetMin"
          type="number"
          value={values.budgetMin}
          onChange={(e) => onChange("budgetMin", e.target.value)}
          placeholder="150"
          className="pl-10 bg-background border-input text-foreground"
          required
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor="budgetMax" className="text-foreground">Maximum Budget ($)</Label>
      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="budgetMax"
          type="number"
          value={values.budgetMax}
          onChange={(e) => onChange("budgetMax", e.target.value)}
          placeholder="250"
          className="pl-10 bg-background border-input text-foreground"
        />
      </div>
    </div>
  </div>
);

export default BudgetFields;
