import React from 'react';

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

export const Timeline: React.FC = () => {
  console.log('🚀 Timeline component is mounting...');
  
  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-4">Timeline Debug Test</h1>
        <p className="text-muted-foreground mb-8">If you can see this, the Timeline component is working!</p>
        
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Component Status</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Timeline component rendered successfully</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Tailwind styles are working</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>React is rendering properly</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;