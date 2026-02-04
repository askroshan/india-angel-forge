import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

const CodeOfConduct = () => {
  const [activeSection, setActiveSection] = useState("purpose");

  const sections = [
    { id: "purpose", title: "1. Purpose & Scope" },
    { id: "core-values", title: "2. Core Values" },
    { id: "professional-standards", title: "3. Professional Standards" },
    { id: "confidentiality", title: "4. Confidentiality" },
    { id: "prohibited-conduct", title: "5. Prohibited Conduct" },
    { id: "conflict-of-interest", title: "6. Conflict of Interest" },
    { id: "anti-corruption", title: "7. Anti-Bribery & Anti-Corruption" },
    { id: "regulatory", title: "8. Regulatory Compliance" },
    { id: "communication", title: "9. Communication Standards" },
    { id: "intellectual-property", title: "10. Intellectual Property" },
    { id: "reporting", title: "11. Reporting Violations" },
    { id: "enforcement", title: "12. Enforcement" },
    { id: "acknowledgment", title: "13. Acknowledgment" },
    { id: "contact", title: "14. Contact Information" },
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
        <title>Code of Conduct - India Angel Forum</title>
        <meta
          name="description"
          content="Code of Conduct for India Angel Forum members. Our community standards for maintaining integrity, professionalism, and compliance in angel investing."
        />
        <link rel="canonical" href="https://indiaangelforum.com/code-of-conduct" />
      </Helmet>

      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-hero py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-primary-foreground text-3xl md:text-4xl lg:text-5xl">
              Code of Conduct
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
                {/* Purpose & Scope */}
                <section id="purpose">
                  <h2 className="text-2xl font-bold mb-4">1. Purpose & Scope</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">1.1 Purpose</h3>
                  <p className="text-muted-foreground mb-4">
                    This Code of Conduct ("<strong>Code</strong>") establishes the standards of ethical behavior and professional conduct expected of all participants in the India Angel Forum community. The Code is designed to foster a trustworthy, collaborative, and compliant investment ecosystem.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">1.2 Scope</h3>
                  <p className="text-muted-foreground mb-4">
                    This Code applies to all individuals and entities participating in the India Angel Forum ecosystem, including:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• <strong>Members:</strong> All accredited investors who have been accepted into the network</li>
                    <li>• <strong>Founders:</strong> Entrepreneurs presenting or seeking funding through the platform</li>
                    <li>• <strong>Staff:</strong> Employees, contractors, and representatives of Kosansh Solutions Inc</li>
                    <li>• <strong>Partners:</strong> Service providers, advisors, and ecosystem partners</li>
                    <li>• <strong>Guests:</strong> Individuals attending forums, events, or accessing platform resources</li>
                  </ul>
                  <p className="text-muted-foreground">
                    By participating in any India Angel Forum activity, you agree to abide by this Code.
                  </p>
                </section>

                {/* Core Values */}
                <section id="core-values">
                  <h2 className="text-2xl font-bold mb-4">2. Core Values</h2>
                  <p className="text-muted-foreground mb-4">
                    The India Angel Forum community is built on the following core values:
                  </p>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Integrity</h3>
                  <p className="text-muted-foreground mb-4">
                    We conduct ourselves with honesty, transparency, and ethical behavior in all interactions. We honor our commitments and take responsibility for our actions.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Respect</h3>
                  <p className="text-muted-foreground mb-4">
                    We treat all community members with dignity, courtesy, and professionalism, regardless of their background, position, or viewpoints. We value diverse perspectives and foster an inclusive environment.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Transparency</h3>
                  <p className="text-muted-foreground mb-4">
                    We communicate openly and honestly about our interests, potential conflicts, and limitations. We provide accurate information and avoid misleading representations.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">2.4 Confidentiality</h3>
                  <p className="text-muted-foreground mb-4">
                    We protect sensitive information shared within the community and respect the privacy of founders, investors, and other participants.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">2.5 Collaboration</h3>
                  <p className="text-muted-foreground">
                    We support one another in making informed investment decisions and contributing to the success of portfolio companies. We share knowledge generously while respecting appropriate boundaries.
                  </p>
                </section>

                {/* Professional Standards */}
                <section id="professional-standards">
                  <h2 className="text-2xl font-bold mb-4">3. Professional Standards</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Accurate Representation</h3>
                  <p className="text-muted-foreground mb-4">
                    All participants must:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Provide truthful and accurate information in all applications, presentations, and communications</li>
                    <li>• Not misrepresent their qualifications, experience, or investment capacity</li>
                    <li>• Promptly update any information that becomes inaccurate or outdated</li>
                    <li>• Not make false or misleading claims about companies, investments, or other members</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Due Diligence</h3>
                  <p className="text-muted-foreground mb-4">
                    Members are expected to:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Conduct appropriate due diligence before making investment decisions</li>
                    <li>• Share diligence findings with syndicate participants in good faith</li>
                    <li>• Respect the confidentiality of proprietary diligence materials</li>
                    <li>• Not rely solely on others' diligence or platform curation for investment decisions</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Founders' Obligations</h3>
                  <p className="text-muted-foreground">
                    Founders presenting on the platform must provide accurate financial data, disclose material risks, and promptly communicate any significant changes to their business or fundraise.
                  </p>
                </section>

                {/* Confidentiality */}
                <section id="confidentiality">
                  <h2 className="text-2xl font-bold mb-4">4. Confidentiality</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Confidential Information</h3>
                  <p className="text-muted-foreground mb-4">
                    The following information is considered confidential and must not be disclosed to third parties without express written consent:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Business plans, financial projections, and proprietary information shared by founders</li>
                    <li>• Investment terms, valuation discussions, and deal-specific information</li>
                    <li>• Member identities, investment activities, and portfolio information</li>
                    <li>• Forum discussions, diligence findings, and voting outcomes</li>
                    <li>• Platform data, analytics, and proprietary methodologies</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Non-Disclosure Obligations</h3>
                  <p className="text-muted-foreground mb-4">
                    All participants acknowledge that:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Confidentiality obligations survive the termination of membership</li>
                    <li>• Breach of confidentiality may result in legal action and damages</li>
                    <li>• Additional NDAs may be required for specific deals or information</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Permitted Disclosures</h3>
                  <p className="text-muted-foreground">
                    Confidential information may be disclosed only: (a) with the express written consent of the disclosing party; (b) to professional advisors bound by confidentiality; (c) as required by law or regulatory authority; or (d) in connection with legal proceedings to protect one's rights.
                  </p>
                </section>

                {/* Prohibited Conduct */}
                <section id="prohibited-conduct">
                  <h2 className="text-2xl font-bold mb-4">5. Prohibited Conduct</h2>
                  <p className="text-muted-foreground mb-4">
                    The following conduct is strictly prohibited and may result in immediate termination of membership:
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Securities Violations</h3>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• <strong>Insider Trading:</strong> Trading in securities based on material non-public information obtained through the platform, in violation of the SEBI (Prohibition of Insider Trading) Regulations, 2015</li>
                    <li>• <strong>Market Manipulation:</strong> Any conduct that manipulates or attempts to manipulate the market for securities, in violation of the SEBI (Prohibition of Fraudulent and Unfair Trade Practices) Regulations, 2003</li>
                    <li>• <strong>Front-Running:</strong> Using advance knowledge of pending transactions for personal benefit</li>
                    <li>• <strong>Tipping:</strong> Sharing material non-public information with others who may trade on it</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Fraud & Misrepresentation</h3>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Providing false or misleading information in applications or presentations</li>
                    <li>• Misrepresenting investment terms, company performance, or material facts</li>
                    <li>• Forging signatures or documents</li>
                    <li>• Impersonating other members or creating fake accounts</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Harassment & Discrimination</h3>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Harassment, bullying, or intimidation of any community member</li>
                    <li>• Discrimination based on race, gender, religion, nationality, age, disability, or any protected characteristic</li>
                    <li>• Sexual harassment or inappropriate conduct</li>
                    <li>• Threatening or abusive language or behavior</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">5.4 Other Prohibited Actions</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Soliciting members for competing platforms or unauthorized services</li>
                    <li>• Using platform data for unauthorized purposes</li>
                    <li>• Circumventing platform fees or processes</li>
                    <li>• Any illegal activity or violation of applicable laws</li>
                  </ul>
                </section>

                {/* Conflict of Interest */}
                <section id="conflict-of-interest">
                  <h2 className="text-2xl font-bold mb-4">6. Conflict of Interest</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Disclosure Requirements</h3>
                  <p className="text-muted-foreground mb-4">
                    Members must promptly disclose any actual or potential conflicts of interest, including:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Financial interests in companies being presented for investment</li>
                    <li>• Business relationships with founders, other investors, or service providers</li>
                    <li>• Family or personal relationships that may influence investment decisions</li>
                    <li>• Investments in competing companies</li>
                    <li>• Receipt of compensation or benefits related to specific deals</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Management of Conflicts</h3>
                  <p className="text-muted-foreground mb-4">
                    When a conflict is disclosed:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• The conflicted party must recuse themselves from relevant discussions and voting</li>
                    <li>• The platform may require additional disclosures to affected parties</li>
                    <li>• Special procedures may be implemented to manage the conflict</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Staff Conflicts</h3>
                  <p className="text-muted-foreground">
                    India Angel Forum staff members are prohibited from making personal investments in companies on the platform without prior approval and disclosure. Staff must maintain independence in curation and evaluation processes.
                  </p>
                </section>

                {/* Anti-Corruption */}
                <section id="anti-corruption">
                  <h2 className="text-2xl font-bold mb-4">7. Anti-Bribery & Anti-Corruption</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Zero Tolerance Policy</h3>
                  <p className="text-muted-foreground mb-4">
                    India Angel Forum has a zero-tolerance policy for bribery and corruption. All participants must comply with applicable anti-corruption laws, including:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• The Prevention of Corruption Act, 1988 (India)</li>
                    <li>• The Foreign Corrupt Practices Act (FCPA) - United States</li>
                    <li>• The UK Bribery Act 2010</li>
                    <li>• Any other applicable anti-corruption laws</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Prohibited Actions</h3>
                  <p className="text-muted-foreground mb-4">
                    Participants must not:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Offer, promise, give, or receive bribes or improper payments</li>
                    <li>• Make facilitation payments to government officials</li>
                    <li>• Provide gifts, hospitality, or entertainment intended to improperly influence decisions</li>
                    <li>• Use third parties to circumvent anti-corruption requirements</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Political Contributions</h3>
                  <p className="text-muted-foreground">
                    The platform does not make political contributions and does not permit the use of platform resources for political purposes.
                  </p>
                </section>

                {/* Regulatory Compliance */}
                <section id="regulatory">
                  <h2 className="text-2xl font-bold mb-4">8. Regulatory Compliance</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">8.1 SEBI Compliance</h3>
                  <p className="text-muted-foreground mb-4">
                    All participants must comply with applicable Securities and Exchange Board of India (SEBI) regulations, including:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• SEBI (Alternative Investment Funds) Regulations, 2012</li>
                    <li>• SEBI (Prohibition of Insider Trading) Regulations, 2015</li>
                    <li>• SEBI (Prohibition of Fraudulent and Unfair Trade Practices) Regulations, 2003</li>
                    <li>• SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015, if applicable</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">8.2 RBI & FEMA Compliance</h3>
                  <p className="text-muted-foreground mb-4">
                    For cross-border investments:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• All foreign investments must comply with the Foreign Exchange Management Act, 1999 (FEMA)</li>
                    <li>• NRI and foreign investor participation must follow RBI guidelines</li>
                    <li>• Overseas remittances must be properly documented and reported</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">8.3 Tax Compliance</h3>
                  <p className="text-muted-foreground">
                    Each participant is responsible for their own tax compliance. The platform may provide information required for tax reporting but does not provide tax advice. Participants should consult qualified tax advisors regarding their obligations.
                  </p>
                </section>

                {/* Communication Standards */}
                <section id="communication">
                  <h2 className="text-2xl font-bold mb-4">9. Communication Standards</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">9.1 Professional Communication</h3>
                  <p className="text-muted-foreground mb-4">
                    All communications within the community should be:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Professional, respectful, and constructive</li>
                    <li>• Focused on relevant business and investment topics</li>
                    <li>• Free from personal attacks, inflammatory language, or offensive content</li>
                    <li>• Mindful of cultural sensitivities and diverse perspectives</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">9.2 Social Media & Public Statements</h3>
                  <p className="text-muted-foreground mb-4">
                    When referring to India Angel Forum publicly:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Do not disclose confidential platform information</li>
                    <li>• Do not make unauthorized statements on behalf of the platform</li>
                    <li>• Clearly distinguish personal opinions from official platform positions</li>
                    <li>• Respect the privacy and confidentiality of other members and founders</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">9.3 Spam & Solicitation</h3>
                  <p className="text-muted-foreground">
                    Unsolicited commercial messages, excessive self-promotion, and unauthorized solicitation of members are prohibited.
                  </p>
                </section>

                {/* Intellectual Property */}
                <section id="intellectual-property">
                  <h2 className="text-2xl font-bold mb-4">10. Intellectual Property</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">10.1 Respect for IP Rights</h3>
                  <p className="text-muted-foreground mb-4">
                    All participants must respect intellectual property rights, including:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• Not copying, reproducing, or distributing copyrighted materials without authorization</li>
                    <li>• Not using trademarks, logos, or branding without permission</li>
                    <li>• Properly attributing content created by others</li>
                    <li>• Respecting trade secrets and proprietary information</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">10.2 Platform IP</h3>
                  <p className="text-muted-foreground">
                    India Angel Forum's name, logos, platform content, methodologies, and proprietary tools are protected intellectual property. Use of these assets requires prior written authorization.
                  </p>
                </section>

                {/* Reporting Violations */}
                <section id="reporting">
                  <h2 className="text-2xl font-bold mb-4">11. Reporting Violations</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">11.1 Duty to Report</h3>
                  <p className="text-muted-foreground mb-4">
                    All community members have a duty to report known or suspected violations of this Code. Reports may be made confidentially through:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• The{" "}
                      <Link to="/contact" className="text-accent hover:underline">
                        Contact Page
                      </Link>{" "}
                      on our website
                    </li>
                    <li>• Direct communication with the Grievance Officer</li>
                    <li>• Reports to any staff member for escalation</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">11.2 Confidentiality of Reports</h3>
                  <p className="text-muted-foreground mb-4">
                    We will maintain the confidentiality of reports to the extent possible, consistent with the need to conduct a proper investigation and comply with legal requirements.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">11.3 Non-Retaliation</h3>
                  <p className="text-muted-foreground">
                    <strong>Retaliation against anyone who reports a violation in good faith is strictly prohibited.</strong> Any person who retaliates against a reporter will be subject to disciplinary action, up to and including termination of membership.
                  </p>
                </section>

                {/* Enforcement */}
                <section id="enforcement">
                  <h2 className="text-2xl font-bold mb-4">12. Enforcement</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">12.1 Investigation Process</h3>
                  <p className="text-muted-foreground mb-4">
                    When a potential violation is reported:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• The matter will be reviewed and investigated by appropriate personnel</li>
                    <li>• The accused party will have an opportunity to respond to allegations</li>
                    <li>• Investigations will be conducted fairly, promptly, and confidentially</li>
                    <li>• Findings and decisions will be documented</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">12.2 Disciplinary Actions</h3>
                  <p className="text-muted-foreground mb-4">
                    Violations of this Code may result in disciplinary action, including:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• <strong>Warning:</strong> Formal notice of the violation and expected corrective action</li>
                    <li>• <strong>Probation:</strong> Restricted access or enhanced monitoring for a specified period</li>
                    <li>• <strong>Suspension:</strong> Temporary suspension of membership privileges</li>
                    <li>• <strong>Termination:</strong> Permanent termination of membership without refund</li>
                    <li>• <strong>Legal Action:</strong> Referral to law enforcement or civil litigation where appropriate</li>
                  </ul>
                  <p className="text-muted-foreground mb-4">
                    The severity of disciplinary action will depend on the nature and severity of the violation, the violator's history, and other relevant factors.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">12.3 Appeals</h3>
                  <p className="text-muted-foreground">
                    Members subject to disciplinary action may appeal the decision in writing within 14 days of notification. Appeals will be reviewed by designated senior personnel whose decision will be final.
                  </p>
                </section>

                {/* Acknowledgment */}
                <section id="acknowledgment">
                  <h2 className="text-2xl font-bold mb-4">13. Acknowledgment</h2>
                  <p className="text-muted-foreground mb-4">
                    By registering as a member, submitting a founder application, or participating in any India Angel Forum activity, you acknowledge that:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>• You have read and understood this Code of Conduct</li>
                    <li>• You agree to comply with all provisions of this Code</li>
                    <li>• You understand that violations may result in disciplinary action</li>
                    <li>• You will report known or suspected violations</li>
                    <li>• You will cooperate with any investigations</li>
                  </ul>
                  <p className="text-muted-foreground">
                    This Code may be updated from time to time. Continued participation in the community after such updates constitutes acceptance of the revised Code.
                  </p>
                </section>

                {/* Contact Information */}
                <section id="contact">
                  <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>
                  <p className="text-muted-foreground mb-4">
                    If you have questions about this Code of Conduct or need to report a concern, please contact:
                  </p>
                  <div className="bg-muted/50 p-6 rounded-lg border">
                    <p className="font-semibold mb-2">Grievance Officer</p>
                    <p className="text-muted-foreground">
                      <strong>Name:</strong> Roshan Shah<br />
                      <strong>Organization:</strong> Kosansh Solutions Inc<br />
                      <strong>Address:</strong> 1320 Pepperhill Ln, Fort Worth, TX 76131, United States
                    </p>
                    <p className="text-muted-foreground mt-4">
                      For inquiries or to report violations, please visit our{" "}
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

export default CodeOfConduct;
