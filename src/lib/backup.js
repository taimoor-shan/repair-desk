import db from '../db/db';

export async function exportJSON() {
  const [customers, products, repairJobs, sales, settings] = await Promise.all(
    [
      db.customers.toArray(),
      db.products.toArray(),
      db.repairJobs.toArray(),
      db.sales.toArray(),
      db.settings.toArray(),
    ]
  );

  const data = { customers, products, repairJobs, sales, settings };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `repair-desk-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);

        await db.transaction(
          'rw',
          [
            db.customers,
            db.products,
            db.repairJobs,
            db.sales,
            db.settings,
          ],
          async () => {
            await db.customers.clear();
            await db.products.clear();
            await db.repairJobs.clear();
            await db.sales.clear();
            await db.settings.clear();

            if (data.customers) await db.customers.bulkAdd(data.customers);
            if (data.products) await db.products.bulkAdd(data.products);
            if (data.repairJobs) await db.repairJobs.bulkAdd(data.repairJobs);
            if (data.sales) await db.sales.bulkAdd(data.sales);
            if (data.settings) await db.settings.bulkAdd(data.settings);
          }
        );

        resolve(true);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
