import { createClient } from '@supabase/supabase-js'

export const revalidate = 0 

export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return <main className="p-8 text-red-800 text-xl font-bold">خطا: تنظیمات دیتابیس یافت نشد.</main>
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // به جای درخواست اتصالی از دیتابیس، ما تمام جداول را همزمان و جداگانه می‌خوانیم
  const [kuRes, prodRes, hazRes, beRes, certRes, manRes] = await Promise.all([
    supabase.from('knowledge_units').select('*'),
    supabase.from('products').select('*'),
    supabase.from('hazards').select('*'),
    supabase.from('building_elements').select('*'),
    supabase.from('certificates').select('*'),
    supabase.from('manufacturers').select('*')
  ])

  // تبدیل جداول به فرمت "نقشه" (Map) تا بر اساس ID سریع پیدا شوند
  const productsMap = Object.fromEntries((prodRes.data || []).map(p => [p.id, p]))
  const hazardsMap = Object.fromEntries((hazRes.data || []).map(h => [h.id, h]))
  const beMap = Object.fromEntries((beRes.data || []).map(b => [b.id, b]))
  const certsMap = Object.fromEntries((certRes.data || []).map(c => [c.id, c]))
  const mansMap = Object.fromEntries((manRes.data || []).map(m => [m.id, m]))

  // اتصال مهندسی جداول در کد سایت (بدون نیاز به Foreign Key دیتابیس)
  const finalData = (kuRes.data || []).map(unit => {
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
      <header className="max-w-6xl mx-auto mb-12 border-b pb-6">
        <h1 className="text-4xl font-bold text-blue-900 tracking-tight">ResiliCheck</h1>
        <p className="mt-2 text-lg text-gray-600">
          Verified building product performance against natural hazards.
        </p>
        <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800 text-sm">
          <strong>System Boundary Notice:</strong> This platform displays verified technical data and certificates. It does not provide personalized product recommendations or replace engineering assessment.
        </div>
      </header>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Verified Knowledge Base</h2>
        
        {finalData.length === 0 ? (
          <p className="text-gray-500">No verified data available yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {finalData.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col">
                
                <div className="mb-4">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Product</span>
                  <h3 className="text-xl font-bold mt-1">{item.product_name}</h3>
                  <p className="text-sm text-gray-500">by {item.manufacturer_name}</p>
                </div>

                <div className="bg-green-50 p-3 rounded mb-4 border border-green-100">
                  <span className="text-xs font-semibold text-green-700">Performance Value</span>
                  <p className="text-2xl font-bold text-green-800 uppercase">{item.performance_value}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4 flex-grow">
                  <div>
                    <span className="text-gray-500 block">Hazard</span>
                    <span className="font-medium capitalize">{item.hazard_name} ({item.hazard_type})</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Building Element</span>
                    <span className="font-medium capitalize">{item.be_name} ({item.be_type})</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t text-xs text-gray-600">
                  <p><strong>Evidence:</strong> {item.cert_standard}</p>
                  <p><strong>Issued by:</strong> {item.cert_body}</p>
                  <p className={`mt-1 font-bold ${item.cert_status === 'verified' ? 'text-green-600' : 'text-red-600'}`}>
                    Status: {item.cert_status?.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}