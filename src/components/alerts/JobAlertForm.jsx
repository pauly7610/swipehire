import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Bell, Mail, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function JobAlertForm({ alert, onSave, onCancel }) {
  const [formData, setFormData] = useState(alert || {
    name: '',
    skills: [],
    experience_level: 'any',
    job_types: [],
    locations: [],
    salary_min: '',
    notify_email: true,
    notify_in_app: true,
    frequency: 'daily',
    is_active: true
  });
  const [newSkill, setNewSkill] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestingSkills, setSuggestingSkills] = useState(false);

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const addLocation = () => {
    if (newLocation.trim() && !formData.locations.includes(newLocation.trim())) {
      setFormData({ ...formData, locations: [...formData.locations, newLocation.trim()] });
      setNewLocation('');
    }
  };

  const toggleJobType = (type) => {
    const types = formData.job_types.includes(type)
      ? formData.job_types.filter(t => t !== type)
      : [...formData.job_types, type];
    setFormData({ ...formData, job_types: types });
  };

  const suggestSkills = async () => {
    setSuggestingSkills(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on a job seeker looking for ${formData.experience_level || 'any'} level positions with these skills: ${formData.skills.join(', ') || 'not specified yet'}, suggest 6 additional relevant technical and professional skills they should consider tracking. Return only skills not already in their list.`,
        response_json_schema: {
          type: 'object',
          properties: {
            skills: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      if (result.skills) {
        const newSkills = result.skills.filter(s => !formData.skills.includes(s));
        setFormData({ ...formData, skills: [...formData.skills, ...newSkills.slice(0, 6)] });
      }
    } catch (error) {
      console.error('Failed to suggest skills:', error);
    }
    setSuggestingSkills(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    await onSave({
      ...formData,
      salary_min: parseFloat(formData.salary_min) || 0
    });
    setLoading(false);
  };

  const jobTypes = ['full-time', 'part-time', 'contract', 'internship', 'remote'];

  return (
    <Card className="p-6">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      <div className="space-y-6">
        {/* Alert Name */}
        <div>
          <Label>Alert Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Remote React Developer Jobs"
            className="mt-2 h-11"
          />
        </div>

        {/* Skills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Skills to Match</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={suggestSkills}
              disabled={suggestingSkills}
              className="text-pink-600"
            >
              {suggestingSkills ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
              AI Suggest
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <Button onClick={addSkill} className="swipe-gradient">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.skills.map((skill) => (
              <Badge key={skill} className="bg-pink-100 text-pink-700 pr-1">
                {skill}
                <button onClick={() => setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) })} className="ml-2">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <Label>Experience Level</Label>
          <Select value={formData.experience_level} onValueChange={(v) => setFormData({ ...formData, experience_level: v })}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Level</SelectItem>
              <SelectItem value="entry">Entry Level</SelectItem>
              <SelectItem value="mid">Mid Level</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Job Types */}
        <div>
          <Label>Job Types</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {jobTypes.map((type) => (
              <Badge
                key={type}
                className={`cursor-pointer capitalize ${
                  formData.job_types.includes(type)
                    ? 'swipe-gradient text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => toggleJobType(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div>
          <Label>Preferred Locations</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Add a location"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
            />
            <Button onClick={addLocation} variant="outline">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.locations.map((loc) => (
              <Badge key={loc} variant="outline" className="pr-1">
                {loc}
                <button onClick={() => setFormData({ ...formData, locations: formData.locations.filter(l => l !== loc) })} className="ml-2">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Minimum Salary */}
        <div>
          <Label>Minimum Salary (yearly)</Label>
          <div className="relative mt-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <Input
              type="number"
              value={formData.salary_min}
              onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
              placeholder="50000"
              className="pl-7"
            />
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium text-gray-900">Notification Preferences</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-gray-500" />
              <span>Email Notifications</span>
            </div>
            <Switch
              checked={formData.notify_email}
              onCheckedChange={(v) => setFormData({ ...formData, notify_email: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-500" />
              <span>In-App Notifications</span>
            </div>
            <Switch
              checked={formData.notify_in_app}
              onCheckedChange={(v) => setFormData({ ...formData, notify_in_app: v })}
            />
          </div>

          <div>
            <Label>Notification Frequency</Label>
            <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name}
            className="flex-1 swipe-gradient text-white"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Alert'}
          </Button>
        </div>
      </div>
    </Card>
  );
}