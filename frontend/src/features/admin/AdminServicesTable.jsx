/**
 * AdminServicesTable — platform-wide service listing management.
 * Super Admin can enable or disable any provider's service.
 */
import React, { useState, useEffect, useCallback } from "react";
import { ToggleLeft, ToggleRight, ChevronLeft, ChevronRight } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import { listAllServices, toggleService } from "../../services/adminService";
import { formatCurrency } from "../../utils/formatters";

const AdminServicesTable = () => {
  const [services, setServices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const PAGE_SIZE = 20;

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAllServices({ page, page_size: PAGE_SIZE });
      setServices(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setError("Failed to load services.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const handleToggle = async (service) => {
    setActionLoading(service.id);
    try {
      await toggleService(service.id, !service.is_active);
      setSuccessMsg(`"${service.name}" ${service.is_active ? "disabled" : "enabled"}.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      await fetchServices();
    } catch {
      setError("Failed to toggle service.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      {successMsg && <p className="text-green-600 text-sm mb-3">{successMsg}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Service</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Price</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(5)].map((__, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-24" /></td>
                ))}</tr>
              ))
            ) : services.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No services found.</td></tr>
            ) : (
              services.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.category_name || "—"}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{formatCurrency(s.base_price)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.is_active ? "success" : "default"}>
                      {s.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant={s.is_active ? "danger" : "primary"}
                      loading={actionLoading === s.id}
                      onClick={() => handleToggle(s)}
                    >
                      {s.is_active ? (
                        <><ToggleRight size={14} className="mr-1" /> Disable</>
                      ) : (
                        <><ToggleLeft size={14} className="mr-1" /> Enable</>
                      )}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <span>{total} service{total !== 1 ? "s" : ""} total</span>
        <div className="flex gap-2 items-center">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronLeft size={16} /></button>
          <span>Page {page} of {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
};

export default AdminServicesTable;
