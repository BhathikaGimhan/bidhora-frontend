import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import GoogleLoginButton from "./GoogleLoginButton";
import { toast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebaseConfig";

const ensureUserDocument = async (user: User) => {
  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    // Create user document if it doesn't exist
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      role: "user", // Default role
    });
  } else {
    // Update last login time
    await setDoc(
      userDocRef,
      {
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }
};

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Get redirect URL from query params
  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get('redirect') || `/profile/${user?.uid || ''}`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // If user is logged in, clear input fields
        setEmail("");
        setPassword("");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Ensure user document exists in Firestore
      await ensureUserDocument(userCredential.user);

      toast({
        title: "Login Successful! 🎉",
        description: "Welcome to Bidhora platform",
      });
      
      // Get redirect URL from query params or default to profile
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get('redirect');
      
      if (redirectUrl) {
        navigate(decodeURIComponent(redirectUrl));
      } else {
        navigate("/profile/" + userCredential.user.uid);
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Invalid email or password";
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      navigate("/auth");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to log out";
      toast({
        title: "Logout Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-scale-in">
      <Card className="border-border/50 shadow-card glass-effect backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto relative">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-primary/30 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/50">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/bidhora.firebasestorage.app/o/Logo%2FFrame_3__2_-removebg-preview.png?alt=media&token=fe7f0531-1431-4d3e-98cf-b6f907e65f24"
                alt="Bidhora Logo"
                className="w-16 h-16 object-contain  transition-transform duration-300 hover:scale-100"
              />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-gradient">
              Welcome to Bidhora
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Your professional Digital Solution platform
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {user ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  Welcome, {user.displayName || "User"}!
                </h3>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full h-12 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-300 hover:shadow-lg hover:shadow-destructive/30">
                    Sign Out
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="sm:max-w-[425px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to sign out?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      You will be logged out of your Bidhora account and
                      redirected to the login page.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogout}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sign Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <GoogleLoginButton isLoading={isLoading} isDisabled={!!user} />
            </>
          )}

          <div className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link
                to="/terms"
                className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors duration-200 hover:scale-105 inline-block"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors duration-200 hover:scale-105 inline-block"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
