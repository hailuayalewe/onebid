export default function PrivacyPage() {
  return (
    <article className="space-y-4 max-w-2xl text-sm">
      <h1 className="text-3xl font-bold">Privacy Policy (demo)</h1>
      <p>DemoBid is a demonstration application. The following describes what is collected and how it is used:</p>
      <ul className="list-disc list-inside space-y-2">
        <li><strong>Account data.</strong> Name, email address, hashed password (never stored in plain text) for demo accounts only. Passwords are hashed with Argon2.</li>
        <li><strong>Bid data.</strong> Bid amounts and times for demo draws, used to calculate winners and show bid history.</li>
        <li><strong>Demo credits.</strong> A ledger of simulated demo-credit movements. These are not financial records and demo credits have no monetary value.</li>
        <li><strong>No tracking.</strong> No analytics, no advertising cookies, no third-party trackers are used.</li>
        <li><strong>Session tokens.</strong> Kept server-side and never logged. We avoid logging passwords, session tokens, or other sensitive data.</li>
        <li><strong>Deletion.</strong> Demo data lives in a local development database and can be dropped at any time with your permission.</li>
      </ul>
    </article>
  );
}
