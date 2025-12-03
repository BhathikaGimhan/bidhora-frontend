import { useEffect, useState } from "react";
import HeroSection from "@/features/home/components/HeroSection";
import HowItWorks from "@/features/home/components/HowItWorks";
import Features from "@/features/home/components/Features";
import CallToAction from "@/features/home/components/CallToAction";
import SEO from "@/components/SEO";


const Index = () => {
  return (
    <>
      <SEO 
        title="Home" 
        description="Welcome to Bidhora, the best place to find professional talent and work in Sri Lanka. Connect with experts for your next project."
      />
      <HeroSection />
      <HowItWorks />
      <Features />
      <CallToAction />
    </>
  );
};

export default Index;
