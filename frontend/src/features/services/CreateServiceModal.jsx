import React, { useState } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { X, PlusCircle, AlertCircle } from 'lucide-react';
import { catalogService } from '../../services/catalogService';

export default function CreateServiceModal({ isOpen, onClose, categories, onServiceCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    category_id: categories?.[0]?.id || '',
    base_price: '',
    estimated_duration_minutes: 60,
    description: '',
    image_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category_id || !formData.base_price) {
      setError('Please provide service title, category, and price.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        name: formData.name,
        category_id: Number(formData.category_id),
        base_price: parseFloat(formData.base_price),
        estimated_duration_minutes: Number(formData.estimated_duration_minutes) || 60,
        description: formData.description || undefined,
        image_url: formData.image_url || undefined,
      };

      const res = await catalogService.createService(payload);
      if (onServiceCreated) onServiceCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to publish service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-lg">Publish New Service</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Service Title"
            id="name"
            name="name"
            placeholder="e.g. Master Bathroom Leak Repair"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-slate-700 mb-1">
              Service Category
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Starting Price (₹)"
              id="base_price"
              name="base_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 599.00"
              value={formData.base_price}
              onChange={handleChange}
              required
            />
            <Input
              label="Estimated Time (mins)"
              id="estimated_duration_minutes"
              name="estimated_duration_minutes"
              type="number"
              step="5"
              min="15"
              placeholder="60"
              value={formData.estimated_duration_minutes}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Cover Image URL (Optional)"
            id="image_url"
            name="image_url"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={formData.image_url}
            onChange={handleChange}
          />

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
              Description & Scope of Work
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Detailed description of what is included in this service..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Publish Service
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
