import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { Camera, Plus, X, DollarSign, MapPin, Tag, FileText } from 'lucide-react';
import { categories, getSubcategoriesByParent } from '../data/categories';
import DeliveryOptionsForm from '../components/DeliveryOptionsForm';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

const EditService = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    subcategory: '',
    location: '',
    features: [] as string[],
    image_url: '',
    status: 'active' as 'active' | 'inactive'
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [newFeature, setNewFeature] = useState('');
  const [deliveryOptions, setDeliveryOptions] = useState({
    type: 'none' as 'free' | 'paid' | 'none' | 'company',
    price: 0,
    companyName: '',
    areas: [] as string[],
    estimatedTime: ''
  });

  useEffect(() => {
    // جلب الخدمة من قاعدة البيانات
    const fetchService = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          price: data.price?.toString() || '',
          category: data.category || '',
          subcategory: data.subcategory || '',
          location: data.location || '',
          features: Array.isArray(data.features) ? data.features : [],
          image_url: data.image_url || '',
          status: data.status || 'active'
        });
        setImagePreview(data.image_url || '');
        if (data.deliveryOptions) setDeliveryOptions(data.deliveryOptions);
      }
      setIsLoading(false);
    };
    fetchService();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user?.id) {
      showError('يجب تسجيل الدخول أولاً');
      setIsSubmitting(false);
      return;
    }
    if (!formData.title || !formData.description || !formData.price || !formData.category || !formData.location) {
      showError('يرجى تعبئة جميع الحقول المطلوبة');
      setIsSubmitting(false);
      return;
    }

    let image_url = formData.image_url;
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

    const { error } = await supabase.from('services').update({
      title: formData.title,
      description: formData.description,
      price: Number(formData.price),
      category: formData.category,
      subcategory: formData.subcategory,
      location: formData.location,
      features: formData.features,
      deliveryOptions,
      image_url,
      status: formData.status
    }).eq('id', id).eq('provider_id', user.id);

    if (error) {
      showError('حدث خطأ أثناء تحديث الخدمة');
    } else {
      showSuccess('تم تحديث الخدمة بنجاح');
      navigate('/my-services');
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header />
      <form className="max-w-2xl mx-auto p-4 bg-white dark:bg-secondary-900 rounded-xl shadow" onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-4 dark:text-white">تعديل الخدمة</h2>

        <div className="mb-4">
          <label className="block mb-1 font-medium">صورة الخدمة</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && <img src={imagePreview} alt="معاينة" className="w-32 h-32 object-cover rounded mt-2" />}
        </div>

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
          <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="input" required />
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
          {isSubmitting ? "جارٍ الحفظ..." : "حفظ التعديلات"}
        </button>
      </form>
    </div>
  );
};

export default EditService;