import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export default getRequestConfig(async () => {
  let locale = "ru";

  try {
    const cookieStore = await cookies();
    locale = cookieStore.get("locale")?.value || "ru";
  } catch {
    // Static export: cookies() not available, use default
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
