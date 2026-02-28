import { supabase } from "@/utils/supabase";

export async function createPatient(data: {
  name: string;
  dob: string | null;
  phone: string;
  email: string | null;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: patient, error } = await supabase
    .from("patients")
    .insert({
      doctor_id: user.id,
      name: data.name.trim(),
      dob: data.dob || null,
      phone: data.phone.trim(),
      email: data.email?.trim() || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: patient };
}

export async function createInforme(patientId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: informe, error } = await supabase
    .from("informes")
    .insert({
      doctor_id: user.id,
      patient_id: patientId,
      status: "recording",
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: informe };
}

export async function getInformes() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data, error } = await supabase
    .from("informes")
    .select("*, patients(name, phone, email)")
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getInforme(informeId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data, error } = await supabase
    .from("informes")
    .select("*, patients(name, phone, email, dob)")
    .eq("id", informeId)
    .eq("doctor_id", user.id)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateInformeStatus(
  informeId: string,
  status: string,
  extra?: {
    transcript?: string;
    audio_path?: string;
    informe_doctor?: string;
    informe_paciente?: string;
    pdf_path?: string;
  }
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("informes")
    .update({ status, ...extra })
    .eq("id", informeId)
    .eq("doctor_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function getPdfSignedUrl(pdfPath: string) {
  const { data } = await supabase.storage
    .from("informes-pdf")
    .createSignedUrl(pdfPath, 3600);
  return data?.signedUrl ?? null;
}

export async function uploadAudio(
  doctorId: string,
  informeId: string,
  audioUri: string,
  mimeType: string
) {
  const ext = mimeType.includes("mp4") || mimeType.includes("m4a") ? "m4a" : "caf";
  const fileName = `${doctorId}/${informeId}/recording.${ext}`;

  const response = await fetch(audioUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from("audio-recordings")
    .upload(fileName, blob, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) return { error: error.message };
  return { path: fileName };
}

export async function processInformeWithAI(
  informeId: string,
  transcript: string,
  audioPath?: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  await updateInformeStatus(informeId, "processing", {
    transcript,
    audio_path: audioPath,
  });

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/process-informe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ informeId, transcript }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || "Error al procesar el informe");
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await updateInformeStatus(informeId, "error");
    return { error: message };
  }
}
