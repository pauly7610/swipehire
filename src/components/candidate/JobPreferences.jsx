import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Target, MapPin, Briefcase, TrendingUp } from 'lucide-react';
import LocationSelect from '@/components/shared/LocationSelect';
import IndustrySelect from '@/components/shared/IndustrySelect';
import JobTitleSelect from '@/components/shared/JobTitleSelect';

export default function JobPreferences({ candidate, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [preferences, setPreferences] = useState({
    target_job_titles: candidate?.target_job_titles || [],
    target_industries: candidate?.target_industries || [],
    preferred_locations: candidate?.preferred_locations || [],
    target_seniority: candidate?.target_seniority || 'mid',
    job_search_status: candidate?.job_search_status || 'actively_looking',
    email_frequency: candidate?.email_frequency || 'relevant_only'
  });
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const handleSave = async () => {
    await onUpdate(preferences);
    setEditing(false);
  };

  const addTitle = () => {
    if (newTitle && !preferences.target_job_titles.includes(newTitle)) {
      setPreferences({
        ...preferences,
        target_job_titles: [...preferences.target_job_titles, newTitle]
      });
      setNewTitle('');
    }
  };

  const removeTitle = (title) => {
    setPreferences({
      ...preferences,
      target_job_titles: preferences.target_job_titles.filter(t => t !== title)
    });
  };

  const addLocation = () => {
    if (newLocation && !preferences.preferred_locations.includes(newLocation)) {
      setPreferences({
        ...preferences,
        preferred_locations: [...preferences.preferred_locations, newLocation]
      });
      setNewLocation('');
    }
  };

  const removeLocation = (location) => {
    setPreferences({
      ...preferences,
      preferred_locations: preferences.preferred_locations.filter(l => l !== location)
    });
  };

  const addIndustry = (industry) => {
    if (industry && !preferences.target_industries.includes(industry)) {
      setPreferences({
        ...preferences,
        target_industries: [...preferences.target_industries, industry]
      });
    }
  };

  const removeIndustry = (industry) => {
    setPreferences({
      ...preferences,
      target_industries: preferences.target_industries.filter(i => i !== industry)
    });
  };

  if (!editing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-pink-500" />
                Job Alert Preferences
              </CardTitle>
              <CardDescription>Control what jobs you get notified about</CardDescription>
            </div>
            <Button onClick={() => setEditing(true)} variant="outline" size="sm">
              Edit Preferences
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Target Roles</Label>
            <div className="flex flex-wrap gap-2">
              {preferences.target_job_titles.length > 0 ? (
                preferences.target_job_titles.map((title, i) => (
                  <Badge key={i} variant="secondary">{title}</Badge>
                ))
              ) : (
                <p className="text-sm text-gray-400">No target roles set</p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Industries</Label>
            <div className="flex flex-wrap gap-2">
              {preferences.target_industries.length > 0 ? (
                preferences.target_industries.map((industry, i) => (
                  <Badge key={i} variant="secondary">{industry}</Badge>
                ))
              ) : (
                <p className="text-sm text-gray-400">Any industry</p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Preferred Locations</Label>
            <div className="flex flex-wrap gap-2">
              {preferences.preferred_locations.length > 0 ? (
                preferences.preferred_locations.map((location, i) => (
                  <Badge key={i} variant="secondary">{location}</Badge>
                ))
              ) : (
                <p className="text-sm text-gray-400">Any location</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <Label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Status</Label>
              <p className="text-sm font-medium capitalize">{preferences.job_search_status?.replace('_', ' ')}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Email Frequency</Label>
              <p className="text-sm font-medium capitalize">{preferences.email_frequency?.replace('_', ' ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-pink-500" />
          Edit Job Alert Preferences
        </CardTitle>
        <CardDescription>We'll send you relevant opportunities based on these preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Job Titles */}
        <div>
          <Label className="mb-2">Target Job Titles</Label>
          <div className="flex gap-2 mb-2">
            <JobTitleSelect
              value={newTitle}
              onChange={setNewTitle}
              placeholder="Add job title..."
              industry={preferences.target_industries[0]}
            />
            <Button onClick={addTitle} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferences.target_job_titles.map((title, i) => (
              <Badge key={i} className="bg-pink-100 text-pink-700 pr-1">
                {title}
                <button onClick={() => removeTitle(title)} className="ml-1 hover:bg-pink-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Target Industries */}
        <div>
          <Label className="mb-2">Industries</Label>
          <IndustrySelect
            value=""
            onChange={addIndustry}
            placeholder="Add industry..."
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {preferences.target_industries.map((industry, i) => (
              <Badge key={i} className="bg-blue-100 text-blue-700 pr-1">
                {industry}
                <button onClick={() => removeIndustry(industry)} className="ml-1 hover:bg-blue-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Preferred Locations */}
        <div>
          <Label className="mb-2">Preferred Locations</Label>
          <div className="flex gap-2 mb-2">
            <LocationSelect
              value={newLocation}
              onChange={setNewLocation}
              placeholder="Add location..."
            />
            <Button onClick={addLocation} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferences.preferred_locations.map((location, i) => (
              <Badge key={i} className="bg-purple-100 text-purple-700 pr-1">
                {location}
                <button onClick={() => removeLocation(location)} className="ml-1 hover:bg-purple-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Seniority Level */}
        <div>
          <Label className="mb-2">Target Seniority Level</Label>
          <Select value={preferences.target_seniority} onValueChange={(v) => setPreferences({...preferences, target_seniority: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entry Level</SelectItem>
              <SelectItem value="mid">Mid Level</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Job Search Status */}
        <div>
          <Label className="mb-2">Current Status</Label>
          <Select value={preferences.job_search_status} onValueChange={(v) => setPreferences({...preferences, job_search_status: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="actively_looking">Actively Looking</SelectItem>
              <SelectItem value="passively_open">Passively Open</SelectItem>
              <SelectItem value="not_looking">Not Looking</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Email Frequency */}
        <div>
          <Label className="mb-2">Email Frequency</Label>
          <Select value={preferences.email_frequency} onValueChange={(v) => setPreferences({...preferences, email_frequency: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevant_only">Relevant Only (Recommended)</SelectItem>
              <SelectItem value="daily_digest">Daily Digest</SelectItem>
              <SelectItem value="weekly_digest">Weekly Digest</SelectItem>
              <SelectItem value="never">Never (Opt Out)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Max 2 emails per week for relevant roles
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={handleSave} className="flex-1 swipe-gradient text-white">
            Save Preferences
          </Button>
          <Button onClick={() => setEditing(false)} variant="outline">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}