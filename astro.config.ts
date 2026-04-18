import { defineConfig } from 'astro/config';
import komorebiConfig from "./komorebi.config";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: "https://blog.huarun.moe",
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    smartypants: false,
  },
  integrations: [komorebiConfig],
});
