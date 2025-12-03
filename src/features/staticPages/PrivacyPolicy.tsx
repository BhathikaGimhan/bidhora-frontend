import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import SEO from "@/components/SEO";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-brand-black py-12 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Privacy Policy" 
        description="Read our Privacy Policy to understand how we collect, use, and protect your personal information on Bidhora."
      />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-brand-primary mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground dark:text-gray-400">
            Last updated: October 22, 2025
          </p>
        </div>

        <Card className="border-border dark:border-gray-700">
          <CardContent className="p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                1. Introduction
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
                Welcome to Bidhora's Privacy Policy. This policy describes how
                we collect, use, disclose, and protect your personal information
                when you use our website and services. We are committed to
                protecting your privacy and ensuring the security of your
                personal data.
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                2. Information We Collect
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mb-4">
                We collect various types of information to provide and improve
                our service:
              </p>

              <h3 className="text-xl font-semibold text-foreground dark:text-gray-100 mb-3 mt-6">
                2.1 Personal Information
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>Name, email address, and contact information</li>
                <li>Profile information including photo and bio</li>
                <li>Payment and billing information</li>
                <li>Identity verification documents</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground dark:text-gray-100 mb-3 mt-6">
                2.2 Usage Information
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>IP address and device information</li>
                <li>Browser type and operating system</li>
                <li>Pages visited and features used</li>
                <li>Time spent on the website</li>
                <li>Referring website or source</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground dark:text-gray-100 mb-3 mt-6">
                2.3 Transaction Information
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>Service requests and quotations</li>
                <li>Payment transactions and history</li>
                <li>Communication with our support team</li>
                <li>Service delivery records</li>
              </ul>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mb-4">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>
                  To provide, maintain, and improve our website and services
                </li>
                <li>
                  To process transactions and send transaction notifications
                </li>
                <li>
                  To communicate with you about your account and our services
                </li>
                <li>To personalize your experience on our website</li>
                <li>To detect and prevent fraud and security threats</li>
                <li>To comply with legal obligations</li>
                <li>To send marketing communications (with your consent)</li>
                <li>To analyze usage patterns and improve our services</li>
              </ul>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                4. Information Sharing and Disclosure
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>
                  <strong>Service Providers:</strong> Third-party vendors who
                  assist in operating our website and services
                </li>
                <li>
                  <strong>Business Transfers:</strong> In case of merger,
                  acquisition, or sale of assets
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law or
                  to protect our rights
                </li>
                <li>
                  <strong>With Your Consent:</strong> When you explicitly agree
                  to share information
                </li>
              </ul>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mt-4">
                We do not sell your personal information to third parties for
                their marketing purposes.
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                5. Data Security
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mb-4">
                We implement appropriate technical and organizational measures
                to protect your data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mt-4">
                However, no method of transmission over the internet is 100%
                secure. We cannot guarantee absolute security of your data.
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                6. Your Rights and Choices
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mb-4">
                You have the following rights regarding your personal
                information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>
                  <strong>Access:</strong> Request a copy of your personal data
                </li>
                <li>
                  <strong>Correction:</strong> Update or correct inaccurate
                  information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal
                  data
                </li>
                <li>
                  <strong>Portability:</strong> Receive your data in a
                  structured format
                </li>
                <li>
                  <strong>Opt-out:</strong> Unsubscribe from marketing
                  communications
                </li>
                <li>
                  <strong>Withdraw Consent:</strong> Revoke consent for data
                  processing
                </li>
              </ul>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mt-4">
                To exercise these rights, please contact us at
                contact@bidhora.com
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                6. Cookies and Tracking Technologies
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>Remember your preferences and settings</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Provide personalized content and ads</li>
                <li>Enable certain features and functionality</li>
              </ul>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mt-4">
                You can control cookies through your browser settings. Note that
                disabling cookies may affect the functionality of our website.
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                7. Data Retention
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
                We retain your personal information for as long as necessary to
                fulfill the purposes outlined in this policy, unless a longer
                retention period is required by law. After you close your
                account, we may retain certain information for legitimate
                business purposes or legal compliance.
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                8. International Data Transfers
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
                Your information may be transferred to and processed in
                countries other than your country of residence. We ensure
                appropriate safeguards are in place to protect your data in
                accordance with this Privacy Policy.
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                9. Children's Privacy
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
                Our website and services are not intended for users under the
                age of 18. We do not knowingly collect personal information from
                children. If you believe we have collected information from a
                child, please contact us immediately.
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                10. Changes to This Policy
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of significant changes by email or through a notice
                on our website. Your continued use of our website and services
                after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                11. Contact Us
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mb-4">
                If you have any questions or concerns about this Privacy Policy
                or our data practices, please contact us:
              </p>
              <div className="text-muted-foreground dark:text-gray-400">
                <p>
                  <strong>Email:</strong> contact@bidhora.com
                </p>
                <p>
                  <strong>Address:</strong> No 106, Temple road, palagala.
                </p>
                <p>
                  <strong>Data Protection Officer:</strong> contact@bidhora.com
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
