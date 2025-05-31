/*
  # إصلاح نظام التحقق من رقم الهاتف
  
  1. التغييرات
    - حذف الوظائف المكررة
    - إعادة إنشاء جدول phone_verification_codes
    - تحديث سياسات الأمان
    - إصلاح وظيفة handle_new_user
  
  2. الأمان
    - تمكين RLS على جميع الجداول
    - إضافة سياسات مناسبة للوصول
*/

-- حذف الوظائف المكررة
DROP FUNCTION IF EXISTS verify_phone_code(uuid, text, text);
DROP FUNCTION IF EXISTS verify_phone_code(text, text);
DROP FUNCTION IF EXISTS generate_verification_code(uuid, text);
DROP FUNCTION IF EXISTS generate_verification_code(text, uuid);

-- حذف الجدول القديم وإعادة إنشائه
DROP TABLE IF EXISTS phone_verification_codes;

-- إنشاء جدول رموز التحقق من جديد
CREATE TABLE phone_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  code text NOT NULL,
  attempts integer DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes')
);

-- إنشاء فهارس للأداء
CREATE INDEX idx_phone_verification_codes_user_id ON phone_verification_codes(user_id);
CREATE INDEX idx_phone_verification_codes_phone ON phone_verification_codes(phone);

-- تمكين RLS
ALTER TABLE phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسة أمان تسمح للجميع بإدارة رموز التحقق
CREATE POLICY "Anyone can manage verification codes"
ON phone_verification_codes
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- إنشاء وظيفة للتحقق من رمز التحقق
CREATE OR REPLACE FUNCTION verify_phone_code(
  p_phone text,
  p_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code_record RECORD;
  v_user_id uuid;
BEGIN
  -- البحث عن آخر رمز تحقق لهذا الرقم
  SELECT * INTO v_code_record
  FROM phone_verification_codes
  WHERE phone = p_phone
    AND verified = false
    AND attempts < 3
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- التحقق من وجود الرمز
  IF v_code_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- زيادة عدد المحاولات
  UPDATE phone_verification_codes
  SET attempts = attempts + 1
  WHERE id = v_code_record.id;
  
  -- التحقق من صحة الرمز
  IF v_code_record.code = p_code THEN
    -- تحديث حالة التحقق
    UPDATE phone_verification_codes
    SET verified = true
    WHERE id = v_code_record.id;
    
    -- البحث عن المستخدم برقم الهاتف
    SELECT id INTO v_user_id
    FROM profiles
    WHERE phone = p_phone;
    
    -- تحديث حالة التحقق في الملف الشخصي
    IF v_user_id IS NOT NULL THEN
      UPDATE profiles
      SET phone_verified = true
      WHERE id = v_user_id;
    END IF;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- إنشاء وظيفة لإنشاء رمز تحقق جديد
CREATE OR REPLACE FUNCTION generate_verification_code(
  p_phone text,
  p_user_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
BEGIN
  -- إنشاء رمز عشوائي من 6 أرقام
  v_code := floor(random() * 900000 + 100000)::text;
  
  -- تخزين الرمز في قاعدة البيانات
  INSERT INTO phone_verification_codes (
    user_id,
    phone,
    code,
    attempts,
    verified,
    expires_at
  ) VALUES (
    p_user_id,
    p_phone,
    v_code,
    0,
    false,
    now() + interval '10 minutes'
  );
  
  RETURN v_code;
END;
$$;

-- إصلاح وظيفة handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    phone,
    phone_verified,
    created_at,
    updated_at
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.phone, new.raw_user_meta_data->>'phone', ''),
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إعادة إنشاء المحفز
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();