'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Domain {
  id: string;
  name: string;
  url: string;
  active: boolean;
  lastCrawledAt: string | null;
  lastStatus: string;
  healthScore: number;
  crawlFrequency: number;
  _count: {
    crawlJobs: number;
    alerts: number;
  };
}

export default function DashboardPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/domains');
      const data = await response.json();
      setDomains(data);
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerCrawl = async (domainId: string) => {
    try {
      await fetch('/api/crawl/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });
      alert('Crawl started!');
    } catch (error) {
      console.error('Error triggering crawl:', error);
      alert('Error starting crawl');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Healthy</Badge>;
      case 'WARNING':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
      case 'CRITICAL':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Critical</Badge>;
      case 'DOWN':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Down</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'CRITICAL':
      case 'DOWN':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Domains</h2>
          <p className="text-gray-500 mt-1">
            Monitor and track the SEO health of your domains
          </p>
        </div>
        <Link href="/dashboard/domains/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Domain
          </Button>
        </Link>
      </div>

      {domains.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No domains yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first domain</p>
            <Link href="/dashboard/domains/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Domain
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain) => (
            <Card key={domain.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(domain.lastStatus)}
                    <CardTitle className="text-lg">{domain.name}</CardTitle>
                  </div>
                  {getStatusBadge(domain.lastStatus)}
                </div>
                <CardDescription className="truncate">{domain.url}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Health Score */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Health Score</span>
                      <span className="font-semibold">{domain.healthScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          domain.healthScore >= 80
                            ? 'bg-green-500'
                            : domain.healthScore >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${domain.healthScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Crawls</div>
                      <div className="font-semibold">{domain._count.crawlJobs}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Alerts</div>
                      <div className="font-semibold">{domain._count.alerts}</div>
                    </div>
                  </div>

                  {/* Last Crawled */}
                  <div className="text-sm">
                    <span className="text-gray-600">Last crawled: </span>
                    <span className="font-medium">
                      {domain.lastCrawledAt
                        ? new Date(domain.lastCrawledAt).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Link href={`/dashboard/domains/${domain.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => triggerCrawl(domain.id)}
                      title="Trigger Crawl"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
