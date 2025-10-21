import { useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, Download, Code, ArrowLeft } from 'lucide-react';

export default function ReportSuccess() {
  const [, params] = useRoute('/report/:id');
  const [, setLocation] = useLocation();
  const reportId = params?.id || '';

  const { data: report, isLoading, error, refetch } = trpc.report.get.useQuery(
    { reportId },
    {
      enabled: !!reportId,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (data && !data.isPaid) {
          return 2000; // Poll every 2 seconds until paid
        }
        return false;
      },
    }
  );

  useEffect(() => {
    if (report?.isPaid) {
      // Stop polling once paid
      refetch();
    }
  }, [report?.isPaid, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error?.message || 'Report not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!report.isPaid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-3">Processing Your Payment</h2>
          <p className="text-muted-foreground mb-6">
            We're generating your report. This should only take a few seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/audit/${report.auditRunId}`)}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Audit
          </Button>
        </div>
      </div>

      {/* Success Section */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-xl text-muted-foreground mb-12">
              Your LMS Auditor report is ready. Download your files below.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    PDF Report
                  </CardTitle>
                  <CardDescription>
                    Detailed analysis with prioritized fixes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => window.open(report.pdfUrl!, '_blank')}
                  >
                    Download PDF
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    JSON Export
                  </CardTitle>
                  <CardDescription>
                    Raw data for programmatic access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => window.open(report.jsonUrl!, '_blank')}
                  >
                    Download JSON
                  </Button>
                </CardContent>
              </Card>
            </div>

            {report.badgeCode && (
              <Card className="text-left">
                <CardHeader>
                  <CardTitle>🎉 Congratulations! You've Earned the LMS-Ready Badge</CardTitle>
                  <CardDescription>
                    Your site scored 85+ on the Launch Money Score. Add this badge to your website:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{report.badgeCode}</pre>
                  </div>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(report.badgeCode!);
                    }}
                  >
                    Copy Badge Code
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="mt-12">
              <Button
                size="lg"
                onClick={() => setLocation('/')}
              >
                Audit Another Site
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

