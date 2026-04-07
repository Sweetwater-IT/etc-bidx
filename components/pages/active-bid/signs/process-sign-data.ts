import { SheetingType, SignDesignation } from "@/types/MPTEquipment";

export async function processSignData (apiData: any[]) {
    if (!Array.isArray(apiData)) {
      console.error("API data is not an array");
      return [];
    }

    const processedData: SignDesignation[] = [];

    try {
      apiData.forEach((item) => {
        if (!item) return;

        // Validate that necessary properties exist
        if (!item.sign_designations || !item.sign_dimensions) return;

        const designation = item.sign_designations.designation;
        if (!designation) return;

        const description = item.sign_designations.description || "";
        const sheeting =
          (item.sign_designations.sheeting as SheetingType) || "DG";
        const image_url = item.image_url;

        let width: number;
        let height: number;

        try {
          width = parseFloat(item.sign_dimensions.width);
          height = parseFloat(item.sign_dimensions.height);

          // Skip if dimensions are invalid
          if (isNaN(width) || isNaN(height)) return;
        } catch (e) {
          return; // Skip this item if dimensions can't be parsed
        }

        // Find if this designation already exists in our processed data
        const existingIndex = processedData.findIndex(
          (d) => d.designation === designation
        );

        if (existingIndex >= 0) {
          // Add the dimension to the existing designation
          processedData[existingIndex].dimensions.push({ width, height });
        } else {
          // Create a new designation entry
          processedData.push({
            designation,
            description,
            sheeting,
            dimensions: [{ width, height }],
            image_url,
          });
        }
      });

      // Sort dimensions within each designation for consistent display
      processedData.forEach((designation) => {
        if (!designation.dimensions) designation.dimensions = [];

        designation.dimensions.sort((a, b) => {
          // Sort first by width, then by height
          if (a.width !== b.width) {
            return a.width - b.width;
          }
          return a.height - b.height;
        });
      });

      return processedData;
    } catch (error) {
      console.error("Error processing sign data:", error);
      return [];
    }
  };