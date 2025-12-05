import React, { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

// Job titles mapped by industry
const JOB_TITLES_BY_INDUSTRY = {
  'Technology': [
    'Software Engineer',
    'Senior Software Engineer',
    'Staff Software Engineer',
    'Principal Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Mobile Developer',
    'iOS Developer',
    'Android Developer',
    'DevOps Engineer',
    'Site Reliability Engineer',
    'Cloud Engineer',
    'Data Engineer',
    'Data Scientist',
    'Machine Learning Engineer',
    'AI Engineer',
    'QA Engineer',
    'Test Automation Engineer',
    'Security Engineer',
    'Cybersecurity Analyst',
    'Solutions Architect',
    'Technical Architect',
    'Engineering Manager',
    'VP of Engineering',
    'CTO',
    'IT Support Specialist',
    'Network Administrator',
    'Database Administrator',
    'Product Manager',
    'Technical Product Manager',
    'UX Designer',
    'UI Designer',
    'Product Designer'
  ],
  'Healthcare': [
    'Registered Nurse',
    'Licensed Practical Nurse (LPN)',
    'Licensed Vocational Nurse (LVN)',
    'Certified Nursing Assistant (CNA)',
    'Nurse Practitioner',
    'Physician',
    'Physician Assistant',
    'Medical Director',
    'Director of Nursing',
    'Nursing Supervisor',
    'Charge Nurse',
    'Healthcare Administrator',
    'Clinical Research Coordinator',
    'Medical Assistant',
    'Certified Medical Assistant',
    'Pharmacist',
    'Pharmacy Technician',
    'Physical Therapist',
    'Physical Therapy Assistant',
    'Occupational Therapist',
    'Occupational Therapy Assistant',
    'Speech Language Pathologist',
    'Respiratory Therapist',
    'Medical Technologist',
    'Lab Technician',
    'Phlebotomist',
    'Radiology Technician',
    'X-Ray Technician',
    'MRI Technician',
    'Ultrasound Technician',
    'EMT',
    'Paramedic',
    'Home Health Aide',
    'Caregiver',
    'Health Information Manager',
    'Medical Records Clerk',
    'Patient Care Coordinator',
    'Medical Receptionist',
    'Medical Biller',
    'Medical Coder',
    'Healthcare Consultant',
    'Chief Medical Officer',
    'Dental Hygienist',
    'Dental Assistant',
    'Optometrist',
    'Optician',
    'Veterinary Technician',
    'Mental Health Counselor',
    'Social Worker (Healthcare)'
  ],
  'Finance & Banking': [
    'Financial Analyst',
    'Senior Financial Analyst',
    'Investment Banker',
    'Portfolio Manager',
    'Risk Analyst',
    'Compliance Officer',
    'Accountant',
    'Senior Accountant',
    'Controller',
    'Finance Manager',
    'FP&A Analyst',
    'Tax Specialist',
    'Auditor',
    'Credit Analyst',
    'Loan Officer',
    'CFO',
    'Treasurer',
    'Wealth Manager'
  ],
  'Marketing & Advertising': [
    'Marketing Manager',
    'Digital Marketing Manager',
    'Content Marketing Manager',
    'SEO Specialist',
    'Social Media Manager',
    'Growth Marketing Manager',
    'Brand Manager',
    'Marketing Director',
    'CMO',
    'Content Strategist',
    'Copywriter',
    'Creative Director',
    'Marketing Analyst',
    'Email Marketing Specialist',
    'PPC Specialist',
    'Marketing Coordinator',
    'Public Relations Manager'
  ],
  'Sales': [
    'Sales Representative',
    'Account Executive',
    'Sales Development Representative',
    'Business Development Representative',
    'Account Manager',
    'Sales Manager',
    'Sales Director',
    'VP of Sales',
    'Chief Revenue Officer',
    'Inside Sales Representative',
    'Outside Sales Representative',
    'Sales Engineer',
    'Customer Success Manager',
    'Key Account Manager',
    'Territory Manager'
  ],
  'Human Resources': [
    'Recruiter',
    'Technical Recruiter',
    'HR Coordinator',
    'HR Manager',
    'HR Business Partner',
    'People Operations Manager',
    'Talent Acquisition Manager',
    'HR Director',
    'Chief People Officer',
    'Compensation Analyst',
    'Benefits Administrator',
    'Learning & Development Manager',
    'Employee Relations Manager',
    'HRIS Analyst',
    'Diversity & Inclusion Manager'
  ],
  'Education': [
    'Teacher',
    'Professor',
    'Academic Advisor',
    'School Administrator',
    'Curriculum Developer',
    'Instructional Designer',
    'Education Coordinator',
    'Principal',
    'Superintendent',
    'Admissions Counselor',
    'Tutor',
    'Special Education Teacher',
    'ESL Teacher',
    'Academic Dean'
  ],
  'Manufacturing': [
    'Production Manager',
    'Plant Manager',
    'Quality Control Inspector',
    'Manufacturing Engineer',
    'Process Engineer',
    'Supply Chain Manager',
    'Logistics Coordinator',
    'Warehouse Manager',
    'Operations Manager',
    'Maintenance Technician',
    'Production Supervisor',
    'Inventory Manager',
    'Procurement Specialist',
    'COO'
  ],
  'Retail & E-commerce': [
    'Store Manager',
    'Assistant Store Manager',
    'Shift Supervisor',
    'Retail Sales Associate',
    'Sales Associate',
    'Cashier',
    'Customer Service Associate',
    'Visual Merchandiser',
    'Stock Associate',
    'Stocker',
    'Inventory Clerk',
    'Warehouse Associate',
    'Receiving Clerk',
    'E-commerce Manager',
    'E-commerce Coordinator',
    'Order Fulfillment Associate',
    'Buyer',
    'Assistant Buyer',
    'Inventory Specialist',
    'Customer Service Representative',
    'Call Center Representative',
    'Retail District Manager',
    'Regional Manager',
    'Category Manager',
    'Merchandising Manager',
    'Loss Prevention Officer',
    'Loss Prevention Manager',
    'Retail Operations Manager',
    'Department Manager',
    'Team Lead',
    'Key Holder',
    'Beauty Advisor',
    'Jewelry Sales Associate',
    'Electronics Sales Associate',
    'Fitting Room Attendant',
    'Personal Shopper'
  ],
  'Real Estate': [
    'Real Estate Agent',
    'Property Manager',
    'Real Estate Broker',
    'Leasing Agent',
    'Real Estate Analyst',
    'Commercial Real Estate Agent',
    'Real Estate Developer',
    'Appraiser',
    'Escrow Officer',
    'Title Officer'
  ],
  'Legal': [
    'Attorney',
    'Paralegal',
    'Legal Assistant',
    'Corporate Counsel',
    'Legal Secretary',
    'Compliance Manager',
    'Contract Manager',
    'Legal Operations Manager',
    'General Counsel',
    'Litigation Associate'
  ],
  'Consulting': [
    'Management Consultant',
    'Strategy Consultant',
    'Business Analyst',
    'Senior Consultant',
    'Principal Consultant',
    'Partner',
    'Operations Consultant',
    'IT Consultant',
    'Change Management Consultant',
    'Implementation Consultant'
  ],
  'Media & Entertainment': [
    'Content Producer',
    'Video Editor',
    'Graphic Designer',
    'Art Director',
    'Journalist',
    'Social Media Coordinator',
    'Communications Manager',
    'Animator',
    'Photographer',
    'Sound Engineer',
    'Broadcast Engineer'
  ],
  'Hospitality & Tourism': [
    'Hotel Manager',
    'Assistant Hotel Manager',
    'Restaurant Manager',
    'Assistant Restaurant Manager',
    'Shift Manager',
    'Event Coordinator',
    'Event Planner',
    'Travel Agent',
    'Concierge',
    'Front Desk Agent',
    'Front Desk Manager',
    'Receptionist',
    'Bellhop',
    'Valet',
    'Executive Chef',
    'Sous Chef',
    'Line Cook',
    'Prep Cook',
    'Dishwasher',
    'Server',
    'Waitress',
    'Waiter',
    'Bartender',
    'Barista',
    'Host/Hostess',
    'Busser',
    'Food Runner',
    'Housekeeping Manager',
    'Housekeeper',
    'Room Attendant',
    'Janitor',
    'Custodian',
    'Maintenance Worker',
    'Food & Beverage Director',
    'Catering Manager',
    'Banquet Server',
    'Banquet Captain',
    'Night Auditor',
    'Spa Manager',
    'Massage Therapist',
    'Lifeguard',
    'Tour Guide'
  ],
  'Transportation & Logistics': [
    'Logistics Manager',
    'Supply Chain Analyst',
    'Fleet Manager',
    'Dispatcher',
    'Transportation Coordinator',
    'Warehouse Supervisor',
    'Import/Export Specialist',
    'Freight Broker',
    'Distribution Manager'
  ],
  'Energy & Utilities': [
    'Electrical Engineer',
    'Energy Analyst',
    'Utility Manager',
    'Sustainability Manager',
    'Power Plant Operator',
    'Renewable Energy Specialist',
    'Environmental Engineer',
    'Energy Consultant'
  ],
  'Construction': [
    'Project Manager',
    'Construction Manager',
    'Site Supervisor',
    'Civil Engineer',
    'Estimator',
    'Architect',
    'Safety Manager',
    'Superintendent',
    'Contract Administrator'
  ],
  'Government & Public Sector': [
    'Policy Analyst',
    'Program Manager',
    'Public Affairs Specialist',
    'Government Relations Manager',
    'City Planner',
    'Social Worker',
    'Grant Writer',
    'Public Administrator'
  ],
  'Non-Profit': [
    'Executive Director',
    'Development Director',
    'Fundraising Manager',
    'Program Director',
    'Grant Manager',
    'Volunteer Coordinator',
    'Community Outreach Manager',
    'Advocacy Director'
  ],
  'Telecommunications': [
    'Network Engineer',
    'Telecommunications Specialist',
    'Systems Administrator',
    'RF Engineer',
    'Technical Support Engineer',
    'Telecom Project Manager',
    'Field Technician'
  ],
  'Aerospace & Defense': [
    'Aerospace Engineer',
    'Systems Engineer',
    'Defense Analyst',
    'Flight Test Engineer',
    'Avionics Engineer',
    'Program Manager',
    'Quality Assurance Engineer'
  ],
  'Automotive': [
    'Automotive Engineer',
    'Service Manager',
    'Automotive Technician',
    'Quality Engineer',
    'Sales Consultant',
    'Parts Manager',
    'Body Shop Manager'
  ],
  'Pharmaceutical': [
    'Clinical Research Associate',
    'Regulatory Affairs Specialist',
    'Pharmaceutical Sales Rep',
    'Formulation Scientist',
    'Quality Control Analyst',
    'Medical Science Liaison',
    'Drug Safety Associate'
  ],
  'Agriculture': [
    'Farm Manager',
    'Agricultural Engineer',
    'Agronomist',
    'Food Scientist',
    'Agricultural Sales Rep',
    'Crop Advisor',
    'Livestock Manager'
  ]
};

// Common roles across all industries
const COMMON_ROLES = [
  'CEO',
  'COO',
  'CFO',
  'CTO',
  'CMO',
  'Director',
  'Assistant Director',
  'Manager',
  'Assistant Manager',
  'Supervisor',
  'Team Lead',
  'Executive Assistant',
  'Administrative Assistant',
  'Office Manager',
  'Office Coordinator',
  'Receptionist',
  'Operations Manager',
  'Project Manager',
  'Program Manager',
  'Business Analyst',
  'Data Analyst',
  'Customer Service Representative',
  'General Laborer',
  'Warehouse Worker',
  'Forklift Operator',
  'Delivery Driver',
  'Truck Driver',
  'Driver',
  'Security Guard',
  'Security Officer',
  'Janitor',
  'Custodian',
  'Cleaner',
  'Landscaper',
  'Groundskeeper',
  'Painter',
  'Electrician',
  'Plumber',
  'HVAC Technician',
  'Carpenter',
  'Welder',
  'Machinist',
  'Assembler',
  'Production Worker',
  'Factory Worker',
  'Package Handler',
  'Material Handler',
  'Packer',
  'Picker',
  'Shipping Clerk',
  'Data Entry Clerk',
  'File Clerk',
  'Mail Clerk',
  'Intern',
  'Apprentice',
  'Trainee',
  'Entry Level',
  'Other'
];

export default function JobTitleSelect({ value, onChange, placeholder = "Select job title", industry = null, allowCustom = true }) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const availableTitles = useMemo(() => {
    if (!industry || industry === 'Other') {
      // Return all titles if no industry selected
      const allTitles = new Set(COMMON_ROLES);
      Object.values(JOB_TITLES_BY_INDUSTRY).forEach(titles => {
        titles.forEach(t => allTitles.add(t));
      });
      return Array.from(allTitles).sort();
    }
    
    // Return industry-specific titles + common roles
    const industryTitles = JOB_TITLES_BY_INDUSTRY[industry] || [];
    const combined = new Set([...industryTitles, ...COMMON_ROLES]);
    return Array.from(combined).sort();
  }, [industry]);

  const handleSelectChange = (val) => {
    if (val === 'Other' && allowCustom) {
      setIsCustom(true);
      onChange('');
    } else {
      setIsCustom(false);
      onChange(val);
    }
  };

  if (isCustom) {
    return (
      <div className="flex gap-2">
        <Input
          placeholder="Enter custom job title"
          value={customValue}
          onChange={(e) => {
            setCustomValue(e.target.value);
            onChange(e.target.value);
          }}
          className="flex-1"
        />
        <button 
          type="button"
          onClick={() => { setIsCustom(false); setCustomValue(''); }}
          className="text-sm text-pink-600 hover:text-pink-700 px-2"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleSelectChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {availableTitles.map(title => (
          <SelectItem key={title} value={title}>{title}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}