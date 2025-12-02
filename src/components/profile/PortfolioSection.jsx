import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, X, ExternalLink, Github, Linkedin, Globe, 
  Sparkles, Loader2, Image as ImageIcon, Trash2, Lightbulb
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

const LINK_TYPES = [
  { value: 'github', label: 'GitHub', icon: Github },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'website', label: 'Personal Website', icon: Globe },
  { value: 'behance', label: 'Behance', icon: Globe },
  { value: 'dribbble', label: 'Dribbble', icon: Globe },
  { value: 'other', label: 'Other', icon: ExternalLink },
];

export default function PortfolioSection({ candidate, editing, editData, setEditData }) {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestingProjects, setSuggestingProjects] = useState(false);
  const [projectSuggestions, setProjectSuggestions] = useState(null);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    url: '',
    image_url: '',
    skills_used: []
  });
  const [newLink, setNewLink] = useState({ type: 'github', url: '', label: '' });
  const [newSkill, setNewSkill] = useState('');

  const analyzeProject = async (project) => {
    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this portfolio project for a job seeker:
Title: ${project.title}
Description: ${project.description}
Skills used: ${project.skills_used?.join(', ') || 'Not specified'}
URL: ${project.url || 'Not provided'}

Provide:
1. A relevance score (0-100) for job applications
2. A brief insight (2-3 sentences) on how this project showcases the candidate's abilities and what types of jobs it would be most relevant for.`,
        response_json_schema: {
          type: 'object',
          properties: {
            relevance_score: { type: 'number' },
            insight: { type: 'string' }
          }
        }
      });

      return {
        ai_relevance_score: result.relevance_score,
        ai_insights: result.insight
      };
    } catch (error) {
      console.error('Failed to analyze project:', error);
      return {};
    } finally {
      setAnalyzing(false);
    }
  };

  const suggestProjects = async () => {
    setSuggestingProjects(true);
    try {
      const skills = editData.skills || candidate?.skills || [];
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on these skills: ${skills.join(', ')}, suggest 3 portfolio project ideas that would impress employers. For each project, provide a title, brief description, and list of skills it would demonstrate.`,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  skills: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      });
      setProjectSuggestions(result.suggestions);
    } catch (error) {
      console.error('Failed to suggest projects:', error);
    }
    setSuggestingProjects(false);
  };

  const addProject = async () => {
    const aiData = await analyzeProject(newProject);
    const projectWithAI = { ...newProject, ...aiData };
    
    setEditData({
      ...editData,
      portfolio_projects: [...(editData.portfolio_projects || []), projectWithAI]
    });
    setNewProject({ title: '', description: '', url: '', image_url: '', skills_used: [] });
    setShowProjectModal(false);
  };

  const removeProject = (index) => {
    setEditData({
      ...editData,
      portfolio_projects: editData.portfolio_projects.filter((_, i) => i !== index)
    });
  };

  const addLink = () => {
    if (newLink.url.trim()) {
      setEditData({
        ...editData,
        portfolio_links: [...(editData.portfolio_links || []), newLink]
      });
      setNewLink({ type: 'github', url: '', label: '' });
      setShowLinkModal(false);
    }
  };

  const removeLink = (index) => {
    setEditData({
      ...editData,
      portfolio_links: editData.portfolio_links.filter((_, i) => i !== index)
    });
  };

  const addProjectSkill = () => {
    if (newSkill.trim() && !newProject.skills_used.includes(newSkill.trim())) {
      setNewProject({
        ...newProject,
        skills_used: [...newProject.skills_used, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const useSuggestion = (suggestion) => {
    setNewProject({
      title: suggestion.title,
      description: suggestion.description,
      url: '',
      image_url: '',
      skills_used: suggestion.skills
    });
    setProjectSuggestions(null);
    setShowProjectModal(true);
  };

  const projects = editing ? editData.portfolio_projects : candidate?.portfolio_projects;
  const links = editing ? editData.portfolio_links : candidate?.portfolio_links;

  const getLinkIcon = (type) => {
    const linkType = LINK_TYPES.find(l => l.value === type);
    return linkType ? linkType.icon : ExternalLink;
  };

  return (
    <div className="space-y-6">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      {/* Portfolio Links */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Portfolio Links</CardTitle>
          {editing && (
            <Button variant="outline" size="sm" onClick={() => setShowLinkModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Link
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {links?.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {links.map((link, i) => {
                const Icon = getLinkIcon(link.type);
                return (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-pink-600 hover:underline"
                    >
                      {link.label || link.type}
                    </a>
                    {editing && (
                      <button onClick={() => removeLink(i)} className="text-gray-400 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No portfolio links added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Project Showcases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Project Showcases</CardTitle>
          {editing && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={suggestProjects}
                disabled={suggestingProjects}
                className="text-pink-600"
              >
                {suggestingProjects ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Lightbulb className="w-4 h-4 mr-1" />}
                AI Ideas
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowProjectModal(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Project
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* AI Suggestions */}
          {projectSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-pink-500" />
                <h4 className="font-medium text-gray-900">AI Project Suggestions</h4>
                <button onClick={() => setProjectSuggestions(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {projectSuggestions.map((suggestion, i) => (
                  <div key={i} className="bg-white rounded-lg p-3">
                    <h5 className="font-medium text-gray-900">{suggestion.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex flex-wrap gap-1">
                        {suggestion.skills?.slice(0, 3).map(skill => (
                          <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                      <Button size="sm" variant="ghost" className="text-pink-600" onClick={() => useSuggestion(suggestion)}>
                        Use This
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {projects?.length > 0 ? (
            <div className="grid gap-4">
              {projects.map((project, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border rounded-xl overflow-hidden"
                >
                  <div className="flex">
                    {project.image_url ? (
                      <img src={project.image_url} alt={project.title} className="w-32 h-32 object-cover" />
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-pink-300" />
                      </div>
                    )}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{project.title}</h4>
                          {project.url && (
                            <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 hover:underline flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> View Project
                            </a>
                          )}
                        </div>
                        {project.ai_relevance_score && (
                          <Badge className="swipe-gradient text-white">
                            {project.ai_relevance_score}% Match
                          </Badge>
                        )}
                        {editing && (
                          <button onClick={() => removeProject(i)} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.skills_used?.map(skill => (
                          <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                      {project.ai_insights && (
                        <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                          <p className="text-xs text-purple-700 flex items-start gap-1">
                            <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {project.ai_insights}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-2">No projects added yet</p>
              <p className="text-sm text-gray-400">Showcase your best work to stand out</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Link Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Portfolio Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Link Type</Label>
              <Select value={newLink.type} onValueChange={(v) => setNewLink({ ...newLink, type: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL</Label>
              <Input
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Label (optional)</Label>
              <Input
                value={newLink.label}
                onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                placeholder="My Portfolio"
                className="mt-1"
              />
            </div>
            <Button onClick={addLink} className="w-full swipe-gradient text-white">
              Add Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Project Modal */}
      <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project Title *</Label>
              <Input
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                placeholder="My Awesome Project"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="What does this project do? What problems does it solve?"
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label>Project URL</Label>
              <Input
                value={newProject.url}
                onChange={(e) => setNewProject({ ...newProject, url: e.target.value })}
                placeholder="https://github.com/..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={newProject.image_url}
                onChange={(e) => setNewProject({ ...newProject, image_url: e.target.value })}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Skills Used</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProjectSkill())}
                />
                <Button onClick={addProjectSkill} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {newProject.skills_used.map(skill => (
                  <Badge key={skill} className="bg-pink-100 text-pink-700 pr-1">
                    {skill}
                    <button 
                      onClick={() => setNewProject({
                        ...newProject,
                        skills_used: newProject.skills_used.filter(s => s !== skill)
                      })}
                      className="ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <Button 
              onClick={addProject} 
              disabled={!newProject.title || !newProject.description || analyzing}
              className="w-full swipe-gradient text-white"
            >
              {analyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing with AI...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Add & Analyze Project</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}