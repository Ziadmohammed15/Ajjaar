import React, { useState } from 'react';
import { Filter, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { categories } from '../data/categories';
import RatingStars from './RatingStars';

interface ServiceFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    priceRange: [number, number];
    rating: number;
    categories: string[];
    sortBy: string;
  };
  onApplyFilters: (filters: {
    priceRange: [number, number];
    rating: number;
    categories: string[];
    sortBy: string;
  }) => void;
  onResetFilters: () => void;
}

const ServiceFilters: React.FC<ServiceFiltersProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    rating: true,
    categories: true,
    sort: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePriceChange = (min: number, max: number) => {
    setLocalFilters(prev => ({
      ...prev,
      priceRange: [min, max]
    }));
  };

  const handleRatingChange = (value: number) => {
    setLocalFilters(prev => ({
      ...prev,
      rating: value
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setLocalFilters(prev => {
      const newCategories = prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId];

      return {
        ...prev,
        categories: newCategories
      };
    });
  };

  const handleSortChange = (value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      sortBy: value
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
    setLocalFilters({
      priceRange: [0, 500],
      rating: 0,
      categories: [],
      sortBy: 'recommended'
    });
  };

  const sortOptions = [
    { id: 'recommended', label: 'الأكثر ملاءمة' },
    { id: 'price_asc', label: 'السعر: من الأقل للأعلى' },
    { id: 'price_desc', label: 'السعر: من الأعلى للأقل' },
    { id: 'rating_desc', label: 'التقييم: من الأعلى للأقل' },
    { id: 'newest', label: 'الأحدث' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-white dark:bg-secondary-900 rounded-t-2xl md:rounded-2xl w-full md:w-96 p-6 md:my-0 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg dark:text-white">تصفية الخدمات</h3>
              <button onClick={onClose} className="btn-modern">
                <X />
              </button>
            </div>

            {/* Price */}
            <div className="mb-5">
              <button
                className="flex items-center w-full mb-2"
                onClick={() => toggleSection('price')}
              >
                <span className="font-medium">السعر</span>
                {expandedSections.price ? <ChevronUp className="ml-auto" /> : <ChevronDown className="ml-auto" />}
              </button>
              <AnimatePresence>
                {expandedSections.price && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}>
                    {/* يمكنك هنا استخدام Slider أو إدخال يدوي */}
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min={0}
                        max={localFilters.priceRange[1]}
                        value={localFilters.priceRange[0]}
                        className="input w-20"
                        onChange={e => handlePriceChange(Number(e.target.value), localFilters.priceRange[1])}
                      />
                      <span>-</span>
                      <input
                        type="number"
                        min={localFilters.priceRange[0]}
                        value={localFilters.priceRange[1]}
                        className="input w-20"
                        onChange={e => handlePriceChange(localFilters.priceRange[0], Number(e.target.value))}
                      />
                      <span>ريال</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rating */}
            <div className="mb-5">
              <button
                className="flex items-center w-full mb-2"
                onClick={() => toggleSection('rating')}
              >
                <span className="font-medium">التقييم</span>
                {expandedSections.rating ? <ChevronUp className="ml-auto" /> : <ChevronDown className="ml-auto" />}
              </button>
              <AnimatePresence>
                {expandedSections.rating && (
                  <motion.div>
                    <div className="flex gap-2 items-center">
                      {[5, 4, 3, 2, 1].map(r => (
                        <button
                          key={r}
                          className={`px-2 py-1 rounded ${localFilters.rating === r ? 'bg-primary-500 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-200'}`}
                          onClick={() => handleRatingChange(r)}
                          type="button"
                        >
                          <RatingStars rating={r} />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Categories */}
            <div className="mb-5">
              <button
                className="flex items-center w-full mb-2"
                onClick={() => toggleSection('categories')}
              >
                <span className="font-medium">التصنيفات</span>
                {expandedSections.categories ? <ChevronUp className="ml-auto" /> : <ChevronDown className="ml-auto" />}
              </button>
              <AnimatePresence>
                {expandedSections.categories && (
                  <motion.div>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          type="button"
                          key={cat.id}
                          className={`px-3 py-1 rounded-full border ${localFilters.categories.includes(cat.id) ? 'bg-primary-500 text-white border-primary-600' : 'bg-secondary-100 dark:bg-secondary-800 border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300'}`}
                          onClick={() => handleCategoryToggle(cat.id)}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort */}
            <div className="mb-5">
              <button
                className="flex items-center w-full mb-2"
                onClick={() => toggleSection('sort')}
              >
                <span className="font-medium">ترتيب النتائج</span>
                {expandedSections.sort ? <ChevronUp className="ml-auto" /> : <ChevronDown className="ml-auto" />}
              </button>
              <AnimatePresence>
                {expandedSections.sort && (
                  <motion.div>
                    <div className="flex flex-col gap-2">
                      {sortOptions.map(opt => (
                        <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="sort"
                            value={opt.id}
                            checked={localFilters.sortBy === opt.id}
                            onChange={() => handleSortChange(opt.id)}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="btn-modern flex-1 bg-primary-600 text-white" onClick={handleApply}>تطبيق</button>
              <button className="btn-modern flex-1" type="button" onClick={handleReset}>إعادة تعيين</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ServiceFilters;