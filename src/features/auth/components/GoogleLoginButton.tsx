import { Button } from "@/components/ui/button";
import { auth } from "@/firebaseConfig";
import { toast } from "@/hooks/use-toast";
import {
  GoogleAuthProvider,
  signInWithPopup,
  getRedirectResult,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Helper function to ensure user document exists
const ensureUserDocument = async (user: {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}) => {
  const { doc, getDoc, setDoc, updateDoc, Timestamp } = await import(
    "firebase/firestore"
  );
  const { db } = await import("@/firebaseConfig");

  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    // Create user document if it doesn't exist
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName:
        user.displayName || user.email?.split("@")[0] || "Anonymous User",
      photoURL: user.photoURL || null,
      role: "buyer", // Default role
      status: "active",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastActive: Timestamp.now(),
      totalProjects: 0,
      totalEarnings: 0,
      rating: 0,
      verified: false,
    });
  } else {
    // Update last active
    await updateDoc(userRef, {
      lastActive: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
};

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

interface GoogleLoginButtonProps {
  isLoading?: boolean;
  isDisabled?: boolean;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  isLoading = false,
  isDisabled = false,
}) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(isLoading);

  const handleGoogleLogin = async () => {
    if (isDisabled) return;
    setIsProcessing(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Ensure user document exists in Firestore
      await ensureUserDocument({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      toast({
        title: "Google Login Successful",
        description: "Welcome to Bidhora!",
      });
      navigate("/profile/" + user.uid);
    } catch (error) {
      setIsProcessing(false);
      toast({
        title: "Google Login Failed",
        description: error.message || "Failed to process Google login",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const handleRedirectResult = async () => {
      if (isDisabled) return;
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;

          // Ensure user document exists in Firestore
          await ensureUserDocument({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });

          toast({
            title: "Google Login Successful",
            description: "Welcome to Bidhora!",
          });
          navigate("/profile/" + user.uid);
        }
      } catch (error) {
        toast({
          title: "Google Login Failed",
          description: error.message || "Failed to process Google login",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };
    handleRedirectResult();
  }, [navigate, isDisabled]);

  return (
    <Button
      onClick={handleGoogleLogin}
      disabled={isProcessing || isDisabled}
      className="w-full h-12 bg-card hover:bg-card-hover border border-border text-foreground font-medium transition-all duration-300 hover:shadow-card hover:scale-[1.02] active:scale-[0.98] glass-effect"
      variant="outline"
    >
      {isProcessing ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Signing in...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-3">
          <GoogleIcon />
          <span>Continue with Google</span>
        </div>
      )}
    </Button>
  );
};

export default GoogleLoginButton;
