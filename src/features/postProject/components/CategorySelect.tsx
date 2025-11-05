import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
}

const CategorySelect: React.FC<Props> = ({ categories, value, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor="category" className="text-foreground">
        Category *
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-background border-input text-foreground hover:bg-accent"
          >
            {value
              ? categories.find((category) => category === value)
              : "Select a category..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories..." className="h-9" />
            <CommandList>
              <CommandEmpty>No category found.</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {categories.map((category) => (
                  <CommandItem
                    key={category}
                    value={category}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    {category}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === category ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CategorySelect;