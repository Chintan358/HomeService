import React, { useState, useEffect } from "react";
import { Users, UserPlus, Mail, Phone, Wrench, CheckCircle, Plus, X } from "lucide-react";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Badge from "../../components/common/Badge";
import { getMyTechnicians, addTechnician } from "../../services/providerService";

export default function TechniciansManager() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    employee_code: "",
    skills: "",
    password: "Tech@12345",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTechs = async () => {
    setLoading(true);
    try {
      const data = await getMyTechnicians();
      setTechnicians(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTechs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await addTechnician(form);
      setSuccess("Technician added successfully!");
      setShowModal(false);
      setForm({
        full_name: "",
        email: "",
        phone: "",
        employee_code: "",
        skills: "",
        password: "Tech@12345",
      });
      loadTechs();
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Failed to add technician.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Field Technicians & Staff
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your service staff and dispatch technicians to customer appointments.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add Technician
        </Button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading technicians...</div>
      ) : technicians.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No technicians registered yet.</p>
          <p className="text-xs text-slate-400 mt-1">Add technicians to assign them to customer bookings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicians.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors bg-slate-50/50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-slate-900">{t.full_name}</h4>
                  {t.employee_code && (
                    <span className="text-[11px] font-mono text-slate-500">ID: {t.employee_code}</span>
                  )}
                </div>
                <Badge variant={t.is_active ? "success" : "default"}>
                  {t.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                {t.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{t.email}</span>
                  </div>
                )}
                {t.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.phone}</span>
                  </div>
                )}
                {t.skills && (
                  <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-slate-200/60">
                    <Wrench className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                    <span className="text-[11px] text-slate-500 line-clamp-2">{t.skills}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Add New Technician</h3>
            <p className="text-xs text-slate-500 mb-4">
              Create an account for your field technician so they can be assigned to bookings.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                label="Full Name"
                placeholder="e.g. Rahul Sharma"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                placeholder="rahul@domain.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Phone Number"
                placeholder="+919876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                label="Employee Code"
                placeholder="e.g. EMP-101"
                value={form.employee_code}
                onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
              />
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Skills & Specializations
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={2}
                  placeholder="e.g. AC Installation, Gas Refilling, Circuit Testing"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={saving} className="flex-1">
                  Save Technician
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
