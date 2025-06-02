import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import SearchBar from '../components/SearchBar';
import CategorySelector from '../components/CategorySelector';
import ServiceCard from '../components/ServiceCard';
import { Filter, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import PromotionBanner from '../components/PromotionBanner';
import CategoryGrid from '../components/CategoryGrid';
import { categories } from '../data/categories';
import NotificationBadge from '../components/NotificationBadge';
import ServiceFilters from '../components/ServiceFilters';
import { useAuth } from '../context/AuthContext';

interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory?: string | null;
  location: string;
  image_url: string;
  rating: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface HomeProps {
  isProvider?: boolean;
}

const Home: React.FC<HomeProps> = ({ isProvider }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordReminder, setShowPasswordReminder] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const params = useParams();

  const [filters, setFilters] = useState({
    priceRange: [0, 500] as [number, number],
    rating: 0,
    categories: [] as string[],
    sortBy: 'recommended'
  });

  // جلب الخدمات من supabase
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      let query = supabase
        .from('services')
        .select('*')
        .eq('status', 'active'); // فقط الخدمات النشطة

      // فلترة حسب الفئة إذا تم تحديدها
      if (params.categoryId && params.categoryId !== 'all') {
        query = query.eq('category', params.categoryId);
      }

      const { data, error } = await query;

      if (data) setServices(data);
      setIsLoading(false);
    };
    fetchServices();
  }, [params.categoryId]);

  useEffect(() => {
    // Check if user should be reminded to set password
    if (user) {
      const hasBeenReminded = localStorage.getItem('password_reminder_shown');
      if (!hasBeenReminded) {
        const timer2 = setTimeout(() => {
          setShowPasswordReminder(true);
          localStorage.setItem('password_reminder_shown', 'true');
        }, 5000);
        return () => clearTimeout(timer2);
      }
    }
  }, [user]);

  // حدد نوع المستخدم من الـ profile أو prop أو حتى من localStorage
  const isProviderUser =
    isProvider !== undefined
      ? isProvider
      : profile?.user_type === 'provider' ||
        localStorage.getItem('userType') === 'provider';

  // حدد الفئة المختارة من المسار إذا كان هناك categoryId
  useEffect(() => {
    if (params.categoryId) setSelectedCategory(params.categoryId);
    else setSelectedCategory('all');
  }, [params.categoryId]);

  const categoryOptions = [
    { id: 'all', name: 'الكل' },
    ...categories.map(cat => ({ id: cat.id, name: cat.name }))
  ];

  const handleApplyFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      priceRange: [0, 500],
      rating: 0,
      categories: [],
      sortBy: 'recommended'
    });
  };

  const handleAddService = () => {
    if (!user || !profile || !profile.is_profile_complete) {
      navigate('/complete-profile');
    } else {
      navigate('/provider/add-service');
    }
  };

  // زر إضافة خدمة متاح فقط إذا كان المستخدم مقدم خدمة ومسجل الدخول وملفه مكتمل
  const showAddService =
    isProviderUser &&
    !loading &&
    user &&
    profile &&
    profile.user_type === 'provider' &&
    profile.is_profile_complete;

  // الفلترة محلياً بعد جلب الخدمات من supabase
  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;

    const matchesFilters = (
      service.price >= filters.priceRange[0] &&
      service.price <= filters.priceRange[1] &&
      (filters.rating === 0 || service.rating >= filters.rating) &&
      (filters.categories.length === 0 || filters.categories.includes(service.category))
    );

    return matchesSearch && matchesCategory && matchesFilters;
  });

  // Sort services based on selected sort option
  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (filters.sortBy) {
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'rating_desc':
        return b.rating - a.rating;
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default: // recommended
        return 0;
    }
  });

  const dismissPasswordReminder = () => {
    setShowPasswordReminder(false);
    localStorage.setItem('password_reminder_shown', 'true');
  };

  const goToProfile = () => {
    setShowPasswordReminder(false);
    localStorage.setItem('password_reminder_shown', 'true');
    navigate('/profile');
  };

  return (
    <div className="content-scroll">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-primary text-white pt-6 pb-8 px-4 rounded-b-3xl transition-colors duration-300 shadow-lg relative overflow-hidden"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-dots opacity-10"></div>

        <div className="flex justify-between items-center mb-6 relative z-10">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-black dark:text-white">مرحباً بك 👋</h1>
            <p className="text-primary-100">
              {isProviderUser
                ? 'أدر خدماتك واستقبل الحجوزات'
                : 'اكتشف أفضل الخدمات المتاحة'}
            </p>
          </motion.div>
          <div className="flex space-x-3 rtl:space-x-reverse">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="relative"
            >
              <NotificationBadge count={3} showCount={true} />
              <div className="absolute inset-0 rounded-full animate-pulse-glow opacity-60"></div>
            </motion.div>
          </div>
        </div>

        <div className="relative z-10">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={isProviderUser ? "ابحث في خدماتك..." : "ابحث عن خدمة..."}
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFilterModal(true)}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center"
          >
            <Filter className="w-5 h-5 text-secondary-400 dark:text-secondary-500" />
          </motion.button>
        </div>
      </motion.div>

      <div className="px-4 -mt-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-morphism rounded-xl p-2 mb-6"
        >
          <CategorySelector
            categories={categoryOptions}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </motion.div>

        {/* Password Reminder Notification */}
        <AnimatePresence>
          {showPasswordReminder && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-700/30 shadow-lg"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-primary-700 dark:text-primary-300 mb-1">تذكير هام</h3>
                  <p className="text-sm text-primary-600 dark:text-primary-400">
                    يرجى تعيين كلمة مرور لحسابك حتى تتمكن من تسجيل الدخول مرة أخرى بسهولة في المستقبل.
                  </p>
                </div>
                <button
                  onClick={dismissPasswordReminder}
                  className="text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 ml-2"
                >
                  ×
                </button>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={goToProfile}
                  className="text-sm bg-primary-500 text-white px-3 py-1 rounded-lg hover:bg-primary-600"
                >
                  تعيين كلمة المرور
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Promotional Banners */}
        <PromotionBanner />

        {/* Category Grid */}
        <CategoryGrid />

        {showAddService && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={handleAddService}
              className="flex items-center justify-center btn-modern mb-6 relative overflow-hidden group w-full"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <PlusCircle className="w-5 h-5 ml-2 relative z-10" />
              <span className="relative z-10">إضافة خدمة جديدة</span>
            </button>
          </motion.div>
        )}

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg font-bold mb-4 dark:text-white"
        >
          {isProviderUser ? 'خدماتك المعروضة' : 'خدمات مميزة'}
        </motion.h2>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-modern h-72 shimmer"
              />
            ))}
          </div>
        ) : (
          <>
            {sortedServices.length > 0 ? (
              <div className="space-y-4 pb-20">
                {sortedServices.map((service, index) => (
                  <ServiceCard key={service.id} service={service} index={index} isProvider={isProviderUser} />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center glass-morphism rounded-2xl"
              >
                <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-4 animate-bounce-subtle">
                  <Filter className="w-8 h-8 text-secondary-400" />
                </div>
                <h3 className="text-lg font-bold text-black dark:text-white mb-2">لا توجد نتائج</h3>
                <p className="text-secondary-600 dark:text-secondary-400">
                  لم يتم العثور على خدمات تطابق معايير البحث
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    handleResetFilters();
                  }}
                  className="mt-4 text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  إعادة ضبط البحث
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Filters Modal */}
      <ServiceFilters
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
};

export default Home;