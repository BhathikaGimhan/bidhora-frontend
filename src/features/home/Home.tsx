import { useEffect, useState } from "react";
import HeroSection from "@/features/home/components/HeroSection";
import HowItWorks from "@/features/home/components/HowItWorks";
import Features from "@/features/home/components/Features";
import CallToAction from "@/features/home/components/CallToAction";


const Index = () => {
  return (
    <>
    
      <HeroSection />
      <HowItWorks />
      <Features />
      <CallToAction />
    </>
  );
};

export default Index;
