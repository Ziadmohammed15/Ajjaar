import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star, MapPin, Heart, Share2, MessageCircle, User, Phone,
  Calendar, Clock, ChevronLeft, ChevronRight, X, Check,
  Shield, Award, Verified, Camera, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';
import CommissionInfo from '../components/CommissionInfo';
import RatingStars from '../components/RatingStars';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../context/ToastContext';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ServiceData {
  id: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  image_url: string;
  location: string;
  category: string;
  subcategory?: string;
  status: string;
  created_at: string;
  provider_id: string;
  provider?: {
    id: string;
    name: string;
    avatar_url?: string;
    rating?: number;
    verified?: boolean;
    total_reviews?: number;
    total_completed_services?: number;
    phone?: string;
  };
  features?: string[];
  images?: string[];
  reviews?: any[];
}

const ServiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { createConversation } = useChat();
  const { showSuccess, showError } = useToast();

  const [service, setService] = useState<ServiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Generate available dates (next 30 days)
  const availableDates = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(new Date(), i + 1);
    return {
      date: format(date, 'yyyy-MM-dd'),
      display: format(date, 'EEEE، d MMMM', { locale: ar }),
      isToday: i === 0
    };
  });

  // Available time slots
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  useEffect(() => {
    fetchServiceDetails();
    checkIfFavorite();
    // eslint-disable-next-line
  }, [id, user]);

  const fetchServiceDetails = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      // Fetch service with provider details (safe join, fallback if join fails)
      let serviceData: any = null;
      let serviceError: any = null;

      // Try to get provider info by join first
      const { data: joinedData, error: joinedError } = await supabase
        .from('services')
        .select(`
          *,
          provider:profiles!services_provider_id_fkey(
            id, name, avatar_url, phone_verified, total_reviews, total_completed_services
          )
        `)
        .eq('id', id)
        .single();

      if (!joinedError && joinedData) {
        serviceData = joinedData;
      } else {
        // fallback: get service only
        const { data: fallbackService, error: fallbackError } = await supabase
          .from('services')
          .select('*')
          .eq('id', id)
          .single();
        serviceData = fallbackService;
        serviceError = fallbackError;
      }
      if (!serviceData || serviceError) throw serviceError || new Error('Service not found');

      // Fetch service features
      const { data: featuresData } = await supabase
        .from('service_features')
        .select('feature')
        .eq('service_id', id);

      // Fetch reviews with user profiles
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          user:profiles!reviews_user_id_fkey(name, avatar_url)
        `)
        .eq('service_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Check if provider is verified
      let providerVerified = false;
      if (serviceData.provider_id) {
        const { data: providerData } = await supabase
          .from('providers')
          .select('verified')
          .eq('id', serviceData.provider_id)
          .single();
        providerVerified = !!providerData?.verified;
      }

      // If provider info missing (join failed), fetch it manually
      let provider = serviceData.provider;
      if (!provider && serviceData.provider_id) {
        const { data: providerProfile } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, phone_verified, total_reviews, total_completed_services')
          .eq('id', serviceData.provider_id)
          .single();
        provider = providerProfile;
      }

      setService({
        ...serviceData,
        features: featuresData?.map(f => f.feature) || [],
        reviews: reviewsData || [],
        provider: provider
          ? {
              ...provider,
              verified: providerVerified
            }
          : undefined,
      });
    } catch (error) {
      console.error('Error fetching service:', error);
      showError('حدث خطأ في تحميل تفاصيل الخدمة');
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    if (!user || !id) return;

    const { data } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .eq('service_id', id)
      .single();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('service_id', id);
        showSuccess('تم إزالة الخدمة من المفضلة');
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            service_id: id
          });
        showSuccess('تم إضافة الخدمة للمفضلة');
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      showError('حدث خطأ في تحديث المفضلة');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: service?.title || 'خدمة من أجار',
      text: service?.description || '',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      showSuccess('تم نسخ رابط الخدمة!');
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!profile?.is_profile_complete) {
      navigate('/complete-profile');
      return;
    }

    if (!service?.provider_id) return;
    const conversationId = await createConversation(service.provider_id, Number(id));
    if (conversationId) {
      navigate(`/chat/${conversationId}`);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!profile?.is_profile_complete) {
      navigate('/complete-profile');
      return;
    }

    if (!selectedDate || !selectedTime) {
      showError('يرجى اختيار التاريخ والوقت');
      return;
    }

    setIsBooking(true);
    try {
      const commission = (service?.price || 0) * 0.025; // 2.5%
      const vat = (service?.price || 0) * 0.15;
      const totalPrice = (service?.price || 0) + commission + vat;

      const { error } = await supabase
        .from('bookings')
        .insert({
          service_id: id,
          client_id: user.id,
          date: selectedDate,
          time: selectedTime,
          location: bookingNotes || service?.location,
          total_price: totalPrice,
          commission: commission,
          status: 'pending'
        });

      if (error) throw error;

      showSuccess('تم إرسال طلب الحجز بنجاح');
      setShowBookingModal(false);
      navigate('/booking-confirmation');
    } catch (error) {
      console.error('Booking error:', error);
      showError('حدث خطأ في إرسال طلب الحجز');
    } finally {
      setIsBooking(false);
    }
  };

  const nextImage = () => {
    if (service?.images) {
      setCurrentImageIndex((prev) =>
        prev === service.images!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (service?.images) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? service.images!.length - 1 : prev - 1
      );
    }
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="animate-pulse">
          <div className="h-64 bg-secondary-200 dark:bg-secondary-700 rounded-xl mb-4"></div>
          <div className="space-y-4">
            <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4"></div>
            <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2"></div>
            <div className="h-20 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2 dark:text-white">الخدمة غير موجودة</h2>
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">
            لم يتم العثور على الخدمة المطلوبة
          </p>
          <button
            onClick={() => navigate('/home')}
            className="btn-primary"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const isProvider = profile?.user_type === 'provider' && user?.id === service.provider_id;
  const serviceImages = service.images && service.images.length > 0
    ? service.images
    : [service.image_url];

  return (
    <div className="app-container">
      {/* ... باقي الكود كما هو ... */}
      {/* قم بوضع نفس كودك الحالي لباقي الصفحة هنا دون تغيير إذا لم يكن هناك خطأ آخر في العرض أو المفهوم */}
      {/* أهم شيء: التأكد أن service.provider دائماً موجود (سواء من join أو من الطلب المنفصل) */}

      {/* ... نفس JSX السابق ... */}
      {/* في ملخص الحجز: العمولة 2.5% وليس 5% */}
      {/* في CommissionInfo: سيتم استخدام نفس القيمة المعدلة تلقائياً إذا كان الملف معدل */}
      {/* ... إلخ ... */}
      {/* إذا كان هناك جزء معين لا يظهر أو حدث خطأ في العرض، أرسل لي رسالة الخطأ من الكونسول وسوف أساعدك فوراً */}
      {/* ... بقية الصفحة ... */}
    </div>
  );
};

export default ServiceDetails;