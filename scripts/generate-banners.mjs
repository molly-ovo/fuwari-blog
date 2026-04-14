import fs from "node:fs";
import path from "node:path";

// 1. 定义你的随机图片存放路径（相对于项目根目录）
const randomDir = path.join(process.cwd(), "public", "images", "random");
// 2. 定义生成的 JSON 存放路径
const outputFile = path.join(process.cwd(), "src", "generated-banners.json");

try {
	if (fs.existsSync(randomDir)) {
		const files = fs
			.readdirSync(randomDir)
			.filter((file) => /\.(png|jpe?g|gif|svg|webp|avif)$/i.test(file))
			.map((file) => `/images/random/${file}`); // 生成相对 URL 路径

		fs.writeFileSync(outputFile, JSON.stringify(files, null, 2));
		console.log(`✅ 成功扫描到 ${files.length} 张随机 Banner 图！`);
	} else {
		console.warn(`⚠️ 找不到目录: ${randomDir}`);
		fs.writeFileSync(outputFile, JSON.stringify([]));
	}
} catch (err) {
	console.error("❌ 生成 Banner 列表失败:", err);
}
