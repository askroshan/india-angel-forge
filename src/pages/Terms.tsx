import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

const Terms = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("introduction");

  const sections = [
    { id: "introduction", title: "1. Introduction" },
    { id: "definitions", title: "2. Definitions" },
    { id: "eligibility", title: "3. Eligibility & Registration" },
    { id: "services", title: "4. Platform Services" },
    { id: "user-conduct", title: "5. User Conduct" },
    { id: "intellectual-property", title: "6. Intellectual Property" },
    { id: "third-party", title: "7. Third-Party Services" },
    { id: "disclaimers", title: "8. Disclaimers" },
    { id: "limitation", title: "9. Limitation of Liability" },
    { id: "indemnification", title: "10. Indemnification" },
    { id: "governing-law", title: "11. Governing Law" },
    { id: "dispute-resolution", title: "12. Dispute Resolution" },
    { id: "general", title: "13. General Provisions" },
    { id: "amendments", title: "14. Amendments" },
    { id: "contact", title: "15. Contact Information" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map((section) => ({
        id: section.id,
        element: document.getElementById(section.id),
      }));

      for (const section of sectionElements) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom > 150) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Terms of Service - India Angel Forum</title>
        <meta
          name="description"
          content="Terms of Service for India Angel Forum. Read our comprehensive terms governing the use of our angel investing platform and services."
        />
        <link rel="canonical" href="https://indiaangelforum.com/terms" />
      </Helmet>

      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-hero py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-primary-foreground text-3xl md:text-4xl lg:text-5xl">
              Terms of Service
            </h1>
            <p className="text-primary-foreground/80">
              Effective Date: 26 January 2026 | Last Updated: 26 January 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto">
            {/* Table of Contents - Sticky Sidebar */}
            <aside className="lg:w-72 flex-shrink-0">
              <div className="lg:sticky lg:top-24">
                <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "block w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                        activeSection === section.id
                          ? "bg-accent/10 text-accent font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 max-w-none prose prose-slate dark:prose-invert">
              <div className="space-y-12">
                {/* Introduction */}
                <section id="introduction">
                  <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                  <p className="text-muted-foreground mb-4">
                    Welcome to India Angel Forum. These Terms of Service ("<strong>Terms</strong>") constitute a legally binding agreement between you ("<strong>User</strong>," "<strong>you</strong>," or "<strong>your</strong>") and Kosansh Solutions Inc, a corporation registered in the State of Texas, United States ("<strong>Company</strong>," "<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>"), governing your access to and use of the India Angel Forum platform, website, mobile applications, and related services (collectively, the "<strong>Platform</strong>").
                  </p>
                  <p className="text-muted-foreground mb-4">
                    By accessing or using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use the Platform.
                  </p>
                  <p className="text-muted-foreground">
                    The Platform facilitates connections between accredited investors and early-stage startup companies seeking funding. The Company acts solely as a technology platform provider and does not provide investment advice, broker-dealer services, or portfolio management services.
                  </p>
                </section>

                {/* Definitions */}
                <section id="definitions">
                  <h2 className="text-2xl font-bold mb-4">2. Definitions</h2>
                  <p className="text-muted-foreground mb-4">
                    For the purposes of these Terms, the following definitions shall apply:
                  </p>
                  <ul className="space-y-3 text-muted-foreground">
                    <li>
                      <strong>"Accredited Investor"</strong> means an individual or entity that meets the eligibility criteria prescribed under the Securities and Exchange Board of India (Alternative Investment Funds) Regulations, 2012, as amended from time to time, including but not limited to:
                      <ul className="mt-2 ml-6 space-y-1">
                        <li>• Individuals with net tangible assets of at least INR 2 crore, excluding the value of primary residence</li>
                        <li>• Individuals with gross annual income exceeding INR 25 lakh</li>
                        <li>• Bodies corporate with net worth exceeding INR 10 crore</li>
                      </ul>
                    </li>
                    <li>
                      <strong>"Content"</strong> means any information, data, text, software, photographs, graphics, videos, messages, tags, or other materials uploaded, posted, or transmitted through the Platform.
                    </li>
                    <li>
                      <strong>"Deal Flow"</strong> means the pipeline of investment opportunities presented to Members through the Platform.
                    </li>
                    <li>
                      <strong>"Founder"</strong> means an individual or entity that has applied to or is presenting a startup company on the Platform for potential investment.
                    </li>
                    <li>
                      <strong>"Forum"</strong> means the periodic investment forums conducted by the Company where Founders present to Members.
                    </li>
                    <li>
                      <strong>"Member"</strong> means an Accredited Investor who has been accepted into the India Angel Forum network and maintains an active membership.
                    </li>
                    <li>
                      <strong>"Services"</strong> means all services provided through the Platform, including but not limited to deal flow curation, forum facilitation, SPV administration, and portfolio management tools.
                    </li>
                    <li>
                      <strong>"SPV"</strong> or <strong>"Special Purpose Vehicle"</strong> means a legal entity formed for the specific purpose of pooling capital from multiple investors to make a collective investment.
                    </li>
                  </ul>
                </section>

                {/* Eligibility & Registration */}
                <section id="eligibility">
                  <h2 className="text-2xl font-bold mb-4">3. Eligibility & Registration</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">3.1 General Eligibility</h3>
                  <p className="text-muted-foreground mb-4">
                    To use the Platform, you must:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Be at least 18 years of age and have the legal capacity to enter into binding contracts</li>
                    <li>• Provide accurate, current, and complete information during registration</li>
                    <li>• Maintain and promptly update your account information</li>
                    <li>• Comply with all applicable laws and regulations</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Investor Eligibility</h3>
                  <p className="text-muted-foreground mb-4">
                    To participate as a Member and access investment opportunities, you must:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Qualify as an Accredited Investor under applicable SEBI regulations</li>
                    <li>• Complete the Know Your Customer (KYC) verification process, including submission of valid PAN and Aadhaar documents</li>
                    <li>• Provide bank account verification</li>
                    <li>• Pay the applicable membership fees</li>
                    <li>• Accept and adhere to the Member Code of Conduct</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Account Security</h3>
                  <p className="text-muted-foreground">
                    You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account or any other breach of security. We shall not be liable for any loss or damage arising from your failure to comply with this requirement.
                  </p>
                </section>

                {/* Platform Services */}
                <section id="services">
                  <h2 className="text-2xl font-bold mb-4">4. Platform Services</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Nature of Services</h3>
                  <p className="text-muted-foreground mb-4">
                    The Platform provides technology-enabled services to facilitate connections between Founders and Members. Our Services include:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Curated deal flow presentation</li>
                    <li>• Investment forum facilitation</li>
                    <li>• Due diligence resources and templates</li>
                    <li>• SPV formation and administration services</li>
                    <li>• Portfolio tracking and management tools</li>
                    <li>• Networking and community features</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">4.2 No Investment Advice</h3>
                  <p className="text-muted-foreground mb-4">
                    <strong>THE COMPANY DOES NOT PROVIDE INVESTMENT ADVICE, TAX ADVICE, LEGAL ADVICE, OR RECOMMENDATIONS.</strong> All investment decisions are made solely by you. The presentation of investment opportunities on the Platform does not constitute a recommendation or endorsement by the Company. You should consult with qualified professional advisors before making any investment decisions.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Fees</h3>
                  <p className="text-muted-foreground">
                    Members are subject to annual membership fees and transaction-based fees as published on the Platform. All fees are non-refundable unless otherwise specified. The Company reserves the right to modify fee structures with 30 days' prior notice to Members.
                  </p>
                </section>

                {/* User Conduct */}
                <section id="user-conduct">
                  <h2 className="text-2xl font-bold mb-4">5. User Conduct</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Acceptable Use</h3>
                  <p className="text-muted-foreground mb-4">
                    You agree to use the Platform only for lawful purposes and in accordance with these Terms. You shall not:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Violate any applicable law, regulation, or third-party rights</li>
                    <li>• Provide false, misleading, or inaccurate information</li>
                    <li>• Engage in any fraudulent or manipulative conduct</li>
                    <li>• Circumvent or attempt to circumvent any security measures</li>
                    <li>• Use automated systems to access the Platform without authorization</li>
                    <li>• Interfere with or disrupt the Platform's operation</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Confidentiality</h3>
                  <p className="text-muted-foreground">
                    You acknowledge that information shared on the Platform, including deal information, founder presentations, and member discussions, is confidential. You agree not to disclose such information to third parties without express written consent from the relevant parties and the Company.
                  </p>
                </section>

                {/* Intellectual Property */}
                <section id="intellectual-property">
                  <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Company IP</h3>
                  <p className="text-muted-foreground mb-4">
                    The Platform and all Content, features, and functionality thereof, including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof, are owned by the Company, its licensors, or other providers of such material and are protected by Indian and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws, including the Indian Copyright Act, 1957, and the Trade Marks Act, 1999.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Limited License</h3>
                  <p className="text-muted-foreground mb-4">
                    Subject to your compliance with these Terms, the Company grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Platform for your personal, non-commercial use.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">6.3 User Content</h3>
                  <p className="text-muted-foreground">
                    By submitting Content to the Platform, you grant the Company a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute such Content in connection with operating and providing the Services.
                  </p>
                </section>

                {/* Third-Party Services */}
                <section id="third-party">
                  <h2 className="text-2xl font-bold mb-4">7. Third-Party Services</h2>
                  <p className="text-muted-foreground mb-4">
                    The Platform may contain links to third-party websites, services, or resources. These links are provided for your convenience only. The Company has no control over the contents of those sites or resources and accepts no responsibility for them or for any loss or damage that may arise from your use of them.
                  </p>
                  <p className="text-muted-foreground">
                    Your use of third-party services, including payment processors, identity verification providers, and document signing services, is subject to the terms and conditions of those third parties. The Company shall not be liable for any acts or omissions of such third parties.
                  </p>
                </section>

                {/* Disclaimers */}
                <section id="disclaimers">
                  <h2 className="text-2xl font-bold mb-4">8. Disclaimers</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">8.1 No Warranty</h3>
                  <p className="text-muted-foreground mb-4">
                    THE PLATFORM AND SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">8.2 Investment Risks</h3>
                  <p className="text-muted-foreground mb-4">
                    <strong>INVESTING IN EARLY-STAGE STARTUPS INVOLVES SUBSTANTIAL RISK, INCLUDING THE RISK OF COMPLETE LOSS OF INVESTMENT.</strong> Past performance is not indicative of future results. The Company makes no representations or warranties regarding the accuracy of information provided by Founders, the prospects of any investment opportunity, or the likelihood of investment returns.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">8.3 Information Accuracy</h3>
                  <p className="text-muted-foreground">
                    While we strive to provide accurate information, the Company does not warrant that the Platform will be error-free, uninterrupted, or free of viruses or other harmful components. Information provided by Founders has not been independently verified by the Company.
                  </p>
                </section>

                {/* Limitation of Liability */}
                <section id="limitation">
                  <h2 className="text-2xl font-bold mb-4">9. Limitation of Liability</h2>
                  <p className="text-muted-foreground mb-4">
                    TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE COMPANY, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Your access to or use of or inability to access or use the Platform</li>
                    <li>• Any conduct or content of any third party on the Platform</li>
                    <li>• Any investment decisions made based on information obtained through the Platform</li>
                    <li>• Unauthorized access, use, or alteration of your transmissions or content</li>
                  </ul>
                  <p className="text-muted-foreground">
                    THE COMPANY'S TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE PLATFORM SHALL NOT EXCEED THE AMOUNT OF FEES PAID BY YOU TO THE COMPANY IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR INR 50,000, WHICHEVER IS GREATER.
                  </p>
                </section>

                {/* Indemnification */}
                <section id="indemnification">
                  <h2 className="text-2xl font-bold mb-4">10. Indemnification</h2>
                  <p className="text-muted-foreground">
                    You agree to defend, indemnify, and hold harmless the Company and its officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Platform, including, but not limited to, your User Content, any use of the Platform's Content, services, and products other than as expressly authorized in these Terms, or your use of any information obtained from the Platform.
                  </p>
                </section>

                {/* Governing Law */}
                <section id="governing-law">
                  <h2 className="text-2xl font-bold mb-4">11. Governing Law</h2>
                  <p className="text-muted-foreground mb-4">
                    These Terms shall be governed by and construed in accordance with the laws of the Republic of India, including but not limited to:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• The Indian Contract Act, 1872</li>
                    <li>• The Information Technology Act, 2000, and rules made thereunder</li>
                    <li>• The Securities and Exchange Board of India Act, 1992, and applicable regulations</li>
                    <li>• The Digital Personal Data Protection Act, 2023</li>
                  </ul>
                  <p className="text-muted-foreground">
                    The Company is incorporated in Tarrant County, Texas, United States. For matters relating to the corporate governance of the Company, the laws of the State of Texas shall apply.
                  </p>
                </section>

                {/* Dispute Resolution */}
                <section id="dispute-resolution">
                  <h2 className="text-2xl font-bold mb-4">12. Dispute Resolution</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">12.1 Good Faith Negotiation</h3>
                  <p className="text-muted-foreground mb-4">
                    In the event of any dispute, controversy, or claim arising out of or relating to these Terms or the breach, termination, or validity thereof, the parties shall first attempt to resolve the dispute through good faith negotiations for a period of thirty (30) days.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">12.2 Arbitration</h3>
                  <p className="text-muted-foreground mb-4">
                    If the dispute cannot be resolved through negotiation, it shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996, as amended. The arbitration shall be conducted as follows:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• <strong>Seat of Arbitration:</strong> New Delhi, India</li>
                    <li>• <strong>Language:</strong> English</li>
                    <li>• <strong>Number of Arbitrators:</strong> One (1), to be mutually appointed by the parties, or failing agreement within 15 days, to be appointed in accordance with the Act</li>
                    <li>• <strong>Rules:</strong> The arbitration shall be conducted in accordance with the rules of the Delhi International Arbitration Centre (DIAC)</li>
                  </ul>
                  <p className="text-muted-foreground">
                    The award rendered by the arbitrator shall be final and binding upon the parties and may be entered in any court of competent jurisdiction.
                  </p>
                </section>

                {/* General Provisions */}
                <section id="general">
                  <h2 className="text-2xl font-bold mb-4">13. General Provisions</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">13.1 Severability</h3>
                  <p className="text-muted-foreground mb-4">
                    If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">13.2 Waiver</h3>
                  <p className="text-muted-foreground mb-4">
                    No waiver by the Company of any term or condition set out in these Terms shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">13.3 Entire Agreement</h3>
                  <p className="text-muted-foreground mb-4">
                    These Terms, together with our Privacy Policy and Code of Conduct, constitute the entire agreement between you and the Company regarding the use of the Platform and supersede all prior agreements and understandings.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">13.4 Assignment</h3>
                  <p className="text-muted-foreground">
                    You may not assign or transfer these Terms, by operation of law or otherwise, without the Company's prior written consent. The Company may freely assign these Terms without restriction.
                  </p>
                </section>

                {/* Amendments */}
                <section id="amendments">
                  <h2 className="text-2xl font-bold mb-4">14. Amendments</h2>
                  <p className="text-muted-foreground mb-4">
                    The Company reserves the right to modify or replace these Terms at any time at its sole discretion. If a revision is material, we will provide at least thirty (30) days' notice prior to any new terms taking effect.
                  </p>
                  <p className="text-muted-foreground">
                    What constitutes a material change will be determined at our sole discretion. By continuing to access or use the Platform after any revisions become effective, you agree to be bound by the revised Terms. If you do not agree to the new Terms, you must stop using the Platform.
                  </p>
                </section>

                {/* Contact Information */}
                <section id="contact">
                  <h2 className="text-2xl font-bold mb-4">15. Contact Information</h2>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about these Terms, please contact us:
                  </p>
                  <div className="bg-muted/50 p-6 rounded-lg border">
                    <p className="font-semibold mb-2">Kosansh Solutions Inc</p>
                    <p className="text-muted-foreground">
                      1320 Pepperhill Ln<br />
                      Fort Worth, TX 76131<br />
                      United States
                    </p>
                    <p className="text-muted-foreground mt-4">
                      For inquiries, please visit our{" "}
                      <Link to="/contact" className="text-accent hover:underline">
                        Contact Page
                      </Link>
                      .
                    </p>
                  </div>
                </section>
              </div>
            </main>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
