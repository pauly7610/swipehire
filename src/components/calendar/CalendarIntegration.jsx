import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, CheckCircle2, XCircle, Loader2, 
  AlertTriangle, ExternalLink, RefreshCw
} from 'lucide-react';

export default function CalendarIntegration({ userType = 'candidate' }) {
  const [loading, setLoading] = useState(false);
  const [backendEnabled, setBackendEnabled] = useState(false);
  const [connectedCalendars, setConnectedCalendars] = useState([]);

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    // Check if backend functions are enabled
    // This is a placeholder - the actual check would depend on your backend setup
    setBackendEnabled(false);
  };

  const connectCalendar = async (provider) => {
    if (!backendEnabled) {
      alert('Backend functions must be enabled first. Please enable them in your app settings.');
      return;
    }

    setLoading(true);
    try {
      // This would use the OAuth connector once backend functions are enabled
      // const url = await base44.connectors.getAuthorizationURL('googlecalendar');
      // window.location.href = url;
      
      alert('Calendar integration requires backend functions to be enabled. Please enable backend functions in your app settings.');
    } catch (error) {
      console.error('Failed to connect calendar:', error);
    }
    setLoading(false);
  };

  const disconnectCalendar = async (provider) => {
    setLoading(true);
    try {
      // Remove calendar connection
      setConnectedCalendars(connectedCalendars.filter(c => c !== provider));
    } catch (error) {
      console.error('Failed to disconnect calendar:', error);
    }
    setLoading(false);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Calendar Integrations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Backend Functions Warning */}
        {!backendEnabled && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Backend Functions Required:</strong> Calendar integrations require backend functions to be enabled. 
              Please enable them in your app settings dashboard to use this feature.
            </AlertDescription>
          </Alert>
        )}

        <p className="text-gray-600 mb-6">
          Connect your calendar to automatically sync interview schedules and availability.
        </p>

        {/* Available Integrations */}
        <div className="space-y-4">
          {/* Google Calendar */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Google Calendar</h3>
                <p className="text-sm text-gray-500">Sync with your Google Calendar</p>
              </div>
            </div>
            {connectedCalendars.includes('google') ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnectCalendar('google')}
                  disabled={loading}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => connectCalendar('google')}
                disabled={loading || !backendEnabled}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Connect'
                )}
              </Button>
            )}
          </div>

          {/* Microsoft Outlook - Coming Soon */}
          <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Microsoft Outlook</h3>
                <p className="text-sm text-gray-500">Sync with Outlook Calendar</p>
              </div>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Benefits of Calendar Integration:</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Automatically block time for confirmed interviews</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Share your real availability when scheduling</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Get reminders for upcoming interviews</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Avoid double-booking conflicts</span>
            </li>
          </ul>
        </div>

        {/* Setup Instructions */}
        {!backendEnabled && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold text-gray-900 mb-2">Setup Instructions:</h4>
            <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
              <li>Enable backend functions in your app settings</li>
              <li>Configure the Google Calendar connector with appropriate scopes</li>
              <li>Return here and click "Connect" to authorize</li>
              <li>Grant calendar access permissions</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}