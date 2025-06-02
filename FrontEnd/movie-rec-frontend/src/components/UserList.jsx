// src/components/admin/UserList.jsx
import { useState, useEffect } from 'react';
import UserEditModal from './UserEditModal';
import { adminService } from '../services/adminService'; 

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editUser, setEditUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminService.getAllUsers();
        setUsers(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminService.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
      } catch (err) {
        alert('Failed to delete user: ' + err.message);
      }
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="user-management">
      <h2>User Management</h2>
      <table className="user-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Member Since</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.userName}</td>
              <td>{user.email}</td>
              <td>{user.roles.join(', ')}</td>
              <td>{new Date(user.memberSince).toLocaleDateString()}</td>
              <td>
                <button onClick={() => setEditUser(user)}>Edit</button>
                <button 
                  onClick={() => handleDelete(user.id)}
                  disabled={user.roles.includes('Admin')}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {editUser && (
        <UserEditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={async (updatedUser) => {
            try {
              const result = await adminService.updateUser(updatedUser.id, updatedUser);
              setUsers(users.map(u => u.id === result.id ? result : u));
              setEditUser(null);
            } catch (err) {
              alert('Failed to update user: ' + err.message);
            }
          }}
        />
      )}
    </div>
  );
};

export default UserList;