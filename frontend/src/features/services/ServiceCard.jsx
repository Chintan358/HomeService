import React from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Clock, Star, ShieldCheck, Wrench } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function ServiceCard({ service, onBook }) {
  const defaultImage =
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
  const imageUrl = service.images?.[0]?.image_url || defaultImage;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Service Image */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultImage;
          }}
        />
        {service.category && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-slate-800 shadow-sm">
              {service.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Provider Business Name */}
          {service.provider && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <Link
                to={`/providers/${service.provider_id}`}
                className="hover:text-blue-600 hover:underline font-semibold"
              >
                {service.provider.business_name}
              </Link>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {service.provider.average_rating || '5.0'}
              </span>
            </div>
          )}

          {/* Service Title */}
          <h3 className="text-lg font-bold text-slate-900 line-clamp-1 mb-2">
            {service.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
            {service.description || 'Professional home service delivered by certified experts.'}
          </p>
        </div>

        {/* Footer with Price & Duration */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Starting from
            </span>
            <span className="text-lg font-extrabold text-blue-600">
              {formatCurrency(service.base_price)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {service.estimated_duration_minutes}m
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onBook && onBook(service)}
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
