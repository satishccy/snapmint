import jsPDF from "jspdf";

// A4 dimensions in mm
const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const MARGIN = 10;
const MAX_WIDTH = A4_WIDTH - 2 * MARGIN;
const MAX_HEIGHT = A4_HEIGHT - 2 * MARGIN;

/**
 * Converts image URL to base64 data URL to avoid CORS issues
 */
async function imageToDataURL(url: string): Promise<string> {
  try {
    const response = await fetch(url, { mode: "cors" });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // Fallback: try loading via img element
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
  }
}

/**
 * Determines image format from data URL or URL
 */
function getImageFormat(dataUrl: string): "JPEG" | "PNG" {
  if (dataUrl.startsWith("data:image/png")) {
    return "PNG";
  }
  return "JPEG";
}

/**
 * Downloads an image as a PDF (A4 size)
 * @param imageUrl - URL of the image to download
 * @param filename - Name of the PDF file (without .pdf extension)
 */
export async function downloadImageAsPDF(
  imageUrl: string,
  filename: string = "image"
): Promise<void> {
  try {
    // Convert image to data URL
    const dataUrl = await imageToDataURL(imageUrl);
    const imageFormat = getImageFormat(dataUrl);

    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Load the image to get dimensions
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = dataUrl;
    });

    // Calculate dimensions
    const imgWidth = img.width;
    const imgHeight = img.height;

    // Calculate aspect ratio
    const aspectRatio = imgWidth / imgHeight;

    // Calculate dimensions to fit within A4 page (with margins)
    let finalWidth = MAX_WIDTH;
    let finalHeight = MAX_WIDTH / aspectRatio;

    // If height exceeds max height, scale down
    if (finalHeight > MAX_HEIGHT) {
      finalHeight = MAX_HEIGHT;
      finalWidth = MAX_HEIGHT * aspectRatio;
    }

    // Center the image on the page
    const x = (A4_WIDTH - finalWidth) / 2;
    const y = (A4_HEIGHT - finalHeight) / 2;

    // Add image to PDF
    pdf.addImage(dataUrl, imageFormat, x, y, finalWidth, finalHeight);

    // Save the PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to generate PDF. Please try again."
    );
  }
}

