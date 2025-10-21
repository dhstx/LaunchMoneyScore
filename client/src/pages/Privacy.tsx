import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Privacy() {
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
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <h2>Introduction</h2>
          <p>
            LMS Auditor ("we", "our", or "us") respects your privacy and is committed to protecting your personal data.
            This privacy policy explains how we collect, use, and safeguard your information when you use our website auditing service.
          </p>

          <h2>Information We Collect</h2>
          
          <h3>Information You Provide</h3>
          <ul>
            <li><strong>URLs for Auditing:</strong> The website URLs you submit for analysis</li>
            <li><strong>Payment Information:</strong> Processed securely through Stripe (we never store your full credit card details)</li>
            <li><strong>Email Address:</strong> If you create an account or make a purchase</li>
            <li><strong>Contact Information:</strong> If you reach out to our support team</li>
          </ul>

          <h3>Information We Collect Automatically</h3>
          <ul>
            <li><strong>Usage Data:</strong> Pages visited, features used, time spent on site</li>
            <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
            <li><strong>Analytics:</strong> We use analytics tools to understand how users interact with our service</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul>
            <li>Provide and improve our website auditing service</li>
            <li>Process your payments and deliver purchased reports</li>
            <li>Send you service-related communications</li>
            <li>Analyze usage patterns to enhance user experience</li>
            <li>Prevent fraud and ensure security</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>Data We Collect from Audited Websites</h2>
          <p>
            When you audit a website, we collect publicly available information including:
          </p>
          <ul>
            <li>Performance metrics from Google PageSpeed Insights</li>
            <li>Field data from Chrome UX Report (if available)</li>
            <li>Publicly visible page elements and structure</li>
            <li>Technical characteristics (mobile responsiveness, accessibility features)</li>
          </ul>
          <p>
            <strong>Important:</strong> We only analyze publicly accessible information. We do not access password-protected areas,
            collect personal data from audited sites, or store any user data from third-party websites.
          </p>

          <h2>Data Sharing and Third Parties</h2>
          <p>We share your information only with:</p>
          <ul>
            <li><strong>Stripe:</strong> For payment processing (subject to Stripe's privacy policy)</li>
            <li><strong>Google APIs:</strong> For PageSpeed Insights and CrUX data (subject to Google's privacy policy)</li>
            <li><strong>Cloud Storage:</strong> For secure storage of generated reports</li>
          </ul>
          <p>We do not sell, rent, or trade your personal information to third parties for marketing purposes.</p>

          <h2>Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including:
          </p>
          <ul>
            <li>Encryption in transit (HTTPS/TLS)</li>
            <li>Encryption at rest for stored data</li>
            <li>Secure payment processing through PCI-compliant providers</li>
            <li>Regular security audits and updates</li>
          </ul>

          <h2>Data Retention</h2>
          <ul>
            <li><strong>Audit Results:</strong> Stored for 90 days unless you purchase a report</li>
            <li><strong>Purchased Reports:</strong> Available for download for 1 year</li>
            <li><strong>Account Data:</strong> Retained while your account is active</li>
            <li><strong>Analytics Data:</strong> Aggregated and anonymized after 24 months</li>
          </ul>

          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Export your data in a portable format</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p>To exercise these rights, contact us at privacy@launchmoneyscore.com</p>

          <h2>Cookies and Tracking</h2>
          <p>We use cookies and similar technologies to:</p>
          <ul>
            <li>Maintain your session and preferences</li>
            <li>Analyze site usage and performance</li>
            <li>Remember your audit history (if logged in)</li>
          </ul>
          <p>You can control cookies through your browser settings.</p>

          <h2>Children's Privacy</h2>
          <p>
            Our service is not intended for users under 13 years of age. We do not knowingly collect
            personal information from children under 13.
          </p>

          <h2>International Data Transfers</h2>
          <p>
            Your data may be processed in countries outside your residence. We ensure appropriate
            safeguards are in place to protect your data in accordance with this privacy policy.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of significant
            changes by posting the new policy on this page and updating the "Last updated" date.
          </p>

          <h2>Contact Us</h2>
          <p>If you have questions about this privacy policy or our data practices, contact us at:</p>
          <ul>
            <li>Email: privacy@launchmoneyscore.com</li>
            <li>Website: launchmoneyscore.com/contact</li>
          </ul>

          <div className="mt-12 p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-0">
              <strong>GDPR Compliance:</strong> For EU residents, we comply with the General Data Protection
              Regulation (GDPR). You have additional rights under GDPR, including the right to lodge a complaint
              with your local data protection authority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

