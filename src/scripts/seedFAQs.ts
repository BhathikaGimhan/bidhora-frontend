/**
 * Seed script to populate initial FAQs in Firestore
 * Run this script once to add default FAQs to the database
 * 
 * Usage: 
 * 1. Ensure you're authenticated as admin
 * 2. Run this script from the browser console or as a one-time migration
 */

import { faqService } from "@/Services/faqService";

const initialFAQs = [
  {
    category: "account",
    question: "How do I create an account?",
    answer:
      "To create an account, click on the 'Sign Up' button in the top right corner. Fill in your details including name, email, and password. You'll receive a confirmation email to verify your account.",
    tags: ["registration", "signup", "account"],
  },
  {
    category: "account",
    question: "How do I reset my password?",
    answer:
      "Click on 'Forgot Password' on the login page. Enter your email address and we'll send you a reset link. Follow the instructions in the email to create a new password.",
    tags: ["password", "reset", "login"],
  },
  {
    category: "services",
    question: "What services does Bidhora offer?",
    answer:
      "Bidhora provides professional document processing, data entry, formatting, and digital solutions. Our expert team handles all your business documentation needs with precision and quality assurance. We specialize in converting physical documents to digital formats, data extraction from various sources, and ensuring compliance with industry standards.",
    tags: ["services", "document", "processing"],
  },
  {
    category: "services",
    question: "How long does service delivery take?",
    answer:
      "Delivery times vary based on the complexity and volume of work. Simple tasks may take 24-48 hours, while complex projects can take 3-7 business days. You'll receive regular updates on your project status.",
    tags: ["delivery", "timeline", "timeframe"],
  },
  {
    category: "payment",
    question: "What payment methods do you accept?",
    answer:
      "We accept payments through major credit cards, debit cards, and bank transfers. All payments are processed securely through our payment gateway with industry-standard encryption.",
    tags: ["payment", "credit card", "bank transfer"],
  },
  {
    category: "payment",
    question: "Can I get a refund?",
    answer:
      "Refunds are available under certain conditions as outlined in our Refund Policy. Generally, refunds are considered if we fail to deliver the service within the agreed timeframe or if the work doesn't meet the specified requirements.",
    tags: ["refund", "money back", "cancellation"],
  },
  {
    category: "technical",
    question: "How do I upload files for processing?",
    answer:
      "After placing an order, you'll see an upload section in your dashboard. Click 'Upload Files' and select your documents. Supported formats include PDF, Word, Excel, and image files up to 50MB each.",
    tags: ["upload", "files", "documents"],
  },
  {
    category: "technical",
    question: "I'm having trouble accessing my account",
    answer:
      "Try clearing your browser cache and cookies, or try a different browser. If the problem persists, contact our support team with your account email and a description of the issue.",
    tags: ["login", "access", "technical issue"],
  },
];

export async function seedFAQs() {
  console.log("Starting FAQ seed...");
  
  try {
    for (const faq of initialFAQs) {
      const id = await faqService.addFAQ(faq);
      console.log(`Added FAQ: ${faq.question} (ID: ${id})`);
    }
    console.log("✅ Successfully seeded all FAQs!");
  } catch (error) {
    console.error("❌ Error seeding FAQs:", error);
    throw error;
  }
}

// Uncomment to run this function from browser console
// seedFAQs();
