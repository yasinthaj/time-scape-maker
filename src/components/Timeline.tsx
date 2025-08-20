import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Filter, Download } from 'lucide-react';
import { TaskPanel } from './TaskPanel';
import { TimelineGrid } from './TimelineGrid';
import { TaskDrawer } from './TaskDrawer';

export interface Task {
  id: string;
  name: string;
  status: 'todo' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  startDate: Date;
  endDate: Date;
  progress?: number;
  dependencies?: string[];
  parentId?: string;
  description?: string;
}

export type ZoomLevel = 'day' | 'week' | 'month';

// Sample data for demonstration
const sampleTasks: Task[] = [
  {
    id: '1',
    name: 'Design System Setup',
    status: 'completed',
    priority: 'high',
    assignee: 'John Doe',
    startDate: new Date(2025, 7, 10),
    endDate: new Date(2025, 7, 15),
    progress: 100,
    description: 'Set up the design system and component library'
  },
  {
    id: '2',
    name: 'Authentication Flow',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Jane Smith',
    startDate: new Date(2025, 7, 16),
    endDate: new Date(2025, 7, 25),
    progress: 60,
    description: 'Implement user authentication and authorization'
  },
  {
    id: '3',
    name: 'Timeline Component',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'Bob Wilson',
    startDate: new Date(2025, 7, 20),
    endDate: new Date(2025, 7, 30),
    progress: 80,
    description: 'Build the interactive timeline component'
  },
  {
    id: '4',
    name: 'Testing Suite',
    status: 'todo',
    priority: 'medium',
    assignee: 'Alice Brown',
    startDate: new Date(2025, 7, 26),
    endDate: new Date(2025, 8, 5),
    progress: 0,
    description: 'Set up comprehensive testing framework'
  },
  {
    id: '5',
    name: 'Documentation',
    status: 'todo',
    priority: 'low',
    assignee: 'Charlie Davis',
    startDate: new Date(2025, 8, 1),
    endDate: new Date(2025, 8, 10),
    progress: 0,
    description: 'Write user and developer documentation'
  }
];

export const Timeline: React.FC = () => {
  console.log('🚀 Timeline component is mounting...');
  
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('day');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prevTasks =>
      prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task)
    );
  };

  const handleTaskCreate = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const handleCreateNewTask = () => {
    setSelectedTask(null);
    setIsDrawerOpen(true);
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="h-16 bg-card border-b px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Project Timeline</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{tasks.length} tasks</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Zoom Level Selector */}
          <Select value={zoomLevel} onValueChange={(value) => setZoomLevel(value as ZoomLevel)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>

          {/* Action Buttons */}
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button onClick={handleCreateNewTask} size="sm" className="bg-gradient-to-r from-primary to-primary/80">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Task Panel */}
        <TaskPanel
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
        />

        {/* Timeline Grid */}
        <div className="flex-1 overflow-hidden">
          <TimelineGrid
            tasks={tasks}
            zoomLevel={zoomLevel}
            onTaskUpdate={handleTaskUpdate}
          />
        </div>
      </div>

      {/* Task Drawer */}
      <TaskDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        task={selectedTask}
        onTaskUpdate={handleTaskUpdate}
        onTaskCreate={handleTaskCreate}
        onTaskDelete={handleTaskDelete}
      />
    </div>
  );
};

export default Timeline;