const colors = {
  Pending: 'bg-yellow-100 text-yellow-800',
  InProgress: 'bg-blue-100 text-blue-800',
  Ready: 'bg-green-100 text-green-800',
  Delivered: 'bg-gray-200 text-gray-900',
};

const labels = {
  Pending: 'Pending',
  InProgress: 'In Progress',
  Ready: 'Ready',
  Delivered: 'Delivered',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
