import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, Heart, Edit, MoreVertical, MessageCircle, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import CommissionInfo from './CommissionInfo';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

interface ServiceCardProps {
  service: any;
  index: number;
  isProvider?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, index, isProvider = false }) => {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [showOptions, setShowOptions] = React.useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createConversation } = useChat();

  if (!service) return null;

  const title = service.title || "بدون عنوان";
  const description = service.description || "بدون وصف";
  const image = service.image_url || service.image || "/placeholder.jpg";
  const location = service.location || "غير محدد";
  const rating = typeof service.rating === 'number' ? service.rating : 0;
  const price = typeof service.price === 'number' ? service.price : 0;
  const features = Array.isArray(service.features) ? service.features : [];

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const toggleOptions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOptions(!showOptions);
  };

  const handleStartChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative"
    >
      <Link to={`/service/${service.id}`} className="block">
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="card-glass overflow-hidden"
        >
          <div className="relative">
            <img
              src={image}
              alt={title}
              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
              onError={e => (e.currentTarget.src = "/placeholder.jpg")}
            />
            <div className="absolute top-3 left-3 backdrop-blur-glass bg-white/60 dark:bg-secondary-800/60 px-2 py-1 rounded-lg flex items-center">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 ml-1" />
              <span className="font-medium dark:text-white">{rating}</span>
            </div>
            {isProvider ? (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleOptions}
                className="absolute top-3 right-3 w-8 h-8 backdrop-blur-glass bg-white/60 dark:bg-secondary-800/60 rounded-full flex items-center justify-center"
              >
                <MoreVertical className="w-4 h-4 text-secondary-500 dark:text-secondary-400" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleFavorite}
                className="absolute top-3 right-3 w-8 h-8 backdrop-blur-glass bg-white/60 dark:bg-secondary-800/60 rounded-full flex items-center justify-center"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-secondary-500 dark:text-secondary-400'}`} />
              </motion.button>
            )}

            {/* Price tag */}
            <div className="absolute bottom-3 right-3 backdrop-blur-glass bg-white/60 dark:bg-secondary-800/60 px-3 py-1 rounded-lg">
              <span className="font-bold text-primary-600 dark:text-primary-400">{price} ريال</span>
              <span className="text-xs text-secondary-500 dark:text-secondary-400 mr-1">/ للساعة</span>
            </div>

            {/* Chat button */}
            {!isProvider && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartChat}
                className="absolute bottom-3 left-3 backdrop-blur-glass bg-primary-500/80 text-white px-2 py-1 rounded-lg flex items-center"
              >
                <MessageCircle className="w-4 h-4 ml-1" />
                <span className="text-xs">تواصل</span>
              </motion.button>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg mb-1 line-clamp-1 dark:text-white">{title}</h3>
            <div className="flex items-center text-secondary-500 dark:text-secondary-400 text-sm mb-2">
              <MapPin className="w-4 h-4 ml-1" />
              <span>{location}</span>
            </div>
            <p className="text-secondary-600 dark:text-secondary-300 text-sm mb-3 line-clamp-2">{description}</p>

            {/* Service features preview */}
            <div className="flex flex-wrap gap-1 mt-2">
              {features.slice(0, 2).map((feature: any, idx: number) => (
                <span key={idx} className="text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-full">
                  {typeof feature === 'string' && feature.length > 15 ? feature.substring(0, 15) + '...' : feature}
                </span>
              ))}
              {features.length > 2 && (
                <span className="text-xs bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 px-2 py-1 rounded-full">
                  +{features.length - 2}
                </span>
              )}
            </div>

            {/* Commission info: تظهر فقط لمقدم الخدمة */}
            {isProvider && <CommissionInfo commission={price * 0.05} />}
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default ServiceCard;