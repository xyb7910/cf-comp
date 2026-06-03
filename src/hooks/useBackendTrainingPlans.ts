import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface BackendTrainingPlan {
  id: string;
  title: string;
  target_rating: number;
  tags: string[];
  description: string;
  completed: boolean;
  created_at: string;
  deadline: string | null;
}

interface UseBackendTrainingPlansReturn {
  plans: BackendTrainingPlan[];
  loading: boolean;
  error: string | null;
  addPlan: (planId: string) => Promise<boolean>;
  removePlan: (planId: string) => Promise<boolean>;
  refetch: () => void;
}

export function useBackendTrainingPlans(): UseBackendTrainingPlansReturn {
  const { token, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<BackendTrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    if (!token) {
      setPlans([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/training-plans/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data);
        setError(null);
      } else {
        setError('获取训练计划失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [token]);

  const addPlan = async (planId: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`/api/training-plans/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: planId }),
      });

      if (response.ok) {
        await fetchPlans();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const removePlan = async (planId: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`/api/training-plans/${planId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok || response.status === 204) {
        await fetchPlans();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  return {
    plans,
    loading,
    error,
    addPlan,
    removePlan,
    refetch: fetchPlans,
  };
}

// Hook for fetching all available training plans (public)
export function useAvailableTrainingPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Try to fetch from backend without authentication for now
        // Since API requires auth, we'll use local data
        setLoading(false);
      } catch (err) {
        setError('获取可用训练计划失败');
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return { plans, loading, error };
}