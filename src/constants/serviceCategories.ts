/**
 * Service Categories / Job Designations
 * Used for project categories and employee designations
 */
export const SERVICE_CATEGORIES = [
  // Software Development Main
  "Web Development",
  "Mobile App Development (Android / iOS)",
  "Desktop Application Development",
  "Game Development",
  "Chatbot Development",
  "API Development & Integration",
  "Bug Fixing / Debugging",
  "Custom Software Development",
  "Database Design & Management",
  "Automation Scripts (Python, JS, etc.)",
  "UI/UX Frontend Development (React, Vue, Angular)",
  
  // Graphic Design Main
  "Logo Design",
  "Business Card & Stationery Design",
  "Flyer / Brochure Design",
  "Poster Design",
  "Social Media Post Design",
  "Banner / Ad Design",
  "Infographic Design",
  "T-shirt & Merchandise Design",
  "Packaging Design",
  "Illustration",
  "Presentation Design (PowerPoint / Pitch Decks)",
  "Website UI/UX Design",
  "3D Product Mockups",
  "Brand Style Guides",
  
  // Video Editing
  "YouTube Video Editing",
  "Short Form Content (TikTok / Reels) Editing",
  "Promotional / Advertisement Video Editing",
  "Wedding / Event Video Editing",
  "Color Grading & Correction",
  "Subtitle / Caption Adding",
  "Green Screen Editing",
  "VFX / Motion Graphics",
  "Slideshow / Photo-to-Video",
  "Intro / Outro Creation",
  "Music Video Editing",
  "Podcast Video Editing",
  
  // Academic Writing & Note Writing
  "Essay Writing",
  "Research Paper Writing",
  "Report Writing",
  "Thesis / Dissertation Assistance",
  "Literature Review Writing",
  "Case Study Writing",
  "Note Writing (Handwritten / Typed Lecture Notes)",
  "Summarizing Textbooks or Lessons",
  "Study Guide Preparation",
  "Proofreading & Editing",
  "Data Analysis (SPSS / Excel / R)",
  "PowerPoint Presentation Preparation",
  "Academic Referencing (APA, MLA, Harvard, etc.)",
  "Assignment Help (School / University level)",
  "Research Proposal Writing",
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];
