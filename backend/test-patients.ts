import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectPatients() {
  const { data: patients, error: p2e } = await supabase.from("patients").select("*");
  console.log("Patients Table:");
  
  if (patients) {
    const enriched = await Promise.all(
        patients.map(async (patient) => {
          try {
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("fullName, email")
              .eq("id", patient.user_id)
              .single();
  
            if (error && error.code !== 'PGRST116') {
               console.error(`Error fetching profile for patient ${patient.id}:`, error);
            } else {
               console.log(`Fetched profile for user ${patient.user_id}:`, profile);
            }
  
            return {
              ...patient,
              user_details: profile ? {
                fullName: profile.fullName || null,
                email: profile.email || null,
              } : null,
            };
          } catch (err) {
            console.error(`Unexpected error for patient ${patient.id}:`, err);
            return {
              ...patient,
              user_details: null,
            };
          }
        }),
      );
      
      console.log(JSON.stringify(enriched, null, 2));
  }
}

inspectPatients().catch(console.error);
