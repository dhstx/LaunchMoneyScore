import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Zap, TrendingUp, Shield, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

export default function Home() {
  const [url, setUrl] = useState('');
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const startAudit = trpc.audit.start.useMutation({
    onSuccess: (data) => {
      setLocation(`/audit/${data.auditId}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    startAudit.mutate({ url });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="gradient-primary text-white py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Launch Money Score
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Is your website ready to make money today? Get your LMS score in seconds.
            </p>
            
            {/* URL Input Form */}
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <Input
                  type="text"
                  placeholder="example.com or https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 bg-white text-foreground border-0 h-12 text-lg"
                  disabled={startAudit.isPending}
                  required
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={startAudit.isPending}
                  className="bg-white text-primary hover:bg-white/90 h-12 px-8"
                >
                  {startAudit.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Audit Now
                    </>
                  )}
                </Button>
              </div>
              {startAudit.isError && (
                <p className="mt-3 text-red-200 text-sm">
                  {startAudit.error.message}
                </p>
              )}
            </form>

            <p className="mt-4 text-white/70 text-sm">
              Free preview • Detailed report $29 • Use code <span className="font-mono font-bold">LAUNCH10</span> for 10% off
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              What We Measure
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Zap className="h-10 w-10 text-primary mb-3" />
                  <CardTitle>Launch Money Score</CardTitle>
                  <CardDescription>
                    Overall readiness to generate revenue today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Frictionless checkout flow</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Performance & mobile optimization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Trust signals & social proof</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-10 w-10 text-blue-600 mb-3" />
                  <CardTitle>Revenue Readiness Index</CardTitle>
                  <CardDescription>
                    How well your conversion funnel is optimized
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Preview-to-pay flow</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Wallet buttons (Apple Pay / Google Pay)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Transparent pricing & refund policy</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="h-10 w-10 text-purple-600 mb-3" />
                  <CardTitle>Popularity Momentum Index</CardTitle>
                  <CardDescription>
                    Your potential for organic growth & discovery
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>SEO & structured data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Email capture & lifecycle hooks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Analytics & iteration readiness</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to optimize your revenue?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get actionable insights in minutes. See exactly what's holding you back from making money.
            </p>
            <Button
              size="lg"
              onClick={() => document.querySelector('input')?.focus()}
              className="h-12 px-8"
            >
              <Zap className="mr-2 h-5 w-5" />
              Start Free Audit
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 LMS Auditor. Powered by PageSpeed Insights, CrUX, and Playwright.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button onClick={() => setLocation('/pricing')} className="hover:text-foreground transition-colors">Pricing</button>
              <button onClick={() => setLocation('/privacy')} className="hover:text-foreground transition-colors">Privacy</button>
              <button onClick={() => setLocation('/terms')} className="hover:text-foreground transition-colors">Terms</button>
              <button onClick={() => setLocation('/contact')} className="hover:text-foreground transition-colors">Contact</button>
              {user?.role === 'admin' && (
                <button onClick={() => setLocation('/admin')} className="hover:text-foreground transition-colors font-medium">Admin</button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

