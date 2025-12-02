import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, AlertTriangle, DollarSign, MapPin, Briefcase, Building2, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEAL_BREAKER_TYPES = [
  { value: 'min_salary', label: 'Minimum Salary', icon: DollarSign, placeholder: 'e.g., 80000' },
  { value: 'job_type', label: 'Job Type', icon: Briefcase, options: ['full-time', 'part-time', 'contract', 'remote'] },
  { value: 'location', label: 'Location', icon: MapPin, placeholder: 'e.g., San Francisco' },
  { value: 'skill_required', label: 'Must Use Technology', icon: Code, placeholder: 'e.g., React' },
  { value: 'company_size', label: 'Company Size', icon: Building2, options: ['1-10', '11-50', '51-200', '201-500', '500+'] }
];

export default function DealBreakersEditor({ dealBreakers = [], onChange }) {
  const [newType, setNewType] = useState('');
  const [newValue, setNewValue] = useState('');

  const addDealBreaker = () => {
    if (!newType || !newValue) return;
    onChange([...dealBreakers, { type: newType, value: newValue }]);
    setNewType('');
    setNewValue('');
  };

  const removeDealBreaker = (index) => {
    onChange(dealBreakers.filter((_, i) => i !== index));
  };

  const selectedType = DEAL_BREAKER_TYPES.find(t => t.value === newType);

  return (
    <Card className="p-4 border-amber-200 bg-amber-50/50">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-gray-900">Deal Breakers</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Jobs that don't meet these requirements will be filtered out or shown with warnings.
      </p>

      {/* Existing Deal Breakers */}
      <AnimatePresence>
        {dealBreakers.map((db, index) => {
          const typeInfo = DEAL_BREAKER_TYPES.find(t => t.value === db.type);
          const Icon = typeInfo?.icon || AlertTriangle;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mb-2"
            >
              <Badge variant="secondary" className="flex items-center gap-2 py-2 px-3">
                <Icon className="w-4 h-4" />
                <span className="font-medium">{typeInfo?.label}:</span>
                <span>{db.type === 'min_salary' ? `$${parseInt(db.value).toLocaleString()}` : db.value}</span>
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-500"
                onClick={() => removeDealBreaker(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Add New */}
      <div className="flex flex-wrap gap-2 mt-4">
        <Select value={newType} onValueChange={setNewType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            {DEAL_BREAKER_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedType?.options ? (
          <Select value={newValue} onValueChange={setNewValue}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {selectedType.options.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={selectedType?.placeholder || 'Enter value...'}
            className="w-[150px]"
          />
        )}

        <Button
          onClick={addDealBreaker}
          disabled={!newType || !newValue}
          size="sm"
          className="swipe-gradient text-white"
        >
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
    </Card>
  );
}