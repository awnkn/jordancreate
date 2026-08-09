"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { nullify, toDate, toNumber } from "@/lib/format";
import { revalidateAll } from "@/lib/revalidate";
import {
  INTERACTION_KIND,
  VENDOR_KIND,
  VENDOR_STATUS,
  constrain,
} from "@/lib/taxonomy";

function vendorData(form: FormData) {
  return {
    company: (nullify(form.get("company")) ?? "Unnamed vendor") as string,
    kind: constrain(form.get("kind"), VENDOR_KIND.values, "Supplier"),
    contactFirstName: nullify(form.get("contactFirstName")),
    contactLastName: nullify(form.get("contactLastName")),
    email: nullify(form.get("email")),
    phone: nullify(form.get("phone")),
    website: nullify(form.get("website")),
    status: constrain(form.get("status"), VENDOR_STATUS.values, "Prospect"),
    service: nullify(form.get("service")),
    spaceName: nullify(form.get("spaceName")),
    monthlyRent: toNumber(form.get("monthlyRent")),
    leaseStart: toDate(form.get("leaseStart")),
    leaseEnd: toDate(form.get("leaseEnd")),
    notes: nullify(form.get("notes")),
  };
}

export async function createVendor(form: FormData) {
  const vendor = await db.vendor.create({ data: vendorData(form) });
  revalidateAll();
  redirect(`/vendors/${vendor.id}`);
}

export async function updateVendor(id: string, form: FormData) {
  await db.vendor.update({ where: { id }, data: vendorData(form) });
  revalidateAll();
  redirect(`/vendors/${id}`);
}

export async function deleteVendor(id: string) {
  await db.vendor.delete({ where: { id } });
  revalidateAll();
  redirect("/vendors");
}

export async function logVendorInteraction(vendorId: string, form: FormData) {
  const summary = nullify(form.get("summary"));
  if (!summary) return;

  await db.interaction.create({
    data: {
      vendorId,
      summary,
      kind: constrain(form.get("kind"), INTERACTION_KIND.values, "Note"),
      occurredAt: toDate(form.get("occurredAt")) ?? new Date(),
    },
  });
  revalidateAll();
}
