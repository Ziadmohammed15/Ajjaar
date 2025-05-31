import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import PhoneInput from '../components/PhoneInput';
import PhoneVerification from '../components/PhoneVerification';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const PhoneVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { phoneVerified, user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(location.state?.phone || '');
  const [showVerification, setShowVerification] = useState(!!location.state?.phone);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(location.state?.userId || null);

  useEffect(() => {
    if (phoneVerified && !verificationComplete) {
      navigate('/user-type');
    }
  }, [phoneVerified, navigate, verificationComplete]);

  const handlePhoneSubmit = async (phone: string) => {
    try {
      setPhoneNumber(phone);
      
      // Send verification code
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ phoneNumber: phone })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send verification code');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setShowVerification(true);
      } else {
        throw new Error(data.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      setError(error.message || 'Failed to send verification code');
    }
  };
  
  const handleVerified = async () => {
    try {
      setVerificationComplete(true);

      // Get current user if not provided in location state
      if (!userId) {
        const { data: authUser } = await supabase.auth.getUser();
        setUserId(authUser?.user?.id || null);
      }
      
      if (!userId) {
        throw new Error('No authenticated user found');
      }

      // Try to find existing profile
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            phone: phoneNumber,
            phone_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) throw updateError;
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            phone: phoneNumber,
            phone_verified: true,
            name: location.state?.name || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/user-type');
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('فشل في تحديث الملف الشخصي. يرجى المحاولة مرة أخرى.');
      setVerificationComplete(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/auth');
  };
  
  const handleChangePhone = () => {
    setShowVerification(false);
  };

  return (
    <>
      <Header title="التحقق من رقم الهاتف" showBack={true} />
      
      <div className="page-container">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30 flex items-center"
          >
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </motion.div>
        )}
        
        {verificationComplete ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-morphism p-6 rounded-2xl max-w-md mx-auto text-center"
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold mb-2 dark:text-white">تم التحقق بنجاح</h2>
            <p className="text-secondary-600 dark:text-secondary-300 mb-6">
              تم التحقق من رقم هاتفك بنجاح. جاري تحويلك...
            </p>
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </motion.div>
        ) : showVerification ? (
          <PhoneVerification
            phoneNumber={phoneNumber}
            onVerified={handleVerified}
            onCancel={handleCancel}
            onChangePhone={handleChangePhone}
          />
        ) : (
          <PhoneInput
            initialPhoneNumber={phoneNumber}
            onSubmit={handlePhoneSubmit}
            onCancel={handleCancel}
          />
        )}
      </div>
    </>
  );
};

export default PhoneVerificationPage;