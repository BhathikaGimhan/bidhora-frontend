import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UserProfile from '@/components/UserProfile';
import AdminPanel from '@/features/admin/AdminDashbord';

const UserManagement: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage your profile and user roles
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="admin">Admin Panel</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-8">
          <div className="flex justify-center">
            <UserProfile />
          </div>
        </TabsContent>
        
        <TabsContent value="admin" className="mt-8">
          <AdminPanel />
        </TabsContent>
      </Tabs>

      <div className="mt-12 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>User Roles Explained</CardTitle>
            <CardDescription>
              Understanding the different user roles in Bidhora
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-blue-600 mb-2">Buyer</h3>
                <p className="text-sm text-muted-foreground">
                  Default role for new users. Can browse and purchase services, post project requirements.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-green-600 mb-2">Service Provider</h3>
                <p className="text-sm text-muted-foreground">
                  Can offer services, bid on projects, and sell their skills to buyers.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-red-600 mb-2">Admin</h3>
                <p className="text-sm text-muted-foreground">
                  Full access to manage users, moderate content, and oversee platform operations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;