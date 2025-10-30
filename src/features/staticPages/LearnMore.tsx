import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Shield,
  Clock,
  DollarSign,
  CheckCircle,
  TrendingUp,
  Award,
  Zap,
} from "lucide-react";

const LearnMore: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Global Talent Network",
      description:
        "Access thousands of skilled professionals ready to work on your projects.",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description:
        "Protected transactions with escrow services to ensure safe payments for all parties.",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description:
        "Round-the-clock customer support to help you whenever you need assistance.",
    },
    {
      icon: DollarSign,
      title: "Competitive Pricing",
      description:
        "Get the best value with our transparent and competitive pricing structure.",
    },
    {
      icon: CheckCircle,
      title: "Quality Guarantee",
      description:
        "All work is reviewed and guaranteed to meet your quality standards.",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description:
        "Real-time project tracking and milestone management for complete visibility.",
    },
  ];

  const benefits = [
    "Post unlimited projects",
    "Professional service delivery",
    "Secure payment processing",
    "Project milestone tracking",
    "Direct communication support",
    "Review and rating system",
    "Dispute resolution support",
    "Mobile-friendly platform",
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-brand-black">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-primary mb-6">
            Why Choose Bidhora?
          </h1>
          <p className="text-xl text-muted-foreground dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Professional Digital Solution services delivered with quality and
            reliability. Discover how we make your document processing needs
            seamless and successful.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/contact")}
              className="text-lg px-8"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground dark:text-gray-100 mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to successfully manage your projects from
              start to finish
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-border dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader>
                  <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-brand-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-accent/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground dark:text-gray-100 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground dark:text-gray-400 max-w-2xl mx-auto">
              Getting started is simple. Follow these three easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-brand-primary text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground dark:text-gray-100">
                Create Your Account
              </h3>
              <p className="text-muted-foreground dark:text-gray-400">
                Sign up for free and set up your profile in minutes. No credit
                card required.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-brand-primary text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground dark:text-gray-100">
                Post Your Project
              </h3>
              <p className="text-muted-foreground dark:text-gray-400">
                Post your project requirements and get professional assistance.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-brand-primary text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground dark:text-gray-100">
                Collaborate & Deliver
              </h3>
              <p className="text-muted-foreground dark:text-gray-400">
                Work together seamlessly, track progress, and deliver quality
                results on time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground dark:text-gray-100 mb-6">
                Everything You Need to Succeed
              </h2>
              <p className="text-lg text-muted-foreground dark:text-gray-400 mb-8">
                Our platform provides all the tools and features you need to
                manage projects efficiently and ensure professional service
                delivery.
              </p>
              <Button size="lg" onClick={() => navigate("/auth")}>
                Start Your Free Trial
              </Button>
            </div>

            <div className="bg-card dark:bg-gray-800 p-8 rounded-xl border border-border dark:border-gray-700">
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground dark:text-gray-200">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-brand-primary mb-2">
                10K+
              </div>
              <div className="text-muted-foreground dark:text-gray-400">
                Active Users
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-primary mb-2">
                5K+
              </div>
              <div className="text-muted-foreground dark:text-gray-400">
                Projects Completed
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-primary mb-2">
                95%
              </div>
              <div className="text-muted-foreground dark:text-gray-400">
                Success Rate
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-primary mb-2">
                24/7
              </div>
              <div className="text-muted-foreground dark:text-gray-400">
                Support Available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground dark:text-gray-100 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground dark:text-gray-400 mb-8">
            Join thousands of satisfied clients using Bidhora for professional
            services
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              <Zap className="mr-2 h-5 w-5" />
              Sign Up Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LearnMore;
