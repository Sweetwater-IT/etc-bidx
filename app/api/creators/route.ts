// app/api/creators/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Fetch non-null user_created emails from quotes
    const { data: emailsData, error: emailsError } = await supabase
      .from("quotes")
      .select("user_created")
      .not("user_created", "is", null);

    if (emailsError || !emailsData) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch creators", error: emailsError },
        { status: 500 }
      );
    }

    // Get unique emails
    const emailsSet = new Set(emailsData.map((row: any) => row.user_created).filter(Boolean));
    const emails = Array.from(emailsSet);

    // Fetch names for each email from auth.users
    const creatorOptions = await Promise.all(
      emails.map(async (email: string) => {
        const { data: userData, error: userError } = await supabase
          .from("auth.users")
          .select("raw_user_meta_data")
          .eq("email", email)
          .single();

        if (userError || !userData) {
          return { value: email, label: email }; // Fallback to email
        }

        const fullName = userData.raw_user_meta_data?.full_name || userData.raw_user_meta_data?.name || email;
        return { value: email, label: fullName };
      })
    );

    // Sort by label
    creatorOptions.sort((a, b) => a.label.localeCompare(b.label));

    return NextResponse.json({ success: true, data: creatorOptions });
  } catch (error) {
    console.error("Error fetching creators:", error);
    return NextResponse.json(
      { success: false, message: "Unexpected error", error: String(error) },
      { status: 500 }
    );
  }
}
