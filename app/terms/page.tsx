import type { Metadata } from 'next'
import Link from 'next/link'
import { HospoPilotLogo } from '@/components/HospoPilotLogo'
import { SiteFooter } from '@/components/marketing/SiteFooter'

export const metadata: Metadata = {
  title: 'Terms of Service — HospoPilot',
  description: 'HospoPilot Terms of Service and Allergen Disclaimer',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-hospopilot-ink text-white px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="inline-block mb-3"><HospoPilotLogo onDark /></Link>
          <h1 className="text-2xl font-bold">Terms of Service</h1>
          <p className="text-gray-400 mt-1 text-sm">Last updated: June 2025</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8 text-gray-700 text-sm leading-relaxed">

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">1. About HospoPilot</h2>
          <p>
            HospoPilot is a software-as-a-service (SaaS) platform that helps restaurant operators
            manage ingredient libraries, recipe costing, allergen information, and staff training.
            HospoPilot is operated by [Your Company Name] (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
          </p>
          <p>
            By using HospoPilot you agree to these Terms. If you are using HospoPilot on behalf of a
            business, you confirm you have authority to bind that business to these Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">2. Allergen information — operator responsibility</h2>
          <p className="font-semibold text-gray-900">
            This is the most important section. Please read it carefully.
          </p>
          <p>
            HospoPilot provides tools to help restaurant operators record, manage, and display allergen
            information. However:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>You are legally responsible</strong> for the accuracy of all allergen information
              you enter, publish, or display to customers. This responsibility cannot be transferred
              to HospoPilot or its operators.
            </li>
            <li>
              HospoPilot uses AI (artificial intelligence) to suggest allergen data when scanning
              supplier invoices. <strong>AI suggestions are estimates only</strong> and may be
              incorrect. You must verify all AI-suggested allergen data before it is published or
              used in customer-facing menus.
            </li>
            <li>
              HospoPilot is a management tool, not a certified food safety system. It does not replace
              your obligations under the <strong>UK Food Information Regulations 2014</strong>,
              <strong> Natasha&apos;s Law (2021)</strong>, or any other applicable food safety legislation.
            </li>
            <li>
              You must ensure your kitchen practices (including cross-contamination controls) meet
              legal requirements independently of any software you use.
            </li>
            <li>
              HospoPilot accepts no liability for harm, loss, or legal action arising from inaccurate
              allergen information entered or published by a restaurant operator using our platform.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">3. AI-generated content</h2>
          <p>
            Certain features of HospoPilot use AI models to assist with data extraction and suggestions
            (for example, reading supplier invoices). AI-generated output:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Is provided as a starting point only and must be reviewed before use.</li>
            <li>May contain errors, omissions, or inaccuracies.</li>
            <li>Does not constitute professional food safety, nutritional, or legal advice.</li>
          </ul>
          <p>
            You are responsible for reviewing and verifying all AI-generated content before saving
            it to your ingredient library or making it visible to customers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">4. Data and privacy</h2>
          <p>
            Your restaurant data (ingredients, recipes, allergen information) is stored securely and
            is only accessible to users you authorise. We do not sell your data to third parties.
            Customer-facing menu pages are publicly accessible at your restaurant&apos;s unique URL.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">5. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, HospoPilot and its operators shall not be liable
            for any indirect, incidental, special, consequential, or punitive damages arising from
            your use of the platform, including but not limited to allergen-related incidents,
            loss of revenue, or reputational harm.
          </p>
          <p>
            Our total liability to you for any claim arising from these Terms or your use of
            HospoPilot shall not exceed the amount you paid us in the 12 months preceding the claim.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">6. Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of material changes
            by email or in-app notice. Continued use of HospoPilot after changes take effect
            constitutes your acceptance of the updated Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">7. Governing law</h2>
          <p>
            These Terms are governed by the laws of England and Wales. Any disputes shall be
            subject to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">8. Contact</h2>
          <p>
            If you have any questions about these Terms or our allergen disclaimer, please contact
            us at <a href="mailto:support@hospopilot.co.uk" className="text-green-700 font-medium hover:underline">support@hospopilot.co.uk</a>.
          </p>
        </section>

        <div className="pt-4 border-t border-gray-200">
          <Link href="/" className="text-sm text-green-700 hover:underline">← Back to HospoPilot</Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
