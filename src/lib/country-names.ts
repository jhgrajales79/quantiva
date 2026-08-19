const COUNTRY_NAMES: Record<string, string> = {
  US: "Estados Unidos",
  GB: "Reino Unido",
  EU: "Zona Euro",
  DE: "Alemania",
  FR: "Francia",
  IT: "Italia",
  ES: "España",
  JP: "Japón",
  CN: "China",
  CA: "Canadá",
  AU: "Australia",
  IN: "India",
  BR: "Brasil",
  MX: "México",
  CH: "Suiza",
  NZ: "Nueva Zelanda",
  SE: "Suecia",
  NO: "Noruega",
  KR: "Corea del Sur",
  RU: "Rusia",
  ZA: "Sudáfrica",
};

export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}
