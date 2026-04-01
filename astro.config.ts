import { defineConfig } from 'astro/config';
import komorebiConfig from "./komorebi.config";

export default defineConfig({
  site: "https://blog.huarun.moe",
  integrations: [komorebiConfig],
});
