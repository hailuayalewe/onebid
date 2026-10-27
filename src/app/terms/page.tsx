export default function TermsPage() {
  return (
    <article className="space-y-4 max-w-2xl text-sm">
      <h1 className="text-3xl font-bold">Terms & Conditions (demo)</h1>
      <ol className="list-decimal list-inside space-y-2">
        <li><strong>Demo application.</strong> DemoBid is a demonstration of a lowest-unique-bid platform. It is provided as-is for evaluation purposes only.</li>
        <li><strong>No real money.</strong> No payments are accepted, no real funds are transferred, and no payment infrastructure is integrated.</li>
        <li><strong>Demo credits.</strong> Demo credits are simulated units with no monetary value. They cannot be purchased, sold, exchanged, or withdrawn for cash or cryptocurrency. Every balance shown is artificial.</li>
        <li><strong>No real prizes.</strong> Nothing is shipped or delivered. Draw outcomes are recorded for demonstration only.</li>
        <li><strong>Fair play.</strong> The lowest-unique-bid winner is calculated solely on the server from eligible bids submitted before a draw closes. Attempts to manipulate draws may result in account suspension.</li>
        <li><strong>Data.</strong> See the Privacy Policy for how demo data is handled.</li>
        <li><strong>No affiliation.</strong> DemoBid is an original implementation and is not affiliated with, endorsed by, or a copy of any particular bidding platform.</li>
      </ol>
    </article>
  );
}
