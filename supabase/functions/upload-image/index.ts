// This file is intended for Supabase Edge Functions runtime, where 'Deno' and remote imports are available.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'

serve(async (req: Request) => {
  const { fileName, base64, contentType } = await req.json()

  // @ts-ignore: 'Deno' is available in the Supabase Edge Functions runtime
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Convert base64 to Uint8Array
  const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0))

  // Upload to Storage
  const { data, error } = await supabase.storage
    .from('property-photos')
    .upload(fileName, buffer, {
      contentType,
      upsert: true,
    })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('property-photos')
    .getPublicUrl(fileName)

  return new Response(JSON.stringify({ publicUrl: publicUrlData.publicUrl }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// Polyfill for atob in Deno
function atob(input: string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  let str = input.replace(/=+$/, '')
  let output = ''
  if (str.length % 4 === 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.")
  }
  for (
    let bc = 0, bs = 0, buffer, i = 0;
    (buffer = str.charAt(i++));
    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer)
  }
  return output
} 