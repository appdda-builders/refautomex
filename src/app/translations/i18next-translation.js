import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { index } from '.';
import { navbar } from "./navbar";
import { about } from "./about";
import { contact } from "./contact";
import { promotions } from "./promotions";
import { products } from "./products";
import { footer } from "./footer";
import { mailbox } from "./mailbox";
import { invoice } from "./invoice";
import { faqs } from "./faqs";
import { privacy } from "./privacy";
import { account } from "./account";

const resources = {
  es: {
    translation: {
      navbar: navbar.es,
      index: index.es,
      about: about.es,
      contact: contact.es,
      promotions: promotions.es,
      products: products.es,
      account: account.es,
      faqs: faqs.es,
      footer: footer.es,
      mailbox: mailbox.es,
      invoice: invoice.es,
      privacy: privacy.es,
    }
  },
  en: {
    translation: {
      navbar: navbar.en,
      index: index.en,
      about: about.en,
      contact: contact.en,
      promotions: promotions.en,
      products: products.en,
      account: account.en,
      faqs: faqs.en,
      footer: footer.en,
      mailbox: mailbox.en,
      invoice: invoice.en,
      privacy: privacy.en,
    }
  }
};

  i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "es",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;


