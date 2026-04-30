const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://egjkbcyermbihkgapwan.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnamtiY3llcm1iaWhrZ2Fwd2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2OTkzNzQsImV4cCI6MjA5MTI3NTM3NH0.414b1EEHINt5l5PR0C_U7gtVjji5dddlP-NPqCeaBro"
);

async function checkColumns() {
  try {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .limit(1);
    
    if (error) {
      console.error("Error:", error.message);
    } else if (data && data.length > 0) {
      console.log("Columns:", Object.keys(data[0]).join(", "));
    } else {
      console.log("No data in stores table to check columns.");
    }
  } catch (e) {
    console.error("Exec Error:", e.message);
  }
}

checkColumns();
