
import KitchenDisplayTab from "@/components/orders/KitchenDisplayTab";
import { getOrders} from "@/server/kitchenDisplay";


interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function kitchenDisplay({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = parseInt(
    Array.isArray(params?.page) ? params.page[0] : params?.page || "1"
  );
  const limit = parseInt(
    Array.isArray(params?.limit) ? params.limit[0] : params?.limit || "10"
  );

  // Fetch categories and paginated menu items on the server using the service
  const [ordersData] = await Promise.all([
    getOrders(),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Kitchen Display</h1>
      <KitchenDisplayTab
        initialkitchen={ordersData}
      />
    </div>
  );
}
