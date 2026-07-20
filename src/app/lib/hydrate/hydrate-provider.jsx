'use client';

import { useRef } from 'react';

import i18n from '@/app/translations/i18next-translation';

/**
 * Inyecta en i18next los textos que vienen de la tabla `hydrate` de appdda.
 *
 * El merge se hace durante el render (no en un efecto) para que los hijos ya
 * pinten con los textos de la base en el primer paint y no haya parpadeo entre
 * el texto hardcodeado y el editado.
 */
export default function HydrateProvider({ resources, children }) {
  const applied = useRef(false);

  if (!applied.current) {
    applied.current = true;

    for (const [locale, bundle] of Object.entries(resources || {})) {
      // deep = true para no borrar las keys que no vienen de la base,
      // overwrite = true para que la base gane sobre lo hardcodeado.
      i18n.addResourceBundle(locale, 'translation', bundle, true, true);
    }
  }

  return children;
}
