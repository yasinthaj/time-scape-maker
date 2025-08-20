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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
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
        <div className="border-b bg-muted/30 sticky top-0 z-10" style={{ height: '80px' }}>
          <div className="flex h-full">
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
            <div className="flex-1">
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={70} minSize={30}>
                  <div className="px-4 py-3 h-full flex items-center border-r">
                    <h3 className="font-semibold text-sm text-foreground">Name</h3>
                  </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={30} minSize={20}>
                  <div className="px-4 py-3 h-full flex items-center">
                    <h3 className="font-semibold text-sm text-foreground">Assignee</h3>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
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
                  className={`border-b hover:bg-muted/50 transition-colors ${
                    selectedTasks.has(task.id) ? 'bg-muted/30' : ''
                  }`}
                  style={{ height: '48px' }}
                >
                  <div className="flex h-full">
                    {/* Checkbox */}
                    <div className="w-8 p-2 border-r flex items-center justify-center">
                      <Checkbox 
                        checked={selectedTasks.has(task.id)}
                        onCheckedChange={(checked) => handleTaskSelection(task.id, !!checked)}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <ResizablePanelGroup direction="horizontal" className="h-full">
                        <ResizablePanel defaultSize={70} minSize={30}>
                          <div className="px-4 py-2 h-full flex items-center border-r">
                            <button
                              onClick={() => onTaskClick(task)}
                              className="text-left hover:text-primary transition-colors text-sm font-medium text-foreground w-full"
                            >
                              {task.name}
                            </button>
                          </div>
                        </ResizablePanel>
                        <ResizableHandle />
                        <ResizablePanel defaultSize={30} minSize={20}>
                          <div className="px-2 py-2 h-full flex items-center justify-between">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(task.assignee)}
                              </AvatarFallback>
                            </Avatar>
                            
                            {/* Actions Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onTaskClick(task)}>
                                  Edit Task
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => onTaskDelete(task.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </ResizablePanel>
                      </ResizablePanelGroup>
                    </div>
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