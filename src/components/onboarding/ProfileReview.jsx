import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, MapPin, Briefcase, GraduationCap, Award } from 'lucide-react';

export default function ProfileReview({ data, userType }) {
  const missingFields = [];
  
  if (userType === 'candidate') {
    if (!data.photo_url) missingFields.push('Profile Photo');
    if (!data.headline) missingFields.push('Job Title');
    if (!data.bio) missingFields.push('Bio');
    if (!data.location) missingFields.push('Location');
    if (!data.skills || data.skills.length < 3) missingFields.push('At least 3 skills');
    if (!data.experience || data.experience.length === 0) missingFields.push('Work Experience');
  }

  const completionScore = userType === 'candidate' 
    ? Math.round(((6 - missingFields.length) / 6) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Completion Score */}
      <Card className="border-0 bg-gradient-to-br from-pink-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Profile Strength</h3>
              <p className="text-sm text-gray-600">Complete your profile to stand out</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold swipe-gradient-text">{completionScore}%</p>
            </div>
          </div>
          
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full swipe-gradient transition-all duration-500"
              style={{ width: `${completionScore}%` }}
            />
          </div>

          {missingFields.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                To improve your profile:
              </p>
              <ul className="space-y-1">
                {missingFields.map((field, i) => (
                  <li key={i} className="text-sm text-gray-600 ml-6">• Add {field}</li>
                ))}
              </ul>
            </div>
          )}

          {completionScore === 100 && (
            <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm font-medium">Your profile is complete!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Preview */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Profile Preview</h3>
          
          {userType === 'candidate' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                {data.photo_url ? (
                  <img src={data.photo_url} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl text-gray-400">?</span>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900">{data.headline || 'Your Title'}</h4>
                  {data.location && (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" /> {data.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio */}
              {data.bio && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">About</h5>
                  <p className="text-sm text-gray-700">{data.bio}</p>
                </div>
              )}

              {/* Skills */}
              {data.skills?.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" /> Skills
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary">{typeof skill === 'string' ? skill : skill.skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {data.experience?.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Experience
                  </h5>
                  <div className="space-y-4">
                    {data.experience.map((exp, i) => (
                      <div key={i} className="border-l-2 border-pink-200 pl-4">
                        <p className="font-medium text-gray-900">{exp.title}</p>
                        <p className="text-sm text-gray-600">{exp.company}</p>
                        <p className="text-xs text-gray-500">
                          {exp.start_date} - {exp.current ? 'Present' : exp.end_date}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {data.education?.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Education
                  </h5>
                  <div className="space-y-4">
                    {data.education.map((edu, i) => (
                      <div key={i} className="border-l-2 border-purple-200 pl-4">
                        <p className="font-medium text-gray-900">{edu.degree} {edu.major && `in ${edu.major}`}</p>
                        <p className="text-sm text-gray-600">{edu.school}</p>
                        {edu.graduation_year && (
                          <p className="text-xs text-gray-500">Graduated {edu.graduation_year}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {userType === 'employer' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {data.recruiter_photo_url && (
                  <img src={data.recruiter_photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                )}
                <div>
                  <h4 className="font-bold text-gray-900">{data.recruiter_name}</h4>
                  <p className="text-sm text-gray-600">{data.recruiter_title}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center gap-3 mb-2">
                  {data.company_logo_url && (
                    <img src={data.company_logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <h4 className="font-bold text-gray-900">{data.company_name}</h4>
                </div>
                <p className="text-sm text-gray-600">{data.company_industry}</p>
                <p className="text-sm text-gray-600">{data.company_location} • {data.company_size}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}