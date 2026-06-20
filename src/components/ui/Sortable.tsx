import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface HandleProps {
  handle: Record<string, unknown>;
  isDragging: boolean;
}

/** Sortable row. Pass the drag handle props to whatever element should start the drag. */
export function Sortable({ id, children }: { id: string; children: (args: HandleProps) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.85 : 1,
        zIndex: isDragging ? 20 : undefined,
        position: 'relative',
      }}
    >
      {children({ handle: { ...attributes, ...listeners, style: { touchAction: 'none' } }, isDragging })}
    </div>
  );
}
