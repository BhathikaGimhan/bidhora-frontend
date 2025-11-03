import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  values: { budgetMin: string; budgetMax: string };
  onChange: (field: string, value: string) => void;
}

const BudgetFields: React.FC<Props> = ({ values, onChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="budgetMin" className="text-foreground">Minimum Budget (LKR) *</Label>
      <div className="relative">
        <Input
          id="budgetMin"
          type="number"
          value={values.budgetMin}
          onChange={(e) => onChange("budgetMin", e.target.value)}
          placeholder="150"
          className="bg-background border-input text-foreground"
          required
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor="budgetMax" className="text-foreground">Maximum Budget (LKR)</Label>
      <div className="relative">
        <Input
          id="budgetMax"
          type="number"
          value={values.budgetMax}
          onChange={(e) => onChange("budgetMax", e.target.value)}
          placeholder="250"
          className="bg-background border-input text-foreground"
        />
      </div>
    </div>
  </div>
);

export default BudgetFields;
