import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Briefcase, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ExperienceForm({ experiences = [], onChange }) {
  const [errors, setErrors] = useState({});

  const addExperience = () => {
    const newExp = {
      id: crypto.randomUUID ? crypto.randomUUID() : `exp_${Date.now()}_${Math.random()}`,
      company: '',
      title: '',
      location: '',
      start_date: '',
      end_date: '',
      current: false,
      description: ''
    };
    onChange([...experiences, newExp]);
  };

  const updateExperience = (index, field, value) => {
    const updated = experiences.map((exp, i) => {
      if (i !== index) return exp;
      
      const updatedExp = { ...exp, [field]: value };
      
      // Clear end_date if marked as current
      if (field === 'current' && value) {
        updatedExp.end_date = '';
      }
      
      return updatedExp;
    });
    
    onChange(updated);
    
    // Clear validation error for this specific entry
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const removeExperience = (index) => {
    onChange(experiences.filter((_, i) => i !== index));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(experiences);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    
    onChange(items);
  };

  const validateExperience = (exp, index) => {
    const newErrors = {};
    if (!exp.company?.trim()) newErrors.company = 'Company is required';
    if (!exp.title?.trim()) newErrors.title = 'Title is required';
    if (!exp.start_date) newErrors.start_date = 'Start date is required';
    if (!exp.current && !exp.end_date) newErrors.end_date = 'End date is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors({ ...errors, [index]: newErrors });
      return false;
    }
    return true;
  };

  if (experiences.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
          <Briefcase className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 mb-4">No work experience added yet</p>
        <Button onClick={addExperience} className="swipe-gradient text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add First Experience
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="experiences">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {experiences.map((exp, index) => (
                <Draggable key={exp.id || index} draggableId={exp.id || `exp-${index}`} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`${snapshot.isDragging ? 'shadow-lg' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-4">
                          <div {...provided.dragHandleProps} className="pt-2 cursor-grab">
                            <GripVertical className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              Experience #{index + 1}
                            </h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExperience(index)}
                            className="text-red-600 hover:bg-red-50"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-4 ml-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>
                                Company <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                value={exp.company}
                                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                placeholder="Google, Microsoft, etc."
                                className={errors[index]?.company ? 'border-red-300' : ''}
                              />
                              {errors[index]?.company && (
                                <p className="text-xs text-red-600 mt-1">{errors[index].company}</p>
                              )}
                            </div>

                            <div>
                              <Label>
                                Title <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                value={exp.title}
                                onChange={(e) => updateExperience(index, 'title', e.target.value)}
                                placeholder="Software Engineer, Designer..."
                                className={errors[index]?.title ? 'border-red-300' : ''}
                              />
                              {errors[index]?.title && (
                                <p className="text-xs text-red-600 mt-1">{errors[index].title}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label>Location</Label>
                            <Input
                              value={exp.location}
                              onChange={(e) => updateExperience(index, 'location', e.target.value)}
                              placeholder="San Francisco, CA (optional)"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>
                                Start Date <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                type="month"
                                value={exp.start_date}
                                onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                                className={errors[index]?.start_date ? 'border-red-300' : ''}
                              />
                              {errors[index]?.start_date && (
                                <p className="text-xs text-red-600 mt-1">{errors[index].start_date}</p>
                              )}
                            </div>

                            <div>
                              <Label>
                                End Date {!exp.current && <span className="text-red-500">*</span>}
                              </Label>
                              <Input
                                type="month"
                                value={exp.end_date}
                                onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                                disabled={exp.current}
                                className={errors[index]?.end_date ? 'border-red-300' : ''}
                              />
                              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={exp.current}
                                  onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                />
                                <span className="text-sm text-gray-600">I currently work here</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={exp.description}
                              onChange={(e) => updateExperience(index, 'description', e.target.value)}
                              placeholder="Describe your responsibilities, achievements, and impact..."
                              rows={4}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Button
        onClick={addExperience}
        variant="outline"
        className="w-full border-dashed border-2"
        type="button"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Experience
      </Button>
    </div>
  );
}