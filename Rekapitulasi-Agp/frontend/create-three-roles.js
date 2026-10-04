const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yicrnndbulqahzwzdofw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpY3JubmRidWxxYWh6d3pkb2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDQxNzMsImV4cCI6MjEwMDIyMDE3M30.PFNutAfJLAzwOPmvezIlPjSyBcCxJ2Yyf_c3O9QgirU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const usersToCreate = [
  { username: 'superadmin', role: 'SUPER_ADMIN', name: 'Sekretaris Utama AGP (Super Admin)' },
  { username: 'admin', role: 'ADMIN', name: 'Pengelola Master Data (Admin)' },
  { username: 'operator', role: 'OPERATOR_REKAP', name: 'Operator Entri Nilai (PJ Rekap)' }
];

async function run() {
  console.log('🚀 Memulai pendaftaran 3 akun panitia berbasis role dengan domain @email.com...');
  
  for (const u of usersToCreate) {
    const email = `${u.username}@email.com`;
    const password = 'Password123!';
    
    console.log(`⏳ Mendaftarkan akun: ${u.username} (${u.role})...`);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: u.username,
          full_name: u.name,
          role: u.role,
        }
      }
    });

    if (error) {
      console.error(`❌ Gagal mendaftarkan ${u.username}:`, error.message);
    } else {
      console.log(`✅ Akun ${u.username} (${email}) BERHASIL terdaftar di Supabase Auth.`);
    }
  }
  
  console.log('\n======================================================');
  console.log('👉 Sekarang silakan buka menu "Users" di Supabase Dashboard,');
  console.log('   lalu klik "Confirm User" pada ketiga akun baru di atas.');
  console.log('======================================================');
}

run();
