import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, Upload, Globe, MapPin, Users, Loader2, 
  Plus, X, Palette, Eye, CheckCircle, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

const CULTURE_TRAITS = [
  'Innovative', 'Collaborative', 'Fast-paced', 'Work-life balance', 
  'Remote-first', 'Diverse & Inclusive', 'Growth-focused', 'Startup culture',
  'Corporate', 'Flexible hours', 'Mission-driven', 'Data-driven'
];

const BENEFITS_SUGGESTIONS = [
  'Health Insurance', '401k Matching', 'Unlimited PTO', 'Remote Work',
  'Stock Options', 'Learning Budget', 'Gym Membership', 'Free Lunch',
  'Parental Leave', 'Mental Health Support', 'Home Office Stipend', 'Team Events'
];

export default function CompanyBranding() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBenefit, setNewBenefit] = useState('');
  const [editData, setEditData] = useState({
    name: '',
    logo_url: '',
    description: '',
    industry: '',
    location: '',
    website: '',
    size: '',
    culture_traits: [],
    benefits: []
  });

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      const user = await base44.auth.me();
      const [companyData] = await base44.entities.Company.filter({ user_id: user.id });
      if (companyData) {
        setCompany(companyData);
        setEditData({
          name: companyData.name || '',
          logo_url: companyData.logo_url || '',
          description: companyData.description || '',
          industry: companyData.industry || '',
          location: companyData.location || '',
          website: companyData.website || '',
          size: companyData.size || '',
          culture_traits: companyData.culture_traits || [],
          benefits: companyData.benefits || []
        });
      }
    } catch (error) {
      console.error('Failed to load company:', error);
    }
    setLoading(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setEditData({ ...editData, logo_url: file_url });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Company.update(company.id, editData);
      setCompany({ ...company, ...editData });
    } catch (error) {
      console.error('Failed to save:', error);
    }
    setSaving(false);
  };

  const toggleCultureTrait = (trait) => {
    const current = editData.culture_traits || [];
    if (current.includes(trait)) {
      setEditData({ ...editData, culture_traits: current.filter(t => t !== trait) });
    } else {
      setEditData({ ...editData, culture_traits: [...current, trait] });
    }
  };

  const addBenefit = (benefit) => {
    if (benefit.trim() && !editData.benefits?.includes(benefit.trim())) {
      setEditData({ ...editData, benefits: [...(editData.benefits || []), benefit.trim()] });
      setNewBenefit('');
    }
  };

  const removeBenefit = (benefit) => {
    setEditData({ ...editData, benefits: editData.benefits.filter(b => b !== benefit) });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Company Branding</h1>
            <p className="text-gray-500">Customize how candidates see your company</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="swipe-gradient text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <div className="space-y-6">
          {/* Logo & Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-pink-500" />
                Company Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="flex items-center gap-6">
                <label className="cursor-pointer group">
                  {editData.logo_url ? (
                    <img 
                      src={editData.logo_url} 
                      alt="Logo" 
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-200 group-hover:border-pink-500 transition-colors"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-pink-500 transition-colors">
                      <Upload className="w-8 h-8 text-pink-400" />
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
                <div>
                  <h4 className="font-medium text-gray-900">Company Logo</h4>
                  <p className="text-sm text-gray-500 mb-2">Square image, at least 200x200px</p>
                  <label>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <Button variant="outline" size="sm" asChild>
                      <span><Upload className="w-4 h-4 mr-1" /> Upload</span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Company Name */}
              <div>
                <Label>Company Name</Label>
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  placeholder="Your Company Name"
                  className="mt-1"
                />
              </div>

              {/* Industry & Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Industry</Label>
                  <Input
                    value={editData.industry}
                    onChange={(e) => setEditData({ ...editData, industry: e.target.value })}
                    placeholder="e.g., Technology, Healthcare"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Company Size</Label>
                  <Select value={editData.size} onValueChange={(v) => setEditData({ ...editData, size: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location & Website */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> Location
                  </Label>
                  <Input
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    placeholder="City, Country"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Globe className="w-4 h-4" /> Website
                  </Label>
                  <Input
                    value={editData.website}
                    onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                    placeholder="https://yourcompany.com"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-pink-500" />
                About Your Company
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Company Description</Label>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Tell candidates what makes your company special, your mission, and what it's like to work here..."
                className="mt-1 min-h-[120px]"
              />
              <p className="text-xs text-gray-400 mt-1">{editData.description?.length || 0} characters</p>
            </CardContent>
          </Card>

          {/* Culture */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5 text-pink-500" />
                Company Culture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Select traits that describe your culture</Label>
              <div className="flex flex-wrap gap-2 mt-3">
                {CULTURE_TRAITS.map(trait => (
                  <Badge
                    key={trait}
                    className={`cursor-pointer transition-all ${
                      editData.culture_traits?.includes(trait)
                        ? 'swipe-gradient text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => toggleCultureTrait(trait)}
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                Benefits & Perks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Current Benefits */}
              {editData.benefits?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {editData.benefits.map(benefit => (
                    <Badge key={benefit} className="bg-green-100 text-green-700 pr-1">
                      {benefit}
                      <button onClick={() => removeBenefit(benefit)} className="ml-1 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add Custom */}
              <div className="flex gap-2 mb-4">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Add a benefit"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit(newBenefit))}
                />
                <Button onClick={() => addBenefit(newBenefit)} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Suggestions */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Quick add:</p>
                <div className="flex flex-wrap gap-1">
                  {BENEFITS_SUGGESTIONS.filter(b => !editData.benefits?.includes(b)).slice(0, 8).map(benefit => (
                    <Badge 
                      key={benefit} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-pink-50 hover:border-pink-200"
                      onClick={() => addBenefit(benefit)}
                    >
                      + {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-orange-50">
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-4">
                {editData.logo_url ? (
                  <img src={editData.logo_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl swipe-gradient flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{editData.name || 'Company Name'}</h3>
                  <p className="text-gray-500">{editData.industry || 'Industry'} • {editData.size || 'Size'}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                    {editData.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {editData.location}</span>}
                    {editData.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {editData.website}</span>}
                  </div>
                </div>
              </div>
              {editData.description && <p className="text-gray-600 text-sm mb-4">{editData.description}</p>}
              {editData.culture_traits?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {editData.culture_traits.map(trait => (
                    <Badge key={trait} variant="secondary" className="text-xs">{trait}</Badge>
                  ))}
                </div>
              )}
              {editData.benefits?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {editData.benefits.map(benefit => (
                    <Badge key={benefit} className="bg-green-50 text-green-600 text-xs">{benefit}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}