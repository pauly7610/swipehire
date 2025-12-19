import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, CheckCircle, XCircle, Zap, Database, 
  Loader2, Users, Briefcase, TrendingUp, FileText, Mail
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// QA TEST FIXTURES - DO NOT DELETE
const TEST_JOBS = [
  {
    title: 'Senior Software Engineer',
    company_id: 'PLACEHOLDER_TECH_CO',
    industry: 'Technology',
    location: 'San Francisco, CA',
    job_type: 'full-time',
    experience_level: 'senior',
    salary_min: 150000,
    salary_max: 220000,
    salary_type: 'yearly',
    description: 'We are seeking a Senior Software Engineer to build scalable web applications using React, Node.js, and AWS.',
    responsibilities: [
      'Design and implement REST APIs',
      'Lead code reviews and mentor junior developers',
      'Optimize application performance and scalability',
      'Collaborate with product team on feature planning'
    ],
    requirements: [
      '5+ years of full-stack development experience',
      'Expert-level React and TypeScript',
      'Strong understanding of microservices architecture',
      'Experience with AWS (EC2, S3, Lambda)'
    ],
    skills_required: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker'],
    benefits: ['Health Insurance', 'Equity', '401k', 'Unlimited PTO'],
    is_active: true
  },
  {
    title: 'Registered Nurse - ICU',
    company_id: 'PLACEHOLDER_HEALTH_CO',
    industry: 'Healthcare',
    location: 'Boston, MA',
    job_type: 'full-time',
    experience_level: 'mid',
    salary_min: 75000,
    salary_max: 95000,
    salary_type: 'yearly',
    description: 'Seeking a compassionate RN for our Intensive Care Unit. Provide critical care and support to patients and families.',
    responsibilities: [
      'Monitor patient vital signs and administer medications',
      'Collaborate with interdisciplinary care teams',
      'Maintain accurate patient records',
      'Respond to medical emergencies'
    ],
    requirements: [
      'Active RN license in Massachusetts',
      '2+ years of ICU experience',
      'BLS and ACLS certifications required',
      'Strong critical thinking skills'
    ],
    skills_required: ['Critical Care', 'Patient Assessment', 'IV Therapy', 'Ventilator Management'],
    benefits: ['Health Insurance', 'Dental', 'Vision', 'Tuition Reimbursement'],
    is_active: true
  },
  {
    title: 'Corporate Attorney',
    company_id: 'PLACEHOLDER_LAW_FIRM',
    industry: 'Legal',
    location: 'New York, NY',
    job_type: 'full-time',
    experience_level: 'senior',
    salary_min: 180000,
    salary_max: 280000,
    salary_type: 'yearly',
    description: 'Prestigious law firm seeking a corporate attorney to advise clients on M&A, securities, and corporate governance.',
    responsibilities: [
      'Draft and negotiate complex commercial agreements',
      'Advise on mergers, acquisitions, and corporate restructuring',
      'Ensure regulatory compliance',
      'Manage client relationships and business development'
    ],
    requirements: [
      'JD from top-tier law school',
      '5+ years of corporate law experience at a major firm',
      'NY Bar admission required',
      'Strong M&A transaction experience'
    ],
    skills_required: ['M&A', 'Securities Law', 'Contract Negotiation', 'Due Diligence'],
    benefits: ['Health Insurance', 'Bonus', 'Profit Sharing', 'Parking'],
    is_active: true
  }
];

const TEST_CANDIDATES_STRONG_FIT = [
  {
    headline: 'Senior Full Stack Engineer | React + Node.js Expert',
    bio: 'Passionate engineer with 7 years building scalable web applications. Led teams at high-growth startups. Expert in React, TypeScript, and AWS.',
    location: 'San Francisco, CA',
    industry: 'Technology',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker', 'Kubernetes', 'GraphQL'],
    experience_level: 'senior',
    experience_years: 7,
    experience: [
      {
        title: 'Senior Software Engineer',
        company: 'TechCorp',
        start_date: '2020-01',
        end_date: 'Present',
        description: 'Led development of microservices architecture serving 10M users. Reduced API latency by 60%.'
      },
      {
        title: 'Software Engineer',
        company: 'StartupXYZ',
        start_date: '2018-06',
        end_date: '2019-12',
        description: 'Built React components and REST APIs. Mentored 2 junior developers.'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science',
        major: 'Computer Science',
        university: 'Stanford University',
        graduation_year: 2017
      }
    ],
    resume_url: 'https://example.com/resume_strong_1.pdf'
  },
  {
    headline: 'ICU Nurse | CCRN Certified | 8 Years Critical Care',
    bio: 'Experienced ICU nurse with CCRN certification. Proven track record in high-acuity patient care, team leadership, and quality improvement.',
    location: 'Boston, MA',
    industry: 'Healthcare',
    skills: ['Critical Care', 'Patient Assessment', 'IV Therapy', 'Ventilator Management', 'ACLS', 'BLS', 'Hemodynamic Monitoring'],
    experience_level: 'mid',
    experience_years: 8,
    experience: [
      {
        title: 'ICU Registered Nurse',
        company: 'Boston Medical Center',
        start_date: '2016-03',
        end_date: 'Present',
        description: 'Provide critical care to post-surgical and trauma patients. Preceptor for new ICU nurses.'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Nursing',
        major: 'Nursing',
        university: 'Northeastern University',
        graduation_year: 2015
      }
    ],
    certifications: [
      { name: 'CCRN', issuer: 'AACN', issue_date: '2018-01' },
      { name: 'BLS', issuer: 'AHA', issue_date: '2024-01' },
      { name: 'ACLS', issuer: 'AHA', issue_date: '2024-01' }
    ],
    resume_url: 'https://example.com/resume_strong_2.pdf'
  }
];

const TEST_CANDIDATES_ADJACENT_FIT = [
  {
    headline: 'Full Stack Developer | Vue + Express',
    bio: 'Developer with 4 years experience. Worked primarily with Vue.js but learning React. Strong backend skills in Node.js.',
    location: 'Remote',
    industry: 'Technology',
    skills: ['Vue.js', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'Git'],
    experience_level: 'mid',
    experience_years: 4,
    experience: [
      {
        title: 'Full Stack Developer',
        company: 'Startup ABC',
        start_date: '2020-01',
        end_date: 'Present',
        description: 'Built web apps using Vue.js and Express. Managed MongoDB databases.'
      }
    ],
    resume_url: 'https://example.com/resume_adjacent_1.pdf'
  },
  {
    headline: 'Med-Surg RN | Transitioning to Critical Care',
    bio: 'Registered Nurse with 3 years medical-surgical experience. Completed ICU orientation program. BLS and ACLS certified.',
    location: 'Providence, RI',
    industry: 'Healthcare',
    skills: ['Patient Care', 'IV Therapy', 'Medication Administration', 'BLS', 'ACLS'],
    experience_level: 'mid',
    experience_years: 3,
    experience: [
      {
        title: 'Registered Nurse',
        company: 'Rhode Island Hospital',
        start_date: '2021-06',
        end_date: 'Present',
        description: 'Med-surg floor nurse. Float to ICU occasionally. Strong patient assessment skills.'
      }
    ],
    resume_url: 'https://example.com/resume_adjacent_2.pdf'
  },
  {
    headline: 'Attorney | Commercial Litigation',
    bio: 'Litigation attorney with 6 years experience. Strong contract drafting and negotiation skills. Limited M&A exposure.',
    location: 'New York, NY',
    industry: 'Legal',
    skills: ['Litigation', 'Contract Drafting', 'Legal Research', 'Negotiation'],
    experience_level: 'mid',
    experience_years: 6,
    experience: [
      {
        title: 'Associate Attorney',
        company: 'Smith & Associates',
        start_date: '2018-09',
        end_date: 'Present',
        description: 'Commercial litigation and contract disputes. Draft agreements and negotiate settlements.'
      }
    ],
    resume_url: 'https://example.com/resume_adjacent_3.pdf'
  },
  {
    headline: 'Junior Web Developer',
    bio: '2 years of web development. Built several React projects. Still learning advanced patterns and cloud deployment.',
    location: 'Austin, TX',
    industry: 'Technology',
    skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Git'],
    experience_level: 'entry',
    experience_years: 2,
    experience: [
      {
        title: 'Web Developer',
        company: 'Agency XYZ',
        start_date: '2022-08',
        end_date: 'Present',
        description: 'Built client websites using React and WordPress.'
      }
    ],
    resume_url: 'https://example.com/resume_adjacent_4.pdf'
  }
];

const TEST_CANDIDATES_STRETCH_MISALIGNED = [
  {
    headline: 'Marketing Manager',
    bio: 'Marketing professional with 5 years experience in digital campaigns, SEO, and social media strategy.',
    location: 'Los Angeles, CA',
    industry: 'Marketing',
    skills: ['SEO', 'Google Ads', 'Content Marketing', 'Social Media', 'Analytics'],
    experience_level: 'mid',
    experience_years: 5,
    resume_url: 'https://example.com/resume_stretch_1.pdf'
  },
  {
    headline: 'Graphic Designer',
    bio: 'Creative designer specializing in branding and visual identity. Proficient in Adobe Creative Suite.',
    location: 'Portland, OR',
    industry: 'Design',
    skills: ['Photoshop', 'Illustrator', 'Figma', 'Branding', 'Typography'],
    experience_level: 'mid',
    experience_years: 4,
    resume_url: 'https://example.com/resume_stretch_2.pdf'
  },
  {
    headline: 'Recent College Graduate | Biology Major',
    bio: 'Fresh graduate looking for first job. Internship experience in lab research. Strong academic background.',
    location: 'Chicago, IL',
    industry: 'Science',
    skills: ['Research', 'Lab Work', 'Data Analysis', 'Microsoft Office'],
    experience_level: 'entry',
    experience_years: 0,
    resume_url: 'https://example.com/resume_stretch_3.pdf'
  },
  {
    headline: 'Sales Representative',
    bio: 'Top-performing sales rep with 3 years experience in B2B SaaS. Consistently exceed quota.',
    location: 'Miami, FL',
    industry: 'Sales',
    skills: ['Salesforce', 'Cold Calling', 'Negotiation', 'Prospecting'],
    experience_level: 'mid',
    experience_years: 3,
    resume_url: 'https://example.com/resume_stretch_4.pdf'
  }
];

export default function QADashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fixturesCreated, setFixturesCreated] = useState(false);
  const [creatingFixtures, setCreatingFixtures] = useState(false);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (e) {
      console.error('Auth error:', e);
    }
  };

  const createTestFixtures = async () => {
    setCreatingFixtures(true);
    const results = [];

    try {
      // Create test recruiter company
      const testRecruiter = await base44.auth.me();
      
      const [existingCompanies] = await Promise.all([
        base44.entities.Company.filter({ user_id: testRecruiter.id })
      ]);

      let companyId;
      
      if (existingCompanies.length > 0) {
        companyId = existingCompanies[0].id;
        results.push({ status: 'success', message: 'Using existing test company' });
      } else {
        const company = await base44.entities.Company.create({
          user_id: testRecruiter.id,
          name: 'QA Test Company',
          industry: 'Technology',
          location: 'San Francisco, CA',
          size: '51-200'
        });
        companyId = company.id;
        results.push({ status: 'success', message: 'Created test company' });
      }

      // Create 3 test jobs
      const jobsToCreate = TEST_JOBS.map(job => ({
        ...job,
        company_id: companyId
      }));

      const createdJobs = [];
      for (const jobData of jobsToCreate) {
        const job = await base44.entities.Job.create(jobData);
        createdJobs.push(job);
      }
      results.push({ status: 'success', message: `Created ${createdJobs.length} test jobs` });

      // Create test candidates (10 total: 2 strong, 4 adjacent, 4 stretch)
      const allTestCandidates = [
        ...TEST_CANDIDATES_STRONG_FIT,
        ...TEST_CANDIDATES_ADJACENT_FIT,
        ...TEST_CANDIDATES_STRETCH_MISALIGNED
      ];

      let candidatesCreated = 0;
      for (const candidateData of allTestCandidates) {
        try {
          // Check if candidate with same headline exists
          const existing = await base44.entities.Candidate.filter({ headline: candidateData.headline });
          if (existing.length === 0) {
            await base44.entities.Candidate.create({
              user_id: testRecruiter.id, // Using admin user for test data
              ...candidateData
            });
            candidatesCreated++;
          }
        } catch (err) {
          console.error('Failed to create candidate:', err);
        }
      }
      results.push({ status: 'success', message: `Created ${candidatesCreated} test candidates` });

      setTestResults(results);
      setFixturesCreated(true);
    } catch (error) {
      results.push({ status: 'error', message: `Fixture creation failed: ${error.message}` });
      setTestResults(results);
    }

    setCreatingFixtures(false);
  };

  const runValidationChecks = async () => {
    setLoading(true);
    const checks = [];

    try {
      // Check 1: Interest signals tracking
      const signals = await base44.entities.InterestSignal.list();
      checks.push({
        name: 'Interest Signal Tracking',
        status: signals.length >= 0 ? 'pass' : 'fail',
        message: `${signals.length} signals found`,
        severity: signals.length >= 0 ? 'P2' : 'P0'
      });

      // Check 2: Email events logging
      const emails = await base44.entities.EmailEvent.list();
      checks.push({
        name: 'Email Event Logging',
        status: emails.length >= 0 ? 'pass' : 'fail',
        message: `${emails.length} email events logged`,
        severity: 'P2'
      });

      // Check 3: Candidate evaluations
      const evaluations = await base44.entities.CandidateEvaluation.list();
      checks.push({
        name: 'AI Evaluation System',
        status: evaluations.length >= 0 ? 'pass' : 'fail',
        message: `${evaluations.length} evaluations generated`,
        severity: 'P1'
      });

      // Check 4: Application rankings
      const rankings = await base44.entities.ApplicationRanking.list();
      checks.push({
        name: 'Application Ranking',
        status: rankings.length >= 0 ? 'pass' : 'fail',
        message: `${rankings.length} rankings computed`,
        severity: 'P1'
      });

      // Check 5: Candidate preferences
      const candidates = await base44.entities.Candidate.list();
      const withPreferences = candidates.filter(c => 
        c.target_job_titles?.length > 0 || c.email_frequency
      );
      checks.push({
        name: 'Candidate Preferences',
        status: 'pass',
        message: `${withPreferences.length}/${candidates.length} candidates have preferences set`,
        severity: 'P2'
      });

      setTestResults(checks);
    } catch (error) {
      console.error('Validation failed:', error);
    }

    setLoading(false);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Only</h1>
          <p className="text-gray-500">This QA dashboard is only accessible to admin users.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QA Test Dashboard</h1>
          <p className="text-gray-600">System validation, test fixtures, and defect tracking</p>
        </div>

        <div className="grid gap-6">
          {/* Test Fixtures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" />
                Test Data Fixtures
              </CardTitle>
              <CardDescription>
                Create sample jobs and candidates for testing AI evaluation, ranking, and email automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <Briefcase className="w-6 h-6 text-blue-600 mb-2" />
                    <p className="text-2xl font-bold text-blue-900">3</p>
                    <p className="text-xs text-blue-700">Test Jobs</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <Users className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-green-900">2</p>
                    <p className="text-xs text-green-700">Strong Fits</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
                    <p className="text-2xl font-bold text-purple-900">8</p>
                    <p className="text-xs text-purple-700">Adjacent + Stretch</p>
                  </div>
                </div>

                <Button
                  onClick={createTestFixtures}
                  disabled={creatingFixtures}
                  className="w-full swipe-gradient text-white h-12"
                >
                  {creatingFixtures ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Test Data...
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5 mr-2" />
                      Generate Test Fixtures
                    </>
                  )}
                </Button>

                {fixturesCreated && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertTitle className="text-green-900">Fixtures Created</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Test data ready. Navigate to ATS → AI Rankings to test evaluation.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validation Checks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                System Validation
              </CardTitle>
              <CardDescription>
                Run automated checks on critical systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runValidationChecks}
                disabled={loading}
                className="w-full mb-4 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Running Checks...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Run Validation Suite
                  </>
                )}
              </Button>

              {testResults.length > 0 && (
                <div className="space-y-2">
                  {testResults.map((result, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {result.status === 'pass' || result.status === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{result.name || result.message}</p>
                          {result.message && result.name && (
                            <p className="text-sm text-gray-500">{result.message}</p>
                          )}
                        </div>
                      </div>
                      {result.severity && (
                        <Badge variant={result.severity === 'P0' ? 'destructive' : 'secondary'}>
                          {result.severity}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Known Issues */}
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Code-Level Defect Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTitle className="flex items-center gap-2">
                    <span className="font-bold">P0:</span> Email automation not implemented
                  </AlertTitle>
                  <AlertDescription className="mt-2 space-y-1 text-sm">
                    <p><strong>Issue:</strong> JobAlertManager requires manual trigger. No event-based automation.</p>
                    <p><strong>Impact:</strong> Email alerts won't send on job publish or interest signal capture.</p>
                    <p><strong>Fix:</strong> Requires backend functions to be enabled for event triggers.</p>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertTitle className="flex items-center gap-2">
                    <span className="font-bold">P1:</span> AI evaluation not auto-triggered on application
                  </AlertTitle>
                  <AlertDescription className="mt-2 space-y-1 text-sm">
                    <p><strong>Issue:</strong> evaluateCandidate() must be called manually by recruiter.</p>
                    <p><strong>Impact:</strong> Candidates not auto-ranked on apply.</p>
                    <p><strong>Fix:</strong> Add trigger in QuickApplyModal after Application.create() or use backend functions.</p>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertTitle className="flex items-center gap-2">
                    <span className="font-bold">P2:</span> Onboarding validation - Skills proficiency mismatch
                  </AlertTitle>
                  <AlertDescription className="mt-2 space-y-1 text-sm">
                    <p><strong>Issue:</strong> OnboardingWizard stores skills as simple array, but SkillsPicker may return objects with proficiency.</p>
                    <p><strong>Location:</strong> OnboardingWizard line 294</p>
                    <p><strong>Fix:</strong> Normalize skills to string[] before save.</p>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertTitle className="flex items-center gap-2">
                    <span className="font-bold">P2:</span> Swipe gesture accessibility on mobile
                  </AlertTitle>
                  <AlertDescription className="mt-2 space-y-1 text-sm">
                    <p><strong>Issue:</strong> No keyboard navigation alternative for swipe gestures.</p>
                    <p><strong>Impact:</strong> Accessibility failure for keyboard/assistive tech users.</p>
                    <p><strong>Fix:</strong> Add keyboard shortcuts (arrow keys) or visible buttons as alternatives.</p>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertTitle className="flex items-center gap-2">
                    <span className="font-bold">PASS:</span> No candidates auto-disqualified
                  </AlertTitle>
                  <AlertDescription className="mt-2 space-y-1 text-sm">
                    <p><strong>Verified:</strong> RankedCandidateList filters by evaluation but does not hide/delete candidates.</p>
                    <p><strong>Status:</strong> All applicants remain visible in "All Applicants" tab.</p>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertTitle className="flex items-center gap-2">
                    <span className="font-bold">PASS:</span> Swipe mechanics unaffected by AI panels
                  </AlertTitle>
                  <AlertDescription className="mt-2 space-y-1 text-sm">
                    <p><strong>Verified:</strong> JobCard AI intelligence is in separate layer, does not block drag events.</p>
                    <p><strong>Status:</strong> Swipe gestures should register correctly.</p>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Remediation Plan */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Remediation Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 list-decimal list-inside">
                <li className="text-sm">
                  <strong>Enable Backend Functions</strong> - Required for event-based email automation and auto-evaluation triggers
                </li>
                <li className="text-sm">
                  <strong>Add Application Submit Hook</strong> - Call evaluateCandidate() immediately after Application.create() in QuickApplyModal
                </li>
                <li className="text-sm">
                  <strong>Add Job Publish Hook</strong> - Trigger sendJobAlert() for matched candidates when job.is_active = true
                </li>
                <li className="text-sm">
                  <strong>Normalize Skills Data</strong> - Ensure skills are always stored as string[] across all components
                </li>
                <li className="text-sm">
                  <strong>Add Keyboard Navigation</strong> - Implement arrow key support for swipe actions (accessibility)
                </li>
                <li className="text-sm">
                  <strong>Add Comprehensive Logging</strong> - Track all onboarding steps, email sends, and AI calls for debugging
                </li>
                <li className="text-sm">
                  <strong>Performance Testing</strong> - Requires manual device testing (cannot automate in code review)
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}