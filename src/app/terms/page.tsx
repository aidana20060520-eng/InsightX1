import React from "react";
import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/marketing-page";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service · InsightX",
  description:
    "The rules for using InsightX. Plain English, fair to both sides.",
};

export default function TermsPage() {
  return (
    <MarketingPage
      title="Terms of Service"
      subtitle="The rules for using InsightX. We've written these in plain English so they're actually readable."
      lastUpdated="December 2024"
    >
      <h2>The short version</h2>
      <p>
        Use InsightX in good faith. Don&apos;t abuse it, don&apos;t use it for
        anything illegal, and accept that we&apos;re still in beta — things
        will occasionally break, and we may change features. In return, we
        promise to be honest about what works, fix what we can, and never
        sell your data.
      </p>

      <h2>1. Who we are</h2>
      <p>
        InsightX (&quot;we,&quot; &quot;our,&quot; &quot;the service&quot;) is
        an AI-powered analysis tool for Notion workspaces, currently in beta.
        By creating an account or using the service, you (&quot;you,&quot;
        &quot;the user&quot;) agree to these Terms of Service.
      </p>

      <h2>2. Beta status</h2>
      <p>
        InsightX is currently in beta. This means:
      </p>
      <ul>
        <li>
          Features may change, be added, or be removed without prior notice.
        </li>
        <li>
          You may encounter bugs, downtime, or incorrect AI responses.
        </li>
        <li>
          The service is provided free of charge during beta.
        </li>
        <li>
          We may discontinue the beta at any time. If we do, we&apos;ll give
          active users at least 30 days&apos; notice and a way to export
          their data.
        </li>
      </ul>

      <h2>3. Your account</h2>
      <p>
        You are responsible for keeping your login credentials secure and for
        all activity under your account. If you suspect unauthorized access,{" "}
        <Link href="/contact">tell us</Link> right away.
      </p>
      <p>
        You must be at least 13 years old to use InsightX. If you&apos;re
        using the service on behalf of a company, you represent that you have
        the authority to bind that company to these terms.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          Connect a Notion workspace you don&apos;t have authorization to
          access.
        </li>
        <li>
          Attempt to bypass our rate limits, security, or authentication.
        </li>
        <li>
          Use the AI assistant to generate content that is illegal, harmful,
          discriminatory, or violates someone else&apos;s rights.
        </li>
        <li>
          Reverse-engineer, scrape, or attempt to extract our prompts, models,
          or proprietary code.
        </li>
        <li>
          Interfere with or disrupt the service, including via automated
          tools, denial-of-service attempts, or excessive automated requests.
        </li>
        <li>
          Use the service to compete with us by re-selling or rebranding
          InsightX as your own product.
        </li>
      </ul>
      <p>
        Violating these rules may result in your account being suspended or
        deleted without refund (though there&apos;s nothing to refund during
        beta).
      </p>

      <h2>5. AI-generated content</h2>
      <p>
        The AI assistant produces text based on your inputs and your synced
        Notion data. You should treat its output as a starting point, not as
        verified fact. We do not guarantee accuracy. Don&apos;t rely on
        AI-generated content for medical, legal, financial, or other
        consequential decisions without independent verification.
      </p>
      <p>
        You retain ownership of the prompts you submit and the outputs the AI
        generates for you. We don&apos;t claim a license over your content
        beyond what&apos;s necessary to operate the service.
      </p>

      <h2>6. Your Notion data</h2>
      <p>
        You retain full ownership of your Notion workspace and the data we
        sync from it. By connecting Notion, you grant us a limited license to
        read and process that data solely for the purpose of providing
        InsightX&apos;s features to you.
      </p>
      <p>
        If you disconnect Notion or delete your account, your synced data is
        removed from our database. See the{" "}
        <Link href="/privacy">Privacy Policy</Link> for details.
      </p>

      <h2>7. Service availability</h2>
      <p>
        We aim for high uptime but can&apos;t guarantee uninterrupted service.
        During beta there&apos;s no SLA. We may need to take the service
        offline for maintenance, upgrades, or to address issues.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        InsightX&apos;s name, logo, design, code, and AI prompt engineering
        are our intellectual property. You may use the service as intended,
        but you can&apos;t copy, modify, or redistribute these elements
        without our permission.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The service is provided &quot;as is&quot; and &quot;as available.&quot;
        To the maximum extent permitted by law, we disclaim all warranties —
        express, implied, or statutory — including warranties of
        merchantability, fitness for a particular purpose, and
        non-infringement.
      </p>
      <p>
        We make no warranty that the service will meet your needs, be
        uninterrupted, error-free, accurate, or secure. AI outputs may be
        wrong. Insights may miss things. Use your judgment.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the extent allowed by law, InsightX and its team will not be
        liable for any indirect, incidental, special, consequential, or
        punitive damages arising from your use of the service. Our total
        liability for any claim is limited to the greater of $50 USD or the
        amount you paid us in the previous 12 months — which during beta is
        zero.
      </p>

      <h2>11. Termination</h2>
      <p>
        You can stop using InsightX any time by disconnecting Notion or
        requesting account deletion via the{" "}
        <Link href="/contact">contact form</Link>.
      </p>
      <p>
        We may suspend or terminate your account if you violate these terms,
        if we&apos;re required to by law, or if continuing to provide service
        becomes commercially unreasonable. We&apos;ll usually warn you first
        unless the situation requires immediate action.
      </p>

      <h2>12. Changes to these terms</h2>
      <p>
        We may update these terms as the service evolves. If we make material
        changes, we&apos;ll update the &quot;Last updated&quot; date and
        notify active users by email. Continued use after the change means
        you accept the new terms.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These terms are governed by the laws applicable to the jurisdiction
        in which InsightX operates. Any disputes will be resolved through
        good-faith negotiation first; if that fails, in the appropriate
        courts of that jurisdiction.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about these terms? Reach us via the{" "}
        <Link href="/contact">contact form</Link>.
      </p>
    </MarketingPage>
  );
}
