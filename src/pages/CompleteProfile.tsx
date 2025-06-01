import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // 1. الهاتف والتحقق
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // 2. كلمة السر
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 3. معلومات اختيارية
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // إرسال رمز التحقق
  const sendOtp = async () => {
    setOtpLoading(true);
    setPhoneError("");
    try {
      // مثال: await supabase.auth.signInWithOtp({ phone });
      setOtpSent(true);
    } catch (e) {
      setPhoneError("فشل إرسال رمز التحقق. جرب مرة أخرى.");
    }
    setOtpLoading(false);
  };

  // تحقق من الرمز
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

  // حفظ كلمة السر
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
    setStep(3);
  };

  // حفظ باقي البيانات
  const handleProfile = async () => {
    setSubmitLoading(true);
    try {
      // تحديث بيانات الملف الشخصي في قاعدة البيانات
      // مثال: await supabase.from("profiles").update({ name, email, bio, location, avatar_url: avatarUrl, is_profile_complete: true }).eq("phone", phone);
      setSuccess(true);
      setTimeout(() => {
        navigate("/");
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