import { clsx } from 'clsx';

interface Props {
  status: string;
}

export function StatusBadge({ status }: Props) {
  // Map status to colors
  const styles: Record<string, string> = {
    'Received': 'bg-gray-100 text-gray-800',
    'Diagnosing': 'bg-blue-100 text-blue-800',
    'PendingApproval': 'bg-purple-100 text-purple-800',
    'WaitingParts': 'bg-yellow-100 text-yellow-800',
    'Fixed': 'bg-green-100 text-green-800',
    'Collected': 'bg-slate-100 text-slate-600 line-through',
    'Unrepairable': 'bg-red-100 text-red-800',
  };

  const className = styles[status] || 'bg-gray-100 text-gray-800';

  return (
    <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent", className)}>
      {status.replace(/([A-Z])/g, ' $1').trim()} {/* Adds space: WaitingParts -> Waiting Parts */}
    </span>
  );
}