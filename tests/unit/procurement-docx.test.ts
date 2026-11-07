import { expect, it } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { extractDocxLines } from "@/modules/procurement/documents";
function word(xml: string) {
  return Buffer.from(
    zipSync({ "[Content_Types].xml": strToU8("<Types/>"), "word/document.xml": strToU8(xml) }),
  );
}
it("imports explicit Word table rows without inventing quantities", () => {
  const file = word(
    '<w:document xmlns:w="w"><w:body><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Наименование</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Количество</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Единица</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>Цемент М500</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>20</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>мешок</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>',
  );
  expect(extractDocxLines(file)).toEqual([{ name: "Цемент М500", qty: "20", unit: "мешок" }]);
});
it("rejects prose requiring interpretation and XML entities", () => {
  expect(() =>
    extractDocxLines(
      word(
        '<w:document xmlns:w="w"><w:p><w:r><w:t>Пожалуйста посчитайте стройматериалы</w:t></w:r></w:p></w:document>',
      ),
    ),
  ).toThrow();
  expect(() =>
    extractDocxLines(word('<!DOCTYPE doc [<!ENTITY x SYSTEM "file:///secret">]><doc>&x;</doc>')),
  ).toThrow();
});
