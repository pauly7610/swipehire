import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const JOB_TITLES = [
  // Tech
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
  // Design
  'UX Designer',
  'UI Designer',
  'Product Designer',
  'Graphic Designer',
  'Visual Designer',
  'Design Lead',
  'Creative Director',
  // Product
  'Product Manager',
  'Senior Product Manager',
  'Product Owner',
  'Program Manager',
  'Project Manager',
  'Scrum Master',
  'Agile Coach',
  'VP of Product',
  'Chief Product Officer',
  // Marketing
  'Marketing Manager',
  'Digital Marketing Manager',
  'Content Marketing Manager',
  'SEO Specialist',
  'Social Media Manager',
  'Growth Marketing Manager',
  'Brand Manager',
  'Marketing Director',
  'CMO',
  // Sales
  'Sales Representative',
  'Account Executive',
  'Sales Development Representative',
  'Business Development Representative',
  'Account Manager',
  'Sales Manager',
  'Sales Director',
  'VP of Sales',
  // HR & Recruiting
  'Recruiter',
  'Technical Recruiter',
  'HR Manager',
  'HR Business Partner',
  'People Operations Manager',
  'Talent Acquisition Manager',
  'HR Director',
  'Chief People Officer',
  // Finance
  'Financial Analyst',
  'Accountant',
  'Senior Accountant',
  'Controller',
  'Finance Manager',
  'FP&A Analyst',
  'CFO',
  // Operations
  'Operations Manager',
  'Operations Analyst',
  'Business Analyst',
  'Strategy Analyst',
  'COO',
  // Customer Success
  'Customer Success Manager',
  'Customer Support Specialist',
  'Technical Support Engineer',
  'Customer Experience Manager',
  // Executive
  'CEO',
  'Founder',
  'Co-Founder',
  // Other
  'Other'
];

export default function JobTitleSelect({ value, onChange, placeholder = "Select job title", allowCustom = true }) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

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
        {JOB_TITLES.map(title => (
          <SelectItem key={title} value={title}>{title}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}