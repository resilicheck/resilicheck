import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// راه‌اندازی کلاینت‌ها
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// تعریف Tool (ابزار استخراج پارامتر)
const searchTool = {
  type: "function" as const,
  function: {
    name: "search_knowledge_units",
    description: "Searches the ResiliCheck knowledge base for verified products based on hazard and building element.",
    parameters: {
      type: "object",
      properties: {
        hazard_type: { type: "string", enum: ["wind", "flood", "fire", "hail", "earthquake"], description: "The type of natural hazard" },
        building_element_type: { type: "string", enum: ["roof", "wall", "window", "facade", "foundation", "door"], description: "The part of the building" }
      },
      required: ["hazard_type", "building_element_type"]
    }
  }
};

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    // ---------------------------------------------------------
    // ۱. کار Agent: استخراج پارامترهای مهندسی از متن کاربر
    // ---------------------------------------------------------
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a data extraction agent for a building resilience platform. Extract the hazard and building element from the user query. Do not make recommendations." },
        { role: "user", content: query }
      ],
      tools: [searchTool],
      tool_choice: { type: "function", function: { name: "search_knowledge_units" } }
    });

    const toolCall = response.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      return NextResponse.json({ error: "Could not understand query" }, { status: 400 });
    }

    const args = JSON.parse(toolCall.function.arguments);
    const { hazard_type } = args;

    // ---------------------------------------------------------
    // ۲. پیدا کردن ID خطر از دیتابیس (جلوگیری از ارور پرانتز)
    // ---------------------------------------------------------
    const hazardRecord = await supabase.from('hazards').select('id').eq('type', hazard_type).single();
    const targetHazardId = hazardRecord.data?.id;

    // ---------------------------------------------------------
    // ۳. کار Tool: جستجو در Knowledge Graph
    // ---------------------------------------------------------
    // اگر خطر پیدا شد، فیلتر را اعمال کن، در غیر این صورت همه را بگیر
    let kuQuery = supabase.from('knowledge_units').select('*');
    if (targetHazardId) {
      kuQuery = kuQuery.eq('hazard_id', targetHazardId);
    }

    const [kuRes, prodRes, hazRes, beRes, certRes, manRes] = await Promise.all([
      kuQuery,
      supabase.from('products').select('*'),
      supabase.from('hazards').select('*'),
      supabase.from('building_elements').select('*'),
      supabase.from('certificates').select('*'),
      supabase.from('manufacturers').select('*')
    ]);

    // ---------------------------------------------------------
    // ۴. اتصال مهندسی داده‌ها (Mappping)
    // ---------------------------------------------------------
    const productsMap = Object.fromEntries((prodRes.data || []).map(p => [p.id, p]));
    const hazardsMap = Object.fromEntries((hazRes.data || []).map(h => [h.id, h]));
    const beMap = Object.fromEntries((beRes.data || []).map(b => [b.id, b]));
    const certsMap = Object.fromEntries((certRes.data || []).map(c => [c.id, c]));
    const mansMap = Object.fromEntries((manRes.data || []).map(m => [m.id, m]));

    const finalData = (kuRes.data || []).map(unit => {
      const product = productsMap[unit.product_id] || {};
      const manufacturer = mansMap[product.manufacturer_id] || {};
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
    });

    // ارسال نتایج به ظاهر سایت
    return NextResponse.json({ data: finalData });

  } catch (error: any) {
    console.error("Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}