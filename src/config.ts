import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "Molly's Blog",
	subtitle: "主页",
	lang: "zh_CN", // 语言代码，例如 'en', 'zh_CN', 'ja' 等
	themeColor: {
		hue: 75, // 主题色的默认色调，范围 0 到 360。例如 红色: 0, 青色: 200, 蓝色: 250, 粉色: 345
		fixed: false, // 是否为访客隐藏主题色选择器
	},
	banner: {
		enable: true,
		src: "/images/nvpu.jpg", // 相对于 /src 目录。如果以 '/' 开头，则相对于 /public 目录
		position: "center", // 等同于 CSS 的 object-position，仅支持 'top', 'center', 'bottom'。默认为 'center'
		credit: {
			enable: false, // 是否显示横幅图片的版权文本
			text: "", // 要显示的版权文本
			url: "", // (可选) 原作或艺术家页面的 URL 链接
		},
	},
	toc: {
		enable: true, // 是否在文章右侧显示目录
		depth: 2, // 目录中显示标题的最大深度，范围 1 到 3
	},
	favicon: [
		// 留空则使用默认图标
		{
			src: "/favicon/saber.png", // 图标路径，相对于 /public 目录
			//   theme: 'light',              // (可选) 'light' 或 'dark'，仅当你为亮色和深色模式准备了不同图标时设置
			//   sizes: '32x32',              // (可选) 图标尺寸，仅当你准备了不同尺寸的图标时设置
		},
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{
			name: "友链", // 导航栏显示的文字
			url: "/links/", // 对应你在 src/pages/ 目录下创建的文件名 (links.md)
			external: false,
		},
		{
			name: "GitHub",
			url: "https://github.com/saicaca/fuwari", // 内部链接不应包含基础路径（base path），系统会自动添加
			external: true, // 显示外部链接图标，并将在新标签页中打开
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "/images/saber.jpg", // 相对于 /src 目录。如果以 '/' 开头，则相对于 /public 目录
	name: "Molly ovo",
	bio: "他年我若修花史 列作人间第一香",
	links: [
		{
			name: "Bilibili",
			icon: "fa6-brands:bilibili", // 图标代码请访问 https://icones.js.org/ 查询
			// 如果使用的图标库未包含在内，你需要安装相应的图标集
			// `pnpm add @iconify-json/<icon-set-name>`
			url: "https://space.bilibili.com/182567178",
		},
		{
			name: "Steam",
			icon: "fa6-brands:steam",
			url: "https://store.steampowered.com",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/molly-ovo",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// 注意：部分样式（如背景颜色）正在被覆盖，请参阅 astro.config.mjs 文件。
	// 请选择深色主题，因为本博客主题目前仅支持深色背景代码框
	theme: "github-dark",
};
