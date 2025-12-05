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
  'Brown University',
  'Dartmouth College',
  'Vanderbilt University',
  'Rice University',
  'University of Notre Dame',
  'Washington University in St. Louis',
  'Emory University',
  'University of California, Los Angeles (UCLA)',
  'University of California, San Diego',
  'University of California, Davis',
  'University of California, Irvine',
  'University of California, Santa Barbara',
  'University of Florida',
  'University of North Carolina at Chapel Hill',
  'University of Virginia',
  'University of Wisconsin-Madison',
  'University of Minnesota',
  'Ohio State University',
  'Pennsylvania State University',
  'Purdue University',
  'Texas A&M University',
  'University of Arizona',
  'Arizona State University',
  'University of Colorado Boulder',
  'University of Maryland',
  'Rutgers University',
  'University of Pittsburgh',
  'Michigan State University',
  'Indiana University',
  'Iowa State University',
  'University of Iowa',
  'University of Kansas',
  'University of Kentucky',
  'Louisiana State University',
  'University of Massachusetts',
  'University of Missouri',
  'University of Nebraska',
  'University of New Mexico',
  'University of Oklahoma',
  'University of Oregon',
  'Oregon State University',
  'University of South Carolina',
  'University of Tennessee',
  'University of Utah',
  'Virginia Tech',
  'West Virginia University',
  'Imperial College London',
  'London School of Economics (LSE)',
  'University College London (UCL)',
  'King\'s College London',
  'University of Edinburgh',
  'University of Manchester',
  'University of Bristol',
  'University of Warwick',
  'University of Glasgow',
  'University of Birmingham',
  'ETH Zurich',
  'University of Zurich',
  'EPFL (École Polytechnique Fédérale de Lausanne)',
  'University of Geneva',
  'Technical University of Munich',
  'Ludwig Maximilian University of Munich',
  'Heidelberg University',
  'Humboldt University of Berlin',
  'Free University of Berlin',
  'University of Bonn',
  'RWTH Aachen University',
  'Sorbonne University',
  'École Normale Supérieure',
  'Sciences Po',
  'University of Paris',
  'Sapienza University of Rome',
  'University of Bologna',
  'Politecnico di Milano',
  'University of Milan',
  'University of Amsterdam',
  'Delft University of Technology',
  'Utrecht University',
  'Leiden University',
  'KU Leuven',
  'University of Copenhagen',
  'Lund University',
  'Stockholm University',
  'Uppsala University',
  'University of Helsinki',
  'University of Oslo',
  'University of Barcelona',
  'Autonomous University of Madrid',
  'Complutense University of Madrid',
  'University of Lisbon',
  'Australian National University',
  'University of Melbourne',
  'University of Sydney',
  'University of Queensland',
  'Monash University',
  'University of New South Wales',
  'University of Adelaide',
  'University of Western Australia',
  'University of Auckland',
  'National University of Singapore',
  'Nanyang Technological University',
  'Tsinghua University',
  'Peking University',
  'Fudan University',
  'Shanghai Jiao Tong University',
  'Zhejiang University',
  'University of Hong Kong',
  'Chinese University of Hong Kong',
  'Hong Kong University of Science and Technology',
  'University of Tokyo',
  'Kyoto University',
  'Osaka University',
  'Tohoku University',
  'Seoul National University',
  'KAIST',
  'Yonsei University',
  'Indian Institute of Technology (IIT) Bombay',
  'Indian Institute of Technology (IIT) Delhi',
  'Indian Institute of Technology (IIT) Madras',
  'Indian Institute of Technology (IIT) Kanpur',
  'Indian Institute of Science (IISc)',
  'Tel Aviv University',
  'Hebrew University of Jerusalem',
  'Technion - Israel Institute of Technology',
  'Weizmann Institute of Science',
  'University of Cape Town',
  'University of the Witwatersrand',
  'Stellenbosch University',
  'University of São Paulo',
  'Federal University of Rio de Janeiro',
  'National Autonomous University of Mexico',
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