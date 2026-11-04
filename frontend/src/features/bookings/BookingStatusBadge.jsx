import React from 'react';
import Badge from '../../components/common/Badge';

export default function BookingStatusBadge({ status }) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="warning">Pending Confirmation</Badge>;
    case 'ACCEPTED':
      return <Badge variant="primary">Accepted</Badge>;
    case 'TECHNICIAN_ASSIGNED':
      return <Badge variant="primary">Technician Assigned</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="primary" className="bg-indigo-50 text-indigo-700 border-indigo-200">In Progress</Badge>;
    case 'COMPLETED':
      return <Badge variant="success">Completed</Badge>;
    case 'CANCELLED':
      return <Badge variant="danger">Cancelled</Badge>;
    case 'REJECTED':
      return <Badge variant="danger">Declined</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}
