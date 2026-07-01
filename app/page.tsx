import { createClient } from '@supabase/supabase-js'
import SearchComponent from './SearchComponent' // وارد کردن کامپوننت جستجو

export const revalidate = 0 

export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return <main className="p-8 text-red-800 text-xl font-bold">خطا: تنظیمات دیتابیس یافت نشد.</main>
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // فقط داده‌های اولیه را برای لود اولیه سایت می‌خوانیم
  const [kuRes, prodRes, hazRes, beRes, certRes, manRes] = await Promise.all([
    supabase.from('knowledge_units').select('*'),
    supabase.from('products').select('*'),
    supabase.from('hazards').select('*'),
    supabase.from('building_elements').select('*'),
    supabase.from('certificates').select('*'),
    supabase.from('manufacturers').select('*')
  ])

  const productsMap = Object.fromEntries((prodRes.data || []).map(p => [p.id, p]))
  const hazardsMap = Object.fromEntries((hazRes.data || []).map(h => [h.id, h]))
  const beMap = Object.fromEntries((beRes.data || []).map(b => [b.id, b]))
  const certsMap = Object.fromEntries((certRes.data || []).map(c => [c.id, c]))
  const mansMap = Object.fromEntries((manRes.data || []).map(m => [m.id, m]))

  const initialData = (kuRes.data || []).map(unit => {
    const product = productsMap[unit.product_id] || {}
    const manufacturer = mansMap[product.manufacturer_id] || {}
    return {
      performance_value: unit.performance_value,
      product_name: product.name || 'Unknown Product',
      manufacturer_name: manufacturer.name || 'Unknown',
      hazard_name: hazardsMap[unit.hazard_id]?.name || '',
      hazard_type: hazardsMap[unit.hazard_id]?.type || '',
      be_name: beMap[unit.building_element_id]?.name || '',
      be_type: beMap[unit.building_element_id]?.type || '',
      cert_standard: certsMap[unit.certificate_id]?.standards || '',
      cert_body: certsMap[unit.certificate_id]?.issuing_body || '',
      cert_status: certsMap[unit.certificate_id]?.verification_status || ''
    }
  })

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 p-8 font-sans">
      {/* هدر سایت */}
      <header className="max-w-6xl mx-auto mb-12 border-b pb-6">
        <h1 className="text-4xl font-bold text-blue-900 tracking-tight">ResiliCheck</h1>
        <p className="mt-2 text-lg text-gray-600">
          Verified building product performance against natural hazards.
        </p>
        <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800 text-sm">
          <strong>System Boundary Notice:</strong> This platform displays verified technical data and certificates. It does not provide personalized product recommendations or replace engineering assessment.
        </div>
      </header>

      {/* فراخوانی کامپوننت جستجو و پاس دادن داده‌های اولیه به آن */}
      <SearchComponent initialData={initialData} />
    </main>
  )
}