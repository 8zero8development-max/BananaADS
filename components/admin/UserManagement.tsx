import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
  businessType: string | null;
  jobRole: string | null;
  phoneNumber: string | null;
  isActive: boolean | null;
  isAdmin: boolean | null;
  lastLoginAt: string | null;
  createdAt: string | null;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (user: User) => {
    setActionLoading(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!response.ok) throw new Error('Failed to update user');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAdmin = async (user: User) => {
    setActionLoading(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      });
      if (!response.ok) throw new Error('Failed to update user');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword }),
      });
      if (!response.ok) throw new Error('Failed to reset password');
      setShowResetPassword(null);
      setNewPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete user');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateUser = async (user: User) => {
    setActionLoading(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: user.name,
          businessType: user.businessType,
          jobRole: user.jobRole,
          phoneNumber: user.phoneNumber,
        }),
      });
      if (!response.ok) throw new Error('Failed to update user');
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-white/10 rounded"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">
        {error}
        <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold">Users ({users.length})</h3>
        <button 
          onClick={fetchUsers}
          className="text-sm text-white/60 hover:text-white px-3 py-1 bg-white/10 rounded"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-2 text-white/60 font-medium">User</th>
              <th className="text-left py-3 px-2 text-white/60 font-medium">Details</th>
              <th className="text-left py-3 px-2 text-white/60 font-medium">Status</th>
              <th className="text-right py-3 px-2 text-white/60 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-3 px-2">
                  <div>
                    <p className="text-white font-medium">{user.name || 'No name'}</p>
                    <p className="text-white/50 text-xs">{user.email}</p>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <p className="text-white/70 text-xs">{user.businessType || 'N/A'}</p>
                  <p className="text-white/50 text-xs">{user.jobRole || 'N/A'}</p>
                  {user.phoneNumber && (
                    <p className="text-white/40 text-xs">{user.phoneNumber}</p>
                  )}
                </td>
                <td className="py-3 px-2">
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {user.isAdmin && (
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                        Admin
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={actionLoading === user.id}
                      className={`text-xs px-2 py-1 rounded ${user.isActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {user.isActive ? 'Block' : 'Unblock'}
                    </button>
                    <button
                      onClick={() => handleToggleAdmin(user)}
                      disabled={actionLoading === user.id}
                      className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                      title={user.isAdmin ? 'Remove admin' : 'Make admin'}
                    >
                      {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button
                      onClick={() => setShowResetPassword(user.id)}
                      disabled={actionLoading === user.id}
                      className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                      title="Reset password"
                    >
                      Reset PW
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={actionLoading === user.id}
                      className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      title="Delete user"
                    >
                      Delete
                    </button>
                  </div>
                  
                  {showResetPassword === user.id && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password (8+ chars)"
                        className="flex-1 px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white placeholder-white/40"
                      />
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="text-xs px-2 py-1 bg-yellow-500 text-black rounded"
                      >
                        Set
                      </button>
                      <button
                        onClick={() => { setShowResetPassword(null); setNewPassword(''); }}
                        className="text-xs px-2 py-1 bg-white/10 text-white/60 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <p className="text-white/50 text-center py-8">No users found</p>
      )}
    </div>
  );
};

export default UserManagement;
