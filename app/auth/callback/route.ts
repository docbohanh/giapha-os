import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // if "next" is in search params, use it as the redirection URL
    const next = searchParams.get("next") ?? "/dashboard";

    if (code) {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && user) {
            // Sync metadata to profiles table
            const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name;
            const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

            if (fullName || avatarUrl) {
                // Use upsert to create or update profile
                await supabase
                    .from("profiles")
                    .upsert({
                        id: user.id,
                        full_name: fullName,
                        avatar_url: avatarUrl,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'id' });
            }

            const forwardedHost = request.headers.get("x-forwarded-host"); // autorendered by Vercel
            const isLocalEnv = process.env.NODE_ENV === "development";
            if (isLocalEnv) {
                // we can skip forwarded host check in local env
                return NextResponse.redirect(`${origin}${next}`);
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`);
            } else {
                return NextResponse.redirect(`${origin}${next}`);
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
