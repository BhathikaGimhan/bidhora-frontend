import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User as FirebaseUser } from "firebase/auth";

const CallToAction = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };
  return (
    <section className="py-16 text-center bg-card px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-4 animate-fade-in">
          Ready to Experience Professional Digital Solutions?
        </h2>
        <p className="text-brand-black dark:text-brand-white/70 text-lg mb-8 max-w-2xl mx-auto">
          Join hundreds of satisfied businesses trusting Bidhora for their
          document processing and digital solution needs.
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in animate-stagger"
          style={{ "--stagger": 1 } as React.CSSProperties}
        >
          {!user && (
            <Button
              variant="hero"
              size="lg"
              onClick={handleGetStarted}
              className="premium-glow hover:scale-105 transition-all duration-300 w-full sm:w-auto"
            >
              Get Started
            </Button>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="bg-card-hover p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-brand-primary mb-2">
              Our Services
            </h3>
            <p className="text-brand-black dark:text-brand-white/70">
              Professional document processing, data entry, formatting, and
              digital solutions delivered with precision, security, and
              guaranteed quality.
            </p>
          </div>
          <div className="bg-card-hover p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-brand-primary mb-2">
              Quality Guarantee
            </h3>
            <p className="text-brand-black dark:text-brand-white/70">
              Every project undergoes rigorous quality checks with 99.9%
              accuracy guarantee and full satisfaction assurance for your
              business needs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
