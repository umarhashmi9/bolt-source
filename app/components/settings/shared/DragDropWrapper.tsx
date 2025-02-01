import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface DragDropWrapperProps {
  children: React.ReactNode;
}

export function DragDropWrapper({ children }: DragDropWrapperProps) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}
