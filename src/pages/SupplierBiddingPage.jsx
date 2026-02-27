import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { Navigate } from 'react-router-dom';

export default function SupplierBiddingPage() {
  // Deprecated: Redirecting to the new jobs page
  return <Navigate to="/supplier-hub/jobs" replace />;
}