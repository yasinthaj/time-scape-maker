import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, Clock, User, Flag, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task } from './Timeline';
import { format } from 'date-fns';

interface TaskPanelProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

const getStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-task-completed text-white';
    case 'in-progress':
      return 'bg-task-progress text-white';
    case 'todo':
      return 'bg-muted text-muted-foreground';
    case 'overdue':
      return 'bg-task-overdue text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getPriorityColor = (priority: Task['priority']) => {
  switch (priority) {
    case 'high':
      return 'text-destructive';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-green-600';
    default:
      return 'text-muted-foreground';
  }
};

const formatStatus = (status: Task['status']) => {
  switch (status) {
    case 'in-progress':
      return 'In Progress';
    case 'todo':
      return 'To Do';
    case 'completed':
      return 'Completed';
    case 'overdue':
      return 'Overdue';
    default:
      return status;
  }
};

export const TaskPanel: React.FC<TaskPanelProps> = ({
  tasks,
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const [editingField, setEditingField] = useState<{ taskId: string; field: string } | null>(null);

  const handleStatusChange = (task: Task, newStatus: Task['status']) => {
    onTaskUpdate({ ...task, status: newStatus });
  };

  const handleAssigneeChange = (task: Task, newAssignee: string) => {
    onTaskUpdate({ ...task, assignee: newAssignee });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="w-96 h-full rounded-none border-r border-y-0 border-l-0 bg-timeline-panel">
      <CardContent className="p-0 h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card">
          <h3 className="font-semibold text-lg">Tasks</h3>
          <p className="text-sm text-muted-foreground">{tasks.length} items</p>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tasks to display</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {tasks.map((task) => (
                <Card key={task.id} className="border-border/50 hover:shadow-sm transition-all duration-200 cursor-pointer">
                  <CardContent className="p-4">
                    {/* Task Name and Actions */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1" onClick={() => onTaskClick(task)}>
                        <h4 className="font-medium text-sm leading-tight mb-1 hover:text-primary transition-colors">
                          {task.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{format(task.startDate, 'MMM d')} - {format(task.endDate, 'MMM d')}</span>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
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
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Status and Priority */}
                    <div className="flex items-center gap-2 mb-3">
                      <Select
                        value={task.status}
                        onValueChange={(value) => handleStatusChange(task, value as Task['status'])}
                      >
                        <SelectTrigger className="h-7 text-xs w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>

                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        <Flag className="h-3 w-3 mr-1" />
                        {task.priority}
                      </Badge>
                    </div>

                    {/* Assignee */}
                    {task.assignee && (
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(task.assignee)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{task.assignee}</span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    {task.progress !== undefined && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    )}

                    {/* Dependencies indicator */}
                    {task.dependencies && task.dependencies.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                          <span className="text-xs text-muted-foreground">
                            Depends on {task.dependencies.length} task{task.dependencies.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};