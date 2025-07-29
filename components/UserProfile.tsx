import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';

interface UserProfileProps {
  onClose?: () => void;
}

export default function UserProfile({ onClose }: UserProfileProps) {
  const { user, logout, updateUser, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    organization: user?.organization || '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMessage(null);

    try {
      const result = await updateUser({
        name: formData.name.trim() || undefined,
        organization: formData.organization.trim() || undefined,
      });

      if (result.success) {
        setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
      } else {
        setUpdateMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      setUpdateMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose?.();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ANALYST': return 'Analyst';
      case 'SENIOR_ANALYST': return 'Senior Analyst';
      case 'MANAGER': return 'Manager';
      case 'ADMIN': return 'Administrator';
      case 'SUPER_ADMIN': return 'Super Administrator';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ANALYST': return 'bg-blue-100 text-blue-800';
      case 'SENIOR_ANALYST': return 'bg-green-100 text-green-800';
      case 'MANAGER': return 'bg-yellow-100 text-yellow-800';
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">User Profile</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* User Information */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium text-lg">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">{user.name || 'Anonymous User'}</h4>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Role:</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                {getRoleDisplayName(user.role)}
              </span>
            </div>

            {user.organization && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Organization:</span>
                <span className="text-sm text-gray-900">{user.organization}</span>
              </div>
            )}
          </div>

          {/* Edit Profile Form */}
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                  Organization
                </label>
                <input
                  type="text"
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your organization"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: user.name || '',
                      organization: user.organization || '',
                    });
                    setUpdateMessage(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-6">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Edit Profile
              </button>
            </div>
          )}

          {/* Update Message */}
          {updateMessage && (
            <div className={`p-3 rounded-md mb-4 ${
              updateMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <p className="text-sm">{updateMessage.text}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 