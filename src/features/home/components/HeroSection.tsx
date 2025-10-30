import React, { useEffect, useState } from "react";
import ParticleBackground from "./ParticleBackground";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebaseConfig";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const handleLearnMore = () => {
    navigate("/learn-more");
  };

  return (
    <section className="min-h-screen text-brand-black flex flex-col justify-center items-center text-center px-6 sm:px-8 md:px-12 relative overflow-hidden dark:text-brand-white">
      <ParticleBackground />
      <div className="max-w-4xl mx-auto z-10 w-full">
        {/* Hero Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 sm:mb-6 animate-fade-in animate-slide-up">
          <span className="block text-brand-primary">
            Professional Digital Solution
          </span>
          <span className="block text-brand-black dark:text-orange-50 mt-2">
            Made Simple
          </span>
        </h1>

        {/* Hero Subtext */}
        <p
          className="mt-2 sm:mt-4 text-sm sm:text-base md:text-lg max-w-xl sm:max-w-2xl mx-auto text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 animate-fade-in animate-slide-up animate-stagger"
          style={{ "--stagger": 1 } as React.CSSProperties}
        >
          Professional document processing, data entry, and digital solutions
          delivered with precision, security, and exceptional quality. Your
          trusted partner for all business documentation needs.
        </p>

        {/* Call-to-Action Buttons */}
        <div
          className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in animate-slide-up animate-stagger"
          style={{ "--stagger": 2 } as React.CSSProperties}
        >
          {!user && (
            <Button
              variant="hero"
              size="lg"
              onClick={handleGetStarted}
              className="premium-glow hover:scale-105 transition-all duration-300 w-full sm:w-auto"
            >
              Get Started Now
            </Button>
          )}
          <Button
            variant="hero-outline"
            size="lg"
            onClick={handleLearnMore}
            className="hover:scale-105 transition-all duration-300 w-full sm:w-auto"
          >
            Learn More
          </Button>
        </div>

        {/* Stats Section */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center w-full">
          <div
            className="p-4 group hover:bg-card/20 rounded-xl transition-all duration-300 animate-fade-in animate-stagger"
            style={{ "--stagger": 3 } as React.CSSProperties}
          >
            <div className="text-2xl sm:text-3xl md:text-3xl font-bold text-brand-primary group-hover-float transition-transform duration-300">
              500+
            </div>
            <div className="text-sm sm:text-base text-gray-400">
              Projects Completed
            </div>
          </div>
          <div
            className="p-4 group hover:bg-card/20 rounded-xl transition-all duration-300 animate-fade-in animate-stagger"
            style={{ "--stagger": 4 } as React.CSSProperties}
          >
            <div className="text-2xl sm:text-3xl md:text-3xl font-bold text-brand-primary group-hover-float transition-transform duration-300">
              99.9%
            </div>
            <div className="text-sm sm:text-base text-gray-400">
              Accuracy Rate
            </div>
          </div>
          <div
            className="p-4 group hover:bg-card/20 rounded-xl transition-all duration-300 animate-fade-in animate-stagger"
            style={{ "--stagger": 5 } as React.CSSProperties}
          >
            <div className="text-2xl sm:text-3xl md:text-3xl font-bold text-brand-primary group-hover-float transition-transform duration-300">
              24/7
            </div>
            <div className="text-sm sm:text-base text-gray-400">
              Expert Support
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
