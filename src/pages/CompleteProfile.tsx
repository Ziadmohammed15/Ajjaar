import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: phone
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Step 2: password
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Step 3: Optional info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [success, setSuccess] = useState(false);

  // 1. إرسال رمز التحقق للهاتف
  const sendOtp = async () => {
    setOtpLoading(true);
    setPhoneError("");
    // يجب ربط هذه الدالة مع باكند/سيرفس OTP حقيقي مثل Twilio أو Supabase Auth
    try {
      // مثال: await supabase.auth.signInWithOtp({ phone });
      setOtpSent(true);
    } catch (e) {
      setPhoneError("فشل إرسال رمز التحقق. جرب مرة أخرى.");
    }
    setOtpLoading(false);
  };

  // 2. تحقق من الرمز
  const verifyOtp = async () => {
    setOtpError("");
    setOtpLoading(true);
    try {
      // مثال: await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
      setStep(2);
    } catch (e) {
      setOtpError("رمز التحقق غير صحيح أو منتهي.");
    }
    setOtpLoading(false);
  };

  // 3. تعيين كلمة السر
  const handlePassword = async () => {
    setPasswordError("");
    if (password.length < 6) {
      setPasswordError("كلمة السر يجب أن تكون 6 أحرف على الأقل.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("كلمتا السر غير متطابقتين.");
      return;
    }
    // من هنا يمكن حفظ كلمة السر في البروفايل أو Supabase Auth
    setStep(3);
  };

  // 4. حفظ باقي الحقول الاختيارية
  const handleProfile = async () => {
    setSubmitLoading(true);
    // تحديث بيانات المستخدم في جدول profiles
    try {
      // مثال: await supabase.from("profiles").update({ name, email, bio, location, avatar_url: avatarUrl, is_profile_complete: true }).eq("phone", phone);
      setSuccess(true);
      setTimeout(() => {
        navigate("/"); // إلى الرئيسية بعد الإكمال
      }, 1500);
    } catch (e) {
      alert("فشل حفظ الملف الشخصي.");
    }
    setSubmitLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow border">
      <h2 className="text-xl font-bold mb-4 text-center">إكمال الملف الشخصي</h2>

      {step === 1 && (
        <>
          <label className="block mb-2 font-medium">رقم الجوال</label>
          <input
            type="tel"
            className="input-field w-full mb-2"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="05xxxxxxxx"
            disabled={otpSent}
          />
          {phoneError && <p className="text-red-500">{phoneError}</p>}
          {!otpSent ? (
            <button className="btn w-full" onClick={sendOtp} disabled={otpLoading}>
              {otpLoading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
            </button>
          ) : (
            <>
              <label className="block mt-4 mb-2 font-medium">رمز التحقق</label>
              <input
                type="text"
                className="input-field w-full mb-2"
                value={otp}
                onChange={e => setOtp(e.target.value)}
              />
              {otpError && <p className="text-red-500">{otpError}</p>}
              <button className="btn w-full" onClick={verifyOtp} disabled={otpLoading}>
                {otpLoading ? "جارٍ التحقق..." : "تحقق"}
              </button>
            </>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <label className="block mb-2 font-medium">كلمة السر</label>
          <input
            type="password"
            className="input-field w-full mb-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <label className="block mb-2 font-medium">تأكيد كلمة السر</label>
          <input
            type="password"
            className="input-field w-full mb-2"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
          {passwordError && <p className="text-red-500">{passwordError}</p>}
          <button className="btn w-full" onClick={handlePassword}>
            التالي
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <label className="block mb-2 font-medium">الاسم (اختياري)</label>
          <input
            type="text"
            className="input-field w-full mb-2"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <label className="block mb-2 font-medium">البريد الإلكتروني (اختياري)</label>
          <input
            type="email"
            className="input-field w-full mb-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <label className="block mb-2 font-medium">نبذة عنك (اختياري)</label>
          <textarea
            className="input-field w-full mb-2"
            value={bio}
            onChange={e => setBio(e.target.value)}
          />
          <label className="block mb-2 font-medium">الموقع (اختياري)</label>
          <input
            type="text"
            className="input-field w-full mb-2"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
          <label className="block mb-2 font-medium">الصورة الشخصية (رابط اختياري)</label>
          <input
            type="text"
            className="input-field w-full mb-2"
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
          />
          <button className="btn w-full" onClick={handleProfile} disabled={submitLoading}>
            {submitLoading ? "جاري الحفظ..." : "حفظ وإنهاء"}
          </button>
          {success && <p className="text-green-600 text-center mt-4">تم اكتمال الملف بنجاح!</p>}
        </>
      )}
    </div>
  );
};

export default CompleteProfile;