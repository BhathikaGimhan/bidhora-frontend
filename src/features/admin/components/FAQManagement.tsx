import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
}

const FAQManagement: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    question: "",
    answer: "",
    tags: "",
  });

  // Mock data - in real app this would come from API
  useEffect(() => {
    const mockFaqs: FAQ[] = [
      {
        id: "1",
        category: "account",
        question: "How do I create an account?",
        answer:
          "To create an account, click on the 'Sign Up' button in the top right corner. Fill in your details including name, email, and password. You'll receive a confirmation email to verify your account.",
        tags: ["registration", "signup", "account"],
      },
      {
        id: "2",
        category: "account",
        question: "How do I reset my password?",
        answer:
          "Click on 'Forgot Password' on the login page. Enter your email address and we'll send you a reset link. Follow the instructions in the email to create a new password.",
        tags: ["password", "reset", "login"],
      },
      {
        id: "3",
        category: "services",
        question: "What services does Bidhora offer?",
        answer:
          "Bidhora provides professional document processing, data entry, formatting, and digital solutions. Our expert team handles all your business documentation needs with precision and quality assurance.",
        tags: ["services", "document", "processing"],
      },
      {
        id: "4",
        category: "services",
        question: "How long does service delivery take?",
        answer:
          "Delivery times vary based on the complexity and volume of work. Simple tasks may take 24-48 hours, while complex projects can take 3-7 business days. You'll receive regular updates on your project status.",
        tags: ["delivery", "timeline", "timeframe"],
      },
      {
        id: "5",
        category: "payment",
        question: "What payment methods do you accept?",
        answer:
          "We accept payments through major credit cards, debit cards, and bank transfers. All payments are processed securely through our payment gateway with industry-standard encryption.",
        tags: ["payment", "credit card", "bank transfer"],
      },
      {
        id: "6",
        category: "payment",
        question: "Can I get a refund?",
        answer:
          "Refunds are available under certain conditions as outlined in our Refund Policy. Generally, refunds are considered if we fail to deliver the service within the agreed timeframe or if the work doesn't meet the specified requirements.",
        tags: ["refund", "money back", "cancellation"],
      },
      {
        id: "7",
        category: "technical",
        question: "How do I upload files for processing?",
        answer:
          "After placing an order, you'll see an upload section in your dashboard. Click 'Upload Files' and select your documents. Supported formats include PDF, Word, Excel, and image files up to 50MB each.",
        tags: ["upload", "files", "documents"],
      },
      {
        id: "8",
        category: "technical",
        question: "I'm having trouble accessing my account",
        answer:
          "Try clearing your browser cache and cookies, or try a different browser. If the problem persists, contact our support team with your account email and a description of the issue.",
        tags: ["login", "access", "technical issue"],
      },
    ];
    setFaqs(mockFaqs);
  }, []);

  const categories = [
    { id: "account", name: "Account & Login" },
    { id: "services", name: "Services" },
    { id: "payment", name: "Payment & Billing" },
    { id: "technical", name: "Technical Support" },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newFaq: FAQ = {
      id: editingFaq ? editingFaq.id : Date.now().toString(),
      category: formData.category,
      question: formData.question,
      answer: formData.answer,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
    };

    if (editingFaq) {
      setFaqs(faqs.map((faq) => (faq.id === editingFaq.id ? newFaq : faq)));
    } else {
      setFaqs([...faqs, newFaq]);
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      tags: faq.tags.join(", "),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setFaqs(faqs.filter((faq) => faq.id !== id));
  };

  const resetForm = () => {
    setFormData({
      category: "",
      question: "",
      answer: "",
      tags: "",
    });
    setEditingFaq(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">FAQ Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openAddDialog}
              className="bg-brand-primary hover:bg-brand-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingFaq ? "Edit FAQ" : "Add New FAQ"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  placeholder="Enter the FAQ question"
                  required
                />
              </div>

              <div>
                <Label htmlFor="answer">Answer</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  placeholder="Enter the detailed answer"
                  rows={6}
                  required
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="e.g., registration, signup, account"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-primary/90"
                >
                  {editingFaq ? "Update FAQ" : "Add FAQ"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFaqs.map((faq) => (
          <Card key={faq.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      {categories.find((cat) => cat.id === faq.category)?.name}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                    {faq.answer}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {faq.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(faq)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(faq.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFaqs.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-xl font-semibold mb-2">No FAQs found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== "all"
                ? "Try adjusting your search or filters."
                : "Add your first FAQ to get started."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FAQManagement;
