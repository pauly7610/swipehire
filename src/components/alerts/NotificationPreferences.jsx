import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Bell, Mail, Smartphone, Pause, CheckCircle2, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NotificationPreferences({ candidateId, userId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [candidate, setCandidate] = useState(null);
  const [preferences, setPreferences] = useState({
    email_alerts_enabled: true,
    push_alerts_enabled: false,
    alert_frequency: 'instant',
    urgent_only: false,
    min_match_score: 75
  });

  useEffect(() => {
    loadPreferences();
  }, [candidateId]);

  const loadPreferences = async () => {
    try {
      const [candidateData] = await base44.entities.Candidate.filter({ id: candidateId });
      setCandidate(candidateData);
      if (candidateData?.alert_preferences) {
        setPreferences({
          email_alerts_enabled: candidateData.alert_preferences.email_alerts_enabled !== false,
          push_alerts_enabled: candidateData.alert_preferences.push_alerts_enabled || false,
          alert_frequency: candidateData.alert_preferences.alert_frequency || 'instant',
          urgent_only: candidateData.alert_preferences.urgent_only || false,
          min_match_score: candidateData.alert_preferences.min_match_score || 75
        });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
    setLoading(false);
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await base44.entities.Candidate.update(candidateId, {
        alert_preferences: {
          ...candidate.alert_preferences,
          ...preferences
        }
      });
      setTimeout(() => setSaving(false), 1000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setSaving(false);
    }
  };

  const pauseAlerts = async (hours) => {
    const pauseUntil = new Date();
    pauseUntil.setHours(pauseUntil.getHours() + hours);
    
    setSaving(true);
    try {
      await base44.entities.Candidate.update(candidateId, {
        alert_preferences: {
          ...candidate.alert_preferences,
          paused_until: pauseUntil.toISOString()
        }
      });
      setTimeout(() => {
        setSaving(false);
        loadPreferences();
      }, 1000);
    } catch (error) {
      console.error('Failed to pause alerts:', error);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
      </div>
    );
  }

  const isPaused = candidate?.alert_preferences?.paused_until && 
    new Date(candidate.alert_preferences.paused_until) > new Date();

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {isPaused ? (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <Pause className="w-5 h-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900">Alerts Paused</h3>
            <p className="text-sm text-orange-700">
              Alerts paused until {new Date(candidate.alert_preferences.paused_until).toLocaleString()}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={async () => {
                await base44.entities.Candidate.update(candidateId, {
                  alert_preferences: {
                    ...candidate.alert_preferences,
                    paused_until: null
                  }
                });
                loadPreferences();
              }}
            >
              Resume Alerts
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">Alerts Active</h3>
            <p className="text-sm text-green-700">
              You'll be notified when high-fit roles are posted
            </p>
          </div>
        </div>
      )}

      {/* Channel Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-500" />
              <div>
                <Label>Email Notifications</Label>
                <p className="text-xs text-gray-500">Receive role alerts via email</p>
              </div>
            </div>
            <Switch
              checked={preferences.email_alerts_enabled}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, email_alerts_enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-purple-500" />
              <div>
                <Label>Push Notifications</Label>
                <p className="text-xs text-gray-500">Mobile push alerts (optional)</p>
              </div>
            </div>
            <Switch
              checked={preferences.push_alerts_enabled}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, push_alerts_enabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Frequency */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Frequency</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={preferences.alert_frequency} 
            onValueChange={(value) => 
              setPreferences({ ...preferences, alert_frequency: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">Instant (as roles are posted)</SelectItem>
              <SelectItem value="weekly_digest">Weekly Digest</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-2">
            Maximum 1 email per day, 2-3 per week
          </p>
        </CardContent>
      </Card>

      {/* Match Score Threshold */}
      <Card>
        <CardHeader>
          <CardTitle>Match Score Threshold</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Minimum Match: {preferences.min_match_score}%</Label>
            </div>
            <Slider
              value={[preferences.min_match_score]}
              onValueChange={([value]) => 
                setPreferences({ ...preferences, min_match_score: value })
              }
              min={60}
              max={95}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Only notify when roles match at least {preferences.min_match_score}% of your preferences
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Urgent Only */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Filtering</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Urgent Roles Only</Label>
              <p className="text-xs text-gray-500">Only notify for high-priority, time-sensitive roles</p>
            </div>
            <Switch
              checked={preferences.urgent_only}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, urgent_only: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Pause Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pause className="w-5 h-5" />
            Pause Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">Temporarily pause all alerts</p>
          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" onClick={() => pauseAlerts(24)}>
              24 hours
            </Button>
            <Button variant="outline" onClick={() => pauseAlerts(72)}>
              3 days
            </Button>
            <Button variant="outline" onClick={() => pauseAlerts(168)}>
              1 week
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={savePreferences}
        disabled={saving}
        className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Save Preferences
          </>
        )}
      </Button>
    </div>
  );
}