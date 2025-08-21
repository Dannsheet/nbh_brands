export async function GET(req) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  // ... tu lógica original ...
}

export async function POST(req) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  // ... tu lógica original ...
}

// Repite el patrón para PUT, DELETE, etc. si existen