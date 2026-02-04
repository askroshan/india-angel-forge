import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

const Privacy = () => {
  const [activeSection, setActiveSection] = useState("introduction");

  const sections = [
    { id: "introduction", title: "1. Introduction" },
    { id: "data-controller", title: "2. Data Controller" },
    { id: "information-collected", title: "3. Information We Collect" },
    { id: "collection-methods", title: "4. How We Collect Information" },
    { id: "purpose", title: "5. Purpose of Processing" },
    { id: "legal-basis", title: "6. Legal Basis for Processing" },
    { id: "data-sharing", title: "7. Data Sharing & Disclosure" },
    { id: "cookies", title: "8. Cookies & Tracking" },
    { id: "data-retention", title: "9. Data Retention" },
    { id: "data-security", title: "10. Data Security" },
    { id: "your-rights", title: "11. Your Rights" },
    { id: "children", title: "12. Children's Privacy" },
    { id: "cross-border", title: "13. Cross-Border Transfers" },
    { id: "grievance-officer", title: "14. Grievance Officer" },
    { id: "changes", title: "15. Changes to This Policy" },
    { id: "contact", title: "16. Contact Information" },
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
        <title>Privacy Policy - India Angel Forum</title>
        <meta
          name="description"
          content="Privacy Policy for India Angel Forum. Learn how we collect, use, and protect your personal data in compliance with Indian data protection laws including DPDP Act 2023."
        />
        <link rel="canonical" href="https://indiaangelforum.com/privacy" />
      </Helmet>

      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-hero py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-primary-foreground text-3xl md:text-4xl lg:text-5xl">
              Privacy Policy
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
                    Kosansh Solutions Inc ("<strong>Company</strong>," "<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>") is committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy ("<strong>Policy</strong>") describes how we collect, use, disclose, and safeguard your information when you use the India Angel Forum platform, website, mobile applications, and related services (collectively, the "<strong>Platform</strong>").
                  </p>
                  <p className="text-muted-foreground mb-4">
                    This Policy is published in compliance with:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• The Information Technology Act, 2000 ("<strong>IT Act</strong>")</li>
                    <li>• The Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 ("<strong>IT Rules 2011</strong>")</li>
                    <li>• The Digital Personal Data Protection Act, 2023 ("<strong>DPDP Act</strong>")</li>
                    <li>• The Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</li>
                  </ul>
                  <p className="text-muted-foreground">
                    By accessing or using the Platform, you acknowledge that you have read, understood, and agree to this Policy. If you do not agree with this Policy, please do not use the Platform.
                  </p>
                </section>

                {/* Data Controller */}
                <section id="data-controller">
                  <h2 className="text-2xl font-bold mb-4">2. Data Controller</h2>
                  <p className="text-muted-foreground mb-4">
                    The data controller responsible for your personal data is:
                  </p>
                  <div className="bg-muted/50 p-6 rounded-lg border mb-4">
                    <p className="font-semibold mb-2">Kosansh Solutions Inc</p>
                    <p className="text-muted-foreground">
                      1320 Pepperhill Ln<br />
                      Fort Worth, TX 76131<br />
                      United States
                    </p>
                  </div>
                  <p className="text-muted-foreground">
                    Under the DPDP Act, we act as the "<strong>Data Fiduciary</strong>" with respect to the personal data we process. We determine the purposes and means of processing personal data collected through the Platform.
                  </p>
                </section>

                {/* Information We Collect */}
                <section id="information-collected">
                  <h2 className="text-2xl font-bold mb-4">3. Information We Collect</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Personal Data</h3>
                  <p className="text-muted-foreground mb-4">
                    We collect the following categories of personal data:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• <strong>Identity Information:</strong> Full name, date of birth, gender, photograph, signature</li>
                    <li>• <strong>Contact Information:</strong> Email address, phone number, postal address</li>
                    <li>• <strong>Professional Information:</strong> Occupation, employer, job title, professional experience, LinkedIn profile</li>
                    <li>• <strong>Account Information:</strong> Username, password (encrypted), account preferences</li>
                    <li>• <strong>Investment Profile:</strong> Investment experience, risk appetite, sector preferences, investment capacity</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Sensitive Personal Data or Information (SPDI)</h3>
                  <p className="text-muted-foreground mb-4">
                    As defined under IT Rules 2011, we collect the following SPDI with your explicit consent:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• <strong>Financial Information:</strong> Bank account details, net worth declarations, income information</li>
                    <li>• <strong>Government Identifiers:</strong> Permanent Account Number (PAN), Aadhaar number (for KYC purposes only)</li>
                    <li>• <strong>Biometric Data:</strong> Only if required for identity verification, collected through authorized service providers</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Usage Data</h3>
                  <p className="text-muted-foreground mb-4">
                    We automatically collect certain information when you access the Platform:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• <strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                    <li>• <strong>Log Data:</strong> Access times, pages viewed, links clicked, referring URLs</li>
                    <li>• <strong>Location Data:</strong> Approximate location based on IP address</li>
                    <li>• <strong>Interaction Data:</strong> Features used, deals viewed, forum participation</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Communications Data</h3>
                  <p className="text-muted-foreground">
                    We collect and retain records of communications between you and other users on the Platform, as well as communications with our support team, to improve our services and resolve disputes.
                  </p>
                </section>

                {/* Collection Methods */}
                <section id="collection-methods">
                  <h2 className="text-2xl font-bold mb-4">4. How We Collect Information</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Direct Collection</h3>
                  <p className="text-muted-foreground mb-4">
                    We collect information directly from you when you:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Register for an account or apply for membership</li>
                    <li>• Complete the KYC verification process</li>
                    <li>• Submit a founder application</li>
                    <li>• Participate in forums or events</li>
                    <li>• Subscribe to newsletters or communications</li>
                    <li>• Contact our support team</li>
                    <li>• Update your profile or preferences</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Automatic Collection</h3>
                  <p className="text-muted-foreground mb-4">
                    We automatically collect information through cookies, web beacons, and similar technologies when you use the Platform. See Section 8 for more details on cookies.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Third-Party Sources</h3>
                  <p className="text-muted-foreground">
                    We may receive information about you from third parties, including identity verification providers, payment processors, and publicly available sources (such as company registries or professional networking sites).
                  </p>
                </section>

                {/* Purpose of Processing */}
                <section id="purpose">
                  <h2 className="text-2xl font-bold mb-4">5. Purpose of Processing</h2>
                  <p className="text-muted-foreground mb-4">
                    We process your personal data for the following purposes:
                  </p>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Service Delivery</h3>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Creating and managing your account</li>
                    <li>• Verifying your identity and accreditation status</li>
                    <li>• Providing access to deal flow and investment opportunities</li>
                    <li>• Facilitating forum participation and networking</li>
                    <li>• Processing membership fees and transactions</li>
                    <li>• Administering SPVs and investment vehicles</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Communications</h3>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Sending transactional notifications and updates</li>
                    <li>• Providing customer support</li>
                    <li>• Sending newsletters and marketing communications (with consent)</li>
                    <li>• Notifying you of changes to our services or policies</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Legal & Compliance</h3>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Complying with KYC/AML requirements under applicable laws</li>
                    <li>• Meeting regulatory reporting obligations</li>
                    <li>• Responding to legal process and government requests</li>
                    <li>• Enforcing our Terms of Service</li>
                    <li>• Protecting against fraud and security threats</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">5.4 Analytics & Improvement</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Analyzing usage patterns to improve the Platform</li>
                    <li>• Conducting research and analytics</li>
                    <li>• Personalizing your experience</li>
                    <li>• Developing new features and services</li>
                  </ul>
                </section>

                {/* Legal Basis */}
                <section id="legal-basis">
                  <h2 className="text-2xl font-bold mb-4">6. Legal Basis for Processing</h2>
                  <p className="text-muted-foreground mb-4">
                    Under the DPDP Act and IT Rules 2011, we process your personal data based on the following legal grounds:
                  </p>
                  <ul className="space-y-3 text-muted-foreground">
                    <li>
                      <strong>Consent:</strong> Where you have provided explicit consent for processing, particularly for SPDI such as financial information and government identifiers. You may withdraw consent at any time.
                    </li>
                    <li>
                      <strong>Contractual Necessity:</strong> Processing necessary for the performance of our contract with you (the Terms of Service), including providing access to the Platform and Services.
                    </li>
                    <li>
                      <strong>Legal Obligation:</strong> Processing necessary to comply with applicable laws, including KYC/AML requirements, tax regulations, and regulatory reporting.
                    </li>
                    <li>
                      <strong>Legitimate Interest:</strong> Processing necessary for our legitimate interests, including fraud prevention, security, and service improvement, provided such interests do not override your fundamental rights.
                    </li>
                  </ul>
                </section>

                {/* Data Sharing */}
                <section id="data-sharing">
                  <h2 className="text-2xl font-bold mb-4">7. Data Sharing & Disclosure</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Service Providers</h3>
                  <p className="text-muted-foreground mb-4">
                    We share your personal data with trusted third-party service providers who assist us in operating the Platform, including:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Cloud hosting and infrastructure providers</li>
                    <li>• Payment processors and banking partners</li>
                    <li>• Identity verification and KYC service providers</li>
                    <li>• Email and communication service providers</li>
                    <li>• Analytics and performance monitoring services</li>
                    <li>• Legal and professional advisors</li>
                  </ul>
                  <p className="text-muted-foreground mb-4">
                    All service providers are contractually bound to process your data only on our instructions and in compliance with applicable data protection laws.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Other Users</h3>
                  <p className="text-muted-foreground mb-4">
                    Certain information may be visible to other users of the Platform, including your profile information (name, professional background, and profile picture) and your participation in forums and discussions.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Legal Requirements</h3>
                  <p className="text-muted-foreground mb-4">
                    We may disclose your personal data if required by law, regulation, legal process, or governmental request, including:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Response to court orders or subpoenas</li>
                    <li>• Compliance with SEBI, RBI, or other regulatory requirements</li>
                    <li>• Cooperation with law enforcement investigations</li>
                    <li>• Protection of our rights, property, or safety</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">7.4 Business Transfers</h3>
                  <p className="text-muted-foreground mb-4">
                    In the event of a merger, acquisition, reorganization, or sale of assets, your personal data may be transferred as part of the transaction. We will notify you of any such transfer and any choices you may have regarding your data.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">7.5 No Sale of Personal Data</h3>
                  <p className="text-muted-foreground">
                    <strong>We do not sell, rent, or trade your personal data to third parties for their marketing purposes.</strong>
                  </p>
                </section>

                {/* Cookies */}
                <section id="cookies">
                  <h2 className="text-2xl font-bold mb-4">8. Cookies & Tracking Technologies</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">8.1 Types of Cookies</h3>
                  <p className="text-muted-foreground mb-4">
                    We use the following types of cookies:
                  </p>
                  <ul className="space-y-3 text-muted-foreground mb-4">
                    <li>
                      <strong>Essential Cookies:</strong> Necessary for the Platform to function properly, including authentication, security, and session management.
                    </li>
                    <li>
                      <strong>Functional Cookies:</strong> Remember your preferences and settings to enhance your experience.
                    </li>
                    <li>
                      <strong>Analytics Cookies:</strong> Help us understand how visitors interact with the Platform, allowing us to improve our services.
                    </li>
                    <li>
                      <strong>Marketing Cookies:</strong> Used to deliver relevant advertisements and track campaign effectiveness (only with your consent).
                    </li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">8.2 Managing Cookies</h3>
                  <p className="text-muted-foreground mb-4">
                    You can control cookies through your browser settings. Most browsers allow you to:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• View cookies stored on your device</li>
                    <li>• Block all cookies or specific types</li>
                    <li>• Delete cookies when you close your browser</li>
                    <li>• Receive alerts when cookies are being set</li>
                  </ul>
                  <p className="text-muted-foreground">
                    Please note that blocking essential cookies may affect the functionality of the Platform.
                  </p>
                </section>

                {/* Data Retention */}
                <section id="data-retention">
                  <h2 className="text-2xl font-bold mb-4">9. Data Retention</h2>
                  <p className="text-muted-foreground mb-4">
                    We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, including to satisfy legal, regulatory, accounting, or reporting requirements.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Specific retention periods:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• <strong>Account Data:</strong> Duration of account plus 7 years for regulatory compliance</li>
                    <li>• <strong>KYC Documents:</strong> 5 years after termination of relationship (as per PMLA requirements)</li>
                    <li>• <strong>Transaction Records:</strong> 8 years (as per Income Tax Act requirements)</li>
                    <li>• <strong>Communications:</strong> 3 years for support and dispute resolution</li>
                    <li>• <strong>Analytics Data:</strong> 2 years in aggregated/anonymized form</li>
                  </ul>
                  <p className="text-muted-foreground">
                    After the retention period expires, we will securely delete or anonymize your personal data.
                  </p>
                </section>

                {/* Data Security */}
                <section id="data-security">
                  <h2 className="text-2xl font-bold mb-4">10. Data Security</h2>
                  <p className="text-muted-foreground mb-4">
                    We implement reasonable security practices and procedures as required under Section 43A of the IT Act and IT Rules 2011, including:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• <strong>Encryption:</strong> SSL/TLS encryption for data in transit; AES-256 encryption for sensitive data at rest</li>
                    <li>• <strong>Access Controls:</strong> Role-based access, multi-factor authentication, and principle of least privilege</li>
                    <li>• <strong>Infrastructure Security:</strong> Secure cloud hosting, firewalls, intrusion detection, and regular security audits</li>
                    <li>• <strong>Organizational Measures:</strong> Employee training, confidentiality agreements, and security policies</li>
                    <li>• <strong>Incident Response:</strong> Documented procedures for detecting, reporting, and responding to security incidents</li>
                  </ul>
                  <p className="text-muted-foreground">
                    While we strive to protect your personal data, no method of transmission over the Internet or method of electronic storage is 100% secure. We cannot guarantee absolute security of your data.
                  </p>
                </section>

                {/* Your Rights */}
                <section id="your-rights">
                  <h2 className="text-2xl font-bold mb-4">11. Your Rights</h2>
                  <p className="text-muted-foreground mb-4">
                    Under the DPDP Act 2023 and IT Rules 2011, you have the following rights as a Data Principal:
                  </p>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">11.1 Right to Access</h3>
                  <p className="text-muted-foreground mb-4">
                    You have the right to obtain confirmation of whether we process your personal data and to request access to your personal data.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">11.2 Right to Correction</h3>
                  <p className="text-muted-foreground mb-4">
                    You have the right to request correction of inaccurate or incomplete personal data.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">11.3 Right to Erasure</h3>
                  <p className="text-muted-foreground mb-4">
                    You have the right to request erasure of your personal data when it is no longer necessary for the purposes for which it was collected, subject to legal retention requirements.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">11.4 Right to Withdraw Consent</h3>
                  <p className="text-muted-foreground mb-4">
                    Where processing is based on consent, you have the right to withdraw your consent at any time. Withdrawal of consent does not affect the lawfulness of processing based on consent before its withdrawal.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">11.5 Right to Nominate</h3>
                  <p className="text-muted-foreground mb-4">
                    Under the DPDP Act, you have the right to nominate another individual who may exercise your rights in the event of your death or incapacity.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">11.6 Right to Grievance Redressal</h3>
                  <p className="text-muted-foreground mb-4">
                    You have the right to lodge a complaint with our Grievance Officer (see Section 14) or with the Data Protection Board of India if you believe your rights have been violated.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">11.7 Exercising Your Rights</h3>
                  <p className="text-muted-foreground">
                    To exercise any of these rights, please contact our Grievance Officer using the details provided in Section 14. We will respond to your request within 30 days of receipt.
                  </p>
                </section>

                {/* Children's Privacy */}
                <section id="children">
                  <h2 className="text-2xl font-bold mb-4">12. Children's Privacy</h2>
                  <p className="text-muted-foreground mb-4">
                    The Platform is not intended for individuals under the age of 18 years. We do not knowingly collect personal data from children under 18.
                  </p>
                  <p className="text-muted-foreground">
                    If you are a parent or guardian and believe that your child has provided us with personal data, please contact us immediately. If we become aware that we have collected personal data from a child under 18 without verification of parental consent, we will take steps to delete that information.
                  </p>
                </section>

                {/* Cross-Border Transfers */}
                <section id="cross-border">
                  <h2 className="text-2xl font-bold mb-4">13. Cross-Border Data Transfers</h2>
                  <p className="text-muted-foreground mb-4">
                    Your personal data may be transferred to, stored, and processed in countries other than India, including the United States where our parent company is located. Such transfers are made in accordance with applicable data protection laws.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    When transferring personal data outside India, we ensure appropriate safeguards are in place, including:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Standard Contractual Clauses approved by relevant authorities</li>
                    <li>• Transfers to countries with adequate data protection laws</li>
                    <li>• Obtaining your explicit consent where required</li>
                    <li>• Compliance with any conditions specified by the Central Government under the DPDP Act</li>
                  </ul>
                </section>

                {/* Grievance Officer */}
                <section id="grievance-officer">
                  <h2 className="text-2xl font-bold mb-4">14. Grievance Officer</h2>
                  <p className="text-muted-foreground mb-4">
                    In accordance with Rule 5(9) of the IT Rules 2011 and the DPDP Act 2023, we have appointed a Grievance Officer to address your concerns regarding the processing of your personal data.
                  </p>
                  <div className="bg-muted/50 p-6 rounded-lg border mb-4">
                    <p className="font-semibold mb-2">Grievance Officer</p>
                    <p className="text-muted-foreground">
                      <strong>Name:</strong> Roshan Shah<br />
                      <strong>Organization:</strong> Kosansh Solutions Inc<br />
                      <strong>Address:</strong> 1320 Pepperhill Ln, Fort Worth, TX 76131, United States
                    </p>
                    <p className="text-muted-foreground mt-4">
                      To submit a grievance, please visit our{" "}
                      <Link to="/contact" className="text-accent hover:underline">
                        Contact Page
                      </Link>
                      .
                    </p>
                  </div>
                  <p className="text-muted-foreground">
                    The Grievance Officer will acknowledge your complaint within 24 hours and resolve it within 30 days of receipt, in compliance with applicable regulations.
                  </p>
                </section>

                {/* Changes to Policy */}
                <section id="changes">
                  <h2 className="text-2xl font-bold mb-4">15. Changes to This Policy</h2>
                  <p className="text-muted-foreground mb-4">
                    We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. When we make changes:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• We will update the "Last Updated" date at the top of this Policy</li>
                    <li>• For material changes, we will provide notice through the Platform or by email</li>
                    <li>• Where required by law, we will obtain your consent to material changes</li>
                  </ul>
                  <p className="text-muted-foreground">
                    We encourage you to review this Policy periodically to stay informed about how we are protecting your information.
                  </p>
                </section>

                {/* Contact Information */}
                <section id="contact">
                  <h2 className="text-2xl font-bold mb-4">16. Contact Information</h2>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
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

export default Privacy;
