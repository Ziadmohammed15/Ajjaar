import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { Camera, Plus, Tag, MapPin, DollarSign, FileText, Save, ChevronDown } from 'lucide-react';
import { categories, getSubcategoriesByParent } from '../data/categories';
import DeliveryOptionsForm from '../components/DeliveryOptionsForm';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import RequireCompleteProfile from '../components/RequireCompleteProfile';

const saudiCities = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر", "الطائف", "تبوك", "بريدة", "خميس مشيط", "حائل",
  "الجبيل", "أبها", "نجران", "ينبع", "القنفذة", "الظهران", "سكاكا", "عرعر", "رفحاء", "ضباء", "الباحة", "الزلفي",
  "الدوادمي", "وادي الدواسر", "بيشة", "النماص", "بلجرشي", "شرورة", "الحوية"
];

const AddService = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showCitiesModal, setShowCitiesModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    subcategory: '',
    location: '',
    features: [] as string[],
    image: null as File | null
  });

  const [newFeature, setNewFeature] = useState('');
  const [deliveryOptions, setDeliveryOptions] = useState({
    type: 'none' as 'free' | 'paid' | 'none' | 'company',
    price: 0,
    companyName: '',
    areas: [] as string[],
    estimatedTime: ''
  });

  // صورة الخدمة
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  // إضافة ميزة للخدمة
  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  // حذف ميزة
  const handleRemoveFeature = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx)
    }));
  };

  // حفظ الخدمة في قاعدة البيانات supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      showError('يجب تسجيل الدخول أولاً');
      return;
    }
    if (!formData.title || !formData.price || !formData.category || !formData.location) {
      showError('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    setIsSubmitting(true);

    let image_url = '';
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('service_images')
        .upload(fileName, imageFile);

      if (uploadError) {
        showError('حدث خطأ أثناء رفع الصورة');
        setIsSubmitting(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage
        .from('service_images')
        .getPublicUrl(fileName);
      image_url = publicUrl;
    }

    // حفظ الخدمة في supabase
    const { error } = await supabase.from('services').insert([{
      title: formData.title,
      description: formData.description,
      price: Number(formData.price),
      category: formData.category,
      subcategory: formData.subcategory,
      location: formData.location,
      features: formData.features,
      deliveryOptions,
      provider_id: user.id,
      image_url,
      status: 'active'
    }]);

    if (error) {
      showError('حدث خطأ أثناء إضافة الخدمة');
    } else {
      showSuccess('تم إضافة الخدمة بنجاح');
      navigate('/my-services');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="app-container">
      <Header />
      <form className="max-w-2xl mx-auto p-4 bg-white dark:bg-secondary-900 rounded-xl shadow" onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-4 dark:text-white">إضافة خدمة جديدة</h2>

        {/* صورة الخدمة */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">صورة الخدمة</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <img src={imagePreview} alt="معاينة" className="w-32 h-32 object-cover rounded mt-2" />
          )}
        </div>

        {/* باقي الحقول */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">عنوان الخدمة *</label>
          <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input" required />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">الوصف *</label>
          <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input" required />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">السعر (ريال) *</label>
          <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="input" required min="0" />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">التصنيف *</label>
          <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="input" required>
            <option value="">اختر التصنيف</option>
            {categories.map(cat => (
              <option value={cat.id} key={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">التصنيف الفرعي</label>
          <select value={formData.subcategory} onChange={e => setFormData({ ...formData, subcategory: e.target.value })} className="input">
            <option value="">بدون</option>
            {getSubcategoriesByParent(formData.category).map(sub => (
              <option value={sub.id} key={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">الموقع *</label>
          <input type="text" value={formData.location} onFocus={() => setShowCitiesModal(true)} readOnly className="input" required />
          {/* نافذة اختيار المدن */}
          {showCitiesModal && (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-secondary-900 rounded-lg p-4 w-80 max-h-96 overflow-y-auto shadow-lg">
                <button className="ml-auto mb-2 btn-modern" onClick={() => setShowCitiesModal(false)}>إغلاق</button>
                <h4 className="font-bold mb-2">اختر المدينة</h4>
                <ul>
                  {saudiCities.map(city => (
                    <li key={city}>
                      <button
                        className="w-full text-right py-2 px-3 hover:bg-primary-100 dark:hover:bg-primary-900 rounded"
                        onClick={e => {
                          e.preventDefault();
                          setFormData({ ...formData, location: city });
                          setShowCitiesModal(false);
                        }}
                      >
                        {city}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        {/* الميزات */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">ميزات إضافية</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newFeature}
              onChange={e => setNewFeature(e.target.value)}
              className="input flex-1"
              placeholder="مثال: يوجد مواقف سيارات"
            />
            <button type="button" className="btn-modern" onClick={handleAddFeature}><Plus className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.features.map((feature, idx) => (
              <div key={idx} className="bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded flex items-center gap-1">
                <span>{feature}</span>
                <button type="button" className="text-red-500" onClick={() => handleRemoveFeature(idx)}>x</button>
              </div>
            ))}
          </div>
        </div>
        {/* خيارات التوصيل */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">خيارات التوصيل</label>
          <DeliveryOptionsForm value={deliveryOptions} onChange={setDeliveryOptions} />
        </div>

        <button type="submit" className="btn-modern bg-primary-600 text-white w-full py-2 mt-2" disabled={isSubmitting}>
          {isSubmitting ? "جارٍ الحفظ..." : "حفظ الخدمة"}
        </button>
      </form>
    </div>
  );
};

export default AddService;