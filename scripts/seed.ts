import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const email = "admin@crownadvertising.com";
  const password = "admin123";

  // Check if user already exists
  const { data: existing } = await supabase.auth.admin.listUsers();
  const alreadyExists = existing?.users.some((u) => u.email === email);

  if (alreadyExists) {
    console.log("ℹ️  Admin user already exists:", email);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("❌ Failed to create admin user:", error.message);
    process.exit(1);
  }

  console.log("✅ Admin user created:", data.user?.email);
  console.log("   Password: admin123  (change this after first login)");
}

main().catch(console.error);

