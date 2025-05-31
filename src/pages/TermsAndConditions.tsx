import React from 'react';
import Header from '../components/Header';
import { motion } from 'framer-motion';
import { FileText, Shield, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const TermsAndConditions = () => {
  const sections = [
    {
      title: "1. مقدمة",
      content: `مرحباً بك في تطبيق "أجار" لحجز وإدارة الخدمات. باستخدامك للتطبيق، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل استخدام التطبيق.`
    },
    {
      title: "2. التعريفات",
      content: `"التطبيق" يشير إلى تطبيق "أجار" لحجز وإدارة الخدمات.
"المستخدم" يشير إلى أي شخص يستخدم التطبيق سواء كان عميلاً أو مقدم خدمة.
"الخدمة" تشير إلى الخدمات المقدمة من خلال التطبيق.
"مقدم الخدمة" يشير إلى الشخص أو الجهة التي تقدم الخدمات من خلال التطبيق.
"العميل" يشير إلى الشخص الذي يستخدم التطبيق لحجز الخدمات.`
    },
    {
      title: "3. شروط الاستخدام",
      content: `3.1 يجب أن يكون عمر المستخدم 18 عاماً على الأقل.
3.2 يجب على المستخدم تقديم معلومات دقيقة وصحيحة عند التسجيل.
3.3 يتحمل المستخدم مسؤولية الحفاظ على سرية بيانات حسابه.
3.4 يحظر استخدام التطبيق لأي غرض غير قانوني أو غير مصرح به.
3.5 يحق للتطبيق إنهاء أو تعليق حساب أي مستخدم ينتهك هذه الشروط.`
    },
    {
      title: "4. الخدمات والحجوزات",
      content: `4.1 يوفر التطبيق منصة لربط مقدمي الخدمات بالعملاء.
4.2 لا يتحمل التطبيق مسؤولية جودة الخدمات المقدمة من قبل مقدمي الخدمات.
4.3 يجب على العملاء دفع رسوم الخدمة كاملة قبل تأكيد الحجز.
4.4 يمكن للعملاء إلغاء الحجز وفقاً لسياسة الإلغاء المحددة لكل خدمة.
4.5 يحق لمقدمي الخدمات رفض أي طلب حجز دون إبداء الأسباب.`
    },
    {
      title: "5. المدفوعات والرسوم",
      content: `5.1 يتم تحصيل عمولة بنسبة 5% من قيمة كل حجز.
5.2 يتم دفع المبلغ المتبقي لمقدم الخدمة بعد اكتمال الخدمة بنجاح.
5.3 في حالة إلغاء الحجز، يتم تطبيق سياسة الاسترداد وفقاً لشروط الإلغاء.
5.4 جميع المدفوعات تتم من خلال بوابات الدفع المعتمدة في التطبيق.
5.5 يتحمل المستخدم أي رسوم إضافية قد تفرضها بوابات الدفع.`
    },
    {
      title: "6. حقوق الملكية الفكرية",
      content: `6.1 جميع حقوق الملكية الفكرية للتطبيق محفوظة لشركة "أجار".
6.2 لا يجوز نسخ أو توزيع أو تعديل أي محتوى من التطبيق دون إذن مسبق.
6.3 يحتفظ مقدمو الخدمات بحقوق الملكية الفكرية للمحتوى الذي يقومون بنشره.`
    },
    {
      title: "7. الخصوصية وحماية البيانات",
      content: `7.1 يلتزم التطبيق بحماية خصوصية المستخدمين وفقاً لسياسة الخصوصية.
7.2 يوافق المستخدم على جمع واستخدام بياناته الشخصية وفقاً لسياسة الخصوصية.
7.3 لن يتم مشاركة بيانات المستخدم مع أطراف ثالثة دون موافقته إلا في الحالات التي يتطلبها القانون.`
    },
    {
      title: "8. المسؤولية والتعويض",
      content: `8.1 يستخدم المستخدم التطبيق على مسؤوليته الخاصة.
8.2 لا يتحمل التطبيق مسؤولية أي أضرار مباشرة أو غير مباشرة تنتج عن استخدام التطبيق.
8.3 يوافق المستخدم على تعويض التطبيق عن أي خسائر أو أضرار تنتج عن انتهاكه لهذه الشروط.`
    },
    {
      title: "9. التعديلات على الشروط والأحكام",
      content: `9.1 يحتفظ التطبيق بالحق في تعديل هذه الشروط والأحكام في أي وقت.
9.2 سيتم إخطار المستخدمين بأي تغييرات جوهرية في الشروط والأحكام.
9.3 استمرار استخدام التطبيق بعد إجراء التعديلات يعتبر موافقة على الشروط الجديدة.`
    },
    {
      title: "10. القانون المطبق وتسوية النزاعات",
      content: `10.1 تخضع هذه الشروط والأحكام لقوانين المملكة العربية السعودية.
10.2 يتم تسوية أي نزاعات تنشأ عن استخدام التطبيق من خلال التحكيم وفقاً لقوانين المملكة العربية السعودية.`
    }
  ];

  return (
    <>
      <Header title="الشروط والأحكام" showBack={true} />
      
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2 dark:text-white">الشروط والأحكام</h1>
          <p className="text-secondary-600 dark:text-secondary-300">
            يرجى قراءة الشروط والأحكام التالية بعناية قبل استخدام التطبيق
          </p>
        </motion.div>
        
        {/* Last Updated */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8 text-sm text-secondary-500 dark:text-secondary-400"
        >
          آخر تحديث: 1 مايو 2025
        </motion.div>
        
        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="card-glass p-6"
            >
              <h2 className="font-bold dark:text-white mb-3">{section.title}</h2>
              <div className="text-secondary-600 dark:text-secondary-300 whitespace-pre-line">
                {section.content}
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Agreement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 p-6 card-glass text-center"
        >
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
            <h3 className="font-bold dark:text-white">الموافقة على الشروط والأحكام</h3>
          </div>
          <p className="text-secondary-600 dark:text-secondary-300 mb-4">
            باستخدامك لتطبيق "أجار"، فإنك توافق على الالتزام بجميع الشروط والأحكام المذكورة أعلاه.
          </p>
        </motion.div>
        
        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-6 p-6 card-glass text-center"
        >
          <h3 className="font-bold mb-2 dark:text-white">للتواصل معنا</h3>
          <p className="text-secondary-600 dark:text-secondary-300 mb-4">
            إذا كان لديك أي أسئلة حول الشروط والأحكام، يرجى التواصل معنا:
          </p>
          <div className="space-y-2">
            <p className="text-primary-600 dark:text-primary-400">البريد الإلكتروني: legal@ajar.com</p>
            <p className="text-primary-600 dark:text-primary-400">الهاتف: +966 123 456 789</p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default TermsAndConditions;