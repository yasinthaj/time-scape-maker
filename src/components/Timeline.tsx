import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { TaskPanel } from './TaskPanel';
import { TimelineGrid } from './TimelineGrid';
import { TaskDrawer } from './TaskDrawer';
import { useToast } from '@/hooks/use-toast';

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
    name: 'Project Setup & Planning',
    status: 'completed',
    priority: 'high',
    assignee: 'John Doe',
    startDate: new Date(2024, 11, 16), // Dec 16, 2024
    endDate: new Date(2024, 11, 22), // Dec 22, 2024
    progress: 100,
    description: 'Initial project setup and requirement gathering'
  },
  {
    id: '2',
    name: 'UI/UX Design Phase',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Sarah Wilson',
    startDate: new Date(2024, 11, 23), // Dec 23, 2024
    endDate: new Date(2025, 0, 10), // Jan 10, 2025
    progress: 65,
    dependencies: ['1'],
    description: 'Create wireframes and design mockups'
  },
  {
    id: '3',
    name: 'Backend Development',
    status: 'todo',
    priority: 'medium',
    assignee: 'Mike Johnson',
    startDate: new Date(2025, 0, 6), // Jan 6, 2025
    endDate: new Date(2025, 1, 15), // Feb 15, 2025
    progress: 0,
    dependencies: ['1'],
    description: 'API development and database setup'
  },
  {
    id: '4',
    name: 'Frontend Implementation',
    status: 'todo',
    priority: 'medium',
    assignee: 'Emily Chen',
    startDate: new Date(2025, 0, 11), // Jan 11, 2025
    endDate: new Date(2025, 1, 28), // Feb 28, 2025
    progress: 0,
    dependencies: ['2'],
    description: 'React component development'
  },
  {
    id: '5',
    name: 'Testing & QA',
    status: 'todo',
    priority: 'high',
    assignee: 'David Brown',
    startDate: new Date(2025, 1, 16), // Feb 16, 2025
    endDate: new Date(2025, 2, 5), // Mar 5, 2025
    progress: 0,
    dependencies: ['3', '4'],
    description: 'Comprehensive testing and quality assurance'
  },
  {
    id: '6',
    name: 'Database Design',
    status: 'completed',
    priority: 'high',
    assignee: 'Alex Rodriguez',
    startDate: new Date(2024, 11, 20), // Dec 20, 2024
    endDate: new Date(2024, 11, 30), // Dec 30, 2024
    progress: 100,
    description: 'Design database schema and relationships'
  },
  {
    id: '7',
    name: 'User Authentication System',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Lisa Wang',
    startDate: new Date(2025, 0, 2), // Jan 2, 2025
    endDate: new Date(2025, 0, 20), // Jan 20, 2025
    progress: 40,
    dependencies: ['6'],
    description: 'Implement login, registration, and security features'
  },
  {
    id: '8',
    name: 'Content Management',
    status: 'todo',
    priority: 'medium',
    assignee: 'Tom Harris',
    startDate: new Date(2025, 1, 1), // Feb 1, 2025
    endDate: new Date(2025, 2, 15), // Mar 15, 2025
    progress: 0,
    dependencies: ['4'],
    description: 'Build content creation and management tools'
  }
];

export const Timeline: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
  const [sortBy, setSortBy] = useState<string>('startDate');
  const { toast } = useToast();

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'startDate':
          return a.startDate.getTime() - b.startDate.getTime();
        case 'endDate':
          return a.endDate.getTime() - b.endDate.getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, searchQuery, statusFilter, sortBy]);

  const handleTaskUpdate = (updatedTask: Task) => {
    console.log('Timeline received task update:', {
      id: updatedTask.id,
      name: updatedTask.name,
      startDate: updatedTask.startDate,
      endDate: updatedTask.endDate
    });
    
    setTasks(prev => {
      const updated = prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      );
      console.log('Updated tasks array:', updated);
      return updated;
    });
    
    toast({
      title: "Task Updated",
      description: `${updatedTask.name} has been updated successfully.`,
    });
  };

  const handleTaskCreate = (newTask: Omit<Task, 'id'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
    };
    setTasks(prev => [...prev, task]);
    toast({
      title: "Task Created",
      description: `${task.name} has been created successfully.`,
    });
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast({
      title: "Task Deleted",
      description: "Task has been deleted successfully.",
      variant: "destructive",
    });
  };

  const openTaskDrawer = (task?: Task) => {
    setSelectedTask(task || null);
    setIsDrawerOpen(true);
  };

  const closeTaskDrawer = () => {
    setSelectedTask(null);
    setIsDrawerOpen(false);
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Project Timeline
            </CardTitle>
            <Button 
              onClick={() => openTaskDrawer()}
              className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startDate">Start Date</SelectItem>
                <SelectItem value="endDate">Due Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>

            {/* Zoom Level */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={zoomLevel === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setZoomLevel('day')}
              >
                Day
              </Button>
              <Button
                variant={zoomLevel === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setZoomLevel('week')}
              >
                Week
              </Button>
              <Button
                variant={zoomLevel === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setZoomLevel('month')}
              >
                Month
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-3 py-1">
              {filteredTasks.length} Tasks
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-task-completed border-task-completed">
              {filteredTasks.filter(t => t.status === 'completed').length} Completed
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-task-progress border-task-progress">
              {filteredTasks.filter(t => t.status === 'in-progress').length} In Progress
            </Badge>
            <Badge variant="outline" className="px-3 py-1 border-muted-foreground">
              {filteredTasks.filter(t => t.status === 'todo').length} To Do
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Main Timeline View */}
      <div className="flex-1 flex overflow-hidden">
        <TaskPanel 
          tasks={filteredTasks}
          onTaskClick={openTaskDrawer}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
        />
        
        <TimelineGrid 
          tasks={filteredTasks}
          zoomLevel={zoomLevel}
          onTaskUpdate={handleTaskUpdate}
        />
      </div>

      {/* Task Drawer */}
      <TaskDrawer
        isOpen={isDrawerOpen}
        onClose={closeTaskDrawer}
        task={selectedTask}
        onTaskUpdate={handleTaskUpdate}
        onTaskCreate={handleTaskCreate}
        onTaskDelete={handleTaskDelete}
      />
    </div>
  );
};

export default Timeline;