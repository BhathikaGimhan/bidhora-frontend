import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface Props {
  skills: string[];
  onChange: (value: string[]) => void;
}

const MIN_REQUIRED_SKILLS = 3;

const SkillsInput: React.FC<Props> = ({ skills, onChange }) => {
  const [currentSkill, setCurrentSkill] = useState("");

  const addSkill = () => {
    const trimmed = currentSkill.trim();
    if (!trimmed) return;

    // Prevent duplicates
    if (skills.includes(trimmed)) return;

    onChange([...skills, trimmed]);
    setCurrentSkill("");
  };

  const removeSkill = (skill: string) => {
    onChange(skills.filter((s) => s !== skill));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="space-y-3">
      <label
        htmlFor="skills"
        className="block text-sm font-medium text-foreground"
      >
        Required Skills{" "}
        <span className="text-muted-foreground">(min. {MIN_REQUIRED_SKILLS})</span>
      </label>

      <div className="flex gap-2">
        <Input
          id="skills"
          value={currentSkill}
          onChange={(e) => setCurrentSkill(e.target.value)}
          placeholder="e.g., LaTeX, Academic Writing"
          className="bg-background border-input text-foreground"
          onKeyPress={handleKeyPress}
        />
        <Button
          type="button"
          onClick={addSkill}
          size="icon"
          variant="outline"
          aria-label="Add skill"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Display skills as badges */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {skills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="p-0.5 hover:text-destructive transition-colors"
                aria-label={`Remove ${skill}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Validation message */}
      {skills.length < MIN_REQUIRED_SKILLS && (
        <p className="text-sm text-destructive mt-1">
          ⚠️ Please add at least {MIN_REQUIRED_SKILLS} skills before continuing.
        </p>
      )}
    </div>
  );
};

export default SkillsInput;
