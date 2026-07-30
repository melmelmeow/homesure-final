"use client";

import Link from "next/link";

type Property = {
  id: string;
  title: string;
  price: number;
  verification_state: string;
  created_at: string;
  landowner_id: string;
};

type PropertyTableProps = {
  properties: Property[];
  userRole: string;
};

export default function PropertyTable({ properties, userRole }: PropertyTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Title</th>
            <th className="border p-2 text-left">Price</th>
            <th className="border p-2 text-left">State</th>
            <th className="border p-2 text-left">Created</th>
            <th className="border p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr key={property.id}>
              <td className="border p-2">{property.title}</td>
              <td className="border p-2">₱{property.price.toLocaleString()}</td>
              <td className="border p-2">
                <span className={`px-2 py-1 rounded text-xs ${property.verification_state === "verified" ? "bg-green-100 text-green-800" : property.verification_state === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {property.verification_state}
                </span>
              </td>
              <td className="border p-2">{new Date(property.created_at).toLocaleDateString()}</td>
              <td className="border p-2">
                <Link href={`/dashboard/properties/${property.id}`} className="text-blue-600 mr-2">View</Link>
                {userRole === "admin" && <span className="text-xs text-gray-500">(Admin)</span>}
              </td>
            </tr>
          ))}
          {properties.length === 0 && (
            <tr>
              <td colSpan={5} className="border p-4 text-center text-gray-500">No properties found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
