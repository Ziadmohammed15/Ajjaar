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
  -- حذف سياسات جدول phone_verification_codes
  DROP POLICY IF EXISTS "Users can manage their verification codes" ON phone_verification_codes;
  DROP POLICY IF EXISTS "Users can manage their verification codes v2" ON phone_verification_codes;
END $$;

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