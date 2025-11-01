import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, FolderOpen, Activity } from 'lucide-react';

interface BuyerNavbarProps {
  activeTab: 'profile' | 'projects' | 'ongoing';
  onTabChange: (tab: 'profile' | 'projects' | 'ongoing') => void;
}

export const BuyerNavbar = ({ activeTab, onTabChange }: BuyerNavbarProps) => {
  const tabs = [
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: User,
      description: 'View profile information'
    },
    {
      id: 'projects' as const,
      label: 'Projects',
      icon: FolderOpen,
      description: 'Manage posted projects'
    },
    
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <nav className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant={isActive ? 'default' : 'ghost'}
                onClick={() => onTabChange(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </Button>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
};