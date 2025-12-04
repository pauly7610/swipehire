import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance & Banking',
  'Marketing & Advertising',
  'Sales',
  'Human Resources',
  'Education',
  'Manufacturing',
  'Retail & E-commerce',
  'Real Estate',
  'Legal',
  'Consulting',
  'Media & Entertainment',
  'Hospitality & Tourism',
  'Transportation & Logistics',
  'Energy & Utilities',
  'Construction',
  'Government & Public Sector',
  'Non-Profit',
  'Telecommunications',
  'Aerospace & Defense',
  'Automotive',
  'Pharmaceutical',
  'Agriculture',
  'Other'
];

export default function IndustrySelect({ value, onChange, placeholder = "Select industry" }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {INDUSTRIES.map(industry => (
          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}