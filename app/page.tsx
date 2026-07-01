import { createClient } from '@supabase/supabase-js'

export const revalidate = 0 

export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return (
      <main className="p-8 bg-red-100 text-red-800 text-xl font-bold">
        خطا: فایل‌های تنظیمات دیتابیس یافت نشد.
      </main>
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // درخواست نهایی و صحیح با نام‌گذاری دقیق دیتابیس شما
  const { data: knowledgeData, error } = await supabase
    .from('knowledge_units')
    .select(`
      performance_value,
      valid_from,
      valid_until,
      products ( name, description, manufacturers ( name ) ),
      hazards ( name, type ),
      building_elements ( name, type ),
      certificates ( standards, issuing_body, verification_status )
    `)

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
        
        {error ? (
          <div className="bg-red-50 p-4 rounded border border-red-200 text-red-700">
            خطا در دریافت اطلاعات: {error.message}
          </div>
        ) : !knowledgeData || knowledgeData.length === 0 ? (
          <p className="text-gray-500">No verified data available yet. Please check the database.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {knowledgeData.map((unit, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col">
                
                <div className="mb-4">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Product</span>
                  <h3 className="text-xl font-bold mt-1">{unit.products?.name || 'Unknown Product'}</h3>
                  <p className="text-sm text-gray-500">by {unit.products?.manufacturers?.name || 'Unknown'}</p>
                </div>

                <div className="bg-green-50 p-3 rounded mb-4 border border-green-100">
                  <span className="text-xs font-semibold text-green-700">Performance Value</span>
                  <p className="text-2xl font-bold text-green-800 uppercase">{unit.performance_value}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4 flex-grow">
                  <div>
                    <span className="text-gray-500 block">Hazard</span>
                    <span className="font-medium capitalize">{unit.hazards?.name} ({unit.hazards?.type})</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Building Element</span>
                    <span className="font-medium capitalize">{unit.building_elements?.name} ({unit.building_elements?.type})</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t text-xs text-gray-600">
                  <p><strong>Evidence:</strong> {unit.certificates?.standards}</p>
                  <p><strong>Issued by:</strong> {unit.certificates?.issuing_body}</p>
                  <p className={`mt-1 font-bold ${unit.certificates?.verification_status === 'verified' ? 'text-green-600' : 'text-red-600'}`}>
                    Status: {unit.certificates?.verification_status?.toUpperCase()}
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