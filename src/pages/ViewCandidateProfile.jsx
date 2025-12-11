import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, MapPin, Briefcase, Mail, Video, FileText, 
  ArrowLeft, Loader2, Github, Linkedin, Globe, ExternalLink, Download, UserPlus, Check, MessageCircle, Maximize2
} from 'lucide-react';
import { motion } from 'framer-motion';
import ResumeViewer from '@/components/profile/ResumeViewer';
import QuickMessageDialog from '@/components/networking/QuickMessageDialog';

export default function ViewCandidateProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const candidateId = searchParams.get('candidateId') || searchParams.get('id');
  
  const [candidate, setCandidate] = useState(null);
  const [candidateUser, setCandidateUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [connection, setConnection] = useState(null);
  const [sendingConnection, setSendingConnection] = useState(false);
  const [showResumeViewer, setShowResumeViewer] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    loadCandidate();
  }, [candidateId]);

  const loadCandidate = async () => {
    if (!candidateId) {
      setLoading(false);
      return;
    }
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const [companies] = await Promise.all([
        base44.entities.Company.filter({ user_id: user.id })
      ]);
      
      if (companies.length > 0) {
        setCompany(companies[0]);
      }
      
      const candidates = await base44.entities.Candidate.filter({ id: candidateId });
      if (candidates.length > 0) {
        setCandidate(candidates[0]);
        
        // Check if already connected
        const connections = await base44.entities.Connection.filter({
          $or: [
            { requester_id: user.id, receiver_id: candidates[0].user_id },
            { requester_id: candidates[0].user_id, receiver_id: user.id }
          ]
        });
        if (connections.length > 0) {
          setConnection(connections[0]);
        }
        
        // Try to get user info
        try {
          const users = await base44.entities.User.list();
          const candUser = users.find(u => u.id === candidates[0].user_id);
          if (candUser) {
            setCandidateUser(candUser);
          }
        } catch (userError) {
          console.log('Could not load user info:', userError);
        }
      }
    } catch (error) {
      console.error('Failed to load candidate:', error);
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!currentUser || !candidateUser) return;
    
    setSendingConnection(true);
    try {
      const newConnection = await base44.entities.Connection.create({
        requester_id: currentUser.id,
        receiver_id: candidateUser.id,
        status: 'pending',
        message: `Hi! I'd like to connect with you on SwipeHire.`
      });
      
      // Send notification
      await base44.entities.Notification.create({
        user_id: candidateUser.id,
        type: 'system',
        title: '🤝 New Connection Request',
        message: `${currentUser.full_name} wants to connect with you!`,
        navigate_to: 'Connections'
      });
      
      setConnection(newConnection);
    } catch (error) {
      console.error('Failed to send connection:', error);
    }
    setSendingConnection(false);
  };

  const getLinkIcon = (type) => {
    switch (type) {
      case 'github': return Github;
      case 'linkedin': return Linkedin;
      case 'website': return Globe;
      default: return ExternalLink;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Candidate Not Found</h3>
          <p className="text-gray-500 mb-4">This profile may no longer be available.</p>
          <Link to={createPageUrl('EmployerMatches')}>
            <Button>Back to Matches</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <style>{`
        .swipe-gradient { background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%); }
        .swipe-gradient-text {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Header Banner */}
      <div className="swipe-gradient h-32 relative">
        <button 
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Action Buttons */}
        {currentUser && candidateUser && currentUser.id !== candidateUser.id && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Button 
              onClick={() => setShowMessageDialog(true)}
              className="bg-white text-pink-600 hover:bg-gray-50"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
            {connection ? (
              <Button disabled className="bg-white text-gray-600">
                {connection.status === 'accepted' ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Connected
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Request Sent
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleConnect}
                disabled={sendingConnection}
                className="bg-white text-pink-600 hover:bg-gray-50"
              >
                {sendingConnection ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Connect
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-16">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-xl border-0 mb-6 overflow-visible">
            <CardContent className="pt-0">
              {/* Profile Photo */}
              <div className="flex justify-between items-start">
                <div className="relative -mt-12">
                  {candidate.photo_url ? (
                    <img
                      src={candidate.photo_url}
                      alt="Profile"
                      className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="w-12 h-12 text-pink-400" />
                    </div>
                  )}
                </div>

                {candidate.video_intro_url && (
                  <Badge className="mt-4 bg-purple-100 text-purple-700">
                    <Video className="w-3 h-3 mr-1" /> Has Video Intro
                  </Badge>
                )}
              </div>

              {/* Info */}
              <div className="mt-4">
                <h1 className="text-2xl font-bold text-gray-900">{candidateUser?.full_name || 'Candidate'}</h1>
                <p className="text-gray-600">
                  {candidate.headline || 'Professional'}
                  {candidate.current_company && <span className="text-gray-500"> @ {candidate.current_company}</span>}
                </p>

                {candidate.location && (
                  <div className="flex items-center gap-2 mt-2 text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{candidate.location}</span>
                  </div>
                )}

                {candidate.experience_level && (
                  <div className="flex items-center gap-2 mt-1 text-gray-500">
                    <Briefcase className="w-4 h-4" />
                    <span className="capitalize">{candidate.experience_level} Level</span>
                    {candidate.experience_years && <span>• {candidate.experience_years} years experience</span>}
                  </div>
                )}

                {/* Social Links */}
                {(candidate.linkedin_url || candidate.github_url || candidate.website_url) && (
                  <div className="flex gap-3 mt-3">
                    {candidate.linkedin_url && (
                      <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" 
                         className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                        <Linkedin className="w-4 h-4 text-blue-600" />
                      </a>
                    )}
                    {candidate.github_url && (
                      <a href={candidate.github_url} target="_blank" rel="noopener noreferrer"
                         className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <Github className="w-4 h-4 text-gray-800" />
                      </a>
                    )}
                    {candidate.website_url && (
                      <a href={candidate.website_url} target="_blank" rel="noopener noreferrer"
                         className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors">
                        <Globe className="w-4 h-4 text-green-600" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bio */}
        {candidate.bio && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{candidate.bio}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Skills */}
        {candidate.skills?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, i) => (
                    <Badge 
                      key={i} 
                      className="bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 border-0 px-3 py-1.5"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Experience */}
        {candidate.experience?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidate.experience.map((exp, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-pink-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                      <p className="text-gray-600">{exp.company}</p>
                      <p className="text-sm text-gray-400">{exp.start_date} - {exp.end_date || 'Present'}</p>
                      {exp.description && <p className="text-gray-600 mt-1 text-sm">{exp.description}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Portfolio Links */}
        {candidate.portfolio_links?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Portfolio & Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate.portfolio_links.map((link, i) => {
                    const Icon = getLinkIcon(link.type);
                    return (
                      <a 
                        key={i} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">{link.label || link.type}</span>
                      </a>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Video Intro */}
        {candidate.video_intro_url && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="w-5 h-5 text-pink-500" />
                  Video Introduction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <video src={candidate.video_intro_url} controls className="w-full rounded-xl" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Culture Preferences */}
        {candidate.culture_preferences?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Culture Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate.culture_preferences.map((pref, i) => (
                    <Badge key={i} className="bg-purple-100 text-purple-600">{pref}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Portfolio Projects */}
        {candidate.portfolio_projects?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Portfolio Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidate.portfolio_projects.map((project, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl">
                    {project.image_url && (
                      <img src={project.image_url} alt={project.title} className="w-full h-48 object-cover rounded-lg mb-3" />
                    )}
                    <h4 className="font-semibold text-gray-900 mb-2">{project.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                    {project.skills_used?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.skills_used.map((skill, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    )}
                    {project.url && (
                      <a 
                        href={project.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-700 text-sm font-medium inline-flex items-center gap-1"
                      >
                        View Project <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Education */}
        {candidate.education?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Education</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidate.education.map((edu, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                      <p className="text-gray-600">{edu.university}</p>
                      {edu.major && <p className="text-sm text-gray-500">{edu.major}</p>}
                      <p className="text-sm text-gray-400">
                        {edu.graduation_year}
                        {edu.gpa && ` • GPA: ${edu.gpa}`}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Certifications */}
        {candidate.certifications?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Certifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {candidate.certifications.map((cert, i) => (
                  <div key={i} className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                    <p className="text-sm text-gray-600">{cert.issuer}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Issued: {cert.issue_date}
                      {cert.expiry_date && ` • Expires: ${cert.expiry_date}`}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Awards */}
        {candidate.awards?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Awards & Honors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {candidate.awards.map((award, i) => (
                  <div key={i} className="p-3 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900">{award.title}</h4>
                    <p className="text-sm text-gray-600">{award.issuer}</p>
                    <p className="text-xs text-gray-500 mt-1">{award.date}</p>
                    {award.description && <p className="text-sm text-gray-600 mt-2">{award.description}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Licenses */}
        {candidate.licenses?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Professional Licenses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {candidate.licenses.map((license, i) => (
                  <div key={i} className="p-3 bg-indigo-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900">{license.name}</h4>
                    <p className="text-sm text-gray-600">{license.issuing_authority}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      License #: {license.license_number}
                      {license.issue_date && ` • Issued: ${license.issue_date}`}
                      {license.expiry_date && ` • Expires: ${license.expiry_date}`}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Resume */}
        {candidate.resume_url && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
            <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-pink-50 to-orange-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-500" />
                  Resume
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-white rounded-xl p-4 border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Resume Document</p>
                        <p className="text-sm text-gray-500">Click to view or download</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowResumeViewer(true)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:opacity-90"
                    >
                      <Maximize2 className="w-4 h-4" />
                      View Full Screen
                    </Button>
                    <a 
                      href={candidate.resume_url} 
                      download
                      className="flex items-center justify-center gap-2 px-4 py-3 border border-pink-200 text-pink-600 rounded-xl hover:bg-pink-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Resume Full Screen Viewer */}
      <ResumeViewer 
        resumeUrl={candidate?.resume_url}
        open={showResumeViewer}
        onOpenChange={setShowResumeViewer}
      />

      {/* Message Dialog */}
      <QuickMessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        recipientId={candidateUser?.id}
        recipientName={candidateUser?.full_name}
        context={{
          type: 'candidate_profile',
          candidate_id: candidate?.id
        }}
      />
    </div>
  );
}