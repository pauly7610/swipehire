import React from 'react';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EEOQuestionnaire({ data, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-gray-700">
          <strong className="block mb-2">Why we ask these questions</strong>
          Employers are required by law to collect this information for government reporting purposes.
          This data helps ensure equal employment opportunities for all applicants.
          <strong className="block mt-2">All questions are optional and your responses will not affect your job opportunities.</strong>
        </AlertDescription>
      </Alert>

      {/* Gender */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Gender (Optional)</Label>
        <p className="text-sm text-gray-600">Select the option that best describes you</p>
        <div className="space-y-2">
          {[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'non-binary', label: 'Non-binary' },
            { value: 'prefer-not-to-say', label: 'I prefer not to answer' }
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                data.gender === option.value
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="gender"
                value={option.value}
                checked={data.gender === option.value}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="ml-3 text-gray-900">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Race/Ethnicity */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Race/Ethnicity (Optional)</Label>
        <p className="text-sm text-gray-600">
          Please identify your race/ethnicity. You may select more than one.
        </p>
        <div className="space-y-2">
          {[
            { value: 'hispanic-latino', label: 'Hispanic or Latino' },
            { value: 'white', label: 'White (Not Hispanic or Latino)' },
            { value: 'black-african-american', label: 'Black or African American (Not Hispanic or Latino)' },
            { value: 'native-american-alaska-native', label: 'Native American or Alaska Native' },
            { value: 'asian', label: 'Asian' },
            { value: 'native-hawaiian-pacific-islander', label: 'Native Hawaiian or Other Pacific Islander' },
            { value: 'two-or-more', label: 'Two or More Races' },
            { value: 'prefer-not-to-say', label: 'I prefer not to answer' }
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                data.race === option.value
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="race"
                value={option.value}
                checked={data.race === option.value}
                onChange={(e) => handleChange('race', e.target.value)}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="ml-3 text-gray-900">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Veteran Status */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Veteran Status (Optional)</Label>
        <p className="text-sm text-gray-600">
          A "veteran" is defined as a person who served on active duty in the U.S. Armed Forces
          and was discharged or released under conditions other than dishonorable.
        </p>
        <div className="space-y-2">
          {[
            { value: 'protected-veteran', label: 'I am a protected veteran' },
            { value: 'not-protected-veteran', label: 'I am not a protected veteran' },
            { value: 'prefer-not-to-say', label: 'I prefer not to answer' }
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                data.veteran_status === option.value
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="veteran_status"
                value={option.value}
                checked={data.veteran_status === option.value}
                onChange={(e) => handleChange('veteran_status', e.target.value)}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="ml-3 text-gray-900">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Disability Status */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Disability Status (Optional)</Label>
        <p className="text-sm text-gray-600">
          A disability is a physical or mental impairment that substantially limits one or more major life activities.
          This includes conditions like blindness, deafness, mobility impairments, intellectual disabilities,
          psychological disorders, and certain chronic health conditions.
        </p>
        <div className="space-y-2">
          {[
            {
              value: 'yes-disability',
              label: 'Yes, I have a disability (or previously had a disability)'
            },
            {
              value: 'no-disability',
              label: 'No, I don\'t have a disability'
            },
            {
              value: 'prefer-not-to-say',
              label: 'I prefer not to answer'
            }
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                data.disability_status === option.value
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="disability_status"
                value={option.value}
                checked={data.disability_status === option.value}
                onChange={(e) => handleChange('disability_status', e.target.value)}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="ml-3 text-gray-900">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Privacy Notice */}
      <Alert className="bg-gray-50 border-gray-200">
        <AlertDescription className="text-xs text-gray-600">
          <strong>Privacy & Confidentiality:</strong> All information provided is kept confidential and separate
          from your application. This data is used solely for equal employment opportunity analysis and government
          reporting requirements. It will not be used in making any employment decisions.
        </AlertDescription>
      </Alert>
    </div>
  );
}
