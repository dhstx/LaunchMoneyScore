import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, DollarSign, Users, FileText, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const { data: stats } = trpc.admin.getStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: recentAudits } = trpc.admin.getRecentAudits.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: conversionFunnel } = trpc.admin.getConversionFunnel.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need admin privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const conversionRate = stats?.totalAudits
    ? ((stats.totalPurchases / stats.totalAudits) * 100).toFixed(2)
    : '0.00';

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
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Audits</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalAudits || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                {stats?.auditsToday || 0} today
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-3xl">
                ${((stats?.totalRevenue || 0) / 100).toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <DollarSign className="mr-1 h-4 w-4 text-green-600" />
                {stats?.purchasesToday || 0} purchases today
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Conversion Rate</CardDescription>
              <CardTitle className="text-3xl">{conversionRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {stats?.totalPurchases || 0} / {stats?.totalAudits || 0} converted
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Unique Users</CardDescription>
              <CardTitle className="text-3xl">{stats?.uniqueUsers || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-1 h-4 w-4" />
                {stats?.registeredUsers || 0} registered
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        {conversionFunnel && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>
                Track where users drop off in the purchase journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Audits Started</span>
                    <span className="text-sm font-medium">{conversionFunnel.auditsStarted}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-primary h-3 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Audits Completed</span>
                    <span className="text-sm font-medium">
                      {conversionFunnel.auditsCompleted} (
                      {((conversionFunnel.auditsCompleted / conversionFunnel.auditsStarted) * 100).toFixed(1)}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{
                        width: `${(conversionFunnel.auditsCompleted / conversionFunnel.auditsStarted) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Checkout Initiated</span>
                    <span className="text-sm font-medium">
                      {conversionFunnel.checkoutInitiated} (
                      {((conversionFunnel.checkoutInitiated / conversionFunnel.auditsCompleted) * 100).toFixed(1)}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-purple-600 h-3 rounded-full"
                      style={{
                        width: `${(conversionFunnel.checkoutInitiated / conversionFunnel.auditsStarted) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Purchases Completed</span>
                    <span className="text-sm font-medium">
                      {conversionFunnel.purchasesCompleted} (
                      {((conversionFunnel.purchasesCompleted / conversionFunnel.checkoutInitiated) * 100).toFixed(1)}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full"
                      style={{
                        width: `${(conversionFunnel.purchasesCompleted / conversionFunnel.auditsStarted) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for different views */}
        <Tabs defaultValue="audits">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="audits">Recent Audits</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="audits">
            <Card>
              <CardHeader>
                <CardTitle>Recent Audits</CardTitle>
                <CardDescription>
                  Latest website audits performed by users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>LMS</TableHead>
                      <TableHead>Purchased</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAudits?.audits.map((audit: any) => (
                      <TableRow key={audit.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          <a
                            href={audit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            {audit.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              audit.status === 'completed'
                                ? 'default'
                                : audit.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {audit.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{audit.lms || '-'}</TableCell>
                        <TableCell>
                          {audit.hasPurchase ? (
                            <Badge className="bg-green-600">Yes</Badge>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(audit.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {audit.utmSource || audit.referrer || 'Direct'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle>Recent Purchases</CardTitle>
                <CardDescription>
                  Latest report purchases and revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>LMS Score</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAudits?.purchases.map((purchase: any) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {purchase.url}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          ${(purchase.amountPaid / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>{purchase.lms}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(purchase.paidAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {purchase.userEmail || 'Guest'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>
                  Where your users are coming from
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Audits</TableHead>
                      <TableHead>Purchases</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAudits?.sources.map((source: any) => (
                      <TableRow key={source.source}>
                        <TableCell className="font-medium">
                          {source.source || 'Direct'}
                        </TableCell>
                        <TableCell>{source.audits}</TableCell>
                        <TableCell>{source.purchases}</TableCell>
                        <TableCell>
                          {((source.purchases / source.audits) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-green-600">
                          ${(source.revenue / 100).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

