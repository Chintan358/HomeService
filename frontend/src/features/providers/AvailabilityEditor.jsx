import React, { useState, useEffect } from "react";
import { Clock, Check, AlertCircle, Save } from "lucide-react";
import Button from "../../components/common/Button";
import { getMyAvailability, updateMyAvailability } from "../../services/providerService";

const DAYS = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
  { id: 7, name: "Sunday" },
];

export default function AvailabilityEditor() {
  const [schedule, setSchedule] = useState(
    DAYS.map((d) => ({
      day_of_week: d.id,
      start_time: "09:00",
      end_time: "18:00",
      is_available: d.id !== 7, // default Mon-Sat open, Sun closed
    }))
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const slots = await getMyAvailability();
        if (slots && slots.length > 0) {
          const map = {};
          slots.forEach((s) => {
            map[s.day_of_week] = s;
          });
          setSchedule(
            DAYS.map((d) => ({
              day_of_week: d.id,
              start_time: map[d.id]?.start_time || "09:00",
              end_time: map[d.id]?.end_time || "18:00",
              is_available: map[d.id]?.is_available ?? (d.id !== 7),
            }))
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggle = (dayId) => {
    setSchedule((prev) =>
      prev.map((item) =>
        item.day_of_week === dayId
          ? { ...item, is_available: !item.is_available }
          : item
      )
    );
  };

  const handleTimeChange = (dayId, field, val) => {
    setSchedule((prev) =>
      prev.map((item) =>
        item.day_of_week === dayId ? { ...item, [field]: val } : item
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg({ text: "", type: "" });
    try {
      await updateMyAvailability(schedule);
      setMsg({ text: "Weekly working hours saved successfully!", type: "success" });
    } catch {
      setMsg({ text: "Failed to save schedule. Check that end time is after start time.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading schedule...</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Working Hours & Availability
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Set your weekly working days and service hours so customers can book open time slots.
          </p>
        </div>
        <Button onClick={handleSave} isLoading={saving} className="flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Schedule
        </Button>
      </div>

      {msg.text && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {msg.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {DAYS.map((day) => {
          const item = schedule.find((s) => s.day_of_week === day.id) || {
            day_of_week: day.id,
            start_time: "09:00",
            end_time: "18:00",
            is_available: true,
          };
          return (
            <div
              key={day.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 w-36">
                <input
                  type="checkbox"
                  id={`day-${day.id}`}
                  checked={item.is_available}
                  onChange={() => handleToggle(day.id)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label
                  htmlFor={`day-${day.id}`}
                  className={`text-sm font-medium cursor-pointer ${
                    item.is_available ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {day.name}
                </label>
              </div>

              {item.is_available ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">From</span>
                    <input
                      type="time"
                      value={item.start_time}
                      onChange={(e) => handleTimeChange(day.id, "start_time", e.target.value)}
                      className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-slate-400 text-xs">—</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">To</span>
                    <input
                      type="time"
                      value={item.end_time}
                      onChange={(e) => handleTimeChange(day.id, "end_time", e.target.value)}
                      className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Unavailable / Closed</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
