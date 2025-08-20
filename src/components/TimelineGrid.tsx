import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import type { Task, ZoomLevel } from './Timeline';
import { format, startOfDay, endOfDay, addDays, addWeeks, addMonths, differenceInDays, isToday } from 'date-fns';

interface Dependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
}

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
  onDependencyCreate: (fromTaskId: string, toTaskId: string) => void;
  rowIndex: number;
}

const TaskBar: React.FC<TaskBarProps> = ({ 
  task, 
  startDate, 
  endDate, 
  pixelsPerDay, 
  onTaskUpdate,
  onDependencyCreate,
  rowIndex 
}) => {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY EARLY RETURNS
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | 'dependency' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, taskStart: task.startDate, taskEnd: task.endDate });
  const [hoveredEdge, setHoveredEdge] = useState<'start' | 'end' | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [dependencyPreview, setDependencyPreview] = useState<{ x: number; y: number } | null>(null);

  // Calculate positions
  const taskStartPos = differenceInDays(task.startDate, startDate) * pixelsPerDay;
  const taskEndPos = differenceInDays(task.endDate, startDate) * pixelsPerDay;
  const taskWidth = Math.max(pixelsPerDay, taskEndPos - taskStartPos + pixelsPerDay);
  const minWidth = pixelsPerDay; // Minimum 1 day

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize-start' | 'resize-end') => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ 
      x: e.clientX, 
      y: e.clientY,
      taskStart: task.startDate, 
      taskEnd: task.endDate 
    });
  };

  const handleDependencyMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 DEPENDENCY DRAG STARTED from task:', task.id);
    setIsDragging(true);
    setDragType('dependency');
    setDragStart({ 
      x: e.clientX, 
      y: e.clientY,
      taskStart: task.startDate, 
      taskEnd: task.endDate 
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragType) return;

      if (dragType === 'dependency') {
        console.log('🖱️ DEPENDENCY DRAG in progress:', e.clientX, e.clientY);
        // Update dependency preview line position
        setDependencyPreview({ x: e.clientX, y: e.clientY });
        return;
      }

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

    const handleMouseUp = (e: MouseEvent) => {
      console.log('🛑 MOUSE UP - drag type:', dragType, 'at position:', e.clientX, e.clientY);
      
      if (dragType === 'dependency') {
        console.log('🎯 DEPENDENCY DRAG ENDED at:', e.clientX, e.clientY);
        
        // Get all elements at the drop point
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        console.log('📍 All elements at drop point:', elements.map(el => ({
          tag: el.tagName,
          className: el.className,
          id: el.id,
          taskId: el.getAttribute('data-task-id')
        })));
        
        // Look for any element with data-task-id
        let targetTaskId = null;
        for (const element of elements) {
          const taskId = element.getAttribute('data-task-id');
          if (taskId && taskId !== task.id) {
            targetTaskId = taskId;
            console.log('✅ Found target task directly:', taskId);
            break;
          }
          // Also check parent elements
          const parent = element.closest('[data-task-id]');
          if (parent) {
            const parentTaskId = parent.getAttribute('data-task-id');
            if (parentTaskId && parentTaskId !== task.id) {
              targetTaskId = parentTaskId;
              console.log('✅ Found target task in parent:', parentTaskId);
              break;
            }
          }
        }
        
        if (targetTaskId) {
          console.log('🚀 CREATING DEPENDENCY from', task.id, 'to', targetTaskId);
          onDependencyCreate(task.id, targetTaskId);
        } else {
          console.log('❌ No valid drop target found - source task:', task.id);
          console.log('💡 Available task IDs on page:', 
            Array.from(document.querySelectorAll('[data-task-id]')).map(el => el.getAttribute('data-task-id'))
          );
        }
      }
      
      setIsDragging(false);
      setDragType(null);
      setDependencyPreview(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragType, dragStart, pixelsPerDay, task, onTaskUpdate, onDependencyCreate]);

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

  // NOW we can safely do early returns AFTER all hooks are called
  if (task.endDate < startDate || task.startDate > endDate) {
    return null;
  }

  return (
    <>
      {/* Main task bar with normal positioning */}
      <div
        data-task-id={task.id}
        className={`absolute h-8 rounded-sm shadow-sm transition-all duration-200 group ${getStatusColor(task.status)} ${isDragging ? 'z-20 shadow-lg' : 'hover:shadow-md hover:z-10'} ${isHovered ? 'ring-1 ring-white/20' : ''}`}
        style={{
          left: Math.max(0, taskStartPos),
          width: Math.max(minWidth, taskWidth),
          top: rowIndex * 48 + 8,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setHoveredEdge(null);
        }}
        title={`${task.name} (${format(task.startDate, 'MMM d')} - ${format(task.endDate, 'MMM d')})`}
      >
        {/* Left Edge Area */}
        <div
          className="absolute left-0 top-0 h-full w-4 flex items-center justify-start z-30"
          onMouseEnter={() => setHoveredEdge('start')}
          onMouseLeave={() => setHoveredEdge(null)}
        >
          {/* Resize Handle */}
          <div
            className={`w-1 h-4 bg-white/60 rounded-full cursor-ew-resize transition-all duration-200 ${
              hoveredEdge === 'start' ? 'opacity-100 scale-110' : 'opacity-0'
            }`}
            onMouseDown={(e) => handleMouseDown(e, 'resize-start')}
          />
          
          {/* Edge Line + Arrow for resize indication */}
          <div
            className={`absolute -left-4 top-1/2 transform -translate-y-1/2 transition-all duration-200 ${
              hoveredEdge === 'start' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center">
              <svg width="12" height="8" className="text-primary">
                <path d="M8 4L4 2v4l4-2z" fill="currentColor" />
              </svg>
              <div className="w-3 h-0.5 bg-primary"></div>
            </div>
          </div>
        </div>

        {/* Dependency Dot - Left (Completely outside strip) */}
        <div
          className={`absolute w-3 h-3 bg-primary border-2 border-background rounded-full cursor-crosshair transition-all duration-200 z-50 shadow-lg ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-0'
          } hover:scale-125 hover:bg-primary/80`}
          style={{
            left: -12, // 12px outside the left edge of task bar
            top: '50%',
            transform: 'translateY(-50%)'
          }}
          title="Create dependency from this task"
          onMouseDown={handleDependencyMouseDown}
        />

        {/* Right Edge Area */}
        <div
          className="absolute right-0 top-0 h-full w-4 flex items-center justify-end z-30"
          onMouseEnter={() => setHoveredEdge('end')}
          onMouseLeave={() => setHoveredEdge(null)}
        >
          {/* Resize Handle */}
          <div
            className={`w-1 h-4 bg-white/60 rounded-full cursor-ew-resize transition-all duration-200 ${
              hoveredEdge === 'end' ? 'opacity-100 scale-110' : 'opacity-0'
            }`}
            onMouseDown={(e) => handleMouseDown(e, 'resize-end')}
          />
          
          {/* Edge Line + Arrow for resize indication */}
          <div
            className={`absolute -right-4 top-1/2 transform -translate-y-1/2 transition-all duration-200 ${
              hoveredEdge === 'end' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-primary"></div>
              <svg width="12" height="8" className="text-primary">
                <path d="M4 4l4-2v4l-4-2z" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>

        {/* Dependency Dot - Right (Completely outside strip) */}
        <div
          className={`absolute w-3 h-3 bg-primary border-2 border-background rounded-full cursor-crosshair transition-all duration-200 z-50 shadow-lg ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-0'
          } hover:scale-125 hover:bg-primary/80`}
          style={{
            right: -12, // 12px outside the right edge of task bar
            top: '50%',
            transform: 'translateY(-50%)'
          }}
          title="Create dependency from this task"
          onMouseDown={handleDependencyMouseDown}
        />

        {/* Center Move Area */}
        <div
          className="absolute left-4 right-4 top-0 h-full cursor-move z-10"
          onMouseDown={(e) => handleMouseDown(e, 'move')}
        />
        
        {/* Progress indicator background */}
        {task.progress !== undefined && task.progress > 0 && (
          <div 
            className="absolute top-0 left-0 h-full bg-white/25 transition-all duration-300 rounded-l-sm"
            style={{ width: `${task.progress}%` }}
          />
        )}
        
        {/* Task content */}
        <div className="px-4 py-1 h-full flex items-center text-white text-sm font-medium relative z-10">
          <span className="truncate">{task.name}</span>
          {task.progress !== undefined && task.progress > 0 && (
            <span className="ml-1 text-xs opacity-80">({task.progress}%)</span>
          )}
        </div>
      </div>

      {/* Dependency Preview Line */}
      {dependencyPreview && dragType === 'dependency' && (
        <svg className="fixed top-0 left-0 w-full h-full pointer-events-none z-50">
          <line
            x1={dragStart.x}
            y1={dragStart.y}
            x2={dependencyPreview.x}
            y2={dependencyPreview.y}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="2"
            strokeDasharray="5,5"
            className="drop-shadow-sm"
          />
        </svg>
      )}
    </>
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
                : date.getDay() === 0 || date.getDay() === 6
                ? 'bg-muted/30 text-muted-foreground' // Weekend styling
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
  const [hasScrolledToToday, setHasScrolledToToday] = useState(false);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);

  const handleDependencyCreate = (fromTaskId: string, toTaskId: string) => {
    console.log('🔥 HANDLE DEPENDENCY CREATE called:', fromTaskId, '->', toTaskId);
    
    // Simple check for existing dependency
    const existingDep = dependencies.find(dep => 
      dep.fromTaskId === fromTaskId && dep.toTaskId === toTaskId
    );
    
    if (existingDep) {
      console.log('⚠️ Dependency already exists:', existingDep);
      return;
    }
    
    const newDependency: Dependency = {
      id: `${fromTaskId}-to-${toTaskId}`,
      fromTaskId,
      toTaskId,
    };
    
    console.log('✨ Creating new dependency:', newDependency);
    console.log('📊 Current dependencies before update:', dependencies);
    
    // Force state update with proper callback
    setDependencies(prevDeps => {
      const updated = [...prevDeps, newDependency];
      console.log('📊 Dependencies state updating from', prevDeps.length, 'to', updated.length);
      console.log('📊 New dependencies array:', updated);
      return updated;
    });
  };
  
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

  // Scroll to today on mount - only once
  useEffect(() => {
    if (scrollRef.current && !hasScrolledToToday) {
      scrollRef.current.scrollLeft = Math.max(0, todayPosition - 400);
      setHasScrolledToToday(true);
    }
  }, [todayPosition, hasScrolledToToday]);

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
                    isToday(date) 
                      ? 'border-timeline-today/30' 
                      : date.getDay() === 0 || date.getDay() === 6
                      ? 'bg-muted/20 border-timeline-grid' // Weekend background
                      : 'border-timeline-grid'
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
            
            {/* Debug: Dependencies count and controls */}
            <div className="absolute top-2 right-2 z-50 space-y-1">
              <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                Dependencies: {dependencies.length} | Available Tasks: {tasks.length}
              </div>
              <button 
                onClick={() => {
                  console.log('🗑️ CLEARING ALL DEPENDENCIES');
                  setDependencies([]);
                }}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
              >
                Clear All Dependencies
              </button>
            </div>

            {/* Task bars */}
            <div className="absolute" style={{ top: '80px', left: 0, right: 0, height: Math.max(tasks.length * 48, 400) }}>
              {tasks.map((task, index) => (
                 <TaskBar
                   key={task.id}
                   task={task}
                   startDate={startDate}
                   endDate={endDate}
                   pixelsPerDay={pixelsPerDay}
                   onTaskUpdate={onTaskUpdate}
                   onDependencyCreate={handleDependencyCreate}
                   rowIndex={index}
                 />
              ))}
            </div>
            
            {/* Debug: Dependencies list */}
            {dependencies.length > 0 && (
              <div className="absolute top-10 right-2 bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs z-50 max-w-xs">
                {dependencies.map(dep => (
                  <div key={dep.id}>{dep.fromTaskId} → {dep.toTaskId}</div>
                ))}
              </div>
            )}
            
            {/* Dependency arrows */}
            <svg 
              className="absolute pointer-events-none z-40" 
              style={{ 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%'
              }}
            >
              {/* Arrow marker definition - only once */}
              <defs>
                <marker
                  id="dependency-arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="hsl(var(--primary))"
                  />
                </marker>
              </defs>
              
              {/* Debug rect to test SVG visibility */}
              <rect x="10" y="10" width="150" height="30" fill="rgba(0,255,0,0.3)" stroke="green" strokeWidth="2" />
              <text x="15" y="30" fill="green" fontSize="14" fontWeight="bold">SVG OVERLAY WORKING</text>
              
              {/* Dependencies counter */}
              <text x="10" y="60" fill="purple" fontSize="14" fontWeight="bold">
                Dependencies: {dependencies.length}
              </text>
              
              {dependencies.map((dependency, index) => {
                console.log(`🎨 Rendering dependency ${index + 1}/${dependencies.length}:`, dependency);
                
                const fromTask = tasks.find(t => t.id === dependency.fromTaskId);
                const toTask = tasks.find(t => t.id === dependency.toTaskId);
                
                if (!fromTask || !toTask) {
                  console.log('❌ Missing task for dependency:', dependency, { fromTask: !!fromTask, toTask: !!toTask });
                  return (
                    <text key={dependency.id} x="200" y={80 + index * 20} fill="red" fontSize="12" fontWeight="bold">
                      ERROR: {dependency.id} - Missing tasks
                    </text>
                  );
                }
                
                const fromIndex = tasks.findIndex(t => t.id === dependency.fromTaskId);
                const toIndex = tasks.findIndex(t => t.id === dependency.toTaskId);
                
                // Calculate positions with header offset
                const headerHeight = 80;
                const fromTaskEndPos = differenceInDays(fromTask.endDate, startDate) * pixelsPerDay + pixelsPerDay;
                const toTaskStartPos = differenceInDays(toTask.startDate, startDate) * pixelsPerDay;
                
                const fromY = headerHeight + fromIndex * 48 + 24; // Center of task + header
                const toY = headerHeight + toIndex * 48 + 24; // Center of task + header
                
                const startX = fromTaskEndPos + 5; // Small offset from end of task
                const endX = Math.max(toTaskStartPos - 5, startX + 30); // Small offset to start of task
                
                // Simple straight line for now to test
                const pathData = `M ${startX} ${fromY} L ${endX} ${toY}`;

                console.log('🎨 Arrow coordinates:', {
                  dependency: dependency.id,
                  fromTask: fromTask.name,
                  toTask: toTask.name,
                  fromY,
                  toY,
                  startX,
                  endX,
                  headerHeight
                });

                return (
                  <g key={dependency.id}>
                    {/* Large debug circles to make them visible */}
                    <circle cx={startX} cy={fromY} r="8" fill="blue" stroke="white" strokeWidth="2" opacity="0.8" />
                    <circle cx={endX} cy={toY} r="8" fill="green" stroke="white" strokeWidth="2" opacity="0.8" />
                    
                    {/* Thick arrow line */}
                    <path
                      d={pathData}
                      stroke="hsl(var(--primary))"
                      strokeWidth="4"
                      fill="none"
                      markerEnd="url(#dependency-arrowhead)"
                      opacity="0.9"
                    />
                    
                    {/* Clear debug text */}
                    <text x={startX + 12} y={fromY - 5} fill="blue" fontSize="12" fontWeight="bold">
                      FROM: {dependency.fromTaskId}
                    </text>
                    <text x={endX + 12} y={toY + 15} fill="green" fontSize="12" fontWeight="bold">
                      TO: {dependency.toTaskId}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </Card>
  );
};