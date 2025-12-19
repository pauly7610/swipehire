import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function CRMTaskList({ tasks, candidates, onUpdateTask, onAddTask }) {
  const [showForm, setShowForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [selectedCandidate, setSelectedCandidate] = useState('');

  const handleAddTask = async () => {
    if (!taskTitle) return;

    await onAddTask({
      title: taskTitle,
      description: taskDescription,
      due_date: taskDueDate,
      priority: taskPriority,
      crm_candidate_id: selectedCandidate || undefined
    });

    setTaskTitle('');
    setTaskDescription('');
    setTaskDueDate('');
    setTaskPriority('medium');
    setSelectedCandidate('');
    setShowForm(false);
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const getCandidateName = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId);
    return candidate ? candidate.name : 'General Task';
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Pending Tasks</h3>
            <Button onClick={() => setShowForm(!showForm)} className="swipe-gradient text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>

          {showForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <Input
                placeholder="Task title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
              <Textarea
                placeholder="Description (optional)"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={3}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Due Date</label>
                  <Input
                    type="datetime-local"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Priority</label>
                  <Select value={taskPriority} onValueChange={setTaskPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Related Candidate (optional)</label>
                <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {candidates.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddTask} className="swipe-gradient text-white">
                  Create Task
                </Button>
                <Button onClick={() => setShowForm(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {pendingTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No pending tasks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => onUpdateTask(task.id, { status: 'completed' })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={priorityColors[task.priority]}>
                            {task.priority}
                          </Badge>
                          {task.crm_candidate_id && (
                            <Badge variant="outline">
                              {getCandidateName(task.crm_candidate_id)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(task.due_date), 'MMM d, h:mm a')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {completedTasks.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Completed Tasks</h3>
            <div className="space-y-3">
              {completedTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-4 bg-gray-50 border rounded-lg opacity-60">
                  <Checkbox checked={true} disabled className="mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 line-through">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}