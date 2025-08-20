import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings2 } from 'lucide-react';
import type { Task } from './Timeline';

export type ColumnId = 'name' | 'assignee' | 'status' | 'priority';

export interface Column {
  id: ColumnId;
  label: string;
  width: number;
  minWidth: number;
  required?: boolean;
  render: (task: Task) => React.ReactNode;
}

export interface TaskColumnConfigProps {
  visibleColumns: ColumnId[];
  onColumnsChange: (columns: ColumnId[]) => void;
}

const availableColumns: Column[] = [
  {
    id: 'name',
    label: 'Name',
    width: 70,
    minWidth: 30,
    required: true,
    render: (task: Task) => (
      <span className="text-sm font-medium text-foreground">{task.name}</span>
    )
  },
  {
    id: 'assignee',
    label: 'Assignee',
    width: 30,
    minWidth: 20,
    render: (task: Task) => task.assignee || 'Unassigned'
  },
  {
    id: 'status',
    label: 'Status',
    width: 25,
    minWidth: 15,
    render: (task: Task) => {
      const statusColors = {
        todo: 'bg-muted text-muted-foreground',
        'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      };
      
      return (
        <Badge variant="secondary" className={statusColors[task.status]}>
          {task.status.replace('-', ' ')}
        </Badge>
      );
    }
  },
  {
    id: 'priority',
    label: 'Priority',
    width: 20,
    minWidth: 15,
    render: (task: Task) => {
      const priorityColors = {
        low: 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      };
      
      return (
        <Badge variant="secondary" className={priorityColors[task.priority]}>
          {task.priority}
        </Badge>
      );
    }
  }
];

export const TaskColumnConfig: React.FC<TaskColumnConfigProps> = ({
  visibleColumns,
  onColumnsChange
}) => {
  const handleColumnToggle = (columnId: ColumnId, checked: boolean) => {
    if (checked) {
      onColumnsChange([...visibleColumns, columnId]);
    } else {
      onColumnsChange(visibleColumns.filter(id => id !== columnId));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48" align="end">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Columns</h4>
          {availableColumns.map((column) => (
            <div key={column.id} className="flex items-center space-x-2">
              <Checkbox
                id={column.id}
                checked={visibleColumns.includes(column.id)}
                onCheckedChange={(checked) => handleColumnToggle(column.id, !!checked)}
                disabled={column.required}
              />
              <label
                htmlFor={column.id}
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {column.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { availableColumns };