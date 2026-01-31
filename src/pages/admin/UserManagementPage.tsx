import React from 'react';
import { UserManagement } from '@/components/admin/UserManagement';

export default function UserManagementPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <UserManagement />
    </div>
  );
}
