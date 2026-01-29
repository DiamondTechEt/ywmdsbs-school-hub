import React from 'react';
import { ClassTeacherManagement } from '@/components/admin/ClassTeacherManagement';

export default function ClassTeacherAdmin() {
  console.log('ClassTeacherAdmin component rendered');
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Class-Teacher Assignments</h1>
      <ClassTeacherManagement />
    </div>
  );
}
