export interface DeliveryOptions {
  type: 'free' | 'paid' | 'none' | 'company';
  price?: number;
  companyName?: string;
  areas: string[];
  estimatedTime: string;
}

export interface Provider {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  verified?: boolean;
}

export interface Service {
  id: string | number;
  title: string;
  description: string;
  price: number;
  rating?: number;
  image?: string; // يمكن أن تكون الصورة اختياريًا (url)
  image_url?: string; // دعم تسمية أخرى
  location: string;
  category: string;
  subcategory?: string;
  features: string[];
  status?: 'active' | 'inactive';
  deliveryOptions?: DeliveryOptions;
  provider_id?: string; // مفتاح مزود الخدمة من supabase
  provider?: Provider; // بيانات مزود الخدمة (اختيارية)
  created_at?: string;
  // أضف أي حقل آخر تحتاجه مستقبلاً
}