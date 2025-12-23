import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Briefcase, MapPin, Building2, DollarSign, Shield, Bell, AlertCircle } from 'lucide-react';

const ROLE_TYPES = [
  'Software Engineer', 'Product Manager', 'Data Analyst', 'UX Designer', 'Sales Executive',
  'Marketing Manager', 'DevOps Engineer', 'Customer Success', 'HR Manager', 'Financial Analyst'
];

const SENIORITY_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead/Staff' },
  { value: 'executive', label: 'Executive' }
];

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-time', icon: Briefcase },
  { value: 'contract', label: 'Contract', icon: Briefcase },
  { value: 'contract_to_hire', label: 'Contract-to-hire', icon: Briefcase }
];

const WORK_LOCATIONS = [
  { value: 'remote', label: 'Remote', icon: MapPin },
  { value: 'hybrid', label: 'Hybrid', icon: MapPin },
  { value: 'onsite', label: 'Onsite', icon: MapPin }
];

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 
  'Manufacturing', 'Marketing', 'Real Estate', 'Consulting', 'Government'
];

export default function ProfileInterestSelector({ 
  initialPreferences = {}, 
  onChange,
  isOnboarding = false 
}) {
  const [preferences, setPreferences] = useState({
    role_types: initialPreferences.role_types || [],
    target_seniority_levels: initialPreferences.target_seniority_levels || [],
    employment_types: initialPreferences.employment_types || [],
    work_locations: initialPreferences.work_locations || [],
    target_industries: initialPreferences.target_industries || [],
    compensation_range: initialPreferences.compensation_range || { min: null, max: null },
    requires_clearance: initialPreferences.requires_clearance || false,
    email_alerts_enabled: initialPreferences.email_alerts_enabled !== false,
    min_match_score: initialPreferences.min_match_score || 75
  });

  const updatePreference = (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    onChange?.(updated);
  };

  const toggleArrayItem = (key, item) => {
    const current = preferences[key] || [];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    updatePreference(key, updated);
  };

  return (
    <div className="space-y-6">
      {isOnboarding && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">You'll only be notified for roles matching these preferences</h3>
            <p className="text-sm text-gray-600">Select your interests to receive high-fit role alerts</p>
          </div>
        </div>
      )}

      {/* Role Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="w-5 h-5 text-pink-500" />
            Role Types
            <span className="text-red-500 text-sm">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ROLE_TYPES.map(role => (
              <Badge
                key={role}
                variant={preferences.role_types?.includes(role) ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${
                  preferences.role_types?.includes(role)
                    ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white border-0'
                    : 'hover:border-pink-300'
                }`}
                onClick={() => toggleArrayItem('role_types', role)}
              >
                {role}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seniority Levels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Seniority Levels
            <span className="text-red-500 text-sm">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SENIORITY_LEVELS.map(level => (
              <Badge
                key={level.value}
                variant={preferences.target_seniority_levels?.includes(level.value) ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${
                  preferences.target_seniority_levels?.includes(level.value)
                    ? 'bg-purple-500 text-white border-0'
                    : 'hover:border-purple-300'
                }`}
                onClick={() => toggleArrayItem('target_seniority_levels', level.value)}
              >
                {level.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employment Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="w-5 h-5 text-blue-500" />
            Employment Type
            <span className="text-red-500 text-sm">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EMPLOYMENT_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => toggleArrayItem('employment_types', type.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  preferences.employment_types?.includes(type.value)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <type.icon className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                <p className="text-sm font-medium text-center">{type.label}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Work Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-green-500" />
            Work Location
            <span className="text-red-500 text-sm">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {WORK_LOCATIONS.map(location => (
              <button
                key={location.value}
                onClick={() => toggleArrayItem('work_locations', location.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  preferences.work_locations?.includes(location.value)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <location.icon className="w-5 h-5 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium text-center">{location.label}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Industries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-indigo-500" />
            Industry Verticals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map(industry => (
              <Badge
                key={industry}
                variant={preferences.target_industries?.includes(industry) ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${
                  preferences.target_industries?.includes(industry)
                    ? 'bg-indigo-500 text-white border-0'
                    : 'hover:border-indigo-300'
                }`}
                onClick={() => toggleArrayItem('target_industries', industry)}
              >
                {industry}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compensation Range */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5 text-yellow-500" />
            Compensation Range (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Minimum</Label>
              <Input
                type="number"
                placeholder="e.g., 80000"
                value={preferences.compensation_range?.min || ''}
                onChange={(e) => updatePreference('compensation_range', {
                  ...preferences.compensation_range,
                  min: e.target.value ? parseInt(e.target.value) : null
                })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Maximum</Label>
              <Input
                type="number"
                placeholder="e.g., 120000"
                value={preferences.compensation_range?.max || ''}
                onChange={(e) => updatePreference('compensation_range', {
                  ...preferences.compensation_range,
                  max: e.target.value ? parseInt(e.target.value) : null
                })}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-red-500" />
            Clearance / Regulated Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <button
            onClick={() => updatePreference('requires_clearance', !preferences.requires_clearance)}
            className={`w-full p-4 rounded-xl border-2 transition-all ${
              preferences.requires_clearance
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-red-500" />
                <span className="font-medium">Interested in roles requiring security clearance</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${
                preferences.requires_clearance ? 'bg-red-500 border-red-500' : 'border-gray-300'
              }`} />
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Your Alert Settings</h3>
            <p className="text-sm text-gray-600 mb-3">
              You'll receive {preferences.email_alerts_enabled ? 'email' : 'in-app'} notifications when 
              new roles match your criteria with at least {preferences.min_match_score}% match score.
            </p>
            {(preferences.role_types?.length === 0 || 
              preferences.target_seniority_levels?.length === 0 ||
              preferences.employment_types?.length === 0 ||
              preferences.work_locations?.length === 0) && (
              <p className="text-sm text-orange-600 font-medium">
                ⚠️ Please complete all required fields (marked with *) to enable alerts
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}