import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { LegalPage } from "@/components/public/legal-content";

export const metadata: Metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const { dict } = await getServerDictionary();

  return (
    <LegalPage title="Terms of Service" updatedLabel={t(dict, "legal.lastUpdated")} draftBanner={t(dict, "legal.draftBanner")}>
      <h2>1. What Vee is</h2>
      <p>
        Vee is a digital customer-experience platform for businesses in Iraq. A Vee subscription gives a business a
        Business Profile, a Digital Menu, NFC and QR products, and a dashboard to manage links, products, orders and
        analytics. These terms govern use of vee.iq, any vee.iq/:business profile or menu, app.vee.iq, and
        admin.vee.iq.
      </p>

      <h2>2. Accounts and eligibility</h2>
      <p>
        A business must provide accurate information when signing up for a Vee plan (business name, contact details,
        and content published on its profile/menu). A business is responsible for everything published to its own
        profile and menu, and for keeping its account credentials secure once dashboard access exists.
      </p>

      <h2>3. Subscriptions and billing</h2>
      <p>
        Vee is offered on subscription plans (currently Vee Start, Vee Business, Vee Pro and Vee Custom — see
        vee.iq/#plans for current pricing and features). Each plan has a one-time setup fee and a recurring monthly
        fee, billed in Iraqi Dinar (IQD), except Vee Custom which is quoted individually. Plan pricing, features and
        limits may change; the current plan definitions are the ones published on vee.iq at the time of signup or
        renewal.
      </p>

      <h2>4. Acceptable use</h2>
      <ul>
        <li>
          A business may not publish illegal content, misleading pricing, or content that impersonates another
          business or person on its Vee profile or menu.
        </li>
        <li>A business is responsible for the accuracy of its own menu prices, availability, and offers.</li>
        <li>
          NFC and QR products supplied by Vee remain linked to that business&apos;s Vee profile for as long as the
          subscription is active; they are not to be resold or transferred to a different, unrelated business.
        </li>
        <li>Automated scraping, reverse engineering, or attempts to disrupt the platform are not permitted.</li>
      </ul>

      <h2>5. Ordering and payments between businesses and their customers</h2>
      <p>
        Where a business enables WhatsApp, online, or table ordering, Vee provides the technology that formats and
        routes the order (for example, to the business&apos;s own WhatsApp number). Unless a specific payment feature
        says otherwise, the business — not Vee — is the seller of record for any product ordered through its Vee
        menu, and is responsible for fulfilling that order and for any payment collected directly from its customer.
      </p>

      <h2>6. Vee&apos;s role and availability</h2>
      <p>
        Vee aims to keep the platform available and performant but does not guarantee uninterrupted access, and may
        perform maintenance or updates that briefly affect availability. Vee may suspend an account that violates
        these terms, with notice where practical.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        A business retains ownership of the content it uploads (logo, photos, menu text, offers). Vee retains
        ownership of the Vee platform, brand, and underlying software. Nothing in these terms transfers ownership of
        Vee&apos;s platform to a business, or of a business&apos;s own content to Vee beyond what is needed to host
        and display it as part of the service.
      </p>

      <h2>8. Changes to these terms</h2>
      <p>
        These terms may be updated from time to time; continued use of Vee after an update constitutes acceptance of
        the revised terms. Material changes will be communicated to active business accounts once account
        notifications exist.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about these terms can be sent to Vee via WhatsApp or phone at +964 770 956 5566, or via Instagram
        @Nfc.Vee.
      </p>
    </LegalPage>
  );
}
