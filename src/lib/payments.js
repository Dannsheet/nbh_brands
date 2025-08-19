// src/lib/payments.js
import { supabase } from "@/lib/supabase/client";

/**
 * Registrar comprobante de transferencia o De Una
 * @param {string} ordenId - UUID de la orden
 * @param {string} userId - UUID del usuario
 * @param {File} file - Archivo del comprobante
 * @param {string} metodo - "transferencia" o "deuna"
 */
export async function registrarTransferencia(ordenId, userId, file, metodo = "transferencia") {
  try {
    // Subir archivo al Storage
    const filePath = `comprobantes/${ordenId}-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("comprobantes")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // URL pública del comprobante
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/comprobantes/${filePath}`;

    // Guardar registro en la tabla comprobantes_pago
    const { error: insertError } = await supabase
      .from("comprobantes_pago")
      .insert({
        orden_id: ordenId,
        usuario_id: userId,
        metodo,
        estado: "pendiente",
        comprobante_url: url,
      });

    if (insertError) throw insertError;

    return { ok: true, url };
  } catch (err) {
    console.error("Error registrando transferencia:", err.message);
    return { ok: false, error: err.message };
  }
}
