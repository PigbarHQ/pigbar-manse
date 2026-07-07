import { BlueprintClassicalWorkspace } from "@/src/components/blueprint/BlueprintClassicalWorkspace";
import { buildEmptyBlueprintPublication } from "@/src/lib/blueprint/emptyPublication";
import { blueprintNo000001RuntimeInput } from "@/src/lib/blueprint/runtime";

export default function ServiceWorkspacePage() {
  const initialPublication = buildEmptyBlueprintPublication(blueprintNo000001RuntimeInput);

  return <BlueprintClassicalWorkspace initial={initialPublication} workspace="service" />;
}

