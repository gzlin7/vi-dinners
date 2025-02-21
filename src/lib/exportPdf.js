import { jsPDF } from "jspdf";

const headerFontSize = 18;
const bodyFontSize = 12;

export const generatePdf = (selectedRecipes, groceryItemsMap) => {
  const doc = new jsPDF();
  doc.setFont("helvetica", "normal");
  let todayDate = new Date().toISOString().split("T")[0];

  // Recipes coverpage
  doc.setFontSize(headerFontSize);
  doc.text(`VI Dinners Recipes List [${todayDate}]`, 20, 20);

  doc.setFontSize(bodyFontSize);
  let yPosition = 50;
  let xPosition = 20;
  selectedRecipes.forEach((item, index) => {
    const text = `${index + 1}. ${item.title}`;
    doc.text(text, xPosition, yPosition);
    // TODO: jump to page link if I decide to parse the recipes into the packet
    // doc.link(xPosition, yPosition - 2, doc.getTextWidth(item.canonical_url), 10, {
    //   pageNumber: index + 2,
    // });
    yPosition += 10;

    // url link
    doc.setTextColor(0, 0, 255); // Set link color to blue
    doc.text(item.canonical_url, xPosition, yPosition);
    doc.link(xPosition, yPosition - 2, doc.getTextWidth(item.canonical_url), 10, {
      url: item.canonical_url,
    });
    doc.setTextColor(0, 0, 0);
    yPosition += 10;
  });

  // Grocery shopping list
  doc.addPage();
  doc.setFontSize(headerFontSize);
  doc.text("Shopping List", 20, 20);
  doc.setFontSize(bodyFontSize);

  let maxLeftWidth = 85;
  const renderGrocerySection = (section) => {
    let items = groceryItemsMap[section];
    if (items.length > 0) {
      yPosition += 5;
      doc.setFont("helvetica", "bold");
      doc.text(section, xPosition, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition += 10;
      items.map((item) => {
        // Clean unprintable characters from text
        doc.text(item.replace(/[^\x20-\x7E]/g, ""), xPosition, yPosition, {
          align: "left",
          maxWidth: maxLeftWidth,
        });
        // Handle when overflows past next line
        let breakLines = Math.ceil(doc.getTextWidth(item) / maxLeftWidth);
        yPosition += 10 + 3 * (breakLines - 1);
      });
    }
  };
  let left_col = ["Meat", "Dairy", "Dry Grains"];
  let right_col = ["Produce", "Canned Goods"];
  yPosition = 30;
  left_col.map((section) => renderGrocerySection(section));
  yPosition = 30;
  xPosition = maxLeftWidth + 25;
  right_col.map((section) => renderGrocerySection(section));

  // Save the PDF
  doc.save(`vi-dinners_${todayDate}.pdf`);
};
