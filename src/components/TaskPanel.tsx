import React, { useState } from 'react';
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
import { TaskColumnConfig, availableColumns, type ColumnId } from './TaskColumnConfig';

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
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(['name', 'assignee']);

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

  const getColumnConfig = (columnId: ColumnId) => {
    return availableColumns.find(col => col.id === columnId);
  };

  const visibleColumnConfigs = visibleColumns.map(id => getColumnConfig(id)).filter(Boolean);

  return (
    <Card className="w-96 h-full rounded-none border-r border-y-0 border-l-0 bg-card">
      <CardContent className="p-0 h-full">
        <div className="flex h-full">
          {/* Checkbox Column */}
          <div className="w-8 border-r flex flex-col">
            {/* Header Checkbox */}
            <div className="p-2 border-b bg-muted/30 flex items-center justify-center" style={{ height: '80px' }}>
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
            
            {/* Task Checkboxes */}
            <div className="flex-1 overflow-y-auto">
              {tasks.length === 0 ? null : (
                <div>
                  {tasks.map((task) => (
                    <div 
                      key={`checkbox-${task.id}`}
                      className="p-2 border-b flex items-center justify-center"
                      style={{ height: '48px' }}
                    >
                      <Checkbox 
                        checked={selectedTasks.has(task.id)}
                        onCheckedChange={(checked) => handleTaskSelection(task.id, !!checked)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Resizable Content Columns */}
          <div className="flex-1">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {visibleColumnConfigs.map((column, index) => (
                <React.Fragment key={column!.id}>
                  <ResizablePanel 
                    defaultSize={column!.width} 
                    minSize={column!.minWidth}
                  >
                    <div className="h-full flex flex-col">
                      {/* Column Header */}
                      <div className="px-4 py-3 border-b border-r bg-muted/30 flex items-center justify-between" style={{ height: '80px' }}>
                        <h3 className="font-semibold text-sm text-foreground">{column!.label}</h3>
                        {column!.id === visibleColumns[visibleColumns.length - 1] && (
                          <TaskColumnConfig 
                            visibleColumns={visibleColumns}
                            onColumnsChange={setVisibleColumns}
                          />
                        )}
                      </div>
                      
                      {/* Column Content */}
                      <div className="flex-1 overflow-y-auto">
                        {tasks.length === 0 ? (
                          column!.id === 'name' ? (
                            <div className="p-8 text-center text-muted-foreground">
                              <p>No tasks to display</p>
                              <p className="text-sm">Try adjusting your filters</p>
                            </div>
                          ) : null
                        ) : (
                          <div>
                            {tasks.map((task) => (
                              <div 
                                key={`${column!.id}-${task.id}`}
                                className={`px-4 py-2 border-b border-r flex items-center hover:bg-muted/50 transition-colors ${
                                  selectedTasks.has(task.id) ? 'bg-muted/30' : ''
                                } ${column!.id === 'assignee' ? 'justify-between' : ''}`}
                                style={{ height: '48px' }}
                              >
                                {column!.id === 'name' ? (
                                  <button
                                    onClick={() => onTaskClick(task)}
                                    className="text-left hover:text-primary transition-colors w-full"
                                  >
                                    {column!.render(task)}
                                  </button>
                                ) : column!.id === 'assignee' ? (
                                  <>
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                        {getInitials(task.assignee)}
                                      </AvatarFallback>
                                    </Avatar>
                                    
                                    {/* Actions Menu - only show on last column */}
                                    {column!.id === visibleColumns[visibleColumns.length - 1] && (
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
                                    )}
                                  </>
                                ) : (
                                  <div className="w-full">
                                    {column!.render(task)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </ResizablePanel>
                  
                  {/* Add resize handle between columns (except after last column) */}
                  {index < visibleColumnConfigs.length - 1 && <ResizableHandle />}
                </React.Fragment>
              ))}
            </ResizablePanelGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};