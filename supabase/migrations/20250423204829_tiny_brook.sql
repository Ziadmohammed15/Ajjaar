/*
  # تحديث نظام المصادقة ليعتمد على رقم الهاتف فقط
  
  1. التغييرات
    - تعديل جدول profiles لجعل حقل البريد الإلكتروني اختياري
    - تحديث سياسات الأمان لجدول profiles
    - تحديث جدول phone_verification_codes
    - إضافة وظائف مساعدة للتحقق من رقم الهاتف
  
  2. الأمان
    - تفعيل RLS على جميع الجداول
    - إضافة سياسات مناسبة للوصول
    - تحسين أمان عملية التحقق من رقم الهاتف
*/

-- تعديل جدول profiles لجعل حقل البريد الإلكتروني اختياري
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- تحديث جدول phone_verification_codes
CREATE TABLE IF NOT EXISTS phone_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  phone text NOT NULL,
  code text NOT NULL,
  attempts integer DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes')
);

-- تفعيل RLS على جدول phone_verification_codes
ALTER TABLE phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- حذف السياسات الموجودة لتجنب التعارض
DO $$ 
BEGIN
  -- حذف سياسات جدول profiles
  DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Service role has full access" ON profiles;
  DROP POLICY IF EXISTS "Public can insert profiles" ON profiles;
  
  -- حذف سياسات جدول phone_verification_codes
  DROP POLICY IF EXISTS "Users can manage their verification codes" ON phone_verification_codes;
  DROP POLICY IF EXISTS "Users can manage their verification codes v2" ON phone_verification_codes;
END $$;

-- إنشاء سياسات جديدة لجدول profiles
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role has full access"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can insert profiles"
ON profiles FOR INSERT
TO anon
WITH CHECK (true);

-- إنشاء سياسات لجدول phone_verification_codes
CREATE POLICY "Users can manage their verification codes"
ON phone_verification_codes
FOR ALL
USING (
  (user_id IS NULL) OR
  (user_id = auth.uid()) OR
  (auth.role() = 'service_role')
);

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

-- إنشاء وظيفة لإرسال رمز التحقق
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

-- إنشاء وظيفة للتحقق من وجود مستخدم برقم الهاتف
CREATE OR REPLACE FUNCTION get_user_by_phone(
  p_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM profiles
  WHERE phone = p_phone;
  
  RETURN v_user_id;
END;
$$;

-- إنشاء محفز لإنشاء ملف شخصي تلقائيًا عند تسجيل المستخدم
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'name', 
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء محفز لتسجيل المستخدم الجديد
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();