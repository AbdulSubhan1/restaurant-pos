import {orders} from '@/db/schema/orders';
import { db } from "@/db";
import { unstable_cache } from "next/cache";


export const getOrders = unstable_cache(
  async () => db.select().from(orders),
  ["Orders-all"],
  { revalidate: 60 }
);