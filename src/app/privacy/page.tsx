import React from "react";
import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/marketing-page";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy · InsightX",
  description:
    "How InsightX collects, stores, and protects your data. Written in plain English.",
};

export default function PrivacyPage() {
  return (
    <MarketingPage
      title="Privacy Policy"
      subtitle="How InsightX handles your data — written in plain English, not lawyer-speak."
      lastUpdated="December 2024"
    >
      <h2>The short version</h2>
      <p>
        We collect the minimum data needed to make InsightX work. Your Notion
        access tokens are encrypted at rest. We don&apos;t sell your data. We
        don&apos;t share it with anyone. You can delete everything any time.
        That&apos;s it.
      </p>
      <p>
        The longer version below explains exactly what data we touch and why.
        If anything is unclear, reach out via the{" "}
        <Link href="/contact">contact form</Link>.
      </p>

      <h2>What we collect</h2>
      <h3>1. Account information (via Clerk)</h3>
      <p>
        When you sign up, our authentication provider (Clerk) stores your email
        address and, if you sign in with Google, your name and profile picture
        from Google. We never see or store your password — Clerk handles that.
      </p>

      <h3>2. Notion workspace data (only what you authorize)</h3>
      <p>
        When you connect Notion via the official OAuth flow, you choose which
        pages and databases InsightX can read. We then sync metadata about
        those pages — titles, dates, structure, edit history — into our
        database so the AI can answer questions about your workspace. We do
        not write anything back to Notion. We only read what you explicitly
        granted.
      </p>

      <h3>3. Profile information you provide</h3>
      <p>
        On the Settings page you can optionally add a display name, role,
        about-yourself text, and goals. We use these solely to personalize the
        AI&apos;s responses to you. They are never shared.
      </p>

      <h3>4. Chat history</h3>
      <p>
        Your conversations with the AI are stored so you can come back to them
        later and so the assistant has context across messages. They are tied
        to your account and not visible to anyone else.
      </p>

      <h3>5. Basic technical information</h3>
      <p>
        Like every web app, our servers receive standard request information:
        your IP address, browser user agent, and request timestamps. We use
        this for security (rate limiting, fraud detection) and to debug
        problems. We do not run third-party trackers or behavioral
        advertising on the app.
      </p>

      <h2>How we protect it</h2>
      <ul>
        <li>
          <strong>Encryption in transit:</strong> all traffic between you and
          InsightX uses HTTPS.
        </li>
        <li>
          <strong>Encryption at rest:</strong> your Notion access tokens are
          encrypted with AES-256-GCM before being stored. Even if the database
          were compromised, the tokens are useless without the encryption key.
        </li>
        <li>
          <strong>Isolation:</strong> every API request verifies your identity.
          Users cannot read each other&apos;s data — it&apos;s isolated by
          your account ID at the database level.
        </li>
        <li>
          <strong>Honest scope:</strong> we are an MVP-stage product. We do not
          claim SOC 2, ISO 27001, or other formal certifications because we
          have not undergone those audits. If you need that level of
          compliance, this is not yet the product for you.
        </li>
      </ul>

      <h2>Who we share data with</h2>
      <p>
        We only share data with the third-party services we need to operate
        InsightX. We do not sell or rent your data to anyone. The services we
        use are:
      </p>
      <ul>
        <li>
          <strong>Clerk</strong> — authentication. Stores your email,
          password (if used), and OAuth identities.
        </li>
        <li>
          <strong>Supabase</strong> — our primary database. Hosts your synced
          Notion metadata, profile, and chat history.
        </li>
        <li>
          <strong>Vercel</strong> — hosting and serverless infrastructure.
          Receives request metadata (IPs, user agent) for routing and
          security.
        </li>
        <li>
          <strong>Notion</strong> — only when you connect a workspace. We use
          their official API to read the pages you authorized.
        </li>
        <li>
          <strong>Groq</strong> — the LLM provider that powers the AI
          assistant. When you send a chat message, the message and a summary
          of your workspace context are sent to Groq for inference. Groq
          does not retain or train on this data per their API terms.
        </li>
        <li>
          <strong>Upstash</strong> — Redis for rate limiting. Stores anonymous
          counters (your account ID and request timestamps) that auto-expire.
        </li>
      </ul>

      <h2>Your rights</h2>
      <ul>
        <li>
          <strong>Access:</strong> the entire app shows you exactly what data
          we have on you — your synced workspace, your profile, your chats.
        </li>
        <li>
          <strong>Disconnect Notion:</strong> Settings → Notion connection →
          Disconnect. Your synced data is removed from our database.
        </li>
        <li>
          <strong>Delete a chat:</strong> any chat in the sidebar can be
          deleted via the trash icon — instantly.
        </li>
        <li>
          <strong>Delete your account:</strong> request deletion via the{" "}
          <Link href="/contact">contact form</Link> and we&apos;ll remove all
          your data within 7 days.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use cookies only for authentication (set by Clerk to keep you
        signed in) and basic functionality. We do not use advertising or
        tracking cookies.
      </p>

      <h2>Children</h2>
      <p>
        InsightX is not intended for users under 13. If you believe a child
        has signed up, please <Link href="/contact">contact us</Link> and
        we&apos;ll remove the account.
      </p>

      <h2>Changes</h2>
      <p>
        If we change anything material in this policy, we&apos;ll update the
        &quot;Last updated&quot; date at the top and notify active users by
        email. Minor wording fixes won&apos;t trigger notifications.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, concerns, or requests about your data? Use the{" "}
        <Link href="/contact">contact form</Link>. We read every message.
      </p>
    </MarketingPage>
  );
}
