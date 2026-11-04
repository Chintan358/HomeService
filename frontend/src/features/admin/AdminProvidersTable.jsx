/**
 * AdminProvidersTable — KYC verification management panel.
 * Super Admin can approve or reject pending provider verifications.
 */
import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import { listProviders, verifyProvider } from "../../services/adminService";

const STATUS_COLORS = {
  PENDING: "warning",
  UNDER_REVIEW: "blue",
  APPROVED: "success",
  REJECTED: "danger",
};

const RejectModal = ({ provider, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Reject Provider</h3>
        <p className="text-sm text-gray-500 mb-4">
          Provide a reason for rejecting <strong>{provider.business_name}</strong>.
        </p>
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
          rows={4}
          placeholder="Rejection reason (required)…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={loading}
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason)}
          >
            Confirm Reject
          </Button>
        </div>
      </div>
    </div>
  );
};

const AdminProvidersTable = () => {
  const [providers, setProviders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [verificationFilter, setVerificationFilter] = useState("PENDING");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const PAGE_SIZE = 10;

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (verificationFilter) params.verification_status = verificationFilter;
      const data = await listProviders(params);
      setProviders(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setError("Failed to load providers.");
    } finally {
      setLoading(false);
    }
  }, [page, verificationFilter]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const handleApprove = async (provider) => {
    setActionLoading(provider.id);
    try {
      await verifyProvider(provider.id, "approve");
      setSuccessMsg(`${provider.business_name} approved.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      await fetchProviders();
    } catch {
      setError("Approval failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (reason) => {
    setActionLoading(rejectTarget.id);
    try {
      await verifyProvider(rejectTarget.id, "reject", reason);
      setSuccessMsg(`${rejectTarget.business_name} rejected.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      setRejectTarget(null);
      await fetchProviders();
    } catch {
      setError("Rejection failed.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {rejectTarget && (
        <RejectModal
          provider={rejectTarget}
          loading={actionLoading === rejectTarget.id}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
        />
      )}

      <div className="flex gap-3 mb-4">
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={verificationFilter}
          onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }}
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      {successMsg && <p className="text-green-600 text-sm mb-3">{successMsg}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Business</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Owner</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Rating</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">KYC Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(6)].map((__, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-24" /></td>
                ))}</tr>
              ))
            ) : providers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No providers found.</td></tr>
            ) : (
              providers.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.business_name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.user_full_name || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.user_email || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">
                    ⭐ {parseFloat(p.average_rating || 0).toFixed(1)} ({p.review_count})
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_COLORS[p.verification_status] || "default"}>
                      {p.verification_status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {p.verification_status === "PENDING" || p.verification_status === "UNDER_REVIEW" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          loading={actionLoading === p.id}
                          onClick={() => handleApprove(p)}
                        >
                          <CheckCircle size={13} className="mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setRejectTarget(p)}
                        >
                          <XCircle size={13} className="mr-1" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        {p.verification_status === "REJECTED" && p.verification_rejection_reason
                          ? `Rejected: ${p.verification_rejection_reason.substring(0, 40)}…`
                          : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <span>{total} provider{total !== 1 ? "s" : ""} total</span>
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

export default AdminProvidersTable;
