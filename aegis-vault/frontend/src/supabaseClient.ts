import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_PROJECT_URL_GOES_HERE'
const supabaseKey = 'YOUR_ANON_KEY_GOES_HERE'

export const supabase = createClient(supabaseUrl, supabaseKey)