import React, { useState, useEffect } from "react";
import { Wrench, X, Check, AlertCircle } from "lucide-react";
import Button from "../../components/common/Button";
import { getMyTechnicians, assignTechnician } from "../../services/providerService";

export default function AssignTechnicianModal({ booking, onClose, onAssigned }) {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTechs = async () => {
      setLoading(true);
      try {
        const data = await getMyTechnicians();
        setTechnicians(data.filter((t) => t.is_active));
        if (data.length > 0) {
          setSelectedTechId(data[0].user_id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTechs();
  }, []);

  const handleAssign = async () => {
    if (!selectedTechId) {
      setError("Please select a technician.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await assignTechnician(booking.id, parseInt(selectedTechId), notes);
      onAssigned();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Failed to assign technician.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Assign Technician</h3>
            <p className="text-xs text-slate-500">Booking #{booking.booking_reference}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Loading staff...</div>
        ) : technicians.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-sm">
            <p>No active technicians found.</p>
            <p className="text-xs text-slate-400 mt-1">
              Add technicians in your Technicians tab before assigning.
            </p>
          </div>
        ) : (
          <div className="space-y-4 my-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Technician
              </label>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {technicians.map((t) => (
                  <option key={t.id} value={t.user_id}>
                    {t.full_name} {t.employee_code ? `(${t.employee_code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Dispatch Instructions / Notes
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Bring spare capacitors and ladder..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                isLoading={submitting}
                onClick={handleAssign}
              >
                Confirm Assignment
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
