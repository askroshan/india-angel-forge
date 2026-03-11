import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { MapPin, Clock, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const COMPANYHUB_FORM_URL =
  "https://app.companyhub.com/webtolead/renderform/MjIzNzM1?name=Contact_IndiaAngelForum";

const Contact = () => {

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Contact Us - India Angel Forum</title>
        <meta
          name="description"
          content="Get in touch with India Angel Forum. We're here to help founders, investors, and partners connect with India's largest angel network."
        />
        <link rel="canonical" href="https://indiaangelforum.com/contact" />
        <meta property="og:title" content="Contact Us - India Angel Forum" />
        <meta
          property="og:description"
          content="Get in touch with India Angel Forum. We're here to help founders, investors, and partners connect with India's largest angel network."
        />
        <meta property="og:url" content="https://indiaangelforum.com/contact" />
      </Helmet>

      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-hero py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-primary-foreground">Get in Touch</h1>
            <p className="text-lg md:text-xl text-primary-foreground/90">
              Have questions about membership, funding, or partnerships? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Let's Connect
                </h2>
                <p className="text-muted-foreground">
                  Whether you're a founder looking to raise capital, an investor
                  interested in joining our network, or a partner exploring
                  collaboration opportunities, we're here to help.
                </p>
              </div>

              <div className="space-y-6">
                <Card className="border-2">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Operating Entity</h3>
                      <p className="text-muted-foreground text-sm">
                        Kosansh Solutions Inc
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Registered Office</h3>
                      <p className="text-muted-foreground text-sm">
                        1320 Pepperhill Ln
                        <br />
                        Fort Worth, TX 76131
                        <br />
                        United States
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Response Time</h3>
                      <p className="text-muted-foreground text-sm">
                        We typically respond within 2-3 business days. For urgent
                        matters, please indicate so in your message.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="p-6 bg-muted/50 rounded-lg border">
                <h4 className="font-semibold mb-3">How We Can Help</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>Founders:</strong> Funding applications, pitch preparation, forum calendar</li>
                  <li>• <strong>Investors:</strong> Membership inquiries, deal flow, portfolio support</li>
                  <li>• <strong>Family Offices:</strong> Custom engagement, dedicated relationship management</li>
                  <li>• <strong>Partners:</strong> Ecosystem collaboration, sponsorship opportunities</li>
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Send Us a Message
                </h2>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you shortly.
                </p>
              </div>

              <Card className="border-2">
                <CardContent className="p-0 overflow-hidden rounded-lg">
                  <iframe
                    title="Contact India Angel Forum"
                    src={COMPANYHUB_FORM_URL}
                    style={{ width: "100%", minHeight: "900px", border: "0" }}
                    loading="lazy"
                    sandbox="allow-forms allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
                  />
                </CardContent>
              </Card>
              <p className="text-sm text-muted-foreground mt-3">
                If the form doesn't load, you can{" "}
                <a
                  href={COMPANYHUB_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline hover:text-accent/80"
                >
                  open the form directly
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
