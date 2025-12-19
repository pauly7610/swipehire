import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { X, Plus, Filter, Save, Star, Clock, Search } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function AdvancedSearchFilters({ filters, onFiltersChange, onSaveSearch }) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [savedSearches, setSavedSearches] = useState([]);

  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const addSkillFilter = (skill) => {
    if (!skill.trim()) return;
    const skills = filters.skills || [];
    if (!skills.includes(skill.trim())) {
      updateFilter('skills', [...skills, skill.trim()]);
    }
  };

  const removeSkillFilter = (skill) => {
    updateFilter('skills', (filters.skills || []).filter(s => s !== skill));
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) return;
    const saved = {
      id: Date.now().toString(),
      name: searchName,
      filters: { ...filters },
      timestamp: new Date().toISOString()
    };
    setSavedSearches([saved, ...savedSearches]);
    localStorage.setItem('ats_saved_searches', JSON.stringify([saved, ...savedSearches]));
    setSearchName('');
    setShowSaveDialog(false);
  };

  const loadSavedSearch = (search) => {
    onFiltersChange(search.filters);
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('ats_saved_searches');
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  }, []);

  const clearAllFilters = () => {
    onFiltersChange({
      skills: [],
      location: '',
      experienceLevel: '',
      experienceYearsMin: 0,
      experienceYearsMax: 20,
      hasResume: false,
      hasVideo: false,
      salaryMin: 0,
      salaryMax: 500000,
      educationLevel: ''
    });
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(!showSaveDialog)}
              className="text-pink-600 border-pink-200 hover:bg-pink-50"
            >
              <Save className="w-4 h-4 mr-1" />
              Save Search
            </Button>
          </div>
        </div>

        {/* Save Search Dialog */}
        {showSaveDialog && (
          <div className="mb-4 p-3 bg-pink-50 border border-pink-200 rounded-lg">
            <Label className="text-sm text-gray-700 mb-2 block">Search Name</Label>
            <div className="flex gap-2">
              <Input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g., Senior React Developers in NYC"
                className="flex-1"
              />
              <Button onClick={handleSaveSearch} className="swipe-gradient text-white">
                Save
              </Button>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <div className="mb-4">
            <Label className="text-sm text-gray-700 mb-2 block flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              Saved Searches
            </Label>
            <div className="flex flex-wrap gap-2">
              {savedSearches.map(search => (
                <button
                  key={search.id}
                  onClick={() => loadSavedSearch(search)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-sm hover:bg-yellow-100 transition-colors"
                >
                  <Clock className="w-3 h-3 text-yellow-600" />
                  <span className="text-yellow-900 font-medium">{search.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Skills Filter */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left">
              <Label className="text-sm font-semibold text-gray-700">Skills</Label>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add skill (e.g., React, Python)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addSkillFilter(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(filters.skills || []).map(skill => (
                    <Badge key={skill} className="bg-pink-100 text-pink-700 pl-2 pr-1 py-1">
                      {skill}
                      <button onClick={() => removeSkillFilter(skill)} className="ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Location Filter */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left">
              <Label className="text-sm font-semibold text-gray-700">Location</Label>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Input
                value={filters.location || ''}
                onChange={(e) => updateFilter('location', e.target.value)}
                placeholder="City, State, or Remote"
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Experience Level */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left">
              <Label className="text-sm font-semibold text-gray-700">Experience Level</Label>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Select value={filters.experienceLevel || ''} onValueChange={(v) => updateFilter('experienceLevel', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Any level</SelectItem>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </CollapsibleContent>
          </Collapsible>

          {/* Years of Experience */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left">
              <Label className="text-sm font-semibold text-gray-700">Years of Experience</Label>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{filters.experienceYearsMin || 0} years</span>
                  <span>{filters.experienceYearsMax || 20}+ years</span>
                </div>
                <Slider
                  value={[filters.experienceYearsMin || 0, filters.experienceYearsMax || 20]}
                  onValueChange={([min, max]) => {
                    updateFilter('experienceYearsMin', min);
                    updateFilter('experienceYearsMax', max);
                  }}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Salary Expectations */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left">
              <Label className="text-sm font-semibold text-gray-700">Salary Range</Label>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>${(filters.salaryMin || 0).toLocaleString()}</span>
                  <span>${(filters.salaryMax || 500000).toLocaleString()}+</span>
                </div>
                <Slider
                  value={[filters.salaryMin || 0, filters.salaryMax || 500000]}
                  onValueChange={([min, max]) => {
                    updateFilter('salaryMin', min);
                    updateFilter('salaryMax', max);
                  }}
                  max={500000}
                  step={5000}
                  className="w-full"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Education Level */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left">
              <Label className="text-sm font-semibold text-gray-700">Education</Label>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Select value={filters.educationLevel || ''} onValueChange={(v) => updateFilter('educationLevel', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any education" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Any education</SelectItem>
                  <SelectItem value="high_school">High School</SelectItem>
                  <SelectItem value="associate">Associate Degree</SelectItem>
                  <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                  <SelectItem value="master">Master's Degree</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                </SelectContent>
              </Select>
            </CollapsibleContent>
          </Collapsible>

          {/* Additional Filters */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left">
              <Label className="text-sm font-semibold text-gray-700">Additional</Label>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasResume || false}
                    onChange={(e) => updateFilter('hasResume', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">Has Resume</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasVideo || false}
                    onChange={(e) => updateFilter('hasVideo', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">Has Video Intro</span>
                </label>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Active Filters Count */}
        {Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : true)) && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-pink-600">
                {Object.entries(filters).filter(([k, v]) => 
                  v && (Array.isArray(v) ? v.length > 0 : v !== '' && v !== 0 && v !== false)
                ).length}
              </span>{' '}
              active filters
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}