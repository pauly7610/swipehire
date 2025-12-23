import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export default function ResumeIndexManager({ candidate, onIndexComplete }) {
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState(null);

  const handleIndex = async () => {
    if (!candidate.resume_url) return;

    setIndexing(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('indexResume', {
        candidate_id: candidate.id,
        resume_url: candidate.resume_url
      });

      if (response.data.success) {
        onIndexComplete && onIndexComplete(response.data);
      } else {
        setError(response.data.error || 'Indexing failed');
      }
    } catch (err) {
      console.error('Index error:', err);
      setError(err.message || 'Failed to index resume');
    }

    setIndexing(false);
  };

  const getStatusBadge = () => {
    if (!candidate.resume_url) {
      return <Badge variant="outline" className="text-gray-500">No Resume</Badge>;
    }

    switch (candidate.index_status) {
      case 'success':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Indexed
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            Not Indexed
          </Badge>
        );
    }
  };

  if (!candidate.resume_url) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Resume Index Status
          </span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {candidate.index_status === 'failed' && candidate.index_error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {candidate.index_error}
            </AlertDescription>
          </Alert>
        )}

        {candidate.index_timestamp && (
          <p className="text-sm text-gray-600">
            Last indexed: {new Date(candidate.index_timestamp).toLocaleString()}
          </p>
        )}

        {candidate.resume_normalized_text && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Indexed content length:</p>
            <p className="text-sm font-medium">{candidate.resume_normalized_text.length} characters</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleIndex}
          disabled={indexing || !candidate.resume_url}
          className="w-full"
          variant="outline"
        >
          {indexing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Indexing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              {candidate.index_status === 'success' ? 'Re-index Resume' : 'Index Resume'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}