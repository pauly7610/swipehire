import React, { useState } from 'react';
import { X, Mail, Phone, Linkedin, FileText, Star, Plus, Calendar, MessageSquare, Phone as PhoneIcon, Video, Edit2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export default function CRMCandidateDetail({ candidate, activities, tasks, jobs, onClose, onAddActivity, onAddTask, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(candidate);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityType, setActivityType] = useState('note');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  const handleSave = () => {
    onUpdate(editData);
    setEditing(false);
  };

  const handleAddActivity = async () => {
    if (!activityTitle) return;
    
    await onAddActivity(candidate.id, {
      activity_type: activityType,
      title: activityTitle,
      description: activityDescription
    });

    setActivityTitle('');
    setActivityDescription('');
    setShowActivityForm(false);
  };

  const handleAddTask = async () => {
    if (!taskTitle) return;
    
    await onAddTask({
      crm_candidate_id: candidate.id,
      title: taskTitle,
      description: taskDescription,
      due_date: taskDueDate
    });

    setTaskTitle('');
    setTaskDescription('');
    setTaskDueDate('');
    setShowTaskForm(false);
  };

  const activityIcons = {
    email: Mail,
    call: PhoneIcon,
    meeting: Video,
    note: MessageSquare,
    stage_change: Calendar
  };

  const job = jobs.find(j => j.id === candidate.job_id);

  return (
    <div className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-white shadow-2xl z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
        <h2 className="text-xl font-bold text-gray-900">Candidate Details</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Section */}
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl font-bold text-pink-500">
              {candidate.name.charAt(0)}
            </span>
          </div>
          {editing ? (
            <Input
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="text-center text-xl font-bold"
            />
          ) : (
            <h3 className="text-2xl font-bold text-gray-900">{candidate.name}</h3>
          )}
          {job && (
            <p className="text-gray-600 mt-1">Applied for: {job.title}</p>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-6 h-6 cursor-pointer ${
                i < (editing ? editData.rating || 0 : candidate.rating || 0)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
              onClick={() => editing && setEditData({ ...editData, rating: i + 1 })}
            />
          ))}
        </div>

        {/* Contact Info */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Contact Information</h4>
              {!editing ? (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleSave} className="text-green-600">
                  <Save className="w-4 h-4" />
                </Button>
              )}
            </div>

            {editing ? (
              <>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={editData.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>LinkedIn</Label>
                  <Input
                    value={editData.linkedin_url || ''}
                    onChange={(e) => setEditData({ ...editData, linkedin_url: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </>
            ) : (
              <>
                {candidate.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline">
                      {candidate.email}
                    </a>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${candidate.phone}`} className="text-blue-600 hover:underline">
                      {candidate.phone}
                    </a>
                  </div>
                )}
                {candidate.linkedin_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Linkedin className="w-4 h-4 text-gray-400" />
                    <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      LinkedIn Profile
                    </a>
                  </div>
                )}
                {candidate.resume_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      View Resume
                    </a>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        {editing ? (
          <Card>
            <CardContent className="p-4">
              <Label>Tags (comma separated)</Label>
              <Input
                value={editData.tags?.join(', ') || ''}
                onChange={(e) => setEditData({ ...editData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                className="mt-1"
                placeholder="React, Senior, Remote"
              />
            </CardContent>
          </Card>
        ) : candidate.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {candidate.tags.map((tag, i) => (
              <Badge key={i} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}

        {/* Notes */}
        <Card>
          <CardContent className="p-4">
            <Label>Internal Notes</Label>
            {editing ? (
              <Textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                className="mt-2"
                rows={4}
              />
            ) : (
              <p className="text-sm text-gray-600 mt-2">{candidate.notes || 'No notes yet'}</p>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Tasks</h4>
              <Button variant="ghost" size="sm" onClick={() => setShowTaskForm(!showTaskForm)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {showTaskForm && (
              <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <Input
                  placeholder="Task title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Description"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={2}
                />
                <Input
                  type="datetime-local"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddTask} size="sm" className="swipe-gradient text-white">
                    Add Task
                  </Button>
                  <Button onClick={() => setShowTaskForm(false)} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {tasks.length === 0 ? (
              <p className="text-sm text-gray-500">No tasks yet</p>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.description && <p className="text-xs text-gray-600 mt-1">{task.description}</p>}
                    {task.due_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {format(new Date(task.due_date), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Activity Timeline</h4>
              <Button variant="ghost" size="sm" onClick={() => setShowActivityForm(!showActivityForm)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {showActivityForm && (
              <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Activity title"
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Description"
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddActivity} size="sm" className="swipe-gradient text-white">
                    Add Activity
                  </Button>
                  <Button onClick={() => setShowActivityForm(false)} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.map(activity => {
                const Icon = activityIcons[activity.activity_type] || MessageSquare;
                return (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-pink-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(activity.created_date), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}