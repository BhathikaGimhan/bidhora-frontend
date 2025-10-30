import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search, Filter, ArrowUpDown } from "lucide-react";

export type SortOption = 'newest' | 'oldest' | 'budget-high' | 'budget-low' | 'deadline-soon' | 'deadline-later';
export type BudgetRange = 'all' | '0-1000' | '1000-5000' | '5000-10000' | '10000+';

interface SearchFilterBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  budgetRange: BudgetRange;
  setBudgetRange: (value: BudgetRange) => void;
}

const categories = [
  { value: "all", label: "All Projects" },
  { value: "academic", label: "Academic" },
  { value: "legal", label: "Legal" },
  { value: "technical", label: "Technical" },
  { value: "creative", label: "Creative" },
  { value: "business", label: "Business" },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "budget-high", label: "Budget: High to Low" },
  { value: "budget-low", label: "Budget: Low to High" },
  { value: "deadline-soon", label: "Deadline: Soonest" },
  { value: "deadline-later", label: "Deadline: Latest" },
];

const budgetRanges = [
  { value: "all", label: "All Budgets" },
  { value: "0-1000", label: "$0 - $1,000" },
  { value: "1000-5000", label: "$1,000 - $5,000" },
  { value: "5000-10000", label: "$5,000 - $10,000" },
  { value: "10000+", label: "$10,000+" },
];

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  category,
  setCategory,
  sortBy,
  setSortBy,
  budgetRange,
  setBudgetRange,
}) => {
  return (
    <div className="space-y-4 mb-8">
      {/* Search and Primary Filters Row */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search projects by title or description..."
            className="pl-10 h-12 transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Select */}
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-48 h-12 px-4 rounded-lg border border-border bg-card text-card-foreground">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort and Budget Filter Row */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Sort By Select */}
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-full md:w-56 h-11 px-4 rounded-lg border border-border bg-card text-card-foreground">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Budget Range Select */}
        <Select value={budgetRange} onValueChange={(value) => setBudgetRange(value as BudgetRange)}>
          <SelectTrigger className="w-full md:w-56 h-11 px-4 rounded-lg border border-border bg-card text-card-foreground">
            <SelectValue placeholder="Budget range" />
          </SelectTrigger>
          <SelectContent>
            {budgetRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Results Info */}
        <div className="hidden md:flex flex-1 justify-end">
          <span className="text-sm text-muted-foreground">
            Filters applied
          </span>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterBar;
