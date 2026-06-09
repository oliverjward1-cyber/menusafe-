import type { Metadata } from 'next'
import Link from 'next/link'
import { HospoPilotLogo } from '@/components/HospoPilotLogo'

export const metadata: Metadata = {
  title: 'Privacy Policy — HospoPilot',
  description: 'HospoPilot Privacy Policy and Data Retention Policy',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-hospopilot-ink text-white px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-3">
            <HospoPilotLogo onDark />
          </div>
          <h1 className="text-2xl font-bold">Privacy &amp; Data Retention Policy</h1>
          <p className="text-gray-400 mt-1 text-sm">Last updated: June 2025</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8 text-gray-700 text-sm leading-relaxed">

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">1. Who we are</h2>
          <p>
            HospoPilot is a kitchen management SaaS platform operated by [Your Company Name]
            (&quot;HospoPilot&quot;, &quot;we&quot;, &quot;us&quot;). This policy explains what data we collect,
            how we use it, and how long we keep it. We are committed to complying with the
            UK GDPR and the Data Protection Act 2018.
          </p>
          <p>
            For privacy queries contact us at{' '}
            <span className="text-green-700 font-medium">[your contact email]</span>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">2. Data we collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account data:</strong> name, email address, role, restaurant name when you sign up.</li>
            <li><strong>Operational records:</strong> temperature logs, cleaning logs, delivery records, incident reports, daily trail tasks — entered by your team while using HospoPilot.</li>
            <li><strong>Photos:</strong> invoice photos attached to delivery records; photos attached to incident reports. Stored in Supabase Storage.</li>
            <li><strong>Training records:</strong> staff quiz attempts and allergen module completions, including staff names and scores.</li>
            <li><strong>Recipe and allergen data:</strong> ingredients, recipes, allergen flags entered by your team.</li>
            <li><strong>Usage data:</strong> standard server logs (IP address, browser type, pages visited) for security and analytics purposes.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">3. How we use your data</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>To provide, maintain, and improve the HospoPilot platform.</li>
            <li>To generate compliance records and audit trails for your business.</li>
            <li>To send transactional emails (account setup, password reset, staff quiz reminders).</li>
            <li>To process subscription payments via Stripe.</li>
            <li>We do not sell your data to third parties or use it for advertising.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">4. Data retention</h2>
          <p>
            We retain different types of data for different periods based on legal and operational needs:
          </p>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Data type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Retention period</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3">Temperature &amp; cleaning logs</td>
                  <td className="px-4 py-3 font-medium">24 months</td>
                  <td className="px-4 py-3 text-gray-500">EHO audit trail requirement</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Delivery records</td>
                  <td className="px-4 py-3 font-medium">24 months</td>
                  <td className="px-4 py-3 text-gray-500">Food safety traceability</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Incident reports</td>
                  <td className="px-4 py-3 font-medium">36 months</td>
                  <td className="px-4 py-3 text-gray-500">Potential legal claims window</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Photos (invoices, incidents)</td>
                  <td className="px-4 py-3 font-medium">24 months</td>
                  <td className="px-4 py-3 text-gray-500">Auto-deleted after 24 months to manage storage</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Staff training records</td>
                  <td className="px-4 py-3 font-medium">36 months</td>
                  <td className="px-4 py-3 text-gray-500">Compliance and due diligence</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Recipe &amp; allergen data</td>
                  <td className="px-4 py-3 font-medium">Account lifetime + 12 months</td>
                  <td className="px-4 py-3 text-gray-500">Business continuity</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Account &amp; billing data</td>
                  <td className="px-4 py-3 font-medium">7 years after account closure</td>
                  <td className="px-4 py-3 text-gray-500">UK tax and financial record requirements</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            Records older than their retention period are permanently deleted from our systems.
            Text records are anonymised before deletion where required for aggregate analytics.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">5. Data security</h2>
          <p>
            All data is stored in Supabase (EU region) with encryption at rest and in transit.
            Access is controlled via row-level security so each restaurant can only access its
            own data. We use Supabase Auth for authentication. Payment processing is handled
            entirely by Stripe — we never store card details.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">6. Your rights</h2>
          <p>Under UK GDPR you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your data (subject to our legal retention obligations above).</li>
            <li>Object to processing or request restriction of processing.</li>
            <li>Data portability — receive your data in a machine-readable format.</li>
            <li>Lodge a complaint with the ICO (ico.org.uk).</li>
          </ul>
          <p>To exercise any of these rights, email us at <span className="text-green-700 font-medium">[your contact email]</span>.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">7. Third-party processors</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> — database and file storage (EU)</li>
            <li><strong>Vercel</strong> — hosting and CDN</li>
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>Anthropic</strong> — AI features (ingredient categorisation, allergen suggestions). Data sent to Anthropic is not used to train their models under our enterprise agreement.</li>
            <li><strong>Resend</strong> — transactional email</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">8. Cookies</h2>
          <p>
            HospoPilot uses strictly necessary session cookies for authentication. We do not use
            advertising or tracking cookies. No consent banner is required under PECR for
            strictly necessary cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">9. Changes to this policy</h2>
          <p>
            We may update this policy. Material changes will be notified by email or in-app notice.
            The latest version is always available at hospopilot.co.uk/privacy.
          </p>
        </section>

        <div className="pt-4 border-t border-gray-200 flex gap-4">
          <Link href="/terms" className="text-sm text-green-700 hover:underline">Terms of Service</Link>
          <Link href="/" className="text-sm text-green-700 hover:underline">← Back to HospoPilot</Link>
        </div>
      </div>
    </div>
  )
}
