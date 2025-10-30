import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
}

const CategorySelect: React.FC<Props> = ({ categories, value, onChange }) => (
  <div className="space-y-2">
    <Label htmlFor="category" className="text-foreground">
      Category *
    </Label>
    <Select value={value} onValueChange={onChange} required>
      <SelectTrigger id="category" className="bg-background border-input text-foreground">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category} value={category}>
            {category}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default CategorySelect;