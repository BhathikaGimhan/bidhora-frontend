import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Menu, X, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "./ThemeToggle";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { getUserProfile } from "@/Services/authService";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState(location.pathname);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update active path when route changes
  useEffect(() => {
    setActivePath(location.pathname);
  }, [location]);

  // Monitor authentication state and fetch user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await getUserProfile(); // Use the API function
          setUserRole(profile.user.role);
          setProfilePicture(profile.user.photoURL || null);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserRole(null);
          setProfilePicture(currentUser.photoURL || null);
        }
      } else {
        setUserRole(null);
        setProfilePicture(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Navigation links array
  const navLinks = [
    { href: "/", label: "Home", requiresAuth: false, hiddenForRoles: [] },
    {
      href: "/post-project",
      label: "Post a Job",
      requiresAuth: true,
      hiddenForRoles: ["service_provider"],
    },
    {
      href: "/review-center",
      label: "Review Center",
      requiresAuth: true,
      hiddenForRoles: [],
    },
    {
      href: "/contact",
      label: "Contact",
      requiresAuth: false,
      hiddenForRoles: [],
    },
  ];

  // Filter nav links based on authentication and user role
  const visibleNavLinks = navLinks.filter((link) => {
    // If auth is required and no user, hide it
    if (link.requiresAuth && !user) return false;
    // If user role should hide this link, hide it
    if (userRole && link.hiddenForRoles.includes(userRole)) return false;
    return true;
  });

  // Handle profile picture click for non-service_providers
  const handleProfileClick = () => {
    if (user) {
      navigate(`/profile/${user.uid}`);
    }
  };

  return (
    <header
      className={`sticky top-0 w-full flex flex-col justify-between items-center px-4 sm:px-6 py-4 z-50 transition-all duration-300 
        bg-brand-white dark:bg-brand-black 
        ${isScrolled ? "backdrop-blur-md shadow-glass" : ""}`}
    >
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-brand-primary">
            Bidhora
          </h1>
        </div>

        {/* Hamburger Icon for Mobile/Tablet */}
        <div className="lg:hidden flex items-center space-x-3">
          <ThemeToggle />
          <button
            onClick={toggleMobileMenu}
            className="text-brand-black dark:text-brand-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
          {visibleNavLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`relative text-sm xl:text-base transition-colors duration-300 group ${
                activePath === link.href
                  ? "text-green-500"
                  : "text-brand-black dark:text-brand-white hover:text-green-500"
              }`}
            >
              {link.label}
              <span
                className={`absolute left-0 bottom-[-2px] w-full h-[2px] bg-green-500 transition-transform duration-300 origin-left ${
                  activePath === link.href
                    ? "scale-x-100"
                    : "scale-x-0 group-hover:scale-x-100"
                }`}
              ></span>
            </Link>
          ))}
        </nav>

        {/* Desktop Buttons/Profile */}
        <div className="hidden lg:flex items-center space-x-3">
          <ThemeToggle />
          {user ? (
            userRole === "admin" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 rounded-full">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                      />
                    ) : (
                      <User className="w-10 h-10 rounded-full p-2 bg-purple-100 dark:bg-purple-900 text-purple-600" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => navigate(`/profile/${user.uid}`)}
                    className="cursor-pointer"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  {userRole === "admin" && (
                    <DropdownMenuItem
                      onClick={() => navigate("/admin")}
                      className="cursor-pointer"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                className="p-0 rounded-full"
                onClick={handleProfileClick}
              >
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 rounded-full p-2 bg-gray-200 dark:bg-gray-700" />
                )}
              </Button>
            )
          ) : (
            <>
              <Link to="/auth">
                <Button variant="outline" size="sm" className="text-sm px-3">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden w-full bg-brand-white dark:bg-brand-black transition-all duration-300 ease-in-out">
          <nav className="flex flex-col items-center space-y-3 py-4">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`relative text-base transition-colors duration-300 group ${
                  activePath === link.href
                    ? "text-green-500"
                    : "text-brand-black dark:text-brand-white hover:text-green-500"
                }`}
                onClick={toggleMobileMenu}
              >
                {link.label}
                <span
                  className={`absolute left-0 bottom-[-2px] w-full h-[2px] bg-green-500 transition-transform duration-300 origin-left ${
                    activePath === link.href
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}
                ></span>
              </Link>
            ))}
            <div className="flex flex-col items-center space-y-3 pt-2">
              {user ? (
                userRole === "admin" ? (
                  <>
                    <Link
                      to={`/profile/${user.uid}`}
                      onClick={toggleMobileMenu}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-32 text-sm"
                      >
                        Profile
                      </Button>
                    </Link>
                    <Link to="/admin" onClick={toggleMobileMenu}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-32 text-sm"
                      >
                        Dashboard
                      </Button>
                    </Link>
                  </>
                ) : userRole === "service_provider" ? (
                  <>
                    <Link
                      to={`/profile/${user.uid}`}
                      onClick={toggleMobileMenu}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-32 text-sm"
                      >
                        Profile
                      </Button>
                    </Link>
                    <Link to="/dashboard" onClick={toggleMobileMenu}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-32 text-sm"
                      >
                        Dashboard
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link to={`/profile/${user.uid}`} onClick={toggleMobileMenu}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-32 text-sm"
                    >
                      Profile
                    </Button>
                  </Link>
                )
              ) : (
                <>
                  <Link to="/auth/signup" onClick={toggleMobileMenu}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-32 text-sm"
                    >
                      Sign Up
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={toggleMobileMenu}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-32 text-sm"
                    >
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
