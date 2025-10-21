import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { ScoreGauge } from '@/components/ScoreGauge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, XCircle, Download, Share2, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AuditResults() {
  const [, params] = useRoute('/audit/:id');
  const [, setLocation] = useLocation();
  const auditId = params?.id || '';

  const { data: audit, isLoading, error, refetch } = trpc.audit.get.useQuery(
    { auditId },
    { 
      enabled: !!auditId,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (data?.status === 'pending' || data?.status === 'running') {
          return 2000; // Poll every 2 seconds while running
        }
        return false;
      },
    }
  );

  const createReport = trpc.report.create.useMutation();

  const handlePurchase = () => {
    createReport.mutate(
      { auditId },
      {
        onSuccess: (data) => {
          // Redirect to Stripe checkout
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          }
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading audit results...</p>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error?.message || 'Audit not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (audit.status === 'pending' || audit.status === 'running') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-3">Analyzing Your Website</h2>
          <p className="text-muted-foreground mb-6">
            We're running comprehensive checks on performance, user experience, and revenue readiness.
            This usually takes 30-60 seconds.
          </p>
          <div className="space-y-2 text-sm text-left bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>Fetching PageSpeed Insights data...</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>Checking CrUX field metrics...</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>Running headless browser checks...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (audit.status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Audit Failed</AlertTitle>
          <AlertDescription>
            {audit.error || 'An error occurred while analyzing your website.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const categories = audit.categories as any;
  const gates = audit.gates as any;
  const topFixes = audit.topFixes as string[];
  const allGatesPassed = gates && Object.values(gates).every(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                className="mb-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
              <h1 className="text-2xl font-bold">{audit.url}</h1>
              <p className="text-sm text-muted-foreground">
                Analyzed on {new Date(audit.completedAt!).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button size="sm" onClick={handlePurchase} disabled={createReport.isPending}>
                <Download className="mr-2 h-4 w-4" />
                {createReport.isPending ? 'Processing...' : 'Get Full Report ($29)'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scores Section */}
      <section className="py-12 bg-gradient-to-b from-card to-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <ScoreGauge score={audit.lms || 0} maxScore={100} label="Launch Money Score" size="lg" />
              <ScoreGauge score={audit.rri || 0} maxScore={100} label="Revenue Readiness" size="lg" delay={0.2} />
              <ScoreGauge score={audit.pmi || 0} maxScore={100} label="Popularity Momentum" size="lg" delay={0.4} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gates Status */}
      <section className="py-8 border-y bg-card">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Critical Gates</h2>
            {allGatesPassed ? (
              <Alert className="border-green-600 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900 dark:text-green-100">All Critical Gates Passed!</AlertTitle>
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Your site meets all the essential requirements for revenue generation.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Some Critical Gates Failed</AlertTitle>
                <AlertDescription>
                  Address these issues immediately to unlock revenue potential.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              {gates && Object.entries(gates).map(([key, passed]: [string, any]) => (
                <div key={key} className="flex items-center gap-2 p-3 rounded-lg border bg-background">
                  {passed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                  <span className="text-sm">{key.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Top Fixes */}
      <section className="py-12">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Top 5 Priority Fixes</h2>
            <div className="space-y-3">
              {topFixes.map((fix, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-1">
                          {index + 1}
                        </Badge>
                        <CardTitle className="text-base">{fix}</CardTitle>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Evidence Tabs */}
      <section className="py-12 bg-muted">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Detailed Evidence</h2>
            <Tabs defaultValue="A" className="w-full">
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
                {categories && Object.keys(categories).map((key) => (
                  <TabsTrigger key={key} value={key}>
                    Category {key}
                  </TabsTrigger>
                ))}
              </TabsList>
              {categories && Object.entries(categories).map(([key, category]: [string, any]) => (
                <TabsContent key={key} value={key}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Category {key}</CardTitle>
                      <CardDescription>
                        Score: {category.score} / {category.maxScore}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Checks</h4>
                          <div className="space-y-2">
                            {Object.entries(category.checks).map(([checkKey, passed]: [string, any]) => (
                              <div key={checkKey} className="flex items-center gap-2">
                                {passed ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="text-sm">{checkKey.replace(/_/g, ' ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {category.evidence && category.evidence.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Evidence</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {category.evidence.map((item: string, idx: number) => (
                                <li key={idx}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </section>

      {/* Unlock Full Report CTA */}
      <section className="py-16 gradient-primary text-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Unlock Your Full Report</h2>
            <p className="text-lg text-white/90 mb-8">
              Get a detailed PDF report with actionable fixes, code snippets, and priority recommendations.
              {audit.lms && audit.lms >= 85 && ' Plus, earn your "LMS-Ready" badge!'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="text-4xl font-bold">$29</div>
              <Button
                size="lg"
                onClick={handlePurchase}
                disabled={createReport.isPending}
                className="bg-white text-primary hover:bg-white/90 h-12 px-8"
              >
                <Download className="mr-2 h-5 w-5" />
                {createReport.isPending ? 'Processing...' : 'Purchase Full Report'}
              </Button>
            </div>
            <p className="mt-4 text-sm text-white/70">
              Includes: PDF report • JSON export • Copy-paste fixes • Badge embed code (if LMS ≥ 85)
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

