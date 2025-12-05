import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const DEGREES = [
  'High School Diploma',
  'Associate Degree',
  'Bachelor of Arts (BA)',
  'Bachelor of Science (BS)',
  'Bachelor of Business Administration (BBA)',
  'Bachelor of Engineering (BE)',
  'Bachelor of Technology (BTech)',
  'Master of Arts (MA)',
  'Master of Science (MS)',
  'Master of Business Administration (MBA)',
  'Master of Engineering (ME)',
  'Master of Technology (MTech)',
  'Doctor of Philosophy (PhD)',
  'Juris Doctor (JD)',
  'Doctor of Medicine (MD)',
  'Doctor of Education (EdD)',
  'Certificate',
  'Diploma',
  'Other'
];

const MAJORS = [
  'Computer Science',
  'Information Technology',
  'Software Engineering',
  'Data Science',
  'Artificial Intelligence',
  'Business Administration',
  'Finance',
  'Accounting',
  'Marketing',
  'Economics',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Psychology',
  'Sociology',
  'Political Science',
  'English',
  'Communications',
  'Nursing',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Statistics',
  'Graphic Design',
  'Fine Arts',
  'Education',
  'Law',
  'Medicine',
  'Other'
];

const UNIVERSITIES = [
  'Harvard University',
  'Stanford University',
  'Massachusetts Institute of Technology (MIT)',
  'University of California, Berkeley',
  'University of Oxford',
  'University of Cambridge',
  'Yale University',
  'Princeton University',
  'Columbia University',
  'University of Chicago',
  'Cornell University',
  'University of Pennsylvania',
  'California Institute of Technology (Caltech)',
  'Johns Hopkins University',
  'Northwestern University',
  'Duke University',
  'University of Michigan',
  'New York University (NYU)',
  'University of Toronto',
  'University of British Columbia',
  'McGill University',
  'University of Waterloo',
  'University of Texas at Austin',
  'University of Washington',
  'Georgia Institute of Technology',
  'Carnegie Mellon University',
  'University of Southern California',
  'Boston University',
  'University of Illinois',
  'Other'
];

export function DegreeSelect({ value, onChange, placeholder = "Select degree" }) {
  return (
    <>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {DEGREES.map(degree => (
            <SelectItem key={degree} value={degree}>{degree}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or type your own degree"
        className="mt-2"
      />
    </>
  );
}

export function MajorSelect({ value, onChange, placeholder = "Select major" }) {
  return (
    <>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {MAJORS.map(major => (
            <SelectItem key={major} value={major}>{major}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or type your own major"
        className="mt-2"
      />
    </>
  );
}

export function UniversitySelect({ value, onChange, placeholder = "Select university" }) {
  return (
    <>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {UNIVERSITIES.map(university => (
            <SelectItem key={university} value={university}>{university}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or type your own university"
        className="mt-2"
      />
    </>
  );
}