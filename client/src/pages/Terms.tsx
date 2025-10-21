import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Terms() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>

      <div className="container py-12">
        <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using LMS Auditor ("the Service"), you accept and agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            LMS Auditor provides automated website analysis and scoring services that evaluate:
          </p>
          <ul>
            <li>Launch Money Score (LMS) - overall revenue readiness</li>
            <li>Revenue Readiness Index (RRI) - conversion funnel optimization</li>
            <li>Popularity Momentum Index (PMI) - organic growth potential</li>
          </ul>
          <p>
            The Service analyzes publicly available data using Google PageSpeed Insights, Chrome UX Report,
            and automated browser checks.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            You may use the Service without creating an account for free preview audits. Purchased reports
            may require account creation for access and download.
          </p>
          <p>You are responsible for:</p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized access</li>
          </ul>

          <h2>4. Acceptable Use</h2>
          <p>You agree NOT to:</p>
          <ul>
            <li>Audit websites you do not own or have permission to analyze</li>
            <li>Use the Service to violate any laws or regulations</li>
            <li>Attempt to reverse engineer or circumvent our systems</li>
            <li>Abuse rate limits or overwhelm our infrastructure</li>
            <li>Resell or redistribute audit reports without authorization</li>
            <li>Use automated tools to scrape or harvest data from the Service</li>
          </ul>

          <h2>5. Pricing and Payment</h2>
          <h3>Free Preview</h3>
          <p>
            Free audits provide a preview of scores and top recommendations. Full detailed reports,
            PDF downloads, JSON exports, and badge codes require payment.
          </p>

          <h3>Paid Reports</h3>
          <ul>
            <li><strong>Price:</strong> $29 per detailed report</li>
            <li><strong>Payment:</strong> Processed securely through Stripe</li>
            <li><strong>Delivery:</strong> Immediate upon successful payment</li>
            <li><strong>Access:</strong> Reports available for download for 1 year</li>
          </ul>

          <h3>Promotional Codes</h3>
          <p>
            Promotional codes (e.g., LAUNCH10) may be offered at our discretion and are subject to
            specific terms and expiration dates.
          </p>

          <h2>6. Refund Policy</h2>
          <p>
            We offer a <strong>30-day money-back guarantee</strong> on all purchased reports.
          </p>
          <p><strong>Refund Eligibility:</strong></p>
          <ul>
            <li>Request must be made within 30 days of purchase</li>
            <li>Refunds issued to original payment method within 5-10 business days</li>
            <li>Access to purchased reports will be revoked upon refund</li>
          </ul>
          <p><strong>To request a refund:</strong> Email support@launchmoneyscore.com with your order number.</p>
          <p>
            <strong>Note:</strong> Refunds are not available for reports downloaded more than 7 days ago,
            unless there was a technical error in the audit results.
          </p>

          <h2>7. Accuracy and Disclaimers</h2>
          <p>
            <strong>No Guarantees:</strong> While we strive for accuracy, audit results are provided "as is"
            without warranties of any kind. Scores are estimates based on automated analysis and may not
            reflect real-world performance.
          </p>
          <p>
            <strong>Third-Party Data:</strong> We rely on Google PageSpeed Insights and Chrome UX Report data,
            which may have limitations or inaccuracies beyond our control.
          </p>
          <p>
            <strong>Not Professional Advice:</strong> Our Service provides informational analysis only and
            should not be considered professional consulting, legal, or financial advice.
          </p>

          <h2>8. Intellectual Property</h2>
          <h3>Our Content</h3>
          <p>
            The Service, including its design, algorithms, scoring methodology, and branding, is owned by
            LMS Auditor and protected by copyright and trademark laws.
          </p>

          <h3>Your Content</h3>
          <p>
            You retain ownership of URLs you submit and websites you audit. By using the Service, you grant
            us a limited license to analyze the publicly available content for the purpose of generating your audit report.
          </p>

          <h3>Generated Reports</h3>
          <p>
            Purchased reports are licensed to you for personal or business use. You may not resell, redistribute,
            or publicly display reports without our written permission.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, LMS Auditor shall not be liable for:
          </p>
          <ul>
            <li>Any indirect, incidental, or consequential damages</li>
            <li>Loss of profits, data, or business opportunities</li>
            <li>Damages resulting from reliance on audit results</li>
            <li>Service interruptions or technical errors</li>
          </ul>
          <p>
            Our total liability shall not exceed the amount you paid for the Service in the 12 months
            preceding the claim.
          </p>

          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless LMS Auditor from any claims, damages, or expenses
            arising from your use of the Service, violation of these Terms, or infringement of any rights.
          </p>

          <h2>11. Service Availability</h2>
          <p>
            We strive for 99.9% uptime but do not guarantee uninterrupted access. We may suspend the Service
            for maintenance, updates, or security reasons with reasonable notice when possible.
          </p>

          <h2>12. Data and Privacy</h2>
          <p>
            Your use of the Service is also governed by our Privacy Policy. We collect and process data
            as described in the Privacy Policy.
          </p>

          <h2>13. Modifications to Service and Terms</h2>
          <p>
            We reserve the right to modify or discontinue the Service at any time. We may update these
            Terms by posting the new version on this page. Continued use after changes constitutes acceptance.
          </p>

          <h2>14. Termination</h2>
          <p>
            We may terminate or suspend your access to the Service immediately, without notice, for:
          </p>
          <ul>
            <li>Violation of these Terms</li>
            <li>Fraudulent or illegal activity</li>
            <li>Abuse of the Service</li>
          </ul>
          <p>
            You may stop using the Service at any time. Termination does not affect your right to access
            previously purchased reports during their availability period.
          </p>

          <h2>15. Governing Law</h2>
          <p>
            These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law
            principles. Any disputes shall be resolved in the courts of [Your Jurisdiction].
          </p>

          <h2>16. Dispute Resolution</h2>
          <p>
            For any disputes, you agree to first contact us at support@launchmoneyscore.com to attempt informal
            resolution. If unresolved within 30 days, disputes may be submitted to binding arbitration.
          </p>

          <h2>17. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable, the remaining provisions will
            continue in full effect.
          </p>

          <h2>18. Contact Information</h2>
          <p>For questions about these Terms, contact us at:</p>
          <ul>
            <li>Email: support@launchmoneyscore.com</li>
            <li>Website: launchmoneyscore.com/contact</li>
          </ul>

          <div className="mt-12 p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-0">
              <strong>Summary:</strong> Use our Service responsibly to audit websites you own or have permission
              to analyze. Paid reports cost $29 with a 30-day money-back guarantee. Results are estimates and
              not professional advice. We're not liable for business decisions based on audit scores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

