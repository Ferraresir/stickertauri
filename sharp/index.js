import sharp from "sharp";
import { writeFile } from "fs/promises";
import fs from "fs"

async function test() {
	// giving more info about the background doesn't make a difference :(
	// const { info, data } = await sharp("./input.png").trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 }).png().toBuffer({ resolveWithObject: true });
    const testFolder = './images';

fs.readdirSync(testFolder).forEach(async file => {

  const { info, data } = await sharp(`./images/${file}`).trim({threshold:10}).png().toBuffer({ resolveWithObject: true });
  console.log(info);
  await writeFile(`./images/${file}`, data);
});
}

test();