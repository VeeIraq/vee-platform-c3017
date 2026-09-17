"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: boolean } | undefined;

const DEVICE_TYPES = [
  "acrylic_stand",
  "flat_tag",
  "tissue_box",
  "tent_stand",
  "steel_stand",
  "nfc_card",
  "qr_only",
] as const;

function revalidateDevices() {
  revalidatePath("/admin/devices");
}

const createSchema = z.object({
  serial: z.string().trim().min(1, "Serial is required."),
  type: z.enum(DEVICE_TYPES),
});

export async function createDevice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireStaff();
  const parsed = createSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const supabase = await createClient();
  const { error } = await supabase.from("nfc_devices").insert({
    serial: parsed.data.serial,
    type: parsed.data.type,
    status: "unassigned",
  });
  if (error) {
    if (error.code === "23505") return { error: "A device with that serial already exists." };
    return { error: "Could not create the device." };
  }
  revalidateDevices();
  return { success: true };
}

const assignSchema = z.object({
  deviceId: z.string().uuid(),
  businessId: z.string().uuid(),
  locationId: z.union([z.string().uuid(), z.literal("")]).optional(),
  tableNumber: z.string().trim().optional(),
});

export async function assignDevice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireStaff();
  const parsed = assignSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("nfc_devices")
    .update({
      business_id: parsed.data.businessId,
      location_id: parsed.data.locationId || null,
      table_number: parsed.data.tableNumber || null,
      status: "active",
      activated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.deviceId);
  if (error) return { error: "Could not assign the device." };
  revalidateDevices();
  return { success: true };
}

export async function unassignDevice(deviceId: string) {
  await requireStaff();
  const supabase = await createClient();
  await supabase
    .from("nfc_devices")
    .update({ business_id: null, location_id: null, table_number: null, status: "unassigned", activated_at: null })
    .eq("id", deviceId);
  revalidateDevices();
}

export async function setDeviceStatus(deviceId: string, status: "active" | "inactive") {
  await requireStaff();
  const supabase = await createClient();
  await supabase
    .from("nfc_devices")
    .update({ status, activated_at: status === "active" ? new Date().toISOString() : undefined })
    .eq("id", deviceId);
  revalidateDevices();
}

export async function deleteDevice(deviceId: string) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("nfc_devices").delete().eq("id", deviceId);
  revalidateDevices();
}
