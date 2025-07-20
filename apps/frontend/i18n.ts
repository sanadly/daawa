import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({requestLocale}) => {
  // The locale will be handled manually in the layout
  // This is just a placeholder to satisfy next-intl requirements
  const locale = (await requestLocale) || 'en';
  
  return {
    locale
    // No messages needed here since they're provided by the layout
  };
});