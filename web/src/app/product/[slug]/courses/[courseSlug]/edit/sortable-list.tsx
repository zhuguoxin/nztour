"use client";

import { useState, useTransition, useEffect, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Generic vertical drag-and-drop list.
 *
 * - Renders each item by calling `renderItem(item, dragHandleProps)` — the
 *   caller decides what the row looks like and spreads the handle props
 *   onto whichever element should be the grab area (usually a ⠿ icon).
 * - On drop, optimistically reorders state, then awaits `onReorder(ids)`.
 * - If the server action throws, we revert to the pre-drag order and the
 *   parent can show a toast (we keep the error UX minimal here).
 *
 * Item identity is taken from `item.id`. The list re-syncs with `items`
 * whenever the parent re-renders with a different set (e.g. after a
 * server-side revalidatePath).
 */
export interface SortableItem {
  id: string;
}

export function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  emptyState,
}: {
  items: T[];
  onReorder: (orderedIds: string[]) => Promise<void>;
  renderItem: (item: T, dragHandle: DragHandleProps, isDragging: boolean) => ReactNode;
  emptyState?: ReactNode;
}) {
  const [localOrder, setLocalOrder] = useState(items);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Re-sync if the parent's items list changes (after server revalidate).
  useEffect(() => {
    setLocalOrder(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const prev = localOrder;
    const oldIndex = localOrder.findIndex((i) => i.id === active.id);
    const newIndex = localOrder.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(localOrder, oldIndex, newIndex);
    setLocalOrder(next);
    setError(null);
    startTransition(async () => {
      try {
        await onReorder(next.map((i) => i.id));
      } catch (err) {
        // Revert on failure.
        setLocalOrder(prev);
        setError(err instanceof Error ? err.message : "Failed to save order");
      }
    });
  }

  if (localOrder.length === 0) return <>{emptyState}</>;

  return (
    <>
      {error ? (
        <div className="mb-2 text-[12px] text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-md px-2 py-1">
          {error}
        </div>
      ) : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localOrder.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {localOrder.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {(handle, isDragging) => renderItem(item, handle, isDragging)}
            </SortableRow>
          ))}
        </SortableContext>
      </DndContext>
    </>
  );
}

export interface DragHandleProps {
  ref: (el: HTMLElement | null) => void;
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown>;
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (handle: DragHandleProps, isDragging: boolean) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handle: DragHandleProps = {
    ref: setActivatorNodeRef,
    attributes: attributes as unknown as Record<string, unknown>,
    listeners: (listeners ?? {}) as Record<string, unknown>,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children(handle, isDragging)}
    </div>
  );
}

/** Standard grab handle — drop onto a span. */
export function GrabHandle({ handle }: { handle: DragHandleProps }) {
  return (
    <button
      ref={handle.ref as unknown as React.Ref<HTMLButtonElement>}
      {...handle.attributes}
      {...handle.listeners}
      type="button"
      aria-label="Drag to reorder"
      className="cursor-grab active:cursor-grabbing text-[#86b69a] hover:text-emerald-300 px-1.5 py-1 rounded-md hover:bg-white/[.05] touch-none"
      title="Drag to reorder"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <circle cx="9" cy="6" r="1.6" />
        <circle cx="15" cy="6" r="1.6" />
        <circle cx="9" cy="12" r="1.6" />
        <circle cx="15" cy="12" r="1.6" />
        <circle cx="9" cy="18" r="1.6" />
        <circle cx="15" cy="18" r="1.6" />
      </svg>
    </button>
  );
}
