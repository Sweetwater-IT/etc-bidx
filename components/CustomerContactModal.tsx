"use client"

import {
  CustomerContactForm,
  type CustomerContactFormProps,
} from "@/components/customer-contact-form"

export type CustomerContactModalProps = CustomerContactFormProps

export function CustomerContactModal(props: CustomerContactModalProps) {
  return <CustomerContactForm {...props} />
}
