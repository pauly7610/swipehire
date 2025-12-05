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
  // USA - Ivy League & Top Universities
  'Harvard University',
  'Stanford University',
  'Massachusetts Institute of Technology (MIT)',
  'Yale University',
  'Princeton University',
  'Columbia University',
  'University of Pennsylvania',
  'Brown University',
  'Dartmouth College',
  'Cornell University',
  
  // USA - Top Public Universities
  'University of California, Berkeley',
  'University of California, Los Angeles (UCLA)',
  'University of California, San Diego',
  'University of California, Davis',
  'University of California, Irvine',
  'University of California, Santa Barbara',
  'University of California, Santa Cruz',
  'University of California, Riverside',
  'University of California, Merced',
  'University of Michigan',
  'University of Virginia',
  'University of North Carolina at Chapel Hill',
  'University of Texas at Austin',
  'University of Washington',
  'University of Wisconsin-Madison',
  'University of Florida',
  'University of Illinois Urbana-Champaign',
  'Ohio State University',
  'Pennsylvania State University',
  'Purdue University',
  'Texas A&M University',
  'University of Maryland',
  'Rutgers University',
  'University of Minnesota',
  'University of Pittsburgh',
  'Michigan State University',
  'Indiana University Bloomington',
  'Iowa State University',
  'University of Iowa',
  
  // USA - Top Private Universities
  'California Institute of Technology (Caltech)',
  'Duke University',
  'Johns Hopkins University',
  'Northwestern University',
  'University of Chicago',
  'Vanderbilt University',
  'Rice University',
  'University of Notre Dame',
  'Washington University in St. Louis',
  'Emory University',
  'Carnegie Mellon University',
  'University of Southern California',
  'Boston University',
  'New York University (NYU)',
  'Georgetown University',
  'Tufts University',
  'Boston College',
  'Brandeis University',
  'Case Western Reserve University',
  'Lehigh University',
  'Rensselaer Polytechnic Institute',
  'Rochester Institute of Technology',
  'Syracuse University',
  'University of Rochester',
  'Wake Forest University',
  'Tulane University',
  'Northeastern University',
  
  // USA - State Universities
  'Arizona State University',
  'University of Arizona',
  'University of Colorado Boulder',
  'Colorado State University',
  'University of Connecticut',
  'University of Delaware',
  'Georgia Institute of Technology',
  'University of Georgia',
  'University of Hawaii',
  'University of Idaho',
  'University of Kansas',
  'Kansas State University',
  'University of Kentucky',
  'University of Louisville',
  'Louisiana State University',
  'University of Maine',
  'University of Massachusetts Amherst',
  'University of Missouri',
  'University of Montana',
  'University of Nebraska-Lincoln',
  'University of Nevada, Las Vegas',
  'University of Nevada, Reno',
  'University of New Hampshire',
  'University of New Mexico',
  'University of Oklahoma',
  'Oklahoma State University',
  'University of Oregon',
  'Oregon State University',
  'University of Rhode Island',
  'University of South Carolina',
  'University of South Dakota',
  'University of Tennessee',
  'University of Utah',
  'Utah State University',
  'University of Vermont',
  'Virginia Tech',
  'College of William & Mary',
  'West Virginia University',
  'University of Wyoming',
  'University of Alabama',
  'Auburn University',
  'University of Arkansas',
  'University of Mississippi',
  
  // Canada
  'University of Toronto',
  'University of British Columbia',
  'McGill University',
  'University of Waterloo',
  'McMaster University',
  'University of Alberta',
  'University of Montreal',
  'Queen\'s University',
  'Western University',
  'University of Calgary',
  'University of Ottawa',
  'Dalhousie University',
  'Simon Fraser University',
  'York University',
  'Carleton University',
  'University of Victoria',
  'University of Manitoba',
  'University of Saskatchewan',
  
  // UK
  'University of Oxford',
  'University of Cambridge',
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
  'University of Leeds',
  'University of Southampton',
  'University of Sheffield',
  'University of Nottingham',
  'University of Liverpool',
  'Durham University',
  'University of St Andrews',
  'University of Aberdeen',
  'Queen Mary University of London',
  'University of Exeter',
  'University of York',
  'Lancaster University',
  'University of Sussex',
  'University of Bath',
  'Loughborough University',
  'Newcastle University',
  'Cardiff University',
  'University of Leicester',
  
  // Switzerland
  'ETH Zurich',
  'University of Zurich',
  'EPFL (École Polytechnique Fédérale de Lausanne)',
  'University of Geneva',
  'University of Basel',
  'University of Bern',
  'University of Lausanne',
  
  // Germany
  'Technical University of Munich',
  'Ludwig Maximilian University of Munich',
  'Heidelberg University',
  'Humboldt University of Berlin',
  'Free University of Berlin',
  'University of Bonn',
  'RWTH Aachen University',
  'University of Freiburg',
  'University of Göttingen',
  'University of Hamburg',
  'University of Cologne',
  'University of Frankfurt',
  'University of Tübingen',
  'Karlsruhe Institute of Technology',
  'TU Berlin',
  'TU Dresden',
  'University of Stuttgart',
  'University of Mannheim',
  
  // France
  'Sorbonne University',
  'École Normale Supérieure',
  'Sciences Po',
  'University of Paris',
  'École Polytechnique',
  'HEC Paris',
  'INSEAD',
  'Université Paris-Saclay',
  'Grenoble Alpes University',
  'Aix-Marseille University',
  
  // Italy
  'Sapienza University of Rome',
  'University of Bologna',
  'Politecnico di Milano',
  'University of Milan',
  'University of Padua',
  'University of Pisa',
  'University of Turin',
  'University of Florence',
  'University of Naples',
  
  // Netherlands
  'University of Amsterdam',
  'Delft University of Technology',
  'Utrecht University',
  'Leiden University',
  'Erasmus University Rotterdam',
  'University of Groningen',
  'Wageningen University',
  'Eindhoven University of Technology',
  
  // Belgium
  'KU Leuven',
  'Ghent University',
  'Université Libre de Bruxelles',
  'University of Antwerp',
  
  // Scandinavia
  'University of Copenhagen',
  'Lund University',
  'Stockholm University',
  'Uppsala University',
  'University of Helsinki',
  'University of Oslo',
  'Aalto University',
  'University of Bergen',
  'Aarhus University',
  'Technical University of Denmark',
  'Chalmers University of Technology',
  'Royal Institute of Technology (KTH)',
  
  // Spain & Portugal
  'University of Barcelona',
  'Autonomous University of Madrid',
  'Complutense University of Madrid',
  'Pompeu Fabra University',
  'IE Business School',
  'University of Valencia',
  'University of Lisbon',
  'University of Porto',
  'University of Coimbra',
  
  // Australia & New Zealand
  'Australian National University',
  'University of Melbourne',
  'University of Sydney',
  'University of Queensland',
  'Monash University',
  'University of New South Wales',
  'University of Adelaide',
  'University of Western Australia',
  'University of Technology Sydney',
  'Macquarie University',
  'Queensland University of Technology',
  'RMIT University',
  'University of Auckland',
  'University of Otago',
  'Victoria University of Wellington',
  'University of Canterbury',
  
  // Asia - Singapore
  'National University of Singapore',
  'Nanyang Technological University',
  'Singapore Management University',
  
  // Asia - China
  'Tsinghua University',
  'Peking University',
  'Fudan University',
  'Shanghai Jiao Tong University',
  'Zhejiang University',
  'University of Science and Technology of China',
  'Nanjing University',
  'Wuhan University',
  'Harbin Institute of Technology',
  'Xi\'an Jiaotong University',
  'Sun Yat-sen University',
  'Beihang University',
  'Sichuan University',
  'Tianjin University',
  'Nankai University',
  
  // Asia - Hong Kong
  'University of Hong Kong',
  'Chinese University of Hong Kong',
  'Hong Kong University of Science and Technology',
  'City University of Hong Kong',
  'Hong Kong Polytechnic University',
  
  // Asia - Japan
  'University of Tokyo',
  'Kyoto University',
  'Osaka University',
  'Tohoku University',
  'Nagoya University',
  'Hokkaido University',
  'Kyushu University',
  'Tokyo Institute of Technology',
  'Waseda University',
  'Keio University',
  
  // Asia - South Korea
  'Seoul National University',
  'KAIST',
  'Yonsei University',
  'Korea University',
  'Sungkyunkwan University',
  'POSTECH',
  'Hanyang University',
  
  // Asia - India
  'Indian Institute of Technology (IIT) Bombay',
  'Indian Institute of Technology (IIT) Delhi',
  'Indian Institute of Technology (IIT) Madras',
  'Indian Institute of Technology (IIT) Kanpur',
  'Indian Institute of Technology (IIT) Kharagpur',
  'Indian Institute of Technology (IIT) Roorkee',
  'Indian Institute of Technology (IIT) Guwahati',
  'Indian Institute of Science (IISc)',
  'Delhi University',
  'Jawaharlal Nehru University',
  'University of Mumbai',
  'University of Calcutta',
  'Banaras Hindu University',
  'Jadavpur University',
  'Anna University',
  'Birla Institute of Technology and Science (BITS Pilani)',
  
  // Middle East
  'Tel Aviv University',
  'Hebrew University of Jerusalem',
  'Technion - Israel Institute of Technology',
  'Weizmann Institute of Science',
  'King Abdullah University of Science and Technology',
  'American University of Beirut',
  'American University in Cairo',
  'Qatar University',
  'United Arab Emirates University',
  
  // Africa
  'University of Cape Town',
  'University of the Witwatersrand',
  'Stellenbosch University',
  'University of Pretoria',
  'University of Johannesburg',
  'Cairo University',
  'University of Nairobi',
  
  // Latin America
  'University of São Paulo',
  'University of Campinas',
  'Federal University of Rio de Janeiro',
  'National Autonomous University of Mexico',
  'University of Buenos Aires',
  'Pontifical Catholic University of Chile',
  'University of Chile',
  'University of the Andes (Colombia)',
  'Monterrey Institute of Technology',
  
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