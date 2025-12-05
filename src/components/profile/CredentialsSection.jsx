import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  GraduationCap, Award, BadgeCheck, FileText, Plus, X, 
  Upload, Loader2, ExternalLink, Calendar, Building2, Trash2
} from 'lucide-react';

export default function CredentialsSection({ candidate, editing, editData, setEditData }) {
  const [activeModal, setActiveModal] = useState(null); // 'education', 'certification', 'award', 'license'
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({});

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, document_url: file_url });
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  const addItem = (type) => {
    const key = type === 'education' ? 'education' : 
                type === 'certification' ? 'certifications' :
                type === 'award' ? 'awards' : 'licenses';
    setEditData({
      ...editData,
      [key]: [...(editData[key] || []), formData]
    });
    setFormData({});
    setActiveModal(null);
  };

  const removeItem = (type, index) => {
    const key = type === 'education' ? 'education' : 
                type === 'certification' ? 'certifications' :
                type === 'award' ? 'awards' : 'licenses';
    setEditData({
      ...editData,
      [key]: editData[key].filter((_, i) => i !== index)
    });
  };

  const displayData = editing ? editData : candidate;

  return (
    <div className="space-y-6">
      {/* Education Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-500" />
            Education
          </CardTitle>
          {editing && (
            <Button size="sm" onClick={() => { setFormData({}); setActiveModal('education'); }}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {displayData?.education?.length > 0 ? (
            <div className="space-y-4">
              {displayData.education.map((edu, i) => (
                <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{edu.degree} in {edu.major}</h4>
                        <p className="text-gray-600">{edu.university}</p>
                        <p className="text-sm text-gray-500">Class of {edu.graduation_year} {edu.gpa && `• GPA: ${edu.gpa}`}</p>
                      </div>
                      {editing && (
                        <Button variant="ghost" size="sm" onClick={() => removeItem('education', i)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    {edu.document_url && (
                      <a href={edu.document_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 mt-2 hover:underline">
                        <FileText className="w-3 h-3" /> View Document
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No education added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Certifications Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-green-500" />
            Certifications
          </CardTitle>
          {editing && (
            <Button size="sm" onClick={() => { setFormData({}); setActiveModal('certification'); }}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {displayData?.certifications?.length > 0 ? (
            <div className="space-y-4">
              {displayData.certifications.map((cert, i) => (
                <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <BadgeCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                        <p className="text-gray-600">{cert.issuer}</p>
                        <p className="text-sm text-gray-500">
                          Issued {cert.issue_date} {cert.expiry_date && `• Expires ${cert.expiry_date}`}
                        </p>
                        {cert.credential_id && (
                          <p className="text-xs text-gray-400 mt-1">Credential ID: {cert.credential_id}</p>
                        )}
                      </div>
                      {editing && (
                        <Button variant="ghost" size="sm" onClick={() => removeItem('certification', i)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    {cert.document_url && (
                      <a href={cert.document_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-green-600 mt-2 hover:underline">
                        <FileText className="w-3 h-3" /> View Certificate
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No certifications added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Awards Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Awards & Honors
          </CardTitle>
          {editing && (
            <Button size="sm" onClick={() => { setFormData({}); setActiveModal('award'); }}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {displayData?.awards?.length > 0 ? (
            <div className="space-y-4">
              {displayData.awards.map((award, i) => (
                <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{award.title}</h4>
                        <p className="text-gray-600">{award.issuer}</p>
                        {award.date && <p className="text-sm text-gray-500">{award.date}</p>}
                        {award.description && <p className="text-sm text-gray-500 mt-1">{award.description}</p>}
                      </div>
                      {editing && (
                        <Button variant="ghost" size="sm" onClick={() => removeItem('award', i)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    {award.document_url && (
                      <a href={award.document_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-amber-600 mt-2 hover:underline">
                        <FileText className="w-3 h-3" /> View Document
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No awards added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Licenses Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            Professional Licenses
          </CardTitle>
          {editing && (
            <Button size="sm" onClick={() => { setFormData({}); setActiveModal('license'); }}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {displayData?.licenses?.length > 0 ? (
            <div className="space-y-4">
              {displayData.licenses.map((license, i) => (
                <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{license.name}</h4>
                        <p className="text-gray-600">{license.issuing_authority}</p>
                        <p className="text-sm text-gray-500">
                          License #: {license.license_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          Issued {license.issue_date} {license.expiry_date && `• Expires ${license.expiry_date}`}
                        </p>
                      </div>
                      {editing && (
                        <Button variant="ghost" size="sm" onClick={() => removeItem('license', i)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    {license.document_url && (
                      <a href={license.document_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-purple-600 mt-2 hover:underline">
                        <FileText className="w-3 h-3" /> View License
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No licenses added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Education Modal */}
      <Dialog open={activeModal === 'education'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Education</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Degree</Label>
                <Input placeholder="e.g., Bachelor's" value={formData.degree || ''} onChange={(e) => setFormData({ ...formData, degree: e.target.value })} />
              </div>
              <div>
                <Label>Major/Field</Label>
                <Input placeholder="e.g., Computer Science" value={formData.major || ''} onChange={(e) => setFormData({ ...formData, major: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>University/Institution</Label>
              <Input placeholder="e.g., MIT" value={formData.university || ''} onChange={(e) => setFormData({ ...formData, university: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Graduation Year</Label>
                <Input type="number" placeholder="2024" value={formData.graduation_year || ''} onChange={(e) => setFormData({ ...formData, graduation_year: parseInt(e.target.value) })} />
              </div>
              <div>
                <Label>GPA (optional)</Label>
                <Input placeholder="3.8" value={formData.gpa || ''} onChange={(e) => setFormData({ ...formData, gpa: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Upload Document (optional)</Label>
              <DocumentUpload uploading={uploading} documentUrl={formData.document_url} onUpload={handleFileUpload} onRemove={() => setFormData({ ...formData, document_url: '' })} />
            </div>
            <Button onClick={() => addItem('education')} className="w-full swipe-gradient text-white" disabled={!formData.degree || !formData.university}>
              Add Education
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Certification Modal */}
      <Dialog open={activeModal === 'certification'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Certification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Certification Name</Label>
              <Input placeholder="e.g., AWS Solutions Architect" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label>Issuing Organization</Label>
              <Input placeholder="e.g., Amazon Web Services" value={formData.issuer || ''} onChange={(e) => setFormData({ ...formData, issuer: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Input type="month" value={formData.issue_date || ''} onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })} />
              </div>
              <div>
                <Label>Expiry Date (optional)</Label>
                <Input type="month" value={formData.expiry_date || ''} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Credential ID (optional)</Label>
              <Input placeholder="e.g., ABC123XYZ" value={formData.credential_id || ''} onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })} />
            </div>
            <div>
              <Label>Upload Certificate (optional)</Label>
              <DocumentUpload uploading={uploading} documentUrl={formData.document_url} onUpload={handleFileUpload} onRemove={() => setFormData({ ...formData, document_url: '' })} />
            </div>
            <Button onClick={() => addItem('certification')} className="w-full swipe-gradient text-white" disabled={!formData.name || !formData.issuer}>
              Add Certification
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Award Modal */}
      <Dialog open={activeModal === 'award'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Award</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Award Title</Label>
              <Input placeholder="e.g., Employee of the Year" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div>
              <Label>Issuer/Organization</Label>
              <Input placeholder="e.g., Google Inc." value={formData.issuer || ''} onChange={(e) => setFormData({ ...formData, issuer: e.target.value })} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="month" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea placeholder="Brief description..." value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div>
              <Label>Upload Document (optional)</Label>
              <DocumentUpload uploading={uploading} documentUrl={formData.document_url} onUpload={handleFileUpload} onRemove={() => setFormData({ ...formData, document_url: '' })} />
            </div>
            <Button onClick={() => addItem('award')} className="w-full swipe-gradient text-white" disabled={!formData.title}>
              Add Award
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* License Modal */}
      <Dialog open={activeModal === 'license'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Professional License</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>License Name</Label>
              <Input placeholder="e.g., CPA, RN, PE" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label>Issuing Authority</Label>
              <Input placeholder="e.g., State Board of Accountancy" value={formData.issuing_authority || ''} onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })} />
            </div>
            <div>
              <Label>License Number</Label>
              <Input placeholder="e.g., 123456" value={formData.license_number || ''} onChange={(e) => setFormData({ ...formData, license_number: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Input type="month" value={formData.issue_date || ''} onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })} />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="month" value={formData.expiry_date || ''} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Upload License (optional)</Label>
              <DocumentUpload uploading={uploading} documentUrl={formData.document_url} onUpload={handleFileUpload} onRemove={() => setFormData({ ...formData, document_url: '' })} />
            </div>
            <Button onClick={() => addItem('license')} className="w-full swipe-gradient text-white" disabled={!formData.name || !formData.issuing_authority}>
              Add License
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentUpload({ uploading, documentUrl, onUpload, onRemove }) {
  return (
    <div className="mt-2">
      {documentUrl ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <FileText className="w-6 h-6 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-700">Document uploaded</p>
            <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">
              View document
            </a>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <X className="w-4 h-4 text-green-600" />
          </Button>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-pink-400 transition-colors">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
          ) : (
            <>
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500 text-sm">Click to upload</span>
            </>
          )}
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
}