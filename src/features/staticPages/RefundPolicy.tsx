import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const RefundPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-brand-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-brand-primary mb-4">
            Refund Policy
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
                This Refund Policy ("Policy") applies to all transactions
                carried out through the website operated by BIDHORA (Pvt) Ltd
                ("BIDHORA", "we", "our", or "us"). The purpose of this Policy is
                to outline the conditions under which payments made by clients
                ("users", "you") through the BIDHORA website and services may be
                refunded.
              </p>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                2. General Terms
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>
                  All transactions on BIDHORA are governed by the BIDHORA Terms
                  of Service and Usage Policy.
                </li>
                <li>
                  BIDHORA provides professional digital services directly and
                  retains the right to make final decisions regarding refunds.
                </li>
                <li>
                  All refunds will only be issued to the original payment method
                  used for the transaction.
                </li>
                <li>
                  BIDHORA processes refunds in accordance with the payment
                  service provider's (gateway) policies.
                </li>
              </ol>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                3. Eligible Refund Conditions
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mb-4">
                Refunds may be requested under the following conditions:
              </p>
              <ol className="list-decimal list-inside space-y-4 text-muted-foreground dark:text-gray-400 ml-4">
                <li>
                  <strong>Non-Delivery of Service:</strong> BIDHORA fails to
                  deliver the service within the agreed timeframe and does not
                  respond to follow-ups within 5 days.
                </li>
                <li>
                  <strong>Mutual Cancellation:</strong> Both parties mutually
                  agree to cancel the order or project before completion.
                </li>
                <li>
                  <strong>Service Not as Described:</strong> The delivered work
                  significantly differs from the description or agreed-upon
                  requirements.
                </li>
                <li>
                  <strong>Policy Violation or Fraud:</strong> If BIDHORA
                  determines that a transaction involves fraudulent activity,
                  policy violations, or misuse of our services.
                </li>
              </ol>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                4. Non-Refundable Situations
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed mb-4">
                Refunds will not be granted in the following situations:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>
                  Change of mind or voluntary cancellation by the client after
                  purchase.
                </li>
                <li>
                  Delays caused by the client's failure to provide required
                  information, files, or instructions.
                </li>
                <li>
                  The service has already started or has been fully completed as
                  described.
                </li>
                <li>
                  Dispute raised more than 7 days after the order is marked
                  "Completed."
                </li>
                <li>
                  BIDHORA concludes, after review, that the transaction was fair
                  and compliant.
                </li>
              </ol>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                5. Refund Process
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>
                  The client must submit a written Refund Request through the
                  BIDHORA Customer Support Center or Refund Request Portal.
                </li>
                <li>
                  The BIDHORA support team will review the case, including
                  submitted evidence and communication records.
                </li>
                <li>
                  If necessary, BIDHORA may request additional information from
                  the client before reaching a decision.
                </li>
                <li>
                  Once approved, refunds will be processed within 7–14 business
                  days.
                </li>
                <li>
                  Processing or administrative fees may be deducted in
                  accordance with the payment provider's policy.
                </li>
                <li>
                  <strong>Deposit and Service Fee Policy:</strong> The 10% fee paid by the customer to approve the service is never refunded. This fee covers the initial project evaluation, employee assignment, and platform service costs incurred during the project setup process. Once a project is approved and an employee is assigned, the deposit becomes non-refundable to ensure commitment from both parties and to compensate for the resources allocated to the project.
                </li>
              </ol>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                6. Dispute Resolution & Final Decision
              </h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>
                  BIDHORA will investigate disputes fairly and make a final
                  decision based on available evidence.
                </li>
                <li>
                  BIDHORA's decision shall be final and binding on all parties.
                </li>
                <li>
                  Decisions made by BIDHORA are not subject to appeal or
                  external arbitration unless otherwise required by law.
                </li>
              </ul>
            </section>

            <Separator className="dark:bg-gray-700" />

            <section>
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100 mb-4">
                7. Legal Disclaimer
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground dark:text-gray-400 ml-4">
                <li>
                  BIDHORA provides professional digital services directly to
                  clients.
                </li>
                <li>
                  BIDHORA shall not be held liable for any losses, indirect
                  damages, or third-party claims arising from service delivery.
                </li>
                <li>
                  This Policy shall be governed and construed in accordance with
                  the laws of Sri Lanka. Any legal proceedings shall be brought
                  before the competent courts within the jurisdiction of
                  BIDHORA's registered office.
                </li>
              </ol>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RefundPolicy;
