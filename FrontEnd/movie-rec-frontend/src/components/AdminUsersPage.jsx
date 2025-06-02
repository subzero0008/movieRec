import React, { useEffect, useState } from 'react';
import AdminService from '../services/adminService';
import { 
  PencilIcon, 
  TrashIcon, 
  UserIcon, 
  ShieldCheckIcon, 
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    username: '',
    newPassword: ''
  });
  const [roleManagement, setRoleManagement] = useState({
    userId: null,
    currentRoles: [],
    selectedRole: ''
  });

  const loadData = async () => {
    try {
      setIsRefreshing(true);
      const adminCheck = await AdminService.checkAdminStatus();
      setIsAdmin(adminCheck);
      
      if (adminCheck) {
        const [usersData, roles] = await Promise.all([
          AdminService.fetchAllUsers(),
          AdminService.getAvailableRoles()
        ]);
        setUsers(usersData);
        setAvailableRoles(roles);
      }
    } catch (err) {
      console.error("Admin users error:", err);
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (user) => {
    if (user.roles?.includes('Admin')) {
      const currentUser = getCurrentUser();
      if (user.id !== currentUser.id) {
        Swal.fire({
          title: 'Error',
          text: 'You cannot edit other administrators',
          icon: 'error',
          confirmButtonText: 'OK',
          customClass: {
            confirmButton: 'bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded'
          }
        });
        return;
      }
    }
    
    setEditingUser(user);
    setEditFormData({
      username: user.userName,
      newPassword: ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      const updateData = {};
      
      if (editFormData.username !== editingUser.userName) {
        updateData.username = editFormData.username;
      }
      
      if (editFormData.newPassword) {
        if (editFormData.newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        updateData.newPassword = editFormData.newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        await Swal.fire({
          title: 'No Changes',
          text: 'No changes were detected',
          icon: 'info',
          confirmButtonText: 'OK'
        });
        return;
      }

      await AdminService.updateUser(editingUser.id, updateData);
      await loadData();
      setEditingUser(null);
      
      await Swal.fire({
        title: 'Success!',
        text: 'User updated successfully',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         "Failed to update user";
      
      await Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleDelete = async (userId) => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      
      if (userToDelete?.roles?.includes('Admin')) {
        Swal.fire({
          title: 'Error',
          text: 'You cannot delete administrators',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'Do you really want to delete this user?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        await AdminService.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        Swal.fire('Deleted!', 'User has been deleted.', 'success');
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const openRoleManagement = (user) => {
    setRoleManagement({
      userId: user.id,
      currentRoles: user.roles || [],
      selectedRole: ''
    });
  };

  const closeRoleManagement = () => {
    setRoleManagement({
      userId: null,
      currentRoles: [],
      selectedRole: ''
    });
  };

  const handleAssignRole = async () => {
    if (!roleManagement.selectedRole) {
      Swal.fire('Error', 'Please select a role', 'error');
      return;
    }

    try {
      await AdminService.assignRole(roleManagement.userId, roleManagement.selectedRole);
      Swal.fire('Success', 'Role assigned successfully', 'success');
      closeRoleManagement();
      loadData();
    } catch (error) {
      console.error("Failed to assign role:", error);
      Swal.fire('Error', error.message || 'Failed to assign role', 'error');
    }
  };

  const handleAddRole = async () => {
    if (!roleManagement.selectedRole) {
      Swal.fire('Error', 'Please select a role', 'error');
      return;
    }

    try {
      await AdminService.addRole(roleManagement.userId, roleManagement.selectedRole);
      Swal.fire('Success', 'Role added successfully', 'success');
      closeRoleManagement();
      loadData();
    } catch (error) {
      console.error("Failed to add role:", error);
      Swal.fire('Error', error.message || 'Failed to add role', 'error');
    }
  };

  const handleRemoveRole = async (role) => {
    try {
      await AdminService.removeRole(roleManagement.userId, role);
      Swal.fire('Success', 'Role removed successfully', 'success');
      loadData();
    } catch (error) {
      console.error("Failed to remove role:", error);
      Swal.fire('Error', error.message || 'Failed to remove role', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
        <p className="font-bold">Access Denied</p>
        <p>Administrator privileges required to view this page.</p>
      </div>
    );
  }

 return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center border-b border-gray-700 p-4">
              <h3 className="text-lg font-semibold">
                Edit User: <span className="text-blue-400">{editingUser.userName}</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={3}
                />
                <p className="text-xs text-gray-400 mt-1">Minimum 3 characters</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input  
                  type="password"
                  value={editFormData.newPassword}
                  onChange={(e) => setEditFormData({...editFormData, newPassword: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  minLength={6}
                />
                <p className="text-xs text-gray-400 mt-1">Minimum 6 characters (leave blank to keep current)</p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                  disabled={editFormData.username.length < 3 || (editFormData.newPassword && editFormData.newPassword.length < 6)}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      {roleManagement.userId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center border-b border-gray-700 p-4">
              <h3 className="text-lg font-semibold">
                Manage Roles
              </h3>
              <button
                onClick={closeRoleManagement}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <h4 className="font-medium text-gray-300 mb-3">Current Roles:</h4>
                {roleManagement.currentRoles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {roleManagement.currentRoles.map(role => (
                      <span 
                        key={role} 
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          role === 'Admin' ? 'bg-red-900/80 text-red-100' : 
                          role === 'Moderator' ? 'bg-purple-900/80 text-purple-100' :
                          'bg-blue-900/80 text-blue-100'
                        }`}
                      >
                        {role}
                        <button 
                          onClick={() => handleRemoveRole(role)}
                          className="ml-1.5 hover:text-white"
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No roles assigned</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Role
                </label>
                <select
                  value={roleManagement.selectedRole}
                  onChange={(e) => setRoleManagement({...roleManagement, selectedRole: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a role</option>
                  {availableRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between space-x-3">
                <button
                  onClick={handleAssignRole}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                  disabled={!roleManagement.selectedRole}
                >
                  <CheckIcon className="h-4 w-4 mr-1.5" />
                  Assign
                </button>
                <button
                  onClick={handleAddRole}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                  disabled={!roleManagement.selectedRole}
                >
                  <PlusIcon className="h-4 w-4 mr-1.5" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-blue-400 mr-3" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              User Management
            </h1>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
            disabled={isRefreshing}
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-3 text-lg font-medium text-gray-300">No users found</h3>
            <p className="mt-1 text-gray-500">There are currently no users in the system.</p>
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Username
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Roles
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Member Since
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{user.userName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          {user.roles?.length > 0 ? (
                            user.roles.map(role => (
                              <span 
                                key={role} 
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  role === 'Admin' ? 'bg-red-900/80 text-red-100' : 
                                  role === 'Moderator' ? 'bg-purple-900/80 text-purple-100' :
                                  'bg-blue-900/80 text-blue-100'
                                }`}
                              >
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">No roles</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          {user.memberSince ? (
                            new Date(user.memberSince).toLocaleDateString()
                          ) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-400 hover:text-blue-300 p-1 rounded-full hover:bg-gray-700 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openRoleManagement(user)}
                          className="text-green-400 hover:text-green-300 p-1 rounded-full hover:bg-gray-700 transition-colors"
                          title="Manage Roles"
                        >
                          <ShieldCheckIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-700 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;