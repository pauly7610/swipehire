import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, MapPin, Briefcase, GraduationCap, Award, BadgeCheck, 
  FileText, Video, ExternalLink, ChevronDown, ChevronUp, Star,
  Globe, Github, Linkedin, Calendar, Building2
} from 'lucide-react';

export default function CandidateProfileCard({ candidate, user, expanded = false, onToggle }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!candidate) return null;

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      {/* Header - Always Visible */}
      <div 
        className="p-4 bg-gradient-to-r from-pink-50 to-orange-50 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          {candidate?.photo_url ? (
            <img src={candidate.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center border-2 border-white shadow">
              <User className="w-8 h-8 text-white" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg">{user?.full_name || 'Candidate'}</h3>
            <p className="text-gray-600">{candidate?.headline || 'Professional'}</p>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              {candidate?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {candidate.location}
                </span>
              )}
              {candidate?.experience_years && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> {candidate.experience_years}+ years
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </div>

        {/* Quick Stats Row */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-pink-100">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{candidate?.skills?.length || 0}</p>
            <p className="text-xs text-gray-500">Skills</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{candidate?.experience?.length || 0}</p>
            <p className="text-xs text-gray-500">Roles</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{candidate?.education?.length || 0}</p>
            <p className="text-xs text-gray-500">Education</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{candidate?.certifications?.length || 0}</p>
            <p className="text-xs text-gray-500">Certs</p>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full rounded-none border-b bg-white p-1">
              <TabsTrigger value="overview" className="flex-1 text-xs">Overview</TabsTrigger>
              <TabsTrigger value="experience" className="flex-1 text-xs">Experience</TabsTrigger>
              <TabsTrigger value="education" className="flex-1 text-xs">Education</TabsTrigger>
              <TabsTrigger value="credentials" className="flex-1 text-xs">Credentials</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[300px]">
              {/* Overview Tab */}
              <TabsContent value="overview" className="p-4 m-0 space-y-4">
                {/* Bio */}
                {candidate?.bio && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">About</h4>
                    <p className="text-sm text-gray-600">{candidate.bio}</p>
                  </div>
                )}

                {/* Skills */}
                {candidate?.skills?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-pink-50 text-pink-600">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Intro */}
                {candidate?.video_intro_url && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Video className="w-4 h-4 text-pink-500" /> Video Introduction
                    </h4>
                    <video src={candidate.video_intro_url} controls className="w-full rounded-lg max-h-40" />
                  </div>
                )}

                {/* Links */}
                <div className="flex gap-2">
                  {candidate?.resume_url && (
                    <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-1" /> Resume
                      </Button>
                    </a>
                  )}
                  {candidate?.linkedin_url && (
                    <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <Linkedin className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  {candidate?.github_url && (
                    <a href={candidate.github_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <Github className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </TabsContent>

              {/* Experience Tab */}
              <TabsContent value="experience" className="p-4 m-0 space-y-3">
                {candidate?.experience?.length > 0 ? (
                  candidate.experience.map((exp, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{exp.title}</h4>
                        <p className="text-sm text-gray-600">{exp.company}</p>
                        <p className="text-xs text-gray-500">{exp.start_date} - {exp.end_date || 'Present'}</p>
                        {exp.description && <p className="text-xs text-gray-500 mt-1">{exp.description}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-4">No experience listed</p>
                )}
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education" className="p-4 m-0 space-y-3">
                {candidate?.education?.length > 0 ? (
                  candidate.education.map((edu, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{edu.degree} in {edu.major}</h4>
                        <p className="text-sm text-gray-600">{edu.university}</p>
                        <p className="text-xs text-gray-500">Class of {edu.graduation_year} {edu.gpa && `• GPA: ${edu.gpa}`}</p>
                        {edu.document_url && (
                          <a href={edu.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 hover:underline flex items-center gap-1 mt-1">
                            <FileText className="w-3 h-3" /> View Document
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-4">No education listed</p>
                )}
              </TabsContent>

              {/* Credentials Tab */}
              <TabsContent value="credentials" className="p-4 m-0 space-y-4">
                {/* Certifications */}
                {candidate?.certifications?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <BadgeCheck className="w-4 h-4 text-green-500" /> Certifications
                    </h4>
                    <div className="space-y-2">
                      {candidate.certifications.map((cert, i) => (
                        <div key={i} className="p-2 bg-green-50 rounded-lg">
                          <p className="font-medium text-gray-900 text-sm">{cert.name}</p>
                          <p className="text-xs text-gray-600">{cert.issuer}</p>
                          {cert.document_url && (
                            <a href={cert.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">
                              View Certificate
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Awards */}
                {candidate?.awards?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Award className="w-4 h-4 text-amber-500" /> Awards
                    </h4>
                    <div className="space-y-2">
                      {candidate.awards.map((award, i) => (
                        <div key={i} className="p-2 bg-amber-50 rounded-lg">
                          <p className="font-medium text-gray-900 text-sm">{award.title}</p>
                          <p className="text-xs text-gray-600">{award.issuer} • {award.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Licenses */}
                {candidate?.licenses?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <FileText className="w-4 h-4 text-purple-500" /> Licenses
                    </h4>
                    <div className="space-y-2">
                      {candidate.licenses.map((license, i) => (
                        <div key={i} className="p-2 bg-purple-50 rounded-lg">
                          <p className="font-medium text-gray-900 text-sm">{license.name}</p>
                          <p className="text-xs text-gray-600">{license.issuing_authority} • #{license.license_number}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!candidate?.certifications?.length && !candidate?.awards?.length && !candidate?.licenses?.length && (
                  <p className="text-center text-gray-400 py-4">No credentials listed</p>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}