import { Link } from "react-router-dom";
import { Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground" role="contentinfo">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <img
              src="/logo-transparent.png"
              alt="India Angel Forum"
              className="h-10 w-auto object-contain brightness-0 invert"
            />
            <p className="text-sm text-primary-foreground/80">
              India's largest angel network connecting accredited investors with exceptional founders.
            </p>
            <p className="text-xs text-primary-foreground/60">
              A product of Kosansh Solutions Inc
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.linkedin.com/groups/13633084/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
                aria-label="Follow us on LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com/indiaangelforum" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* For Founders */}
          <div>
            <h4 className="font-semibold mb-4">For Founders</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <Link to="/founders#apply" className="hover:text-accent transition-colors">
                  Apply for Funding
                </Link>
              </li>
              <li>
                <Link to="/founders#how-it-works" className="hover:text-accent transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/founders#calendar" className="hover:text-accent transition-colors">
                  Forum Calendar
                </Link>
              </li>
            </ul>
          </div>

          {/* For Investors */}
          <div>
            <h4 className="font-semibold mb-4">For Investors</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <Link to="/investors#join" className="hover:text-accent transition-colors">
                  Join as Member
                </Link>
              </li>
              <li>
                <Link to="/investors#plans" className="hover:text-accent transition-colors">
                  Membership Plans
                </Link>
              </li>
              <li>
                <Link to="/investors#deals" className="hover:text-accent transition-colors">
                  Deal Rooms & SPVs
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <Link to="/about" className="hover:text-accent transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-accent transition-colors">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-accent transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-accent transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} India Angel Forum. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-primary-foreground/60">
            <Link to="/terms" className="hover:text-accent transition-colors">
              Terms & Policies
            </Link>
            <Link to="/privacy" className="hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <Link to="/code-of-conduct" className="hover:text-accent transition-colors">
              Code of Conduct
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
