export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  parentId: string;
}

export const categories: Category[] = [
  {
    id: 'events',
    name: 'المناسبات',
    icon: '🎉',
    description: 'خدمات تنظيم وإدارة المناسبات والحفلات',
    subcategories: [
      { id: 'wedding-halls', name: 'قاعات وصالات أفراح', parentId: 'events' },
      { id: 'resorts', name: 'استراحات', parentId: 'events' },
      { id: 'photography', name: 'تصوير مناسبات', parentId: 'events' },
      { id: 'coffee-service', name: 'خدمة قهوجي', parentId: 'events' },
      { id: 'wedding-services', name: 'خدمات أعراس', parentId: 'events' },
      { id: 'catering', name: 'ضيافة وبوفيهات', parentId: 'events' },
      { id: 'decoration', name: 'تنسيق وديكور', parentId: 'events' },
      { id: 'lighting', name: 'إضاءة وصوتيات', parentId: 'events' },
      { id: 'wedding-planning', name: 'تنظيم أعراس', parentId: 'events' }
    ]
  },
  {
    id: 'transport',
    name: 'النقل',
    icon: '🚚',
    description: 'نقل عفش ونقل بضائع مثل الدينا والونيت',
    subcategories: [
      { id: 'furniture-moving', name: 'نقل عفش', parentId: 'transport' },
      { id: 'goods-moving', name: 'نقل بضائع', parentId: 'transport' }
    ]
  },
  {
    id: 'heavy-equipment',
    name: 'معدات ثقيلة',
    icon: '🚜',
    description: 'تأجير الشيولات والمعدات الكبيرة',
    subcategories: [
      { id: 'shovels', name: 'شيولات', parentId: 'heavy-equipment' },
      { id: 'cranes', name: 'كرينات', parentId: 'heavy-equipment' },
      { id: 'trucks', name: 'شاحنات كبيرة', parentId: 'heavy-equipment' },
      { id: 'other-machines', name: 'معدات أخرى', parentId: 'heavy-equipment' }
    ]
  },
  {
    id: 'brides',
    name: 'عرايس',
    icon: '👰',
    description: 'خدمات متكاملة للعرايس',
    subcategories: [
      { id: 'makeup', name: 'مكياج عرايس', parentId: 'brides' },
      { id: 'bridal-photography', name: 'مصورات عرايس', parentId: 'brides' },
      { id: 'kosha', name: 'كوش', parentId: 'brides' },
      { id: 'stands', name: 'استاندات وملحقاتها', parentId: 'brides' }
    ]
  },
  {
    id: 'real-estate',
    name: 'العقارات',
    icon: '🏢',
    description: 'خدمات إيجار وإدارة العقارات السكنية والتجارية',
    subcategories: [
      { id: 'apartments', name: 'شقق سكنية', parentId: 'real-estate' },
      { id: 'villas', name: 'فلل وقصور', parentId: 'real-estate' },
      { id: 'offices', name: 'مكاتب تجارية', parentId: 'real-estate' },
      { id: 'shops', name: 'محلات تجارية', parentId: 'real-estate' },
      { id: 'warehouses', name: 'مستودعات', parentId: 'real-estate' },
      { id: 'lands', name: 'أراضي', parentId: 'real-estate' }
    ]
  },
  {
    id: 'home-services',
    name: 'خدمات المنزل',
    icon: '🏠',
    description: 'خدمات التنظيف والصيانة والديكور المنزلي',
    subcategories: [
      { id: 'cleaning', name: 'تنظيف منازل', parentId: 'home-services' },
      { id: 'maintenance', name: 'صيانة منزلية', parentId: 'home-services' },
      { id: 'furniture', name: 'أثاث منزلي', parentId: 'home-services' },
      { id: 'gardening', name: 'تنسيق حدائق', parentId: 'home-services' },
      { id: 'pest-control', name: 'مكافحة حشرات', parentId: 'home-services' },
      { id: 'decoration', name: 'ديكور وتصميم داخلي', parentId: 'home-services' }
    ]
  },
  {
    id: 'equipment',
    name: 'المعدات',
    icon: '🔧',
    description: 'تأجير وصيانة المعدات والأدوات المختلفة',
    subcategories: [
      { id: 'construction', name: 'معدات بناء', parentId: 'equipment' },
      { id: 'medical', name: 'معدات طبية', parentId: 'equipment' },
      { id: 'audio-visual', name: 'معدات صوتية ومرئية', parentId: 'equipment' },
      { id: 'camping', name: 'معدات تخييم', parentId: 'equipment' },
      { id: 'sports', name: 'معدات رياضية', parentId: 'equipment' },
      { id: 'tools', name: 'أدوات وعدد', parentId: 'equipment' }
    ]
  },
  {
    id: 'business-services',
    name: 'خدمات الأعمال',
    icon: '💼',
    description: 'خدمات احترافية للشركات والمؤسسات',
    subcategories: [
      { id: 'office-cleaning', name: 'تنظيف مكاتب', parentId: 'business-services' },
      { id: 'it-services', name: 'خدمات تقنية', parentId: 'business-services' },
      { id: 'accounting', name: 'محاسبة', parentId: 'business-services' },
      { id: 'legal', name: 'خدمات قانونية', parentId: 'business-services' },
      { id: 'marketing', name: 'تسويق وإعلان', parentId: 'business-services' },
      { id: 'translation', name: 'ترجمة', parentId: 'business-services' }
    ]
  },
  {
    id: 'food',
    name: 'الطعام',
    icon: '🍽️',
    description: 'خدمات الطبخ وتقديم الطعام',
    subcategories: [
      { id: 'chefs', name: 'طباخين محترفين', parentId: 'food' },
      { id: 'catering-services', name: 'خدمات تموين', parentId: 'food' },
      { id: 'waiters', name: 'خدمة ضيافة وقرصون', parentId: 'food' },
      { id: 'cooking-classes', name: 'دروس طبخ', parentId: 'food' },
      { id: 'special-diets', name: 'أنظمة غذائية خاصة', parentId: 'food' }
    ]
  },
  {
    id: 'other',
    name: 'أخرى',
    icon: '🛒',
    description: 'أي تجارة أو خدمة لم يتم ذكرها في الأقسام السابقة',
    subcategories: []
  }
];

export const getAllSubcategories = (): Subcategory[] => {
  return categories.flatMap(category => category.subcategories || []);
};

export const getSubcategoriesByParent = (parentId: string): Subcategory[] => {
  const category = categories.find(cat => cat.id === parentId);
  return category?.subcategories || [];
};