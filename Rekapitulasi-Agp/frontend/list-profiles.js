const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yicrnndbulqahzwzdofw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpY3JubmRidWxxYWh6d3pkb2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDQxNzMsImV4cCI6MjEwMDIyMDE3M30.PFNutAfJLAzwOPmvezIlPjSyBcCxJ2Yyf_c3O9QgirU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('🔍 Mengambil daftar profile dari database...');
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) {
    console.error('❌ Gagal:', error.message);
  } else {
    console.log('✅ Daftar profile terdaftar di database:');
    if (data.length === 0) {
      console.log('   (Tabel profile kosong)');
    } else {
      data.forEach(p => {
        console.log(`   - Username: @${p.username} | Role: ${p.role} | Nama: ${p.full_name}`);
      });
    }
  }
}

run();
