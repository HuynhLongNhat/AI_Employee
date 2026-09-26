'use client';

import { useList } from '@refinedev/core';

export default function LeadsPage() {
  const { query, result } = useList({ resource: 'leads' });

  if (query.isLoading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Danh sách Leads</h1>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Score</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {result.data?.map((lead: any) => (
            <tr key={lead.id}>
              <td className="border p-2">{lead.id}</td>
              <td className="border p-2">{lead.name}</td>
              <td className="border p-2">{lead.email}</td>
              <td className="border p-2">{lead.score}</td>
              <td className="border p-2">{lead.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}