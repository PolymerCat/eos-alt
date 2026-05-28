const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('shelters').insert([{
    id: "test-123",
    name: "Test Shelter",
    latitude: 0,
    longitude: 0,
    state: "Test",
    district: "Test"
  }]).select();
  console.log("Insert result:", data, error);
}

test();
