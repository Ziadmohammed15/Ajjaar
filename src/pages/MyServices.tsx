import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ServiceCard from '../components/ServiceCard';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Filter, Trash2, Eye, EyeOff, Edit, Share2, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

const MyServices = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [myServices, setMyServices] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // جلب الخدمات الخاصة بالمستخدم الحالي من قاعدة البيانات
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      if (!user?.id) {
        setMyServices([]);
        setIsLoading(false);
        return;
      }

      // جلب الخدمات التي أنشأها المستخدم الحالي
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        setMyServices(data);
      } else {
        setMyServices([]);
      }
      setIsLoading(false);
    };

    fetchServices();
  }, [user]);

  const handleDeleteService = (serviceId: string) => {
    setSelectedService(serviceId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedService && user?.id) {
      // حذف الخدمة من قاعدة البيانات
      await supabase
        .from('services')
        .delete()
        .eq('id', selectedService)
        .eq('provider_id', user.id);

      setMyServices(prev => prev.filter(service => service.id !== selectedService));
    }
    setShowDeleteModal(false);
    setSelectedService(null);
  };

  const handleToggleStatus = async (serviceId: string) => {
    const service = myServices.find(s => s.id === serviceId);
    if (!service) return;

    const newStatus = service.status === 'active' ? 'inactive' : 'active';
    // تحديث حالة الخدمة في قاعدة البيانات
    await supabase
      .from('services')
      .update({ status: newStatus })
      .eq('id', serviceId)
      .eq('provider_id', user.id);

    setMyServices(prev =>
      prev.map(s =>
        s.id === serviceId ? { ...s, status: newStatus } : s
      )
    );
  };

  const filteredServices = myServices
    .filter(service => {
      if (activeTab === 'active') return service.status !== 'inactive';
      return service.status === 'inactive';
    })
    .filter(service =>
      service.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="app-container">
      <Header />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold dark:text-white">خدماتي</h2>
        <Link to="/add-service" className="btn-modern flex items-center">
          <PlusCircle className="w-5 h-5 ml-1" />
          إضافة خدمة جديدة
        </Link>
      </div>
      <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="ابحث عن خدمة..." />

      <div className="flex gap-3 my-4">
        <button
          className={`tab-btn ${activeTab === 'active' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          الخدمات النشطة
        </button>
        <button
          className={`tab-btn ${activeTab === 'inactive' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('inactive')}
        >
          الخدمات غير النشطة
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="flex flex-col items-center text-secondary-400 mt-10">
          <DollarSign className="w-10 h-10 mb-2" />
          <span>لا توجد خدمات في هذا القسم</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredServices.map((service, idx) => (
              <ServiceCard key={service.id} service={service} index={idx} isProvider />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* نافذة تأكيد الحذف */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-900 rounded-lg p-6 shadow-lg text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <p className="mb-4">هل أنت متأكد أنك تريد حذف هذه الخدمة بشكل نهائي؟</p>
            <div className="flex justify-center gap-4">
              <button onClick={confirmDelete} className="btn-modern bg-red-500 text-white">نعم، حذف</button>
              <button onClick={() => setShowDeleteModal(false)} className="btn-modern">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyServices;