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

  const generateTaskId = (taskName: string) => {
    // Generate a simple task ID from the task name
    const words = taskName.split(' ').slice(0, 2);
    const prefix = words.map(w => w.charAt(0).toUpperCase()).join('');
    return `TASK${prefix}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
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
        <div className="flex border-b bg-muted/30 sticky top-0 z-10">
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
          <div className="flex-1 px-4 py-3 border-r">
            <h3 className="font-semibold text-sm text-foreground">Name</h3>
          </div>
          <div className="w-24 px-4 py-3">
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
                    index % 2 === 0 ? 'bg-transparent' : 'bg-muted/20'
                  }`}
                  style={{ height: TASK_ROW_HEIGHT }}
                >
                  {/* Checkbox */}
                  <div className="w-8 p-2 border-r flex items-center justify-center">
                    <Checkbox 
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={(checked) => handleTaskSelection(task.id, !!checked)}
                    />
                  </div>

                  {/* Task Name */}
                  <div 
                    className="flex-1 px-4 py-2 border-r cursor-pointer flex flex-col justify-center"
                    onClick={() => onTaskClick(task)}
                  >
                    <div className="font-medium text-sm text-foreground hover:text-primary transition-colors truncate">
                      {task.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {generateTaskId(task.name)}
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className="w-24 px-2 py-2 flex items-center justify-between">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(task.assignee)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground">
                          {getInitials(task.assignee)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                            ?
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">--</span>
                      </div>
                    )}

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="bottom">
                        <DropdownMenuItem onClick={() => onTaskClick(task)}>
                          Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onTaskDelete(task.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};