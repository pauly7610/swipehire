import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Download, Sparkles, Plus, X, Loader2, 
  User, Briefcase, GraduationCap, Award, Mail, Phone, MapPin, Link as LinkIcon
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import jsPDF from 'jspdf';

export default function ResumeBuilder({ open, onOpenChange, candidate, onResumeSaved }) {
  const [loading, setLoading] = useState(false);
  const [resumeData, setResumeData] = useState({
    fullName: candidate?.user?.full_name || '',
    email: candidate?.user?.email || '',
    phone: '',
    location: candidate?.location || '',
    headline: candidate?.headline || '',
    summary: candidate?.bio || '',
    experience: candidate?.experience || [],
    education: candidate?.education || [],
    skills: candidate?.skills || [],
    certifications: candidate?.certifications || [],
    portfolio_links: candidate?.portfolio_links || []
  });
  const [aiImproving, setAiImproving] = useState(false);
  const [template, setTemplate] = useState('professional');

  const improveWithAI = async () => {
    setAiImproving(true);
    try {
      const prompt = `I need you to improve this resume content. Make it more professional, impactful, and ATS-friendly.

Current Summary: ${resumeData.summary}
Job Title: ${resumeData.headline}
Experience: ${JSON.stringify(resumeData.experience)}

Please provide:
1. An improved professional summary (3-4 sentences)
2. Enhanced experience descriptions with action verbs and quantifiable achievements

Return as JSON: {
  "summary": "improved summary",
  "experience": [{"title": "...", "company": "...", "start_date": "...", "end_date": "...", "description": "improved description"}]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            experience: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  company: { type: 'string' },
                  start_date: { type: 'string' },
                  end_date: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setResumeData({
        ...resumeData,
        summary: result.summary,
        experience: result.experience
      });
    } catch (error) {
      console.error('AI improvement failed:', error);
    }
    setAiImproving(false);
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(resumeData.fullName, 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(resumeData.headline, 20, yPos);
      yPos += 8;

      // Contact Info
      doc.setFontSize(9);
      doc.text(`${resumeData.email} | ${resumeData.phone} | ${resumeData.location}`, 20, yPos);
      yPos += 15;

      // Summary
      if (resumeData.summary) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PROFESSIONAL SUMMARY', 20, yPos);
        yPos += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const summaryLines = doc.splitTextToSize(resumeData.summary, 170);
        doc.text(summaryLines, 20, yPos);
        yPos += summaryLines.length * 5 + 10;
      }

      // Skills
      if (resumeData.skills.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('SKILLS', 20, yPos);
        yPos += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const skillsText = resumeData.skills.join(' • ');
        const skillsLines = doc.splitTextToSize(skillsText, 170);
        doc.text(skillsLines, 20, yPos);
        yPos += skillsLines.length * 5 + 10;
      }

      // Experience
      if (resumeData.experience.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('EXPERIENCE', 20, yPos);
        yPos += 7;

        resumeData.experience.forEach((exp) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(exp.title, 20, yPos);
          yPos += 6;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.text(`${exp.company} | ${exp.start_date} - ${exp.end_date || 'Present'}`, 20, yPos);
          yPos += 6;

          if (exp.description) {
            doc.setFont('helvetica', 'normal');
            const descLines = doc.splitTextToSize(exp.description, 170);
            doc.text(descLines, 20, yPos);
            yPos += descLines.length * 5 + 8;
          }
        });
      }

      // Education
      if (resumeData.education.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('EDUCATION', 20, yPos);
        yPos += 7;

        resumeData.education.forEach((edu) => {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(`${edu.degree} in ${edu.major}`, 20, yPos);
          yPos += 6;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`${edu.university} | ${edu.graduation_year}`, 20, yPos);
          yPos += 8;
        });
      }

      // Save PDF
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], `${resumeData.fullName.replace(/\s/g, '_')}_Resume.pdf`, { type: 'application/pdf' });
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });
      
      onResumeSaved?.(file_url);
      onOpenChange(false);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-pink-500" />
            SwipeHire Resume Builder
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="edit" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full">
            <TabsTrigger value="edit" className="flex-1">Edit Content</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 overflow-y-auto space-y-4 mt-4">
            {/* AI Assistant */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      AI Resume Enhancement
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Let AI improve your resume content to make it more professional and ATS-friendly</p>
                  </div>
                  <Button
                    onClick={improveWithAI}
                    disabled={aiImproving}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  >
                    {aiImproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {aiImproving ? 'Improving...' : 'Improve with AI'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-pink-500" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={resumeData.fullName}
                      onChange={(e) => setResumeData({ ...resumeData, fullName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={resumeData.phone}
                      onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={resumeData.email} disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={resumeData.location}
                      onChange={(e) => setResumeData({ ...resumeData, location: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Professional Headline</Label>
                  <Input
                    value={resumeData.headline}
                    onChange={(e) => setResumeData({ ...resumeData, headline: e.target.value })}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-semibold">Professional Summary</h3>
                <Textarea
                  value={resumeData.summary}
                  onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                  placeholder="Write a compelling summary that highlights your experience and achievements..."
                  rows={5}
                />
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-semibold">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills.map((skill, i) => (
                    <Badge key={i} className="bg-pink-100 text-pink-700">
                      {skill}
                      <button onClick={() => setResumeData({ ...resumeData, skills: resumeData.skills.filter((_, idx) => idx !== i) })}>
                        <X className="w-3 h-3 ml-1" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Experience - showing existing ones */}
            {resumeData.experience.length > 0 && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-pink-500" />
                    Experience
                  </h3>
                  {resumeData.experience.map((exp, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{exp.title} @ {exp.company}</p>
                      <p className="text-sm text-gray-500">{exp.start_date} - {exp.end_date || 'Present'}</p>
                      {exp.description && <p className="text-sm text-gray-600 mt-2">{exp.description}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-y-auto mt-4">
            <Card className="max-w-3xl mx-auto">
              <CardContent className="p-8 font-serif">
                {/* Resume Preview */}
                <div className="space-y-6">
                  <div className="text-center border-b pb-4">
                    <h1 className="text-3xl font-bold text-gray-900">{resumeData.fullName}</h1>
                    <p className="text-lg text-gray-600 mt-1">{resumeData.headline}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {resumeData.email} | {resumeData.phone} | {resumeData.location}
                    </p>
                  </div>

                  {resumeData.summary && (
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-2">PROFESSIONAL SUMMARY</h2>
                      <p className="text-gray-700 leading-relaxed">{resumeData.summary}</p>
                    </div>
                  )}

                  {resumeData.skills.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-2">SKILLS</h2>
                      <p className="text-gray-700">{resumeData.skills.join(' • ')}</p>
                    </div>
                  )}

                  {resumeData.experience.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-3">EXPERIENCE</h2>
                      <div className="space-y-4">
                        {resumeData.experience.map((exp, i) => (
                          <div key={i}>
                            <h3 className="font-bold text-gray-900">{exp.title}</h3>
                            <p className="text-gray-600 italic">{exp.company} | {exp.start_date} - {exp.end_date || 'Present'}</p>
                            {exp.description && <p className="text-gray-700 mt-1">{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resumeData.education.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-3">EDUCATION</h2>
                      <div className="space-y-3">
                        {resumeData.education.map((edu, i) => (
                          <div key={i}>
                            <h3 className="font-bold text-gray-900">{edu.degree} in {edu.major}</h3>
                            <p className="text-gray-600">{edu.university} | {edu.graduation_year}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={generatePDF} disabled={loading} className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            {loading ? 'Generating...' : 'Generate & Save Resume'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}