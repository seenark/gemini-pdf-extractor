import { readFile, stat } from "node:fs/promises";
export const readFileAndSize = async (filePath: string) => {
  const pdfPath = filePath;
  const file = await readFile(pdfPath);
  const stats = await stat(pdfPath);
  const sizeInMb = stats.size / (1024 * 1024);
  console.log({ sizeInMb });
  console.log(process.env);

  return {
    file,
    sizeInMb,
  };
};
