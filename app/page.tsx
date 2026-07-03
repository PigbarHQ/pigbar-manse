import { BlueprintClassicalWorkspace } from "@/src/components/blueprint/BlueprintClassicalWorkspace";
import { buildBlueprintNo000001 } from "@/src/lib/blueprint/no000001";

export default function Home() {
  const { classicalAnalysis, classicalBook, manse, runtime } = buildBlueprintNo000001();

  return (
    <BlueprintClassicalWorkspace
      initial={{
        appendix: runtime.appendix,
        book: classicalBook,
        debugData: {
          appendix: runtime.appendix,
          canonicalManseInput: runtime.canonicalManseInput,
          classicalAnalysis,
          features: runtime.features,
          reasons: runtime.reasons,
          writerInput: runtime.writerInput,
          writerRuntime: runtime.writerRuntime,
        },
        manseInput: manse.input,
      }}
    />
  );
}
