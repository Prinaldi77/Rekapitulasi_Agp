const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yicrnndbulqahzwzdofw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpY3JubmRidWxxYWh6d3pkb2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDQxNzMsImV4cCI6MjEwMDIyMDE3M30.PFNutAfJLAzwOPmvezIlPjSyBcCxJ2Yyf_c3O9QgirU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Registering demo Grand Master user...');
  const username = 'grandmaster';
  const email = `${username}@agp.local`;
  const password = 'Password123!';
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name: 'Sekretaris Utama AGP (Grand Master)',
        role: 'GRAND_MASTER',
      }
    }
  });

  if (error) {
    console.error('❌ Gagal membuat user auth:', error.message);
  } else {
    console.log('✅ User auth berhasil dibuat:', data.user?.email);
    
    // Create profile
    if (data.user) {
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: data.user.id,
        username,
        full_name: 'Sekretaris Utama AGP (Grand Master)',
        role: 'GRAND_MASTER',
      });
      
      if (profileErr) {
        console.error('❌ Gagal membuat data profile:', profileErr.message);
      } else {
        console.log('✅ Data profile database berhasil di-upsert.');
      }
    }
  }
}

run();
