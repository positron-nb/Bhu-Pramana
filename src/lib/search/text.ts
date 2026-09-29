/** Text normalisation shared by the index and the query parser. */

const STOP = new Set(
  "a an and are as at be by can do does for from has have how in into is it its of on or that the their them there these this to was what which while who why will with within without than then so such not no nor our we you your about across after also among any been being both but each how i if more most other over same should some very what when where whether would main approaches approach policy policies key role effect effects impact impacts evidence study studies show shows find finds".split(
    " ",
  ),
);

/** Terms that look like stopwords but carry meaning in queries. */
const KEEP = new Set(["policy", "policies", "study", "studies", "evidence", "impact", "effect"]);

export function normalise(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/isation/g, "ization")
    .replace(/ising\b/g, "izing")
    .replace(/ised\b/g, "ized")
    .replace(/ise\b/g, "ize");
}

/** Very small suffix stemmer — enough to match plurals and verb forms. */
export function stem(w: string): string {
  if (w.length <= 3) return w;
  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y";
  if (w.endsWith("izations")) return w.slice(0, -8) + "ize";
  if (w.endsWith("ization")) return w.slice(0, -7) + "ize";
  if (w.endsWith("izing")) return w.slice(0, -5) + "ize";
  if (w.endsWith("ized")) return w.slice(0, -4) + "ize";
  if (w.endsWith("ations")) return w.slice(0, -6) + "ate";
  if (w.endsWith("ation")) return w.slice(0, -5) + "ate";
  if (w.endsWith("ings") && w.length > 6) return w.slice(0, -4);
  if (w.endsWith("ing") && w.length > 5) return w.slice(0, -3);
  if (w.endsWith("sses")) return w.slice(0, -2);
  if (w.endsWith("es") && /(ch|sh|x|ss)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && !w.endsWith("is")) return w.slice(0, -1);
  if (w.endsWith("ed") && w.length > 5) return w.slice(0, -2);
  return w;
}

export function tokens(s: string, { keepStop = false }: { keepStop?: boolean } = {}): string[] {
  return normalise(s)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && (keepStop || !STOP.has(t) || KEEP.has(t)))
    .map(stem);
}

/** Tokens including stopwords — used for phrase matching of concept labels. */
export function phraseTokens(s: string): string[] {
  return normalise(s)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0)
    .map(stem);
}
