import { getAllSheetData } from '@/lib/googleSheets';
import { groupByCentre, groupByDate, metrics } from '@/lib/normalize';
import Dashboard from '@/components/Dashboard';

export const revalidate = 60;

export default async function Home() {
  const data = await getAllSheetData();
  return <Dashboard initialData={data} />;
}
