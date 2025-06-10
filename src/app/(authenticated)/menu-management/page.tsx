import { Metadata } from "next";
import MenuTabs from "@/components/menu/MenuTabs";
import { getAllCategories, getPaginatedMenuItems } from "@/server/menuService";



interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MenuPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = parseInt(
    Array.isArray(params?.page) ? params.page[0] : params?.page || "1"
  );
  const limit = parseInt(
    Array.isArray(params?.limit) ? params.limit[0] : params?.limit || "10"
  );

  // Fetch categories and paginated menu items on the server using the service
  const [categoriesData, paginatedMenu] = await Promise.all([
    getAllCategories(),
    getPaginatedMenuItems(page, limit),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Menu Management</h1>
      <MenuTabs
        initialCategories={categoriesData}
        initialMenuItems={paginatedMenu.items}
        pagination={{
          total: paginatedMenu.total,
          page: paginatedMenu.page,
          limit: paginatedMenu.limit,
          totalPages: paginatedMenu.totalPages,
        }}
      />
    </div>
  );
}
