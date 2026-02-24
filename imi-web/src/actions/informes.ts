"use server";

import { createClient } from "@/utils/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { generateInformePDF } from "@/lib/pdf";
import { revalidatePath } from "next/cache";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function createPatient(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const name = formData.get("name") as string;
  const dob = formData.get("dob") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;

  const { data, error } = await supabase
    .from("patients")
    .insert({
      doctor_id: user.id,
      name: name.trim(),
      dob: dob || null,
      phone: phone.trim(),
      email: email?.trim() || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function createInforme(patientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data, error } = await supabase
    .from("informes")
    .insert({
      doctor_id: user.id,
      patient_id: patientId,
      status: "recording",
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function processInformeFromTranscript(
  informeId: string,
  transcript: string,
  audioPath?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  await supabase
    .from("informes")
    .update({ status: "processing", audio_path: audioPath ?? null, transcript })
    .eq("id", informeId)
    .eq("doctor_id", user.id);

  try {
    const reportsResponse = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `Eres un asistente médico experto. Basándote en la siguiente transcripción de una consulta médica, genera DOS informes separados.

TRANSCRIPCIÓN:
${transcript}

---

Genera los dos informes en el siguiente formato JSON exacto (sin markdown, solo JSON puro):
{
  "informe_doctor": "...",
  "informe_paciente": "..."
}

INFORME PARA EL DOCTOR (informe_doctor):
- Detallado y técnico
- Incluye: motivo de consulta, anamnesis, síntomas reportados, diagnóstico presuntivo, medicamentos recetados con dosis y frecuencia, indicaciones, próximos pasos y seguimiento
- Usa terminología médica apropiada
- Formato estructurado con secciones claras usando saltos de línea

INFORME PARA EL PACIENTE (informe_paciente):
- Lenguaje simple y amigable, fácil de entender
- Incluye: resumen de la consulta, qué le pasa y por qué, medicamentos que debe tomar (nombre, para qué sirve, cuándo tomarlo), recomendaciones y cuidados, próximos pasos
- Tono cálido y tranquilizador
- Sin jerga médica compleja
- Formato claro con secciones usando saltos de línea`,
        },
      ],
    });

    const reportsText =
      reportsResponse.content[0].type === "text"
        ? reportsResponse.content[0].text
        : "{}";

    let informeDoctor = "";
    let informePaciente = "";

    const jsonMatch = reportsText.match(/\{[\s\S]*\}/);
    try {
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : reportsText);
      informeDoctor = parsed.informe_doctor || "";
      informePaciente = parsed.informe_paciente || "";
    } catch {
      informeDoctor = reportsText;
      informePaciente = reportsText;
    }

    const { data: informeData } = await supabase
      .from("informes")
      .select("*, patients(*)")
      .eq("id", informeId)
      .single();

    let pdfPath: string | null = null;
    if (informeData && informePaciente) {
      try {
        const patient = (informeData as { patients: { name: string; phone: string } }).patients;
        const pdfBytes = await generateInformePDF({
          patientName: patient.name,
          patientPhone: patient.phone,
          date: new Date().toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
          content: informePaciente,
        });

        const pdfFileName = `${user.id}/${informeId}/informe-paciente.pdf`;
        const pdfBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
        const { error: pdfUploadError } = await supabase.storage
          .from("informes-pdf")
          .upload(pdfFileName, pdfBlob, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (!pdfUploadError) {
          pdfPath = pdfFileName;
        }
      } catch (pdfError) {
        console.error("Error generando PDF:", pdfError);
      }
    }

    const { error: updateError } = await supabase
      .from("informes")
      .update({
        status: "completed",
        informe_doctor: informeDoctor,
        informe_paciente: informePaciente,
        pdf_path: pdfPath,
      })
      .eq("id", informeId)
      .eq("doctor_id", user.id);

    if (updateError) throw new Error(updateError.message);

    revalidatePath("/");
    revalidatePath(`/informes/${informeId}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await supabase
      .from("informes")
      .update({ status: "error" })
      .eq("id", informeId)
      .eq("doctor_id", user.id);
    return { error: message };
  }
}

export async function getInformes() {
  const supabase = await createClient();
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
  const supabase = await createClient();
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

export async function getPdfDownloadUrl(pdfPath: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("informes-pdf")
    .createSignedUrl(pdfPath, 3600);
  return data?.signedUrl ?? null;
}

export async function regeneratePdf(informeId: string) {
  await generateAndSavePdf(informeId);
  revalidatePath(`/informes/${informeId}`);
}

export async function generateAndSavePdf(informeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: informeData, error: fetchError } = await supabase
    .from("informes")
    .select("*, patients(*)")
    .eq("id", informeId)
    .eq("doctor_id", user.id)
    .single();

  if (fetchError || !informeData) return { error: "Informe no encontrado" };
  if (informeData.status !== "completed") return { error: "El informe no está completado" };
  if (!informeData.informe_paciente) return { error: "Sin contenido para el paciente" };

  try {
    const patient = (informeData as { patients: { name: string; phone: string } }).patients;
    const pdfBytes = await generateInformePDF({
      patientName: patient.name,
      patientPhone: patient.phone,
      date: new Date(informeData.created_at).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      content: informeData.informe_paciente,
    });

    const pdfFileName = `${user.id}/${informeId}/informe-paciente.pdf`;
    const pdfBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const { error: uploadError } = await supabase.storage
      .from("informes-pdf")
      .upload(pdfFileName, pdfBlob, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) return { error: uploadError.message };

    await supabase
      .from("informes")
      .update({ pdf_path: pdfFileName })
      .eq("id", informeId)
      .eq("doctor_id", user.id);

    revalidatePath(`/informes/${informeId}`);

    const { data: signed } = await supabase.storage
      .from("informes-pdf")
      .createSignedUrl(pdfFileName, 3600);

    return { signedUrl: signed?.signedUrl ?? null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return { error: message };
  }
}
