import axios from 'axios';
import { getCurrentUser } from './authService';
import Swal from 'sweetalert2';

const API_BASE_URL = "https://localhost:7115/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(config => {
  const user = getCurrentUser();
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  console.log('Making request to:', config.url);
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(response => {
  return response;
}, error => {
  const errorData = error.response?.data;
  const errorMessage = errorData?.message || 
                      errorData?.errors?.Username?.[0] || 
                      error.message || 
                      'Request failed';

  console.error('API Error:', {
    url: error.config?.url,
    status: error.response?.status,
    message: errorMessage
  });

  if (error.response?.status === 401) {
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Show user-friendly error message
  if (error.response?.status !== 401) {
    Swal.fire({
      title: 'Error',
      text: errorMessage,
      icon: 'error',
      confirmButtonText: 'OK',
      customClass: {
        confirmButton: 'bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded'
      }
    });
  }

  return Promise.reject(error);
});

const formatDate = (dateString) => {
  if (!dateString || dateString === '0001-01-01T00:00:00Z') {
    return 'N/A';
  }
  return new Date(dateString).toLocaleString();
};

const AdminService = {
  checkAdminStatus: async () => {
    try {
      await api.get('/admin/check-admin');
      return true;
    } catch (error) {
      console.error("Admin check failed:", error);
      return false;
    }
  },

 // В adminService.js
fetchAllUsers: async () => {
  try {
    const response = await api.get('/admin/users');
    return response.data.map(user => ({
      ...user,
      Roles: user.roles || [], // Унифицираме името на полето
      memberSince: user.memberSince === '0001-01-01T00:00:00Z' ? null : new Date(user.memberSince),
      lastActive: user.lastActive === '0001-01-01T00:00:00Z' ? null : new Date(user.lastActive)
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
},
updateUser: async (userId, { username, newPassword }) => {
  try {
    const payload = {
      userName: username || "", // Винаги изпращай поле, дори празно
      newPassword: newPassword || ""
    };

    console.log('Request payload:', payload);

    const response = await api.put(`/admin/users/${userId}`, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Update error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    throw error;
  }
},


  deleteUser: async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      Swal.fire('Deleted!', 'User has been deleted.', 'success');
    } catch (error) {
      console.error('Failed to delete user:', {
        userId,
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      throw error;
    }
  },

  fetchAllReviews: async () => {
    try {
      const response = await api.get('/admin/reviews');
      return response.data.map(review => ({
        id: review.id,
        movieId: review.movieId,
        movieTitle: review.movieTitle || `Movie ID: ${review.movieId}`,
        userName: review.userName || 'Anonymous',
        rating: review.rating,
        review: review.review || 'No review text',
        ratedOn: review.ratedOn
      }));
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      throw error;
    }
  },

  deleteReview: async (reviewId) => {
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      Swal.fire('Deleted!', 'Review has been deleted.', 'success');
    } catch (error) {
      console.error('Failed to delete review:', error);
      throw error;
    }
  },

  fetchAllMovies: async () => {
    try {
      const response = await api.get('/admin/reviews');
      const uniqueMovies = {};
      
      response.data.forEach(review => {
        if (review.movieId && !uniqueMovies[review.movieId]) {
          uniqueMovies[review.movieId] = {
            id: review.movieId,
            title: review.movieTitle || `Movie ID: ${review.movieId}`
          };
        }
      });

      return Object.values(uniqueMovies);
    } catch (error) {
      console.error('Failed to fetch movies:', error);
      throw error;
    }
  },

  getAvailableRoles: async () => {
    try {
      const response = await api.get('/admin/available-roles');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch available roles:', error);
      throw error;
    }
  },

  getUsersWithRoles: async () => {
    try {
      const response = await api.get('/admin/users-with-roles');
      return response.data.map(user => ({
        ...user,
        memberSince: formatDate(user.memberSince),
        lastActive: formatDate(user.lastActive)
      }));
    } catch (error) {
      console.error('Failed to fetch users with roles:', error);
      throw error;
    }
  },

  async checkIsAdmin(userId) {
    try {
      const user = await api.get(`/admin/users/${userId}`);
      return user.data.roles.includes('Admin');
    } catch (error) {
      console.error('Failed to check admin status:', error);
      return false;
    }
  },

  assignRole: async (userId, role) => {
    try {
      const currentUser = getCurrentUser();
      const isTargetAdmin = await AdminService.checkIsAdmin(userId);
      
      if (isTargetAdmin && currentUser.id !== userId) {
        throw new Error('Cannot modify roles of other administrators');
      }

      const response = await api.post('/admin/assign-role', { userId, role });
      Swal.fire('Success!', 'Role assigned successfully.', 'success');
      return response.data;
    } catch (error) {
      console.error('Failed to assign role:', error);
      Swal.fire('Error', error.message || 'Failed to assign role', 'error');
      throw error;
    }
  },

  addRole: async (userId, role) => {
    try {
      const currentUser = getCurrentUser();
      const isTargetAdmin = await AdminService.checkIsAdmin(userId);
      
      if (isTargetAdmin && currentUser.id !== userId) {
        throw new Error('Cannot modify roles of other administrators');
      }

      const response = await api.post('/admin/add-role', { userId, role });
      Swal.fire('Success!', 'Role added successfully.', 'success');
      return response.data;
    } catch (error) {
      console.error('Failed to add role:', error);
      Swal.fire('Error', error.message || 'Failed to add role', 'error');
      throw error;
    }
  },

  removeRole: async (userId, role) => {
    try {
      const currentUser = getCurrentUser();
      const isTargetAdmin = await AdminService.checkIsAdmin(userId);
      
      if (isTargetAdmin) {
        if (currentUser.id !== userId) {
          throw new Error('Cannot modify roles of other administrators');
        }
        if (role === 'Admin') {
          throw new Error('Cannot remove Admin role from yourself');
        }
      }

      const response = await api.post('/admin/remove-role', { userId, role });
      Swal.fire('Success!', 'Role removed successfully.', 'success');
      return response.data;
    } catch (error) {
      console.error('Failed to remove role:', error);
      Swal.fire('Error', error.message || 'Failed to remove role', 'error');
      throw error;
    }
  },

  verifyAdminAccess: async () => {
    try {
      const user = getCurrentUser();
      if (!user?.token) {
        return false;
      }
      return await AdminService.checkAdminStatus();
    } catch (error) {
      console.error('Admin verification error:', error);
      return false;
    }
  }
};

export default AdminService;