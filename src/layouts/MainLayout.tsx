import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { auth } from "@/firebaseConfig";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

const MainLayout: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500); // Simulate loading
    return () => clearTimeout(timer);
  }, []);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="animate-fade-in">
        <Header />
        {loading ? <LoadingSpinner /> : <Outlet />}
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
