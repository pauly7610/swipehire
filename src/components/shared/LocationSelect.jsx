import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const LOCATIONS = [
  // Remote
  'Remote',
  'Remote - US Only',
  'Remote - Worldwide',
  'Hybrid',
  // US Major Cities
  'New York, NY',
  'San Francisco, CA',
  'Los Angeles, CA',
  'San Jose, CA',
  'Seattle, WA',
  'Austin, TX',
  'Boston, MA',
  'Chicago, IL',
  'Denver, CO',
  'Atlanta, GA',
  'Miami, FL',
  'Dallas, TX',
  'Houston, TX',
  'Phoenix, AZ',
  'Philadelphia, PA',
  'San Diego, CA',
  'Portland, OR',
  'Washington, DC',
  'Minneapolis, MN',
  'Detroit, MI',
  'Nashville, TN',
  'Raleigh, NC',
  'Charlotte, NC',
  'Salt Lake City, UT',
  'Las Vegas, NV',
  'Orlando, FL',
  'Tampa, FL',
  // US States/Regions
  'California',
  'Texas',
  'New York',
  'Florida',
  'Washington',
  'Colorado',
  'Massachusetts',
  'Illinois',
  // International
  'London, UK',
  'Berlin, Germany',
  'Paris, France',
  'Amsterdam, Netherlands',
  'Dublin, Ireland',
  'Toronto, Canada',
  'Vancouver, Canada',
  'Sydney, Australia',
  'Melbourne, Australia',
  'Singapore',
  'Tokyo, Japan',
  'Tel Aviv, Israel',
  'Bangalore, India',
  'Mumbai, India',
  'São Paulo, Brazil',
  'Mexico City, Mexico',
  // Other
  'Other'
];

export default function LocationSelect({ value, onChange, placeholder = "Select location", allowCustom = true }) {
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
          placeholder="Enter location"
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
        {LOCATIONS.map(loc => (
          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}