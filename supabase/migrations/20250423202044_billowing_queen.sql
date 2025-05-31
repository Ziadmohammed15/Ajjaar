/*
  # إصلاح سياسات الأمان لجدول profiles
  
  1. التغييرات
    - حذف السياسات الموجودة لتجنب التعارض
    - إضافة سياسات جديدة تسمح بما يلي:
      - للمستخدمين المسجلين بإنشاء ملفاتهم الشخصية
      - للمستخدمين بتحديث ملفاتهم الشخصية
      - للجميع بعرض الملفات الشخصية
      - لدور الخدمة بإدارة جميع الملفات الشخصية
  
  2. الأمان
    - تفعيل RLS على جدول profiles
    - إضافة سياسات مناسبة لجميع العمليات
    - إصلاح مشاكل المصادقة
*/

-- تفعيل RLS على جدول profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- حذف السياسات الموجودة لتجنب التعارض
DO $$ 
BEGIN
  -- حذف جميع السياسات الموجودة في جدول profiles
  DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Service role has full access" ON profiles;
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
END $$;

-- إنشاء سياسات جديدة بأسماء واضحة

-- السماح للجميع بقراءة جميع الملفات الشخصية
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- السماح للمستخدمين المسجلين بإدراج ملفاتهم الشخصية
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- السماح للمستخدمين بتحديث ملفاتهم الشخصية
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- السماح لدور الخدمة بالوصول الكامل للعمليات النظامية
CREATE POLICY "Service role has full access"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- إنشاء محفز لإنشاء ملف شخصي تلقائيًا عند تسجيل المستخدم
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء محفز لتسجيل المستخدم الجديد إذا لم يكن موجودًا
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();