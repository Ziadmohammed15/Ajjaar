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
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
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
  }, [id, user]);

  const fetchServiceDetails = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // Fetch service with provider details
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select(`
          *,
          provider:profiles!services_provider_id_fkey(
            id, name, avatar_url, phone_verified, total_reviews, total_completed_services
          )
        `)
        .eq('id', id)
        .single();

      if (serviceError) throw serviceError;

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
      const { data: providerData } = await supabase
        .from('providers')
        .select('verified')
        .eq('id', serviceData.provider_id)
        .single();

      setService({
        ...serviceData,
        features: featuresData?.map(f => f.feature) || [],
        reviews: reviewsData || [],
        provider: {
          ...serviceData.provider,
          verified: providerData?.verified || false
        }
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

    const conversationId = await createConversation(service?.provider_id!, Number(id));
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
      const commission = (service?.price || 0) * 0.05;
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
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-glass bg-white/80 dark:bg-secondary-900/80 py-4 px-4 flex items-center justify-between border-b border-secondary-100/50 dark:border-secondary-800/50">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-secondary-100/70 dark:hover:bg-secondary-800/70"
        >
          <ArrowLeft className="w-5 h-5 text-secondary-700 dark:text-secondary-300" />
        </motion.button>
        
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-secondary-100/70 dark:hover:bg-secondary-800/70"
          >
            <Share2 className="w-5 h-5 text-secondary-700 dark:text-secondary-300" />
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleFavorite}
            className="p-2 rounded-full hover:bg-secondary-100/70 dark:hover:bg-secondary-800/70"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-secondary-700 dark:text-secondary-300'}`} />
          </motion.button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative">
        <div 
          className="h-64 bg-secondary-100 dark:bg-secondary-800 cursor-pointer relative overflow-hidden"
          onClick={() => setShowImageGallery(true)}
        >
          <img
            src={serviceImages[currentImageIndex]}
            alt={service.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop';
            }}
          />
          
          {serviceImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 rtl:space-x-reverse">
                {serviceImages.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          
          <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded-lg flex items-center">
            <Camera className="w-4 h-4 mr-1" />
            <span className="text-sm">{serviceImages.length}</span>
          </div>
        </div>
      </div>

      {/* Service Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold dark:text-white mb-2">{service.title}</h1>
            <div className="flex items-center text-secondary-500 dark:text-secondary-400 mb-2">
              <MapPin className="w-4 h-4 ml-1" />
              <span>{service.location}</span>
            </div>
          </div>
          
          <div className="text-left">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {service.price} ريال
            </div>
            <div className="text-sm text-secondary-500 dark:text-secondary-400">للساعة</div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center mb-4">
          <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 ml-1" />
            <span className="font-semibold dark:text-white">{service.rating}</span>
            <span className="text-sm text-secondary-500 dark:text-secondary-400 mr-1">
              ({service.reviews?.length || 0} تقييم)
            </span>
          </div>
        </div>

        {/* Provider Info */}
        {service.provider && (
          <div className="card-glass p-4 mb-4">
            <h3 className="font-bold mb-3 dark:text-white">مقدم الخدمة</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img 
                      src={service.provider.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(service.provider.name)}&background=random`}
                      alt={service.provider.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {service.provider.verified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Verified className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="mr-3">
                  <div className="flex items-center">
                    <h4 className="font-medium dark:text-white">{service.provider.name}</h4>
                    {service.provider.verified && (
                      <Shield className="w-4 h-4 text-blue-500 mr-1" />
                    )}
                  </div>
                  <div className="flex items-center text-sm text-secondary-500 dark:text-secondary-400">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 ml-1" />
                    <span>{service.provider.rating || 0}</span>
                    <span className="mx-1">•</span>
                    <span>{service.provider.total_completed_services || 0} خدمة مكتملة</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 rtl:space-x-reverse">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartChat}
                  className="p-2 bg-primary-500 text-white rounded-full"
                >
                  <MessageCircle className="w-4 h-4" />
                </motion.button>
                
                {service.provider.phone_verified && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 bg-green-500 text-white rounded-full"
                  >
                    <Phone className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-4">
          <h3 className="font-bold mb-2 dark:text-white">وصف الخدمة</h3>
          <p className="text-secondary-700 dark:text-secondary-300 leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Features */}
        {service.features && service.features.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold mb-3 dark:text-white">مميزات الخدمة</h3>
            <div className="grid grid-cols-1 gap-2">
              {service.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 ml-2 flex-shrink-0" />
                  <span className="text-secondary-700 dark:text-secondary-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commission Info for Providers */}
        {isProvider && (
          <CommissionInfo price={service.price} showDetailed={true} />
        )}

        {/* Reviews */}
        {service.reviews && service.reviews.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold dark:text-white">التقييمات</h3>
              {service.reviews.length > 3 && (
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="text-primary-600 dark:text-primary-400 text-sm"
                >
                  {showAllReviews ? 'عرض أقل' : 'عرض المزيد'}
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {(showAllReviews ? service.reviews : service.reviews.slice(0, 3)).map((review, index) => (
                <div key={index} className="card-glass p-4">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <img 
                        src={review.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.name || 'مستخدم')}&background=random`}
                        alt={review.user?.name || 'مستخدم'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="mr-3 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium dark:text-white">{review.user?.name || 'مستخدم'}</h4>
                        <span className="text-xs text-secondary-500 dark:text-secondary-400">
                          {format(new Date(review.created_at), 'dd/MM/yyyy')}
                        </span>
                      </div>
                      
                      <RatingStars rating={review.rating} size="sm" className="mb-2" />
                      
                      {review.comment && (
                        <p className="text-secondary-700 dark:text-secondary-300 text-sm">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      {!isProvider && (
        <div className="sticky bottom-0 bg-white dark:bg-secondary-900 border-t border-secondary-100 dark:border-secondary-800 p-4">
          <div className="flex space-x-3 rtl:space-x-reverse">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartChat}
              className="flex-1 btn-glass flex items-center justify-center"
            >
              <MessageCircle className="w-5 h-5 ml-2" />
              تواصل
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowBookingModal(true)}
              className="flex-2 btn-primary flex items-center justify-center"
            >
              <Calendar className="w-5 h-5 ml-2" />
              احجز الآن
            </motion.button>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      <AnimatePresence>
        {showImageGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            onClick={() => setShowImageGallery(false)}
          >
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center"
              onClick={() => setShowImageGallery(false)}
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={serviceImages[currentImageIndex]}
                alt={service.title}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              
              {serviceImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => setShowBookingModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white dark:bg-secondary-900 rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold dark:text-white">حجز الخدمة</h3>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800"
                  >
                    <X className="w-5 h-5 text-secondary-500" />
                  </button>
                </div>

                {/* Service Summary */}
                <div className="card-glass p-4 mb-6">
                  <div className="flex items-center">
                    <img
                      src={service.image_url}
                      alt={service.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="mr-3 flex-1">
                      <h4 className="font-medium dark:text-white">{service.title}</h4>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">{service.location}</p>
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {service.price} ريال / للساعة
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                    اختر التاريخ
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {availableDates.map((dateOption) => (
                      <button
                        key={dateOption.date}
                        onClick={() => setSelectedDate(dateOption.date)}
                        className={`p-3 text-right rounded-xl border transition-all ${
                          selectedDate === dateOption.date
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                            : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-600'
                        }`}
                      >
                        <div className="font-medium dark:text-white">{dateOption.display}</div>
                        {dateOption.isToday && (
                          <div className="text-xs text-primary-500">اليوم</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                    اختر الوقت
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-2 text-center rounded-lg border transition-all ${
                          selectedTime === time
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                            : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-600'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    ملاحظات إضافية (اختياري)
                  </label>
                  <textarea
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="أضف أي ملاحظات أو متطلبات خاصة..."
                    className="w-full p-3 border border-secondary-200 dark:border-secondary-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:text-white"
                    rows={3}
                  />
                </div>

                {/* Price Summary */}
                <div className="card-glass p-4 mb-6">
                  <h4 className="font-medium mb-3 dark:text-white">ملخص السعر</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary-600 dark:text-secondary-300">سعر الخدمة</span>
                      <span className="dark:text-white">{service.price} ريال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600 dark:text-secondary-300">عمولة المنصة (5%)</span>
                      <span className="dark:text-white">{(service.price * 0.05).toFixed(2)} ريال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600 dark:text-secondary-300">ضريبة القيمة المضافة (15%)</span>
                      <span className="dark:text-white">{(service.price * 0.15).toFixed(2)} ريال</span>
                    </div>
                    <div className="border-t border-secondary-200 dark:border-secondary-700 pt-2 flex justify-between font-bold">
                      <span className="dark:text-white">المجموع</span>
                      <span className="text-primary-600 dark:text-primary-400">
                        {(service.price + service.price * 0.05 + service.price * 0.15).toFixed(2)} ريال
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 rtl:space-x-reverse">
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleBooking}
                    disabled={!selectedDate || !selectedTime || isBooking}
                    className="flex-2 py-3 px-4 rounded-xl bg-primary-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isBooking ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                        جاري الحجز...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-5 h-5 ml-2" />
                        تأكيد الحجز
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceDetails;