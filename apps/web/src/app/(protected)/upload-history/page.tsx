import { PlaceholderPage } from "@/components/placeholder-page";

export default function UploadHistoryPage() {
  return (
    <PlaceholderPage
      eyebrow="Historial"
      title="Historial de cargas"
      description="Consulta futura de cargas anteriores, resumen de filas y resultados asociados."
      items={["Archivo", "Fecha de carga", "Filas validas", "Filas invalidas"]}
    />
  );
}
