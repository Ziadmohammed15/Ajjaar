import axios from 'axios';

/**
 * خدمة التحقق من رقم الهاتف
 */

// إرسال رمز التحقق
export const sendVerificationCode = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // التحقق من تنسيق رقم الهاتف
    let formattedPhone = phoneNumber;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    // إرسال طلب إلى الخادم لإرسال رمز التحقق
    const response = await fetch('/api/verify/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: formattedPhone })
    });

    const data = await response.json();

    if (data.success) {
      console.log(`تم إرسال رمز التحقق إلى الرقم ${formattedPhone}`);
      return { success: true };
    } else {
      return { success: false, error: data.error || 'فشل في إرسال رمز التحقق' };
    }
  } catch (error) {
    console.error('خطأ في إرسال رمز التحقق:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'حدث خطأ غير معروف'
    };
  }
};

// التحقق من صحة الرمز
export const verifyCode = async (phoneNumber: string, code: string): Promise<{ success: boolean; verified?: boolean; error?: string }> => {
  try {
    // التحقق من تنسيق رقم الهاتف
    let formattedPhone = phoneNumber;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    // إرسال طلب إلى الخادم للتحقق من الرمز
    const response = await fetch('/api/verify/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: formattedPhone, code })
    });

    const data = await response.json();

    if (data.success) {
      return { success: true, verified: true };
    } else {
      return { 
        success: false, 
        verified: false,
        error: data.error || 'رمز التحقق غير صحيح'
      };
    }
  } catch (error) {
    console.error('خطأ في التحقق من الرمز:', error);
    return { 
      success: false, 
      verified: false,
      error: error instanceof Error ? error.message : 'حدث خطأ غير معروف'
    };
  }
};

export default {
  sendVerificationCode,
  verifyCode
};