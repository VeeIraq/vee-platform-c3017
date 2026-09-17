import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { LegalPage } from "@/components/public/legal-content";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const { dict } = await getServerDictionary();

  return (
    <LegalPage title="Privacy Policy" updatedLabel={t(dict, "legal.lastUpdated")} draftBanner={t(dict, "legal.draftBanner")}>
      <h2>1. Who this policy covers</h2>
      <p>
        This policy covers vee.iq (the marketing site), every business profile and digital menu hosted on Vee
        (vee.iq/:business), the Vee business dashboard (app.vee.iq), and the Vee admin panel (admin.vee.iq). It
        applies to two kinds of people: business owners and staff who run a Vee account, and end customers who tap an
        NFC device, scan a QR code, or otherwise visit a Vee business profile or menu.
      </p>

      <h2>2. Information we collect</h2>
      <p>
        From business owners and staff (account holders): name, email, phone number, WhatsApp number, business
        details (name, category, description, logo, location, hours), and any content added to a profile or menu
        (links, products, prices, images, offers).
      </p>
      <p>
        From end customers browsing a business profile or menu: no account or personal information is required to
        view a profile, browse a menu, or contact a business. If a customer chooses to place an order, the order flow
        may ask for a name and/or phone number, depending on the ordering mode the business has enabled (WhatsApp,
        online, or table ordering).
      </p>
      <p>
        Automatically, for both groups: basic interaction analytics — for example a profile view, an NFC tap, a QR
        scan, a menu view, a product view, or a click on WhatsApp/Instagram/Maps/Reviews/Call/Reservation —
        aggregated per business so its owner can see how their digital presence is performing. These events do not
        include a name unless the customer separately supplies one through an order or a form.
      </p>

      <h2>3. How we use information</h2>
      <ul>
        <li>To operate a business&apos;s Vee profile, menu, ordering, and dashboard.</li>
        <li>To show a business owner aggregate analytics about their own profile and menu — never another business&apos;s data.</li>
        <li>
          To process orders placed through a business&apos;s enabled ordering mode, and to route WhatsApp orders to
          that business&apos;s own WhatsApp number (not Vee&apos;s).
        </li>
        <li>To provide customer support, billing, and account security.</li>
        <li>To communicate service updates relevant to a business&apos;s account.</li>
      </ul>
      <p>
        Vee does not sell personal data, and does not use a business&apos;s customer data to advertise to that
        business&apos;s customers on behalf of anyone else.
      </p>

      <h2>4. Data sharing</h2>
      <p>
        A business&apos;s own customer-facing content (profile, menu, offers, public reviews/links) is, by design,
        publicly visible to anyone who visits its Vee URL or taps/scans its NFC/QR device — that is the product&apos;s
        purpose. Order details and dashboard analytics are visible only to that business&apos;s own authorized users
        and to Vee staff supporting the account. Vee does not share a business&apos;s data with other businesses on
        the platform.
      </p>

      <h2>5. Data retention</h2>
      <p>
        Account and business data is retained for as long as a subscription is active, plus a reasonable period
        afterward to allow account recovery, unless a business requests earlier deletion. Aggregate, de-identified
        analytics may be retained longer for product improvement purposes.
      </p>

      <h2>6. Your choices</h2>
      <p>
        A business owner can review and update their profile, menu, and account details at any time from the Vee
        dashboard, and can request account or data deletion by contacting Vee support. An end customer can choose not
        to share a name or phone number where an ordering mode makes that optional, and can always browse a profile
        or menu with no data shared at all.
      </p>

      <h2>7. Contact</h2>
      <p>
        Questions about this policy can be sent to Vee via WhatsApp or phone at +964 770 956 5566, or via Instagram
        @Nfc.Vee.
      </p>
    </LegalPage>
  );
}
