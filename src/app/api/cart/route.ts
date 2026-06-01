import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: cart, error } = await supabase
      .from('carts')
      .select(`
        *,
        cart_items (
          *,
          photo:photos (
            *,
            event:events (name)
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error fetching cart:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(cart || { items: [] });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photo_id, event_id, event_name, image_url, price } = await request.json();

    let { data: cart } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!cart) {
      const { data: newCart, error } = await supabase
        .from('carts')
        .insert({ user_id: user.id, status: 'active' })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating cart:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      cart = newCart;
    }

    const { error: itemError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cart.id,
        photo_id,
        price,
      });

    if (itemError) {
      if (itemError.code === '23505') {
        return NextResponse.json({ error: 'Item already in cart' }, { status: 400 });
      }
      console.error('Error adding item:', itemError);
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, cart_id: cart.id });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photo_id } = await request.json();

    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)
      .eq('photo_id', photo_id);

    if (error) {
      console.error('Error removing item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
