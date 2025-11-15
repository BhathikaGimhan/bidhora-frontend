/**
 * Employee Designation Categories
 * Organized by career field with levels from Intern to Lead
 */

export interface DesignationCategory {
  category: string;
  levels: string[];
}

export const EMPLOYEE_DESIGNATIONS: DesignationCategory[] = [
  {
    category: "Software Developer",
    levels: [
      "Intern Developer",
      "Junior Developer",
      "Mid-Level Developer",
      "Senior Developer",
      "Lead Developer / Technical Lead"
    ]
  },
  {
    category: "Graphic Designer",
    levels: [
      "Intern Graphic Designer",
      "Junior Graphic Designer",
      "Graphic Designer (Mid-Level)",
      "Senior Graphic Designer",
      "Lead Graphic Designer / Design Lead"
    ]
  },
  {
    category: "Video Editing",
    levels: [
      "Video Editing Intern / Trainee",
      "Junior Video Editor",
      "Video Editor (Mid-Level)",
      "Senior Video Editor",
      "Lead Video Editor / Editing Supervisor"
    ]
  },
  {
    category: "Academic Writing",
    levels: [
      "Academic Writing Intern / Trainee",
      "Junior Academic Writer",
      "Academic Writer (Mid-Level)",
      "Senior Academic Writer / Research Writer",
      "Lead Academic Writer / Content Supervisor"
    ]
  },
  {
    category: "Typesetting",
    levels: [
      "Typesetting Intern / Trainee",
      "Junior Typesetter",
      "Typesetter (Mid-Level)",
      "Senior Typesetter / Layout Designer",
      "Lead Typesetter / Formatting Supervisor"
    ]
  }
];

// Flatten all designations into a single array for simple usage
export const ALL_DESIGNATIONS = EMPLOYEE_DESIGNATIONS.flatMap(
  category => category.levels
);
