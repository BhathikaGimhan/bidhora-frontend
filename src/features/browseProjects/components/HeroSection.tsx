import React from "react";

const HeroSection: React.FC = () => {
  return (
    <section className="bg-primary/5 py-12 text-center">
      <h1 className="text-4xl font-bold mb-2 text-primary">
        Browse Exciting Projects
      </h1>
      <p className="text-lg text-muted-foreground">
        Find the right project that matches your skills
      </p>
    </section>
  );
};

export default HeroSection;
