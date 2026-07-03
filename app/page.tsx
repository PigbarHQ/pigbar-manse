import { BlueprintReader } from "@/src/components/blueprint/BlueprintReader";
import { buildBlueprintNo000001 } from "@/src/lib/blueprint/no000001";

export default function Home() {
  const { book } = buildBlueprintNo000001();

  return <BlueprintReader book={book} />;
}
