import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Zap, Gift } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Pricing() {
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
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-muted-foreground">
              Get actionable insights to optimize your website for revenue.
            </p>
          </div>

          {/* Launch Promo Banner */}
          <div className="mb-12 p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="h-6 w-6" />
              <h3 className="text-2xl font-bold">Launch Special!</h3>
            </div>
            <p className="text-lg mb-3">
              Use code <span className="font-mono font-bold bg-white/20 px-3 py-1 rounded">LAUNCH10</span> for 10% off
            </p>
            <p className="text-sm text-white/80">
              Limited time offer • Expires in 30 days
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Free Preview */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-2xl">Free Preview</CardTitle>
                <CardDescription>
                  Get started with a comprehensive overview
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full mb-6"
                  variant="outline"
                  onClick={() => setLocation('/')}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Start Free Audit
                </Button>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Complete LMS, RRI, and PMI scores</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Top 5 priority fixes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Category breakdown with evidence</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Critical gates status</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Shareable results page</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Full Report */}
            <Card className="relative border-primary shadow-lg">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                Most Popular
              </Badge>
              <CardHeader>
                <CardTitle className="text-2xl">Full Report</CardTitle>
                <CardDescription>
                  Everything you need to optimize for revenue
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-muted-foreground ml-2">per audit</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full mb-6"
                  onClick={() => setLocation('/')}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Get Full Report
                </Button>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">Everything in Free Preview, plus:</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Downloadable PDF report (1-2 pages)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">JSON export for programmatic access</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Copy-paste code snippets & templates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Example refund policy & schema markup</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Prioritized action plan</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">"LMS-Ready" badge (if score ≥85)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">30-day money-back guarantee</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What's included in the free preview?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    The free preview shows your complete scores (LMS, RRI, PMI), category breakdowns,
                    critical gates status, and top 5 priority fixes. You can share the results page with your team.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What's the refund policy?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We offer a 30-day money-back guarantee. If you're not satisfied with your report,
                    email support@lms-auditor.com with your order number for a full refund.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How long does an audit take?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Most audits complete in 30-60 seconds. We analyze your site using PageSpeed Insights,
                    Chrome UX Report, and automated browser checks to ensure comprehensive results.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Can I audit multiple sites?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Yes! Each audit is priced separately at $29. Free previews are available for all sites.
                    Contact sales@lms-auditor.com for volume discounts on 10+ audits.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We accept all major credit cards, Apple Pay, and Google Pay through our secure
                    Stripe payment processor. Your payment information is never stored on our servers.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How is the score calculated?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Our proprietary algorithm analyzes 8 categories weighted by revenue impact: Frictionless Flow,
                    Proof-to-Pay, Pricing, Trust, Traffic Readiness, Performance, Lifecycle, and Analytics.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center p-8 bg-muted rounded-lg">
            <h3 className="text-2xl font-bold mb-4">Ready to optimize your revenue?</h3>
            <p className="text-muted-foreground mb-6">
              Start with a free preview. Upgrade to the full report if you need detailed recommendations.
            </p>
            <Button size="lg" onClick={() => setLocation('/')}>
              <Zap className="mr-2 h-5 w-5" />
              Start Free Audit Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

