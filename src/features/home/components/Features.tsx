import {
  FileText,
  Shield,
  Clock,
  Users,
  CheckCircle,
  DollarSign,
} from "lucide-react";

const Features = () => {
  const features = [
    {
      title: "Professional Document Processing",
      description:
        "Expert handling of documents, data entry, and digital formatting with industry-standard precision and care.",
      Icon: FileText,
    },
    {
      title: "Quality Assurance",
      description:
        "Multi-level quality checks and accuracy verification to ensure 99.9% error-free deliverables.",
      Icon: CheckCircle,
    },
    {
      title: "Secure & Confidential",
      description:
        "Bank-level security protocols and strict confidentiality agreements to protect your sensitive information.",
      Icon: Shield,
    },
    {
      title: "Fast Turnaround",
      description:
        "Express processing options with guaranteed delivery timelines to meet your urgent business needs.",
      Icon: Clock,
    },
    {
      title: "Expert Support Team",
      description:
        "Dedicated account managers and technical support available 24/7 for seamless project coordination.",
      Icon: Users,
    },
    {
      title: "Competitive Pricing",
      description:
        "Transparent pricing with volume discounts and flexible payment terms tailored to your budget.",
      Icon: DollarSign,
    },
  ];

  return (
    <section className="py-20 bg-card px-6 text-card-foreground">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-brand-primary mb-4">
            Why Choose Bidhora
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Professional excellence and reliability you can trust for all your
            digital solution needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const { Icon } = feature;
            return (
              <div
                key={index}
                className="bg-card-hover p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 text-center group hover:scale-105 animate-fade-in animate-stagger"
                style={{ "--stagger": index } as React.CSSProperties}
              >
                <div className="p-4 rounded-full bg-brand-primary/10 w-fit mx-auto mb-4 group-hover:bg-brand-primary/20 transition-colors duration-300">
                  <Icon className="w-8 h-8 text-brand-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-brand-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-brand-black dark:text-brand-white/50  leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
