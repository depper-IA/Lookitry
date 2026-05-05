import React from 'react';
import { ConversationStatus } from '../types';

export default function StatusBadge({ status }: { status: ConversationStatus }) {
  const styles = {
    active: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    closed: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status] || styles.closed}`}>
      {status === 'active' ? 'Activo' : status === 'pending' ? 'Pendiente' : 'Cerrado'}
    </span>
  );
}
