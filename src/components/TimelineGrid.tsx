import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import type { Task, ZoomLevel } from './Timeline';
import { format, startOfDay, endOfDay, addDays, addWeeks, addMonths, differenceInDays, isToday } from 'date-fns';

interface TimelineGridProps {
  tasks: Task[];
  zoomLevel: ZoomLevel;
  onTaskUpdate: (task: Task) => void;
}

interface TaskBarProps {
  task: Task;
  startDate: Date;
  endDate: Date;
  pixelsPerDay: number;
  onTaskUpdate: (task: Task) => void;
  rowIndex: number;
}

const TaskBar: React.FC<TaskBarProps> = ({ 
  task, 
  startDate, 
  endDate, 
  pixelsPerDay, 
  onTaskUpdate,
  rowIndex 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, taskStart: task.startDate, taskEnd: task.endDate });

  const taskStartPos = differenceInDays(task.startDate, startDate) * pixelsPerDay;
  const taskEndPos = differenceInDays(task.endDate, startDate) * pixelsPerDay;
  const taskWidth = Math.max(pixelsPerDay, taskEndPos - taskStartPos + pixelsPerDay);
  const minWidth = pixelsPerDay; // Minimum 1 day

  // Debug logging
  console.log(`Task ${task.name}:`, {
    startDate: task.startDate,
    endDate: task.endDate,
    taskStartPos,
    taskEndPos,
    taskWidth,
    visible: !(task.endDate < startDate || task.startDate > endDate)
  });

  // Only render if task overlaps with the visible date range
  if (task.endDate < startDate || task.startDate > endDate) {
    console.log(`Task ${task.name} is outside visible range, not rendering`);
    return null;
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-task-completed';
      case 'in-progress':
        return 'bg-task-progress';
      case 'todo':
        return 'bg-task-default';
      case 'overdue':
        return 'bg-task-overdue';
      default:
        return 'bg-task-default';
    }
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize-start' | 'resize-end') => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ 
      x: e.clientX, 
      taskStart: task.startDate, 
      taskEnd: task.endDate 
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragType) return;

      const deltaX = e.clientX - dragStart.x;
      const daysDelta = Math.round(deltaX / pixelsPerDay);

      let newStartDate = dragStart.taskStart;
      let newEndDate = dragStart.taskEnd;

      switch (dragType) {
        case 'move':
          newStartDate = addDays(dragStart.taskStart, daysDelta);
          newEndDate = addDays(dragStart.taskEnd, daysDelta);
          break;
        case 'resize-start':
          newStartDate = addDays(dragStart.taskStart, daysDelta);
          // Ensure start date doesn't go past end date
          if (newStartDate >= dragStart.taskEnd) {
            newStartDate = addDays(dragStart.taskEnd, -1);
          }
          break;
        case 'resize-end':
          newEndDate = addDays(dragStart.taskEnd, daysDelta);
          // Ensure end date doesn't go before start date
          if (newEndDate <= dragStart.taskStart) {
            newEndDate = addDays(dragStart.taskStart, 1);
          }
          break;
      }

      if (newStartDate !== task.startDate || newEndDate !== task.endDate) {
        onTaskUpdate({
          ...task,
          startDate: newStartDate,
          endDate: newEndDate,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragType, dragStart, pixelsPerDay, task, onTaskUpdate]);

  return (
    <div
      className={`absolute h-6 rounded-sm shadow-sm transition-all duration-200 hover:shadow-md hover:z-10 group cursor-pointer ${getStatusColor(task.status)} ${isDragging ? 'z-20 shadow-lg' : ''}`}
      style={{
        left: Math.max(0, taskStartPos),
        width: Math.max(minWidth, taskWidth),
        top: rowIndex * 48 + 12, // Center in the 48px row
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
      title={`${task.name} (${format(task.startDate, 'MMM d')} - ${format(task.endDate, 'MMM d')})`}
    >
      {/* Resize handle - left */}
      <div
        className="absolute left-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-all duration-200"
        onMouseDown={(e) => handleMouseDown(e, 'resize-start')}
      />
      
      {/* Progress indicator background */}
      {task.progress !== undefined && task.progress > 0 && (
        <div 
          className="absolute top-0 left-0 h-full bg-white/25 transition-all duration-300"
          style={{ width: `${task.progress}%` }}
        />
      )}
      
      {/* Task content */}
      <div className="px-2 py-1 h-full flex items-center text-white text-xs font-medium relative z-10">
        <span className="truncate">{task.name}</span>
        {task.progress !== undefined && task.progress > 0 && (
          <span className="ml-1 text-xs opacity-80">({task.progress}%)</span>
        )}
      </div>
      
      {/* Resize handle - right */}
      <div
        className="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-all duration-200"
        onMouseDown={(e) => handleMouseDown(e, 'resize-end')}
      />
    </div>
  );
};

const DateHeader: React.FC<{ dates: Date[]; zoomLevel: ZoomLevel }> = ({ dates, zoomLevel }) => {
  // Group dates by month for the header
  const monthGroups = dates.reduce((groups, date, index) => {
    const monthKey = format(date, 'yyyy-MM');
    if (!groups[monthKey]) {
      groups[monthKey] = {
        month: format(date, 'MMMM yyyy'),
        dates: [],
        startIndex: index,
      };
    }
    groups[monthKey].dates.push({ date, index });
    return groups;
  }, {} as Record<string, { month: string; dates: { date: Date; index: number }[]; startIndex: number }>);

  const columnWidth = zoomLevel === 'day' ? '120px' : zoomLevel === 'week' ? '60px' : '40px';

  return (
    <div className="border-b bg-card sticky top-0 z-20" style={{ height: '80px' }}>
      {/* Month Row */}
      <div className="flex border-b bg-muted/30" style={{ height: '40px' }}>
        {Object.values(monthGroups).map((group, groupIndex) => (
          <div
            key={groupIndex}
            className="flex-shrink-0 px-2 py-2 text-sm font-semibold text-center border-r text-foreground bg-gradient-to-r from-primary/5 to-primary/10 flex items-center justify-center"
            style={{ width: `calc(${columnWidth} * ${group.dates.length})` }}
          >
            {group.month}
          </div>
        ))}
      </div>
      
      {/* Days Row */}
      <div className="flex" style={{ height: '40px' }}>
        {dates.map((date, index) => (
          <div
            key={index}
            className={`flex-shrink-0 px-1 py-2 text-sm font-medium border-r text-center transition-colors flex items-center justify-center ${
              isToday(date) 
                ? 'bg-timeline-today/10 text-timeline-today font-bold' 
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
            style={{ width: columnWidth }}
          >
            <div className="space-y-0">
              <div className="text-xs opacity-75">
                {format(date, 'EEE')}
              </div>
              <div className={`text-sm ${isToday(date) ? 'font-bold' : 'font-medium'}`}>
                {format(date, 'd')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TimelineGrid: React.FC<TimelineGridProps> = ({ 
  tasks, 
  zoomLevel, 
  onTaskUpdate 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Calculate date range and pixel scale
  const today = startOfDay(new Date());
  const startDate = addDays(today, -60); // Start 60 days ago
  const endDate = addDays(today, 180); // End 180 days from now
  
  const pixelsPerDay = zoomLevel === 'day' ? 120 : zoomLevel === 'week' ? 60 : 40;
  
  // Generate date columns
  const dates: Date[] = [];
  let currentDate = startDate;
  
  while (currentDate <= endDate) {
    dates.push(currentDate);
    switch (zoomLevel) {
      case 'day':
        currentDate = addDays(currentDate, 1);
        break;
      case 'week':
        currentDate = addDays(currentDate, 1);
        break;
      case 'month':
        currentDate = addDays(currentDate, 1);
        break;
    }
  }

  // Today line position
  const todayPosition = differenceInDays(today, startDate) * pixelsPerDay;
  const totalWidth = dates.length * pixelsPerDay;

  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = Math.max(0, todayPosition - 400);
    }
  }, [todayPosition]);

  return (
    <Card className="flex-1 h-full rounded-none border-y-0 border-r-0 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Timeline Grid - Scrollable with Header */}
        <div 
          ref={scrollRef} 
          className="flex-1 overflow-x-auto overflow-y-auto relative"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="relative" style={{ width: totalWidth, minHeight: '100%' }}>
            {/* Date Header - Scrolls with content */}
            <div className="sticky top-0 z-20">
              <DateHeader dates={dates} zoomLevel={zoomLevel} />
            </div>

            {/* Grid lines */}
            <div className="absolute top-20 bottom-0 flex" style={{ height: 'calc(100% - 80px)' }}>
              {dates.map((date, index) => (
                <div
                  key={index}
                  className={`border-r h-full ${
                    isToday(date) ? 'border-timeline-today/30' : 'border-timeline-grid'
                  }`}
                  style={{ width: pixelsPerDay }}
                />
              ))}
            </div>
            
            {/* Today line */}
            <div
              className="absolute bottom-0 w-0.5 bg-timeline-today z-10 shadow-sm"
              style={{ left: todayPosition, top: '80px', height: 'calc(100% - 80px)' }}
            />
            
            {/* Task rows background */}
            <div className="absolute" style={{ top: '80px', left: 0, right: 0, bottom: 0 }}>
              {tasks.map((_, index) => (
                <div
                  key={index}
                  className={`absolute left-0 right-0 ${
                    index % 2 === 0 ? 'bg-transparent' : 'bg-muted/20'
                  }`}
                  style={{ 
                    top: index * 48,
                    height: 48
                  }}
                />
              ))}
            </div>
            
            {/* Task bars */}
            <div className="relative" style={{ height: Math.max(tasks.length * 48, 400), minHeight: '100%', top: '80px' }}>
              {tasks.map((task, index) => (
                <TaskBar
                  key={task.id}
                  task={task}
                  startDate={startDate}
                  endDate={endDate}
                  pixelsPerDay={pixelsPerDay}
                  onTaskUpdate={onTaskUpdate}
                  rowIndex={index}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};