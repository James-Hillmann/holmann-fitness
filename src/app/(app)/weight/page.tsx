import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMyMeasurements, getMyWeighIns, requireUser } from "@/lib/queries";
import { fromCm, fromKg, lengthUnitFor } from "@/lib/units";
import { MeasurementsClient } from "./measurements-client";
import { WeightClient } from "./weight-client";

function dateLabels(d: Date) {
  return {
    dateLabel: d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
    fullDate: d.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

export default async function BodyPage() {
  const user = await requireUser();
  const [weighRows, measurementRows] = await Promise.all([
    getMyWeighIns(user.id),
    getMyMeasurements(user.id),
  ]);

  const lengthUnit = lengthUnitFor(user.unitPreference);

  const weighEntries = weighRows.map((r) => ({
    id: r.id,
    value: Number(fromKg(r.weightKg, user.unitPreference).toFixed(1)),
    ...dateLabels(r.recordedAt),
  }));

  const measurementEntries = measurementRows.map((r) => ({
    id: r.id,
    site: r.site,
    value: Number(fromCm(r.valueCm, lengthUnit).toFixed(1)),
    ...dateLabels(r.recordedAt),
  }));

  return (
    <main>
      <h1 className="mb-1 text-xl font-bold tracking-tight">Your body</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Only you can see this page. The family only ever sees how much
        you&apos;ve lost — never your numbers.
      </p>
      <Tabs defaultValue={weighEntries.length === 0 && measurementEntries.length > 0 ? "measurements" : "weight"}>
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
        </TabsList>
        <TabsContent value="weight">
          <WeightClient entries={weighEntries} unit={user.unitPreference} />
        </TabsContent>
        <TabsContent value="measurements">
          <MeasurementsClient entries={measurementEntries} unit={lengthUnit} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
