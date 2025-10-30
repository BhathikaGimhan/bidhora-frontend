import { Mail, Twitter, Linkedin, Facebook } from "lucide-react";
import Lightning from "@/components/Lightning";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-14  text-brand-white bg-black relative text-center px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="text-left">
            <h3 className="text-xl font-bold text-brand-primary mb-4">
              Bidhora
            </h3>
            <p className="text-gray-400 text-sm">
              Your trusted partner for professional Digital Solution services.
            </p>
          </div>

          <div className="text-left z-[99]">
            <h4 className="font-semibold text-brand-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-400 hover:text-brand-primary transition-colors z-[99] duration-300"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/learn-more"
                  className="text-gray-400 hover:text-brand-primary transition-colors z-[99] duration-300"
                >
                  Learn More
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-left z-[99]">
            <h4 className="font-semibold text-brand-white mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/help-center"
                  className="text-gray-400 hover:text-brand-primary transition-colors z-[99] duration-300"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-policy"
                  className="text-gray-400 hover:text-brand-primary transition-colors z-[99] duration-300"
                >
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-400 hover:text-brand-primary transition-colors z-[99] duration-300"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-400 hover:text-brand-primary transition-colors z-[99] duration-300"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-left">
            <h4 className="font-semibold text-brand-white mb-4">Connect</h4>
            <div className="flex space-x-4 ">
              
              <a
                href="https://www.tiktok.com/@bidhora.pvt.ltd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-brand-primary transition-colors duration-300 p-2 rounded-lg z-[99] hover:bg-brand-primary/10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-tiktok w-5 h-5"
                  viewBox="0 0 16 16"
                >
                  <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/bidhora"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-brand-primary transition-colors duration-300 p-2 rounded-lg z-[99] hover:bg-brand-primary/10"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://web.facebook.com/profile.php?id=61580203743171"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-brand-primary transition-colors duration-300 p-2 rounded-lg z-[99] hover:bg-brand-primary/10"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 z-10 to-transparent"></div>

      <div
        style={{ width: "100%", height: "100%" }}
        className="absolute bottom-0 left-0"
      >
        <Lightning hue={120} xOffset={0} speed={2} intensity={0.6} size={1.2} />
      </div>
    </footer>
  );
};

export default Footer;
