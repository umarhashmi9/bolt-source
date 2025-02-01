import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { UserCircle } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export default function ProfileTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('bolt_user_profile');
    return saved
      ? JSON.parse(saved)
      : {
          avatar: null,
          username: '',
          bio: '',
          notifications: true,
        };
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsLoading(true);

    try {
      const reader = new FileReader();

      reader.onloadend = () => {
        const updatedProfile = { ...profile, avatar: reader.result as string };
        setProfile(updatedProfile);
        localStorage.setItem('bolt_user_profile', JSON.stringify(updatedProfile));
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'bolt_user_profile',
            newValue: JSON.stringify(updatedProfile),
          }),
        );
        setIsLoading(false);
        toast.success('Avatar updated successfully');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem('bolt_user_profile', JSON.stringify(profile));
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'bolt_user_profile',
          newValue: JSON.stringify(profile),
        }),
      );
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="space-y-6 p-4 bg-[#FAFAFA] dark:bg-[#0A0A0A] rounded-lg">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={ALLOWED_FILE_TYPES.join(',')}
            onChange={handleAvatarUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="absolute bottom-0 right-0 p-1 rounded-full bg-purple-500 text-white hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <motion.div
                className="w-4 h-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <div className="i-ph:spinner" />
              </motion.div>
            ) : (
              <div className="i-ph:pencil-simple w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex-1 space-y-3">
          <input
            type="text"
            placeholder="Username"
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
          />
          <textarea
            placeholder="Bio"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors resize-none"
            rows={3}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={profile.notifications}
            onChange={(e) => setProfile({ ...profile, notifications: e.target.checked })}
            className="form-checkbox h-4 w-4 text-purple-500 rounded border-gray-300 dark:border-gray-600"
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">Enable notifications</span>
        </label>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-md bg-purple-500 text-white hover:bg-purple-600 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
