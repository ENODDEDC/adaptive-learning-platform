'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ProfilePictureUpload = ({ currentImage, onImageUpdate }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    console.log('Crop complete:', { croppedArea, croppedAreaPixels });
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSaveCrop = async () => {
    const uploadToast = toast.loading('Uploading profile picture...');
    
    try {
      setIsUploading(true);
      console.log('🚀 Starting crop process...');
      console.log('📐 Cropped area pixels:', croppedAreaPixels);
      console.log('🖼️ Current image:', currentImage);
      console.log('📸 Selected image length:', selectedImage?.length);
      
      if (!croppedAreaPixels) {
        toast.error('Please wait for the crop area to be calculated', { id: uploadToast });
        setIsUploading(false);
        return;
      }

      console.log('✂️ Creating cropped blob...');
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      console.log('✅ Cropped blob created:', {
        size: croppedBlob.size,
        type: croppedBlob.type
      });
      
      const formData = new FormData();
      formData.append('profilePicture', croppedBlob, 'profile.jpg');
      console.log('📦 FormData created');

      console.log('📡 Sending upload request to /api/auth/profile/picture...');
      const res = await fetch('/api/auth/profile/picture', {
        method: 'POST',
        body: formData,
      });

      console.log('📨 Response received - Status:', res.status);
      const data = await res.json();
      console.log('📄 Response data:', data);

      if (res.ok) {
        console.log('✅ Upload successful!');
        console.log('🔗 New image URL:', data.imageUrl);
        console.log('👤 Updated user:', data.user);
        
        toast.success('Profile picture updated!', { id: uploadToast });
        
        console.log('🔄 Calling onImageUpdate with:', data.imageUrl);
        await onImageUpdate(data.imageUrl);
        
        console.log('🧹 Cleaning up modal...');
        setShowCropModal(false);
        setSelectedImage(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        
        console.log('✨ Upload process complete!');
      } else {
        console.error('❌ Upload failed:', data);
        toast.error(`Failed: ${data.message || 'Unknown error'}`, { id: uploadToast });
      }
    } catch (error) {
      console.error('💥 Error uploading image:', error);
      console.error('Stack:', error.stack);
      toast.error(`Error: ${error.message}`, { id: uploadToast });
    } finally {
      setIsUploading(false);
      console.log('🏁 Upload attempt finished');
    }
  };

  const handleCancel = () => {
    setShowCropModal(false);
    setSelectedImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {currentImage ? (
              <img 
                src={currentImage} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('❌ Failed to load image:', currentImage);
                  e.target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('✅ Image loaded successfully:', currentImage);
                }}
              />
            ) : (
              <UserIcon className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <label
            htmlFor="profile-picture-input"
            className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
            title="Upload profile picture"
          >
            <CameraIcon className="w-4 h-4 text-white" />
            <input
              id="profile-picture-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">Profile Picture</h3>
          <p className="text-xs text-gray-500 mt-1">
            Click the camera icon to upload a new picture
          </p>
          {currentImage && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Picture uploaded
            </p>
          )}
        </div>
      </div>

      {showCropModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Crop Profile Picture</h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zoom
                </label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCrop}
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UserIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default ProfilePictureUpload;
