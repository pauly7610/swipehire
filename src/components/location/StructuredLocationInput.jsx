import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'France', 'India', 'Singapore', 'Netherlands', 'Sweden', 'Remote/Global'
];

export default function StructuredLocationInput({ value, onChange, className = '' }) {
  const [location, setLocation] = React.useState({
    city: '',
    state: '',
    country: 'United States',
    zipCode: '',
    ...parseLocation(value)
  });

  function parseLocation(locationString) {
    if (!locationString) return {};
    
    const parts = locationString.split(',').map(p => p.trim());
    if (parts.length === 4) {
      return { city: parts[0], state: parts[1], zipCode: parts[2], country: parts[3] };
    } else if (parts.length === 3) {
      return { city: parts[0], state: parts[1], country: parts[2] };
    } else if (parts.length === 2) {
      return { city: parts[0], country: parts[1] };
    }
    return { city: locationString };
  }

  const updateLocation = (field, val) => {
    const updated = { ...location, [field]: val };
    setLocation(updated);
    
    // Build formatted string
    const parts = [];
    if (updated.city) parts.push(updated.city);
    if (updated.state && updated.country === 'United States') parts.push(updated.state);
    if (updated.zipCode) parts.push(updated.zipCode);
    if (updated.country) parts.push(updated.country);
    
    onChange(parts.join(', '));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-sm dark:text-gray-300">City</Label>
          <Input
            placeholder="San Francisco"
            value={location.city}
            onChange={(e) => updateLocation('city', e.target.value)}
            className="mt-1 h-11"
          />
        </div>
        
        {location.country === 'United States' && (
          <div>
            <Label className="text-sm dark:text-gray-300">State</Label>
            <Select value={location.state} onValueChange={(v) => updateLocation('state', v)}>
              <SelectTrigger className="mt-1 h-11">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {US_STATES.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-sm dark:text-gray-300">Country</Label>
          <Select value={location.country} onValueChange={(v) => updateLocation('country', v)}>
            <SelectTrigger className="mt-1 h-11">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(country => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {location.country === 'United States' && (
          <div>
            <Label className="text-sm dark:text-gray-300">Zip Code (optional)</Label>
            <Input
              placeholder="94102"
              value={location.zipCode}
              onChange={(e) => updateLocation('zipCode', e.target.value)}
              className="mt-1 h-11"
              maxLength={5}
            />
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
        <MapPin className="w-4 h-4 text-pink-500" />
        <span className="font-medium">
          {value || 'No location set'}
        </span>
      </div>
    </div>
  );
}