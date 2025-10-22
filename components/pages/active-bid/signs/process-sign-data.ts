import { SheetingType, SignDesignation, SignVariant } from "@/types/MPTEquipment";



export async function processSignData(apiData: any[]) {
  if (!Array.isArray(apiData)) {
    console.error("API data is not an array");
    return [];
  }

  const processedData: SignDesignation[] = [];

  try {
    apiData.forEach((item) => {
      if (!item) return;

      const designation = item.mutcd_code;
      if (!designation) return;

      const description = item.description || "";

      // Parse variants JSON
      let variants: SignVariant[] = [];
      try {
        variants = Array.isArray(item.variants)
          ? item.variants
          : JSON.parse(item.variants);
      } catch (e) {
        console.warn(`Skipping designation ${designation} due to invalid variants`);
        return;
      }

      const mappedVariants = variants
        .map((v: any) => {   
          const width = parseFloat(v.width_inches);
          const height = parseFloat(v.length_inches);
          const sheeting = (v.sheeting_abbreviated || "DG") as SheetingType;

          if (isNaN(width) || isNaN(height)) return null;
          return { width, height, sheeting };
        })
        .filter(Boolean) as SignVariant[];

      if (mappedVariants.length === 0) return;

      processedData.push({
        designation,
        description,
        variants: mappedVariants,
      });
    });

    processedData.sort((a, b) => a.designation.localeCompare(b.designation));

    return processedData;
  } catch (error) {
    console.error("Error processing sign data:", error);
    return [];
  }
};
