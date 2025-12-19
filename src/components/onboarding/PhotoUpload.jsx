import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ImageCropper from '@/components/shared/ImageCropper';

export default function PhotoUpload({ value, onChange, required = false }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|heic)/)) {
      alert('Please upload a JPG, PNG, or HEIC image');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedBlob) => {
    setUploading(true);
    setShowCropper(false);

    try {
      const file = new File([croppedBlob], 'profile-photo.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setPreview(file_url);
      onChange(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        {/* Photo Preview */}
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
              type="button"
              aria-label="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center border-4 border-white shadow-lg">
            <Camera className="w-12 h-12 text-pink-400" />
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/heic"
            onChange={handleFileSelect}
            className="hidden"
            id="photo-upload"
          />
          <label htmlFor="photo-upload">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              className="cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {preview ? 'Change Photo' : 'Upload Photo'}
                </>
              )}
            </Button>
          </label>
        </div>

        <p className="text-xs text-gray-500 text-center mt-2">
          JPG, PNG, or HEIC • Max 10MB
          {required && <span className="text-red-500 ml-1">*</span>}
        </p>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && selectedFile && (
        <ImageCropper
          image={selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setSelectedFile(null);
          }}
          aspectRatio={1}
          shape="round"
        />
      )}
    </div>
  );
}