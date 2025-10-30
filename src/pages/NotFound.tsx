import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Home,
  HelpCircle,
  ArrowLeft,
  FileText,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    // Trigger animations after component mounts
    setIsVisible(true);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-brand-primary/5 dark:from-brand-black dark:via-brand-black dark:to-brand-primary/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Hero Section */}
        <div
          className={`text-center mb-16 relative overflow-hidden transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 rounded-3xl animate-pulse"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-bounce">
              <HelpCircle className="h-4 w-4" />
              Page Not Found
            </div>
            <h1 className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-pink-500 bg-clip-text text-transparent mb-6 animate-pulse">
              404
            </h1>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Oops! Page Not Found
            </h2>
            <p className="text-muted-foreground dark:text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
              The page you're looking for doesn't exist or has been moved. Don't
              worry, let's get you back on track with some amazing options!
            </p>
            <div className="flex justify-center mt-6">
              <Sparkles className="h-6 w-6 text-yellow-500 animate-spin" />
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div
          className={`grid md:grid-cols-2 gap-6 mb-12 transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Card className="group hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-card/80 backdrop-blur-sm border-brand-primary/10 hover:border-brand-primary/30 hover:shadow-brand-primary/20">
            <CardContent className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 rounded-full mb-4 group-hover:bg-brand-primary/20 transition-all duration-300 group-hover:rotate-12">
                <Home className="h-8 w-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Go Home</h3>
              <p className="text-muted-foreground mb-6">
                Return to our homepage and explore our services
              </p>
              <Button
                asChild
                className="w-full bg-brand-primary hover:bg-brand-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-brand-primary/30"
              >
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-card/80 backdrop-blur-sm border-green-500/10 hover:border-green-500/30 hover:shadow-green-500/20">
            <CardContent className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4 group-hover:bg-green-500/20 transition-all duration-300 group-hover:rotate-12">
                <HelpCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Help</h3>
              <p className="text-muted-foreground mb-6">
                Visit our help center for answers and support
              </p>
              <Button
                asChild
                variant="outline"
                className="w-full hover:bg-green-50 dark:hover:bg-green-950 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30 border-green-500/30 hover:border-green-500"
              >
                <Link to="/help-center">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help Center
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Help Section */}
        <Card
          className={`bg-gradient-to-r from-brand-primary via-brand-primary to-brand-primary/90 text-white border-0 shadow-2xl overflow-hidden relative transition-all duration-1000 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
          <CardContent className="text-center py-12 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 animate-bounce">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-4">Need Assistance?</h3>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              If you're having trouble finding what you need, our support team
              is here to help. Contact us directly for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-brand-primary hover:bg-white/90 font-semibold px-8 py-3 text-lg transition-all duration-300 hover:shadow-lg hover:shadow-white/30 hover:scale-105"
              >
                <Link to="/contact">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Contact Support
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-3 text-lg transition-all duration-300 hover:shadow-lg hover:shadow-white/30 hover:scale-105"
              >
                <Link to="/help-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Browse Help Articles
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Breadcrumb */}
        <div
          className={`text-center mt-8 transition-all duration-1000 delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Button
            asChild
            variant="ghost"
            className="text-muted-foreground hover:text-brand-primary transition-all duration-300 hover:scale-105"
          >
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Bidhora Home
            </Link>
          </Button>
        </div>

        {/* Fun footer message */}
        <div
          className={`text-center mt-12 transition-all duration-1000 delay-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
            Lost? No worries! Every great journey starts with getting a little
            lost.
            <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
