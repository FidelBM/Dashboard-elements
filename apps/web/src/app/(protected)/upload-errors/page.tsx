import { PlaceholderPage } from "@/components/placeholder-page";

export default function UploadErrorsPage() {
  return (
    <PlaceholderPage
      eyebrow="Validacion"
      title="Errores de carga"
      description="Vista para revisar filas invalidas y motivos de error de archivos cargados."
      items={["Comentario vacio", "Fecha invalida", "ID duplicado", "Categoria ausente"]}
    />
  );
}
