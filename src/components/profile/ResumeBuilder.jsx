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
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Brand colors
      const pink = [255, 0, 92];
      const orange = [255, 123, 0];
      const darkGray = [40, 40, 40];
      const medGray = [80, 80, 80];
      const lightGray = [120, 120, 120];

      // Top accent bar
      doc.setFillColor(...pink);
      doc.rect(0, 0, pageWidth, 8, 'F');
      
      // Gradient effect simulation
      doc.setFillColor(255, 60, 108);
      doc.rect(pageWidth * 0.3, 0, pageWidth * 0.4, 8, 'F');
      doc.setFillColor(...orange);
      doc.rect(pageWidth * 0.6, 0, pageWidth * 0.4, 8, 'F');

      yPos = 25;

      // Name - Large and bold
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkGray);
      doc.text(resumeData.fullName, margin, yPos);
      yPos += 8;

      // Headline with accent color
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...pink);
      doc.text(resumeData.headline, margin, yPos);
      yPos += 7;

      // Contact info row
      doc.setFontSize(9);
      doc.setTextColor(...lightGray);
      doc.text(`${resumeData.email} • ${resumeData.phone} • ${resumeData.location}`, margin, yPos);
      yPos += 12;

      // Divider line
      doc.setDrawColor(...lightGray);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Professional Summary Section
      if (resumeData.summary) {
        // Section header with color bar
        doc.setFillColor(255, 240, 245);
        doc.rect(margin - 5, yPos - 5, contentWidth + 10, 8, 'F');
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...pink);
        doc.text('PROFESSIONAL SUMMARY', margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...medGray);
        const summaryLines = doc.splitTextToSize(resumeData.summary, contentWidth);
        doc.text(summaryLines, margin, yPos);
        yPos += summaryLines.length * 5 + 12;
      }

      // Skills Section with badges
      if (resumeData.skills.length > 0) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(255, 240, 245);
        doc.rect(margin - 5, yPos - 5, contentWidth + 10, 8, 'F');
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...pink);
        doc.text('CORE COMPETENCIES', margin, yPos);
        yPos += 10;

        // Display skills as colored badges
        let xPos = margin;
        let maxRowY = yPos;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        resumeData.skills.forEach((skill) => {
          const skillWidth = doc.getTextWidth(skill) + 8;
          
          if (xPos + skillWidth > pageWidth - margin) {
            xPos = margin;
            maxRowY += 8;
          }
          
          // Skill badge background
          doc.setFillColor(255, 245, 250);
          doc.roundedRect(xPos, maxRowY - 4, skillWidth, 6, 1.5, 1.5, 'F');
          
          // Skill badge border
          doc.setDrawColor(...pink);
          doc.setLineWidth(0.3);
          doc.roundedRect(xPos, maxRowY - 4, skillWidth, 6, 1.5, 1.5, 'S');
          
          // Skill text
          doc.setTextColor(...orange);
          doc.text(skill, xPos + 4, maxRowY);
          
          xPos += skillWidth + 4;
        });
        yPos = maxRowY + 12;
      }

      // Experience Section
      if (resumeData.experience.length > 0) {
        if (yPos > 230) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(255, 240, 245);
        doc.rect(margin - 5, yPos - 5, contentWidth + 10, 8, 'F');
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...pink);
        doc.text('PROFESSIONAL EXPERIENCE', margin, yPos);
        yPos += 10;

        resumeData.experience.forEach((exp, idx) => {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }

          // Job title
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...darkGray);
          doc.text(exp.title, margin, yPos);
          yPos += 6;

          // Company name (colored)
          doc.setFontSize(11);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(...orange);
          doc.text(exp.company, margin, yPos);

          // Dates (right aligned)
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...lightGray);
          const dateText = `${exp.start_date} - ${exp.end_date || 'Present'}`;
          const dateWidth = doc.getTextWidth(dateText);
          doc.text(dateText, pageWidth - margin - dateWidth, yPos);
          yPos += 7;

          // Description with bullet points
          if (exp.description) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...medGray);
            
            const descLines = doc.splitTextToSize(exp.description, contentWidth - 6);
            descLines.forEach((line) => {
              if (yPos > 275) {
                doc.addPage();
                yPos = 20;
              }
              // Bullet point
              doc.setFillColor(...orange);
              doc.circle(margin + 2, yPos - 1.5, 1, 'F');
              
              doc.text(line, margin + 6, yPos);
              yPos += 4.5;
            });
            yPos += 6;
          }

          // Divider between experiences
          if (idx < resumeData.experience.length - 1) {
            doc.setDrawColor(240, 240, 240);
            doc.setLineWidth(0.3);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 6;
          }
        });
        yPos += 6;
      }

      // Education Section
      if (resumeData.education.length > 0) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(255, 240, 245);
        doc.rect(margin - 5, yPos - 5, contentWidth + 10, 8, 'F');
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...pink);
        doc.text('EDUCATION', margin, yPos);
        yPos += 10;

        resumeData.education.forEach((edu) => {
          if (yPos > 265) {
            doc.addPage();
            yPos = 20;
          }

          // Degree
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...darkGray);
          doc.text(`${edu.degree}${edu.major ? ' in ' + edu.major : ''}`, margin, yPos);
          yPos += 6;

          // University name
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(...orange);
          doc.text(edu.university, margin, yPos);

          // Graduation year (right aligned)
          if (edu.graduation_year) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...lightGray);
            const yearText = `Graduated ${edu.graduation_year}`;
            const yearWidth = doc.getTextWidth(yearText);
            doc.text(yearText, pageWidth - margin - yearWidth, yPos);
          }
          yPos += 6;

          // GPA if available
          if (edu.gpa) {
            doc.setFontSize(9);
            doc.setTextColor(...medGray);
            doc.text(`GPA: ${edu.gpa}`, margin, yPos);
            yPos += 5;
          }
          yPos += 5;
        });
      }

      // Certifications Section
      if (resumeData.certifications && resumeData.certifications.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(255, 240, 245);
        doc.rect(margin - 5, yPos - 5, contentWidth + 10, 8, 'F');
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...pink);
        doc.text('CERTIFICATIONS', margin, yPos);
        yPos += 10;

        resumeData.certifications.forEach((cert) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...darkGray);
          doc.text(cert.name, margin, yPos);
          yPos += 5;

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...medGray);
          doc.text(`${cert.issuer}${cert.issue_date ? ' • ' + cert.issue_date : ''}`, margin, yPos);
          yPos += 8;
        });
      }

      // Footer with SwipeHire branding
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...lightGray);
        doc.text('Created with SwipeHire', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        
        // Page number
        doc.text(`${i} / ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
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