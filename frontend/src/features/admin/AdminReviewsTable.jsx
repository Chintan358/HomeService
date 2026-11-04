/**
 * AdminReviewsTable — review moderation queue panel.
 * Super Admin can approve (make visible) or hide any user review.
 */
import React, { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import { listReviews, moderateReview } from "../../services/adminService";

const STATUS_COLORS = {
  PENDING: "warning",
  VISIBLE: "success",
  HIDDEN: "danger",
};

const StarRating = ({ rating }) => (
  <span className="text-yellow-400 tracking-tighter">
    {"★".repeat(rating)}{"☆".repeat(5 - rating)}
  </span>
);

const AdminReviewsTable = () => {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const PAGE_SIZE = 10;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (statusFilter) params.moderation_status = statusFilter;
      const data = await listReviews(params);
      setReviews(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setError("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleModerate = async (review, action) => {
    setActionLoading(review.id);
    try {
      await moderateReview(review.id, action);
      setSuccessMsg(`Review #${review.id} ${action === "approve" ? "approved" : "hidden"}.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      await fetchReviews();
    } catch {
      setError("Failed to moderate review.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="VISIBLE">Visible</option>
          <option value="HIDDEN">Hidden</option>
        </select>
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      {successMsg && <p className="text-green-600 text-sm mb-3">{successMsg}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Rating</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Review</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
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
            ) : reviews.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No reviews found.</td></tr>
            ) : (
              reviews.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.customer_name || `User #${r.customer_id}`}</td>
                  <td className="px-4 py-3"><StarRating rating={r.rating} /></td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.review_text || <em className="text-gray-400">No text</em>}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_COLORS[r.moderation_status] || "default"}>{r.moderation_status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(r.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {r.moderation_status !== "VISIBLE" && (
                        <Button size="sm" variant="primary" loading={actionLoading === r.id}
                          onClick={() => handleModerate(r, "approve")}>
                          <Eye size={13} className="mr-1" /> Approve
                        </Button>
                      )}
                      {r.moderation_status !== "HIDDEN" && (
                        <Button size="sm" variant="danger" loading={actionLoading === r.id}
                          onClick={() => handleModerate(r, "hide")}>
                          <EyeOff size={13} className="mr-1" /> Hide
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <span>{total} review{total !== 1 ? "s" : ""} total</span>
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

export default AdminReviewsTable;
