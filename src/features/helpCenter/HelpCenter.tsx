import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  HelpCircle,
  MessageCircle,
  FileText,
  CreditCard,
  User,
  Shield,
  Sparkles,
  Clock,
  CheckCircle,
  ArrowRight,
  Phone,
  Loader2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { faqService, FAQ } from "@/Services/faqService";

const HelpCenter: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch FAQs from Firestore
  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      const fetchedFaqs = await faqService.getAllFAQs();
      setFaqs(fetchedFaqs);
      setFilteredFaqs(fetchedFaqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      // Silently fail and show empty state
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    {
      id: "all",
      name: "All Questions",
      icon: HelpCircle,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    {
      id: "account",
      name: "Account & Login",
      icon: User,
      color:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    },
    {
      id: "services",
      name: "Services",
      icon: FileText,
      color:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    },
    {
      id: "payment",
      name: "Payment & Billing",
      icon: CreditCard,
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    },
    {
      id: "technical",
      name: "Technical Support",
      icon: Shield,
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    },
  ];

  useEffect(() => {
    let filtered = faqs;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((faq) => faq.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    setFilteredFaqs(filtered);
  }, [searchTerm, selectedCategory, faqs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-brand-primary/5 dark:from-brand-black dark:via-brand-black dark:to-brand-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Hero Section */}
        <div className="text-center py-16 mb-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/10 via-transparent to-brand-primary/10 rounded-3xl"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Help Center
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-brand-primary to-brand-primary/80 bg-clip-text text-transparent mb-6">
              How can we help you?
            </h1>
            <p className="text-muted-foreground dark:text-gray-400 text-xl max-w-3xl mx-auto mb-8 leading-relaxed">
              Find answers to common questions, get support, and discover
              everything you need to know about Bidhora's services.
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-primary mb-1">
                  24/7
                </div>
                <div className="text-sm text-muted-foreground">
                  Support Available
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-primary mb-1">
                  50+
                </div>
                <div className="text-sm text-muted-foreground">
                  Help Articles
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-primary mb-1">
                  &lt;2min
                </div>
                <div className="text-sm text-muted-foreground">
                  Average Response
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-brand-primary/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-card/80 backdrop-blur-sm border border-brand-primary/20 rounded-2xl p-2 shadow-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brand-primary h-6 w-6" />
                <Input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-muted-foreground/70"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <Button
                  key={category.id}
                  variant="outline"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`h-auto p-6 flex flex-col items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    isSelected
                      ? "bg-brand-primary text-white border-brand-primary shadow-lg scale-105"
                      : "hover:bg-brand-primary/5 hover:border-brand-primary/50 bg-card/50 backdrop-blur-sm"
                  }`}
                >
                  <Icon
                    className={`h-8 w-8 transition-colors ${
                      isSelected ? "text-white" : "text-brand-primary"
                    }`}
                  />
                  <span className="text-sm font-medium text-center">
                    {category.name}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* FAQ List with Enhanced Cards */}
        <div className="space-y-6 mb-12">
          {loading ? (
            <Card className="text-center py-16 bg-card/50 backdrop-blur-sm">
              <CardContent>
                <Loader2 className="h-16 w-16 text-brand-primary mx-auto mb-4 animate-spin" />
                <h3 className="text-2xl font-semibold mb-3">Loading FAQs...</h3>
                <p className="text-muted-foreground text-lg">
                  Please wait while we fetch the latest help articles.
                </p>
              </CardContent>
            </Card>
          ) : filteredFaqs.length === 0 ? (
            <Card className="text-center py-16 bg-card/50 backdrop-blur-sm border-dashed">
              <CardContent>
                <div className="relative mb-6">
                  <HelpCircle className="h-20 w-20 text-muted-foreground mx-auto" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center">
                    <Search className="h-3 w-3 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-3">
                  No results found
                </h3>
                <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
                  We couldn't find any articles matching your search. Try
                  different keywords or browse our categories.
                </p>
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  variant="outline"
                  className="hover:bg-brand-primary hover:text-white transition-colors"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-center mb-8">
                <p className="text-muted-foreground">
                  Showing {filteredFaqs.length} article
                  {filteredFaqs.length !== 1 ? "s" : ""}
                  {selectedCategory !== "all" &&
                    ` in ${
                      categories.find((cat) => cat.id === selectedCategory)
                        ?.name
                    }`}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                {filteredFaqs.map((faq, index) => (
                  <Card
                    key={faq.id}
                    className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-card/80 backdrop-blur-sm border-brand-primary/10 hover:border-brand-primary/30"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge
                              variant="secondary"
                              className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
                            >
                              {
                                categories.find(
                                  (cat) => cat.id === faq.category
                                )?.name
                              }
                            </Badge>
                            <CheckCircle className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <CardTitle className="text-xl text-left leading-tight group-hover:text-brand-primary transition-colors">
                            {faq.question}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground leading-relaxed mb-4 text-base">
                        {(() => {
                          const isExpanded = expandedFaq === faq.id;
                          const shouldTruncate = faq.answer.length > 150;
                          const displayAnswer = isExpanded || !shouldTruncate
                            ? faq.answer
                            : faq.answer.substring(0, 150) + '...';
                          return displayAnswer;
                        })()}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {faq.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs hover:bg-brand-primary/10 transition-colors"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated recently
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                          className="text-brand-primary hover:bg-brand-primary hover:text-white px-2 py-1 h-auto transition-colors"
                        >
                          {expandedFaq === faq.id ? 'Read less' : 'Read more'}{' '}
                          <ArrowRight className={`h-3 w-3 ml-1 transition-transform ${expandedFaq === faq.id ? 'rotate-90' : ''}`} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Enhanced Contact Support Section */}
        <Card className="bg-gradient-to-r from-brand-primary via-brand-primary to-brand-primary/90 text-white border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-black/20"></div>
          <CardContent className="text-center py-12 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-4">Still need help?</h3>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Can't find what you're looking for? Our expert support team is
              here to help you 24/7. Get personalized assistance for your
              specific needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/contact")}
                className="bg-white text-brand-primary hover:bg-white/90 font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Contact Support
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-3 text-lg"
              >
                <a href="tel:+94743774787">
                  <Phone className="h-5 w-5 mr-2" />
                  Schedule a Call
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpCenter;
