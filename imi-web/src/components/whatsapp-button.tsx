"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  phone: string;
  patientName: string;
  pdfUrl: string;
}

export function WhatsAppButton({ phone, patientName, pdfUrl }: WhatsAppButtonProps) {
  const handleSend = () => {
    const message = encodeURIComponent(
      `Hola ${patientName}, le enviamos su informe médico de la consulta de hoy.\n\nPuede descargarlo aquí: ${pdfUrl}\n\nAnte cualquier duda, no dude en contactarnos.`
    );
    const url = `https://wa.me/${phone}?text=${message}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Button size="sm" onClick={handleSend} className="bg-[#25D366] hover:bg-[#1ebe5d] text-white">
      <MessageCircle className="size-4 mr-1.5" />
      Enviar por WhatsApp
    </Button>
  );
}
