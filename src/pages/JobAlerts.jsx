import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, Plus, Pencil, Trash2, Loader2, BellRing, 
  Mail, Sparkles, MapPin, DollarSign, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JobAlertForm from '@/components/alerts/JobAlertForm';

export default function JobAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [matchingJobs, setMatchingJobs] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [candidateData] = await base44.entities.Candidate.filter({ user_id: currentUser.id });
      setCandidate(candidateData);

      if (candidateData) {
        const userAlerts = await base44.entities.JobAlert.filter({ candidate_id: candidateData.id });
        setAlerts(userAlerts);

        // Get matching job counts
        const jobs = await base44.entities.Job.filter({ is_active: true });
        const counts = {};
        userAlerts.forEach(alert => {
          counts[alert.id] = jobs.filter(job => matchesAlert(job, alert)).length;
        });
        setMatchingJobs(counts);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const matchesAlert = (job, alert) => {
    // Skills match
    if (alert.skills?.length > 0) {
      const jobSkills = (job.skills_required || []).map(s => s.toLowerCase());
      const hasSkillMatch = alert.skills.some(s => jobSkills.includes(s.toLowerCase()));
      if (!hasSkillMatch) return false;
    }

    // Experience level
    if (alert.experience_level && alert.experience_level !== 'any') {
      if (job.experience_level_required && job.experience_level_required !== alert.experience_level) {
        return false;
      }
    }

    // Job type
    if (alert.job_types?.length > 0) {
      if (!alert.job_types.includes(job.job_type)) return false;
    }

    // Location
    if (alert.locations?.length > 0) {
      const jobLocation = (job.location || '').toLowerCase();
      const locationMatch = alert.locations.some(loc => 
        jobLocation.includes(loc.toLowerCase()) || loc.toLowerCase() === 'remote'
      );
      if (!locationMatch && job.job_type !== 'remote') return false;
    }

    // Salary
    if (alert.salary_min && job.salary_max && job.salary_max < alert.salary_min) {
      return false;
    }

    return true;
  };

  const handleSaveAlert = async (alertData) => {
    if (editingAlert) {
      await base44.entities.JobAlert.update(editingAlert.id, alertData);
    } else {
      await base44.entities.JobAlert.create({
        ...alertData,
        candidate_id: candidate.id,
        user_id: user.id
      });
    }
    setShowForm(false);
    setEditingAlert(null);
    loadData();
  };

  const toggleAlert = async (alert) => {
    await base44.entities.JobAlert.update(alert.id, { is_active: !alert.is_active });
    setAlerts(alerts.map(a => a.id === alert.id ? { ...a, is_active: !a.is_active } : a));
  };

  const deleteAlert = async (alertId) => {
    await base44.entities.JobAlert.delete(alertId);
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Job Alerts</h1>
            <p className="text-gray-500">Get notified when jobs match your criteria</p>
          </div>
          <Button
            onClick={() => { setEditingAlert(null); setShowForm(true); }}
            className="swipe-gradient text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Alert
          </Button>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <JobAlertForm
                alert={editingAlert}
                onSave={handleSaveAlert}
                onCancel={() => { setShowForm(false); setEditingAlert(null); }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alerts List */}
        {alerts.length === 0 && !showForm ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
              <BellRing className="w-8 h-8 text-pink-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Job Alerts Yet</h3>
            <p className="text-gray-500 mb-6">Create alerts to get notified when new jobs match your preferences</p>
            <Button
              onClick={() => setShowForm(true)}
              className="swipe-gradient text-white"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Create Your First Alert
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`p-5 transition-all ${!alert.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          alert.is_active ? 'swipe-gradient' : 'bg-gray-200'
                        }`}>
                          <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{alert.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {matchingJobs[alert.id] || 0} matching jobs
                            </span>
                            {alert.notify_email && <Mail className="w-4 h-4" />}
                            {alert.notify_in_app && <Bell className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Criteria Tags */}
                      <div className="flex flex-wrap gap-2">
                        {alert.skills?.slice(0, 3).map((skill) => (
                          <Badge key={skill} className="bg-pink-100 text-pink-700 text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {alert.skills?.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{alert.skills.length - 3} more
                          </Badge>
                        )}
                        {alert.experience_level && alert.experience_level !== 'any' && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {alert.experience_level}
                          </Badge>
                        )}
                        {alert.locations?.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {alert.locations[0]}
                            {alert.locations.length > 1 && ` +${alert.locations.length - 1}`}
                          </Badge>
                        )}
                        {alert.salary_min > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <DollarSign className="w-3 h-3" />
                            {(alert.salary_min / 1000).toFixed(0)}k+
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs capitalize">
                          {alert.frequency}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.is_active}
                        onCheckedChange={() => toggleAlert(alert)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingAlert(alert); setShowForm(true); }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAlert(alert.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}