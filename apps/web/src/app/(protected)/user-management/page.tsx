import { PlaceholderPage } from "@/components/placeholder-page";

export default function UserManagementPage() {
  return (
    <PlaceholderPage
      eyebrow="Administracion"
      title="Gestion de usuarios"
      description="Pantalla reservada para administrar usuarios, roles y permisos basicos."
      items={["Usuarios", "Roles", "Estado", "Permisos"]}
    />
  );
}
