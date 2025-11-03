import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '@/firebaseConfig';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface ProtectedEmployeeRouteProps {
  children: React.ReactNode;
}

export function ProtectedEmployeeRoute({ children }: ProtectedEmployeeRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isEmployee, setIsEmployee] = useState(false);

  useEffect(() => {
    const checkEmployeeRole = async () => {
      const user = auth.currentUser;
      
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsEmployee(userData.role === 'employee' || userData.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking employee role:', error);
      } finally {
        setLoading(false);
      }
    };

    checkEmployeeRole();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!auth.currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (!isEmployee) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
