import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-signature') || ''
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!

  if (!verifySignature(body, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  const eventName = event.meta?.event_name
  const userId = event.meta?.custom_data?.user_id
  const customerId = event.data?.attributes?.customer_id
  const subscriptionId = event.data?.id
  const endsAt = event.data?.attributes?.ends_at
  const status = event.data?.attributes?.status

  if (!userId) {
    return NextResponse.json({ error: 'No user_id in custom_data' }, { status: 400 })
  }

  switch (eventName) {
    case 'subscription_created':
    case 'subscription_updated':
      await supabase.from('profiles').update({
        is_premium: status === 'active',
        subscription_status: status === 'active' ? 'active' : 'cancelled',
        premium_until: endsAt,
        lemon_customer_id: String(customerId),
        lemon_subscription_id: String(subscriptionId),
      }).eq('id', userId)
      break

    case 'subscription_cancelled':
      await supabase.from('profiles').update({
        subscription_status: 'cancelled',
      }).eq('id', userId)
      break

    case 'subscription_expired':
      await supabase.from('profiles').update({
        is_premium: false,
        subscription_status: 'expired',
        premium_until: null,
      }).eq('id', userId)
      break
  }

  return NextResponse.json({ received: true })
}
