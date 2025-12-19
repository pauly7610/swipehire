import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GraduationCap } from 'lucide-react';

export default function EducationForm({ education = [], onChange }) {
  const addEducation = () => {
    onChange([...education, {
      school: '',
      degree: '',
      major: '',
      graduation_year: '',
      gpa: ''
    }]);
  };

  const updateEducation = (index, field, value) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeEducation = (index) => {
    onChange(education.filter((_, i) => i !== index));
  };

  if (education.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
          <GraduationCap className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 mb-2">No education added yet</p>
        <p className="text-sm text-gray-500 mb-4">This is optional but recommended</p>
        <Button onClick={addEducation} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Education
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {education.map((edu, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Education #{index + 1}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeEducation(index)}
                className="text-red-600 hover:bg-red-50"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>School / University</Label>
                <Input
                  value={edu.school}
                  onChange={(e) => updateEducation(index, 'school', e.target.value)}
                  placeholder="Harvard University"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Degree</Label>
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    placeholder="Bachelor's, Master's, PhD..."
                  />
                </div>

                <div>
                  <Label>Field of Study</Label>
                  <Input
                    value={edu.major}
                    onChange={(e) => updateEducation(index, 'major', e.target.value)}
                    placeholder="Computer Science"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Graduation Year</Label>
                  <Input
                    type="number"
                    value={edu.graduation_year}
                    onChange={(e) => updateEducation(index, 'graduation_year', e.target.value)}
                    placeholder="2020"
                    min="1950"
                    max={new Date().getFullYear() + 10}
                  />
                </div>

                <div>
                  <Label>GPA (optional)</Label>
                  <Input
                    value={edu.gpa}
                    onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                    placeholder="3.8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={addEducation}
        variant="outline"
        className="w-full border-dashed border-2"
        type="button"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Education
      </Button>
    </div>
  );
}