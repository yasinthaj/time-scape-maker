import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task } from './Timeline';

interface TaskPanelProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

const TASK_ROW_HEIGHT = 48; // Fixed height for alignment with timeline

export const TaskPanel: React.FC<TaskPanelProps> = ({
  tasks,
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  return (
    <Card className="w-96 h-full rounded-none border-r border-y-0 border-l-0 bg-card">
      <CardContent className="p-0 h-full flex flex-col">
        {/* Header */}
        <div className="flex border-b bg-muted/30 sticky top-0 z-10" style={{ height: '80px' }}>
          <div className="w-8 p-2 border-r flex items-center justify-center">
            <Checkbox 
              checked={selectedTasks.size === tasks.length && tasks.length > 0}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedTasks(new Set(tasks.map(t => t.id)));
                } else {
                  setSelectedTasks(new Set());
                }
              }}
            />
          </div>
          <div className="flex-1 px-4 py-3 border-r flex items-center">
            <h3 className="font-semibold text-sm text-foreground">Name</h3>
          </div>
          <div className="w-24 px-4 py-3 flex items-center">
            <h3 className="font-semibold text-sm text-foreground">Assignee</h3>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No tasks to display</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div>
              {tasks.map((task, index) => (
                <div 
                  key={task.id} 
                  className={`flex border-b hover:bg-muted/50 transition-colors ${
                    selectedTasks.has(task.id) ? 'bg-muted/30' : ''
                  }`}
                  style={{ height: '48px' }}
                >
...
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};