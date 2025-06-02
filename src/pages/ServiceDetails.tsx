import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, MapPin, Clock, Calendar, User, ChevronDown, ChevronUp, Check, ArrowRight, Heart, Share2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';
import CommissionInfo from '../components/CommissionInfo';
import RatingStars from '../components/RatingStars';
import DateTimePicker from '../components/DateTimePicker';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const ServiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createConversation } = useChat();

  const [service, setService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      setIsLoading(true);

      // جلب الخدمة من supabase
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      setService(data || null);
      setIsLoading(false);
    };
    fetchService();
  }, [id]);

  // امثلة بيانات تقييمات مؤقتة (يمكن ربطها مع جدول تقييمات لاحقاً)
  const serviceReviews = [
    {
      id: 1,
      serviceId: id,
      user: { name: 'محمد أحمد', avatar: '' },
      rating: 5,
      comment: 'خدمة رائعة جداً!',
      date: '2024-04-10'
    },
    {
      id: 2,
      serviceId: id,
      user: { name: 'سارة علي', avatar: '' },
      rating: 4,
      comment: 'تجربة ممتازة.',
      date: '2024-04-09'
    }
  ];

  const displayedReviews = showAllReviews ? serviceReviews : serviceReviews.slice(0, 3);

  if (isLoading) {
    return (
      <div className="app-container flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-secondary-600 dark:text-secondary-400">جاري تحميل تفاصيل الخدمة...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="app-container flex items-center justify-center">
        <p className="text-secondary-600 dark:text-secondary-400">الخدمة غير موجودة</p>
      </div>
    );
  }

  const availableTimes = [
    '09:00 ص',
    '10:00 ص',
    '11:00 ص',
    '12:00 م',
    '01:00 م',
    '02:00 م',
    '03:00 م',
    '04:00 م',
  ];

  const toggleFavorite = () => setIsFavorite(!isFavorite);

  const handleBookNow = () => {
    if (selectedDate && selectedTime) {
      navigate('/booking-confirmation');
    } else {
      setShowBookingModal(true);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('تم نسخ رابط الخدمة!');
  };

  const handleStartChat = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    const providerId = service.provider_id || service.provider?.id || "provider-123";
    const conversationId = await createConversation(providerId, service.id);
    if (conversationId) {
      navigate(`/chat/${conversationId}`);
    }
  };

  // دعم كل تسميات الصورة
  const image = service.image_url || service.image || '/placeholder.jpg';
  const title = service.title || 'بدون عنوان';
  const location = service.location || 'غير محدد';
  const description = service.description || '';
  const rating = typeof service.rating === 'number' ? service.rating : 0;
  const price = typeof service.price === 'number' ? service.price : 0;
  const features = Array.isArray(service.features) ? service.features : [];
  const deliveryOptions = service.deliveryOptions || { type: 'none', price: 0, areas: [], estimatedTime: '', companyName: '' };

  return (
    <div className="app-container py-6">
      <div className="flex flex-col md:flex-row gap-8">
        {/* صورة الخدمة */}
        <div className="w-full md:w-1/2 flex flex-col items-center">
          <img
            src={image}
            alt={title}
            className="rounded-xl w-full h-72 object-cover shadow-md"
            onError={e => (e.currentTarget.src = "/placeholder.jpg")}
          />
        </div>
        {/* التفاصيل */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold dark:text-white">{title}</h1>
            <div className="flex items-center gap-2">
              <button onClick={toggleFavorite} className="btn-icon">
                <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-secondary-500 dark:text-secondary-400'}`} />
              </button>
              <button onClick={handleShare} className="btn-icon">
                <Share2 className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
              </button>
              <button onClick={handleStartChat} className="btn-icon">
                <MessageCircle className="w-5 h-5 text-primary-500" />
              </button>
            </div>
          </div>
          <div className="flex items-center text-secondary-500 dark:text-secondary-400 mb-2">
            <MapPin className="w-4 h-4 ml-1" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold dark:text-white">{rating}</span>
          </div>
          <p className="text-secondary-700 dark:text-secondary-300 mb-4">{description}</p>

          {/* ميزات الخدمة */}
          <div className="flex flex-wrap gap-2 mb-4">
            {features.map((feature, idx) => (
              <span key={idx} className="text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-3 py-1 rounded-full">
                {feature}
              </span>
            ))}
          </div>

          {/* خيارات التوصيل */}
          {deliveryOptions && deliveryOptions.type !== 'none' && (
            <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <div className="flex items-center gap-4">
                <Truck className="w-5 h-5 text-primary-500" />
                <span className="text-sm text-primary-600 dark:text-primary-400">
                  {deliveryOptions.type === 'free' && 'توصيل مجاني'}
                  {deliveryOptions.type === 'paid' && `توصيل ${deliveryOptions.price} ريال`}
                  {deliveryOptions.type === 'company' && `توصيل عبر ${deliveryOptions.companyName}`}
                </span>
                <Clock className="w-5 h-5 text-primary-500 ml-4" />
                <span className="text-sm text-primary-600 dark:text-primary-400">
                  {deliveryOptions.estimatedTime}
                </span>
              </div>
              {deliveryOptions.areas && deliveryOptions.areas.length > 0 && (
                <div className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">
                  مناطق التغطية: {deliveryOptions.areas.join('، ')}
                </div>
              )}
            </div>
          )}

          {/* السعر والعمولة */}
          <div className="flex items-center gap-6 mb-4">
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{price} ريال / للساعة</span>
            <CommissionInfo commission={price * 0.05} />
          </div>

          {/* زر احجز الآن */}
          <button
            className="btn-modern bg-primary-600 text-white px-6 py-2 rounded-xl font-bold"
            onClick={handleBookNow}
          >
            احجز الآن
          </button>
        </div>
      </div>

      {/* تقييمات الخدمة (تجريبي) */}
      <div className="my-10">
        <h2 className="text-lg font-bold mb-4 dark:text-white">التقييمات</h2>
        <div className="space-y-4">
          {displayedReviews.map((review, idx) => (
            <div key={idx} className="p-4 bg-secondary-100 dark:bg-secondary-800 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-secondary-500" />
                <span className="font-medium dark:text-white">{review.user.name}</span>
                <RatingStars rating={review.rating} />
                <span className="text-xs text-secondary-400">{review.date}</span>
              </div>
              <p className="text-secondary-700 dark:text-secondary-200">{review.comment}</p>
            </div>
          ))}
        </div>
        {serviceReviews.length > 3 && (
          <button
            className="mt-3 text-primary-600 dark:text-primary-400 text-sm underline"
            onClick={() => setShowAllReviews(v => !v)}
          >
            {showAllReviews ? 'عرض أقل' : 'عرض المزيد'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ServiceDetails;