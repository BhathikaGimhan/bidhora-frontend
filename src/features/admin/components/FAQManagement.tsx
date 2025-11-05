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
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { faqService, FAQ } from "@/Services/faqService";
import { useToast } from "@/hooks/use-toast";
import { adminActivityService } from "@/Services/adminActivityService";

const FAQManagement: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    category: "",
    question: "",
    answer: "",
    tags: "",
  });

  // Fetch FAQs from Firestore
  useEffect(() => {
    fetchFAQs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      const fetchedFaqs = await faqService.getAllFAQs();
      setFaqs(fetchedFaqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      toast({
        title: "Error",
        description: "Failed to load FAQs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
    handleSaveFAQ();
  };

  const handleSaveFAQ = async () => {
    setIsSubmitting(true);
    try {
      const faqData = {
        category: formData.category,
        question: formData.question,
        answer: formData.answer,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      if (editingFaq) {
        await faqService.updateFAQ(editingFaq.id, faqData);
        
        // Log activity
        await adminActivityService.logFAQAction(
          'Updated FAQ',
          editingFaq.id,
          faqData.question,
          `Updated FAQ in ${faqData.category} category`
        );
        
        toast({
          title: "Success",
          description: "FAQ updated successfully!",
        });
      } else {
        const newFaqId = await faqService.addFAQ(faqData);
        
        // Log activity
        await adminActivityService.logFAQAction(
          'Created FAQ',
          newFaqId,
          faqData.question,
          `Created new FAQ in ${faqData.category} category`
        );
        
        toast({
          title: "Success",
          description: "FAQ added successfully!",
        });
      }

      await fetchFAQs();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving FAQ:", error);
      toast({
        title: "Error",
        description: "Failed to save FAQ. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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

  const handleDelete = async (id: string) => {
    const faqToDelete = faqs.find(f => f.id === id);
    if (!confirm("Are you sure you want to delete this FAQ?")) {
      return;
    }

    try {
      await faqService.deleteFAQ(id);
      
      // Log activity
      if (faqToDelete) {
        await adminActivityService.logFAQAction(
          'Deleted FAQ',
          id,
          faqToDelete.question,
          `Deleted FAQ from ${faqToDelete.category} category`
        );
      }
      
      toast({
        title: "Success",
        description: "FAQ deleted successfully!",
      });
      await fetchFAQs();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast({
        title: "Error",
        description: "Failed to delete FAQ. Please try again.",
        variant: "destructive",
      });
    }
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
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingFaq ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    <>{editingFaq ? "Update FAQ" : "Add FAQ"}</>
                  )}
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
      {loading ? (
        <Card className="text-center py-12">
          <CardContent>
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-brand-primary" />
            <p className="text-muted-foreground">Loading FAQs...</p>
          </CardContent>
        </Card>
      ) : (
        <>
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

          {filteredFaqs.length === 0 && !loading && (
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
        </>
      )}
    </div>
  );
};

export default FAQManagement;
