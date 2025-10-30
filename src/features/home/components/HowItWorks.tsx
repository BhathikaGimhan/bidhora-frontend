import { MessageSquare, Calculator, CheckCircle } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      step: "01",
      title: "Request Service",
      description:
        "Contact us with your document processing or digital solution requirements. We'll discuss your specific needs and project scope.",
      Icon: MessageSquare,
    },
    {
      step: "02",
      title: "Get Professional Quote",
      description:
        "Receive a detailed quote with transparent pricing, timeline, and quality guarantees tailored to your project requirements.",
      Icon: Calculator,
    },
    {
      step: "03",
      title: "Receive Quality Delivery",
      description:
        "Get professionally processed documents with quality assurance, secure delivery, and ongoing support for your business needs.",
      Icon: CheckCircle,
    },
  ];

  return (
    <section
      className="py-16 px-6 
                 bg-gradient-to-b from-brand-white to-card 
                 dark:bg-gradient-to-b dark:from-brand-black dark:to-card 
                 text-card-foreground"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-brand-primary mb-4">
            How It Works
          </h2>
          <p className="text-brand-black dark:text-brand-white/70 text-lg max-w-2xl mx-auto">
            Simple, professional process for exceptional digital solutions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const { Icon } = step;
            return (
              <div
                key={index}
                className="flex flex-col items-center gap-4 p-6 rounded-xl bg-card shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
              >
                <div className="p-4 rounded-full bg-brand-primary/10 mb-4 group-hover:bg-brand-primary/20 transition-colors duration-300">
                  <Icon className="w-8 h-8 text-brand-primary" />
                </div>
                <div className="text-brand-primary text-sm font-bold">
                  STEP {step.step}
                </div>
                <h3 className="text-xl font-semibold text-brand-black/80 dark:text-brand-white/80 group-hover:text-brand-primary transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-brand-black dark:text-brand-white/70 text-center">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
