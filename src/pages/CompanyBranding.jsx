import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Building2, Upload, Globe, MapPin, Users, Loader2, 
  Plus, X, Palette, Eye, CheckCircle, Sparkles, Image, Video,
  Quote, UserPlus, Star, Linkedin, ExternalLink, Trash2
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
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState({ name: '', role: '', photo_url: '', linkedin_url: '' });
  const [newTestimonial, setNewTestimonial] = useState({ quote: '', author: '', role: '' });
  const [newValue, setNewValue] = useState({ title: '', description: '' });
  const [editData, setEditData] = useState({
    name: '',
    logo_url: '',
    cover_image_url: '',
    description: '',
    mission: '',
    industry: '',
    location: '',
    website: '',
    linkedin_url: '',
    size: '',
    founded_year: null,
    culture_traits: [],
    benefits: [],
    values: [],
    team_members: [],
    media_gallery: [],
    testimonials: [],
    office_perks: []
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
          cover_image_url: companyData.cover_image_url || '',
          description: companyData.description || '',
          mission: companyData.mission || '',
          industry: companyData.industry || '',
          location: companyData.location || '',
          website: companyData.website || '',
          linkedin_url: companyData.linkedin_url || '',
          size: companyData.size || '',
          founded_year: companyData.founded_year || null,
          culture_traits: companyData.culture_traits || [],
          benefits: companyData.benefits || [],
          values: companyData.values || [],
          team_members: companyData.team_members || [],
          media_gallery: companyData.media_gallery || [],
          testimonials: companyData.testimonials || [],
          office_perks: companyData.office_perks || []
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

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setEditData({ ...editData, cover_image_url: file_url });
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const type = file.type.startsWith('video') ? 'video' : 'image';
    setEditData({ 
      ...editData, 
      media_gallery: [...(editData.media_gallery || []), { type, url: file_url, caption: '' }] 
    });
  };

  const handleTeamPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setNewTeamMember({ ...newTeamMember, photo_url: file_url });
  };

  const addTeamMember = () => {
    if (newTeamMember.name && newTeamMember.role) {
      setEditData({ ...editData, team_members: [...(editData.team_members || []), newTeamMember] });
      setNewTeamMember({ name: '', role: '', photo_url: '', linkedin_url: '' });
      setShowTeamModal(false);
    }
  };

  const removeTeamMember = (index) => {
    setEditData({ ...editData, team_members: editData.team_members.filter((_, i) => i !== index) });
  };

  const addTestimonial = () => {
    if (newTestimonial.quote && newTestimonial.author) {
      setEditData({ ...editData, testimonials: [...(editData.testimonials || []), newTestimonial] });
      setNewTestimonial({ quote: '', author: '', role: '' });
      setShowTestimonialModal(false);
    }
  };

  const removeTestimonial = (index) => {
    setEditData({ ...editData, testimonials: editData.testimonials.filter((_, i) => i !== index) });
  };

  const addValue = () => {
    if (newValue.title) {
      setEditData({ ...editData, values: [...(editData.values || []), newValue] });
      setNewValue({ title: '', description: '' });
      setShowValueModal(false);
    }
  };

  const removeValue = (index) => {
    setEditData({ ...editData, values: editData.values.filter((_, i) => i !== index) });
  };

  const removeMedia = (index) => {
    setEditData({ ...editData, media_gallery: editData.media_gallery.filter((_, i) => i !== index) });
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
          <div className="flex gap-2">
            <Link to={createPageUrl('CompanyProfile')}>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" /> Preview
              </Button>
            </Link>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="swipe-gradient text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Cover Image */}
          <Card className="overflow-hidden">
            <div className="relative h-32 bg-gradient-to-r from-pink-500 to-orange-500">
              {editData.cover_image_url ? (
                <img src={editData.cover_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/80 text-sm">Add a cover image</p>
                </div>
              )}
              <label className="absolute bottom-2 right-2 cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                <Button size="sm" variant="secondary" asChild>
                  <span><Image className="w-4 h-4 mr-1" /> {editData.cover_image_url ? 'Change' : 'Add'} Cover</span>
                </Button>
              </label>
            </div>
          </Card>

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

              {/* LinkedIn & Founded */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </Label>
                  <Input
                    value={editData.linkedin_url}
                    onChange={(e) => setEditData({ ...editData, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/company/..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Founded Year</Label>
                  <Input
                    type="number"
                    value={editData.founded_year || ''}
                    onChange={(e) => setEditData({ ...editData, founded_year: parseInt(e.target.value) || null })}
                    placeholder="e.g., 2020"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description & Mission */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-pink-500" />
                About Your Company
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Company Description</Label>
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  placeholder="Tell candidates what makes your company special..."
                  className="mt-1 min-h-[100px]"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <Star className="w-4 h-4" /> Mission Statement
                </Label>
                <Textarea
                  value={editData.mission}
                  onChange={(e) => setEditData({ ...editData, mission: e.target.value })}
                  placeholder="What is your company's mission?"
                  className="mt-1"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Company Values */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-pink-500" />
                Company Values
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editData.values?.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {editData.values.map((value, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{value.title}</h4>
                        <p className="text-gray-500 text-sm">{value.description}</p>
                      </div>
                      <button onClick={() => removeValue(i)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" onClick={() => setShowValueModal(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Value
              </Button>
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

          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-500" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editData.team_members?.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {editData.team_members.map((member, i) => (
                    <div key={i} className="text-center relative group">
                      <button 
                        onClick={() => removeTeamMember(i)} 
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} className="w-16 h-16 rounded-xl object-cover mx-auto mb-2" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center mx-auto mb-2 text-white font-bold">
                          {member.name?.charAt(0)}
                        </div>
                      )}
                      <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                      <p className="text-gray-500 text-xs">{member.role}</p>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" onClick={() => setShowTeamModal(true)}>
                <UserPlus className="w-4 h-4 mr-1" /> Add Team Member
              </Button>
            </CardContent>
          </Card>

          {/* Media Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Image className="w-5 h-5 text-pink-500" />
                Office Photos & Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editData.media_gallery?.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                  {editData.media_gallery.map((item, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                      {item.type === 'video' ? (
                        <video src={item.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      )}
                      <button 
                        onClick={() => removeMedia(i)} 
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                <Button variant="outline" asChild>
                  <span><Plus className="w-4 h-4 mr-1" /> Add Photo/Video</span>
                </Button>
              </label>
            </CardContent>
          </Card>

          {/* Testimonials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Quote className="w-5 h-5 text-pink-500" />
                Employee Testimonials
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editData.testimonials?.length > 0 && (
                <div className="space-y-3 mb-4">
                  {editData.testimonials.map((t, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-start justify-between">
                      <div>
                        <p className="text-gray-700 italic text-sm">"{t.quote}"</p>
                        <p className="text-gray-500 text-xs mt-1">— {t.author}, {t.role}</p>
                      </div>
                      <button onClick={() => removeTestimonial(i)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" onClick={() => setShowTestimonialModal(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Testimonial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Team Member Modal */}
      <Dialog open={showTeamModal} onOpenChange={setShowTeamModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <label className="cursor-pointer">
                {newTeamMember.photo_url ? (
                  <img src={newTeamMember.photo_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleTeamPhotoUpload} />
              </label>
            </div>
            <Input
              placeholder="Name"
              value={newTeamMember.name}
              onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
            />
            <Input
              placeholder="Role / Title"
              value={newTeamMember.role}
              onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
            />
            <Input
              placeholder="LinkedIn URL (optional)"
              value={newTeamMember.linkedin_url}
              onChange={(e) => setNewTeamMember({ ...newTeamMember, linkedin_url: e.target.value })}
            />
            <Button onClick={addTeamMember} className="w-full swipe-gradient text-white">
              Add Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Testimonial Modal */}
      <Dialog open={showTestimonialModal} onOpenChange={setShowTestimonialModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee Testimonial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="What does this employee say about working here?"
              value={newTestimonial.quote}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, quote: e.target.value })}
              rows={3}
            />
            <Input
              placeholder="Employee Name"
              value={newTestimonial.author}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, author: e.target.value })}
            />
            <Input
              placeholder="Their Role"
              value={newTestimonial.role}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
            />
            <Button onClick={addTestimonial} className="w-full swipe-gradient text-white">
              Add Testimonial
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Value Modal */}
      <Dialog open={showValueModal} onOpenChange={setShowValueModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Company Value</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Value Title (e.g., Innovation)"
              value={newValue.title}
              onChange={(e) => setNewValue({ ...newValue, title: e.target.value })}
            />
            <Textarea
              placeholder="Description of this value..."
              value={newValue.description}
              onChange={(e) => setNewValue({ ...newValue, description: e.target.value })}
              rows={2}
            />
            <Button onClick={addValue} className="w-full swipe-gradient text-white">
              Add Value
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}