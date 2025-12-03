import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import SEO from "@/components/SEO";

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-brand-black py-12 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Terms of Service" 
        description="Read the Terms of Service for using Bidhora. Understand your rights and responsibilities as a user of our platform."
      />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-brand-primary mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground dark:text-gray-400">
            Last updated: October 22, 2025
          </p>
        </div>

        <Card className="border-border dark:border-gray-700">
          <CardContent className="p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
                By accessing and using Bidhora's website and services, you
                accept and agree to be bound by the terms and provision of this
                agreement. If you do not agree to abide by the above, please do
                not use this service.
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                2. Use of Service
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mb-4">
                Bidhora provides professional digital solutions and services. By
                using our service, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>
                  Provide accurate and complete information during registration
                </li>
                <li>Maintain the security of your account credentials</li>
                <li>
                  Accept responsibility for all activities under your account
                </li>
                <li>
                  Notify us immediately of any unauthorized use of your account
                </li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                3. User Accounts
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mb-4">
                To access certain features of our website and services, you must
                register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>
                  Be at least 18 years of age or the age of majority in your
                  jurisdiction
                </li>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Not create multiple accounts for fraudulent purposes</li>
                <li>Not share your account with others</li>
              </ul>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                4. Service Delivery
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mb-4">
                When requesting services from Bidhora, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>Provide accurate service descriptions and requirements</li>
                <li>Submit complete and clear project specifications</li>
                <li>Honor payment commitments for completed work</li>
                <li>Complete payment before accessing final deliverables</li>
                <li>Communicate professionally and provide timely feedback</li>
              </ul>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                5. Payment Terms
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mb-4">
                All financial transactions for our services are subject to the
                following:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>Payments must be made through approved payment methods</li>
                <li>
                  Service fees apply as communicated during service agreement
                </li>
                <li>Payment is processed upon successful service delivery</li>
                <li>Refunds are processed according to our refund policy</li>
                <li>Users are responsible for any applicable taxes</li>
                <li>
                  All payments are final unless otherwise specified in writing
                </li>
              </ul>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                6. Intellectual Property
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
                All content on our website and services, including text,
                graphics, logos, and software, is the property of Bidhora or its
                content suppliers and is protected by intellectual property
                laws. You retain ownership of your submitted content but grant
                Bidhora a license to use, display, and distribute such content
                as necessary to provide our services.
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                7. Prohibited Activities
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mb-4">
                You are prohibited from:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>Engaging in fraudulent or deceptive practices</li>
                <li>Posting illegal, harmful, or offensive content</li>
                <li>Harassing or threatening others</li>
                <li>Using our services for unauthorized commercial purposes</li>
                <li>Violating any laws or regulations</li>
                <li>Attempting to gain unauthorized access to our systems</li>
              </ul>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                8. Dispute Resolution
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
                In the event of service-related concerns, Bidhora provides
                support services to help resolve issues. However, Bidhora is not
                responsible for service delivery outcomes and does not guarantee
                any particular results. Users agree to first attempt to resolve
                concerns through our support process before pursuing other
                remedies.
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                9. Limitation of Liability
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
                Bidhora provides our services "as is" without warranties of any
                kind. We are not liable for any damages arising from the use of
                our services, including but not limited to direct, indirect,
                incidental, or consequential damages. Our total liability shall
                not exceed the amount of fees paid by you in the six months
                preceding the claim.
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                10. Termination
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
                We reserve the right to terminate or suspend your account at any
                time for violations of these terms or for any other reason at
                our sole discretion. Upon termination, your right to use our
                services will immediately cease, and we may delete your account
                and content.
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                11. Changes to Terms
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
                We reserve the right to modify these terms at any time. Users
                will be notified of significant changes via email or service
                notification. Continued use of our services after changes
                constitutes acceptance of the modified terms.
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                12. Contact Information
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
                If you have any questions about these Terms of Service, please
                contact us at:
              </p>
              <div className="mt-4 text-muted-foreground dark:text-gray-400">
                <p>Email: contact@bidhora.com</p>
                <p>Address: No 106, Temple road, palagala.</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
